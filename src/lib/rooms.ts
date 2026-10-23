import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./backend/supabase";
import { BackendError } from "./backend/types";
import type { User } from "./backend/types";
import type { MultiState } from "@/store/gameStore";

export type RoomStatus = "lobby" | "playing" | "finished";

/** A human who has joined the room's lobby. */
export interface RoomMember {
  userId: string;
  username: string;
}

/** One of the four table seats once a game has started (index = engine seat 0–3). */
export interface RoomSeat {
  userId: string | null; // null → AI-controlled seat
  username: string;
  isAI: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  status: RoomStatus;
  players: RoomMember[];
  seats: RoomSeat[] | null;
  state: MultiState | null; // full game blob, replaced on every move
  version: number;
}

const MAX_PLAYERS = 4;

const client = () => {
  if (!supabase) throw new BackendError("Online play needs the cloud backend (Supabase).");
  return supabase;
};

// A row-level-security / auth rejection almost always means "not signed in".
const isAuthError = (e: { code?: string; message?: string }) =>
  e.code === "42501" || /row-level security|JWT|not authenticated/i.test(e.message ?? "");
const NOT_SIGNED_IN = "You're not signed in. Please log in again, then try once more.";

// DB row (snake_case) → Room.
function toRoom(r: Record<string, unknown>): Room {
  return {
    code: r.code as string,
    hostId: r.host_id as string,
    status: r.status as RoomStatus,
    players: (r.players as RoomMember[]) ?? [],
    seats: (r.seats as RoomSeat[] | null) ?? null,
    state: (r.state as MultiState | null) ?? null,
    version: (r.version as number) ?? 0,
  };
}

const randomCode = () => String(Math.floor(1000 + Math.random() * 9000));

/**
 * Seat indexes the AI is holding on someone's behalf — free for a newcomer to
 * drop into. A seat is free once no user owns it, which covers both the seats
 * dealt to the AI at the start and seats whose player left the room.
 */
export const freeSeats = (room: Room): number[] =>
  room.seats?.flatMap((s, i) => (s.isAI && !s.userId ? [i] : [])) ?? [];

/** Create a new room hosted by `user`; retries on the rare code collision. */
export async function createRoom(user: User): Promise<Room> {
  const sb = client();
  const me: RoomMember = { userId: user.id, username: user.username };
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode();
    const { data, error } = await sb
      .from("rooms")
      .insert({ code, host_id: user.id, status: "lobby", players: [me] })
      .select()
      .single();
    if (!error && data) return toRoom(data);
    if (error) {
      if (isAuthError(error)) throw new BackendError(NOT_SIGNED_IN);
      if (error.code !== "23505") throw new BackendError(error.message); // 23505 = code taken, retry
    }
  }
  throw new BackendError("Could not create a room — please try again.");
}

export async function getRoom(code: string): Promise<Room | null> {
  const { data, error } = await client().from("rooms").select().eq("code", code).maybeSingle();
  if (error) throw new BackendError(error.message);
  return data ? toRoom(data) : null;
}

/**
 * Add `user` to the room's lobby (idempotent). Validates code, phase, capacity.
 * Once a game is under way only its own players may re-enter — that's the
 * reconnect path after a refresh or a dropped connection.
 */
export async function joinRoom(user: User, code: string): Promise<Room> {
  const room = await getRoom(code);
  if (!room) throw new BackendError("No room with that code.");

  const already = room.players.some((p) => p.userId === user.id);
  const seated = room.seats?.some((s) => s.userId === user.id) ?? false;

  if (room.status !== "lobby") {
    if (already) return room; // already listed — nothing to write
    if (!seated) {
      // A newcomer can still drop into a seat the AI is holding. Nothing is
      // written until they actually claim one — see `claimSeat`.
      if (freeSeats(room).length) return room;
      throw new BackendError("That game has already started.");
    }
    // Seated but dropped out of `players` (left / lost connection) → re-list them.
  } else if (!already && room.players.length >= MAX_PLAYERS) {
    throw new BackendError("That room is full.");
  }

  const players = already
    ? room.players
    : [...room.players, { userId: user.id, username: user.username }];

  const { data, error } = await client()
    .from("rooms")
    .update({ players, updated_at: new Date().toISOString() })
    .eq("code", code)
    .select()
    .single();
  if (error) throw new BackendError(isAuthError(error) ? NOT_SIGNED_IN : error.message);
  return toRoom(data);
}

/**
 * Remove `user` from the room. If the host leaves, the room is deleted for
 * everyone. Otherwise they're dropped from `players` and — mid-game — their
 * seat is released back to the AI, which both keeps the table playing and
 * leaves the seat open for someone else to drop into.
 */
export async function leaveRoom(user: User, code: string): Promise<void> {
  const room = await getRoom(code);
  if (!room) return;
  if (room.hostId === user.id) {
    await client().from("rooms").delete().eq("code", code);
    return;
  }
  const players = room.players.filter((p) => p.userId !== user.id);
  const seats = room.seats?.map((s) =>
    s.userId === user.id ? { userId: null, username: s.username, isAI: true } : s,
  );
  await client()
    .from("rooms")
    .update({ players, ...(seats ? { seats } : {}), updated_at: new Date().toISOString() })
    .eq("code", code);
}

/**
 * Take over a seat the AI is holding, mid-game. The `is null` filter on that
 * seat's owner makes the claim atomic: if two people reach for the same seat at
 * once, exactly one update matches and the other is told to pick again.
 *
 * Only the seat is written here — flipping the matching player in the game
 * state from AI back to human is the host's job, like every other write to a
 * seat nobody was sitting at.
 */
