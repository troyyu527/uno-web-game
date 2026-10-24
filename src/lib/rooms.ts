import { api, socketUrl, API_URL } from "./api";
import { BackendError } from "./backend/types";
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

// Every room call acts as the signed-in user — the server reads who that is
// from the session token, so none of these take a user.

const roomApi = <T>(path: string, body?: unknown): Promise<T> => {
  if (!API_URL) throw new BackendError("Online play needs the cloud server.");
  return api<T>(`/rooms${path}`, body === undefined ? {} : { method: "POST", body });
};

/**
 * Seat indexes the AI is holding on someone's behalf — free for a newcomer to
 * drop into. A seat is free once no user owns it, which covers both the seats
 * dealt to the AI at the start and seats whose player left the room.
 */
export const freeSeats = (room: Room): number[] =>
  room.seats?.flatMap((s, i) => (s.isAI && !s.userId ? [i] : [])) ?? [];

/** Create a new room hosted by the signed-in user. */
export async function createRoom(): Promise<Room> {
  return (await roomApi<{ room: Room }>("", {})).room;
}

export async function getRoom(code: string): Promise<Room | null> {
  return (await roomApi<{ room: Room | null }>(`/${code}`)).room;
}

/**
 * Join the room's lobby (idempotent). The server validates code, phase and
 * capacity. Once a game is under way only its own players may re-enter —
 * that's the reconnect path after a refresh or a dropped connection — though a
 * newcomer may still look in when the AI is holding a seat (see `claimSeat`).
 */
export async function joinRoom(code: string): Promise<Room> {
  return (await roomApi<{ room: Room }>(`/${code}/join`, {})).room;
}

/**
 * Leave the room. If the host leaves, the room is deleted for everyone.
 * Otherwise they're dropped from `players` and — mid-game — their seat is
 * released back to the AI, which both keeps the table playing and leaves the
 * seat open for someone else to drop into.
 */
export async function leaveRoom(code: string): Promise<void> {
  await roomApi(`/${code}/leave`, {});
}

/**
 * Take over a seat the AI is holding, mid-game. The room serialises claims, so
 * if two people reach for the same seat at once exactly one gets it and the
 * other is told to pick again.
 *
 * Only the seat is written here — flipping the matching player in the game
 * state from AI back to human is the host's job, like every other write to a
 * seat nobody was sitting at.
 */
export async function claimSeat(code: string, seat: number): Promise<Room> {
  return (await roomApi<{ room: Room }>(`/${code}/claim`, { seat })).room;
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
 * rather than waiting for its own write to come back over the socket. Starting
 * a room that's already running is refused, so a double click is harmless.
 */
export async function startGame(code: string, seats: RoomSeat[], state: MultiState): Promise<Room> {
  return (await roomApi<{ room: Room }>(`/${code}/start`, { seats, state })).room;
}

/**
 * Publish a new game state. Only the client that currently holds authority (the
 * seat whose turn it is, or the host for AI seats) calls this. The `version`
 * must be higher than the stored one, so a straggling write can never overwrite
 * a fresher state; `false` means the write lost that race and the caller should
 * resync from the room instead.
 */
export async function pushState(code: string, state: MultiState, version: number): Promise<boolean> {
  return (await roomApi<{ applied: boolean }>(`/${code}/state`, { state, version })).applied;
}

/** What the room's socket carries. */
type RoomMessage =
  | { type: "room"; room: Room }
  | { type: "presence"; online: string[] }
  | { type: "closed" }
  | { type: "error"; error: string };

export interface RoomListener {
  /** The room changed — or `null`: the host closed it. */
  room: (room: Room | null) => void;
  /** User ids currently connected to the room. */
  presence: (online: Set<string>) => void;
  /** The server refused the connection (e.g. the session expired). */
  error?: (message: string) => void;
}

const PING_MS = 20_000;
/** No pong for this long means the connection is dead even if it looks open. */
const DEAD_MS = PING_MS * 2;
const MAX_BACKOFF_MS = 10_000;
/** Close codes the server uses to say "don't come back". */
const FINAL_CLOSE = new Set([4401, 4404]);

/**
 * Follow one room live over a WebSocket: every change to the room, and who is
 * connected to it. Having the socket open is also what marks us present —
 * which is how the host spots a player who vanished without leaving (closed
 * tab, dead connection) so their seat doesn't stall the table.
 *
 * The server sends a full snapshot on every (re)connect, so reconnecting with
 * backoff is all it takes for a client that dropped off — or was asleep — to
 * catch up. Returns an unsubscribe function.
 */
export function subscribeRoom(code: string, on: RoomListener): () => void {
  let socket: WebSocket | null = null;
  let stopped = false;
  let attempt = 0;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const connect = () => {
    if (stopped) return;
    const ws = new WebSocket(socketUrl(`/rooms/${code}/socket`));
    socket = ws;
    let lastHeard = Date.now();

    ws.onopen = () => {
      attempt = 0;
      heartbeat = setInterval(() => {
        if (Date.now() - lastHeard > DEAD_MS) ws.close();
        else ws.send("ping");
      }, PING_MS);
    };

    ws.onmessage = (e) => {
      lastHeard = Date.now();
      if (e.data === "pong") return;
      const msg = JSON.parse(e.data as string) as RoomMessage;
      if (msg.type === "room") on.room(msg.room);
      else if (msg.type === "presence") on.presence(new Set(msg.online));
      else if (msg.type === "closed") {
        stopped = true;
        on.room(null);
      } else if (msg.type === "error") {
        stopped = true;
        on.error?.(msg.error);
      }
    };

    ws.onclose = (e) => {
      clearInterval(heartbeat);
      if (stopped || FINAL_CLOSE.has(e.code)) return;
      const delay = Math.min(MAX_BACKOFF_MS, 500 * 2 ** attempt++);
      retry = setTimeout(connect, delay);
    };
  };

  connect();
  return () => {
    stopped = true;
    clearTimeout(retry);
    clearInterval(heartbeat);
    socket?.close();
  };
}