export async function claimSeat(user: User, code: string, seat: number): Promise<Room> {
  const room = await getRoom(code);
  if (!room) throw new BackendError("No room with that code.");
  if (room.status !== "playing" || !room.seats?.[seat]) {
    throw new BackendError("That game isn't running any more.");
  }
  if (room.seats.some((s, i) => i !== seat && s.userId === user.id)) {
    throw new BackendError("You're already sitting at this table.");
  }

  const seats = room.seats.map((s, i) =>
    i === seat ? { userId: user.id, username: user.username, isAI: false } : s,
  );
  const players = room.players.some((p) => p.userId === user.id)
    ? room.players
    : [...room.players, { userId: user.id, username: user.username }];

  const { data, error } = await client()
    .from("rooms")
    .update({ seats, players, updated_at: new Date().toISOString() })
    .eq("code", code)
    .eq("status", "playing")
    .filter(`seats->${seat}->>userId`, "is", null)
    .select()
    .single();
  if (error) {
    if (isAuthError(error)) throw new BackendError(NOT_SIGNED_IN);
    if (error.code === "PGRST116") throw new BackendError("Someone just took that seat.");
    throw new BackendError(error.message);
  }
  return toRoom(data);
}

/** Randomly seat the humans and fill the rest of the four seats with AI. */
export function buildSeats(players: RoomMember[]): RoomSeat[] {
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const seats: RoomSeat[] = Array.from({ length: 4 }, (_, i) => ({
    userId: null,
    username: `AI-${i}`,
    isAI: true,
  }));
  players.slice(0, 4).forEach((p, i) => {
    seats[order[i]] = { userId: p.userId, username: p.username, isAI: false };
  });
  // Name the AI seats sequentially for readability.
  let n = 1;
  for (const s of seats) if (s.isAI) s.username = `AI-${n++}`;
  return seats;
}

/**
 * Host starts the game: assign seats, publish the opening deal, flip to
 * `playing`. Returns the started room so the host can act on it immediately
 * rather than waiting for its own write to come back over Realtime. The
 * `status` guard makes starting idempotent, and selecting the row back means a
 * write that quietly affects nothing surfaces as an error instead of a hang.
 */
export async function startGame(
  code: string,
  seats: RoomSeat[],
  state: MultiState,
): Promise<Room> {
  const { data, error } = await client()
    .from("rooms")
    .update({ status: "playing", seats, state, version: 1, updated_at: new Date().toISOString() })
    .eq("code", code)
    .eq("status", "lobby")
    .select()
    .single();
  if (error) {
    if (isAuthError(error)) throw new BackendError(NOT_SIGNED_IN);
    if (error.code === "PGRST116") throw new BackendError("This room has already started.");
    throw new BackendError(error.message);
  }
  return toRoom(data);
}

/**
 * Publish a new game state. Only the client that currently holds authority (the
 * seat whose turn it is, or the host for AI seats) calls this. The `version`
 * must be higher than the stored one, so a straggling write can never overwrite
 * a fresher state; `false` means the write lost that race and the caller should
 * resync from the room instead.
 */
export async function pushState(
  code: string,
  state: MultiState,
  version: number,
): Promise<boolean> {
  const { data, error } = await client()
    .from("rooms")
    .update({ state, version, updated_at: new Date().toISOString() })
    .eq("code", code)
    .lt("version", version)
    .select("version");
  if (error) throw new BackendError(isAuthError(error) ? NOT_SIGNED_IN : error.message);
  return (data?.length ?? 0) > 0;
}

/**
 * Hand the current session's token to the Realtime socket, then subscribe.
 * The rooms table is behind RLS, and an unauthenticated socket is simply sent
 * nothing — no error, just a channel that never fires. supabase-js normally
 * does this on sign-in; doing it here means a subscription can't race that.
 *
 * Because that wait makes subscribing async, teardown has to be able to cancel
 * it: under StrictMode the effect is torn down and re-run immediately, and
 * subscribing a channel that had already been removed would leave a duplicate
 * of the same topic on the socket, which the server rejects.
 */
function subscribeAuthed(channel: RealtimeChannel, onReady?: () => void): () => void {
  const sb = client();
  let cancelled = false;
  void (async () => {
    const { data } = await sb.auth.getSession();
    if (data.session && !cancelled) await sb.realtime.setAuth(data.session.access_token);
    if (cancelled) return;
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") onReady?.();
    });
  })();
  return () => {
    cancelled = true;
    void sb.removeChannel(channel);
  };
}

/**
 * Announce that `userId` is at this room and report who else is. Used to spot a
 * player who vanished without leaving (closed tab, dead connection) so their
 * seat doesn't stall the table. Returns an unsubscribe function.
 */
export function subscribePresence(
  code: string,
  userId: string,
  onChange: (online: Set<string>) => void,
): () => void {
  const ch = client().channel(`presence:${code}`, { config: { presence: { key: userId } } });
  ch.on("presence", { event: "sync" }, () => onChange(new Set(Object.keys(ch.presenceState()))));
  return subscribeAuthed(ch, () => void ch.track({ at: Date.now() }));
}

/** Subscribe to live changes on one room. Returns an unsubscribe function. */
export function subscribeRoom(code: string, onChange: (room: Room | null) => void): () => void {
  const ch = client()
    .channel(`room:${code}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rooms", filter: `code=eq.${code}` },
      (payload) => {
        if (payload.eventType === "DELETE") onChange(null);
        else onChange(toRoom(payload.new as Record<string, unknown>));
      },
    );
  // Realtime can drop a message on a flaky connection, so re-read the room on
  // (re)connect — that's also how a client that was asleep catches up.
  return subscribeAuthed(ch, () => void getRoom(code).then(onChange, () => {}));
}
