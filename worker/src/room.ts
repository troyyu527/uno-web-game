import { DurableObject } from "cloudflare:workers";
import type { Env } from "./index";

export interface Member {
  userId: string;
  username: string;
}

export interface Seat {
  userId: string | null; // null → AI-controlled seat
  username: string;
  isAI: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  status: "lobby" | "playing" | "finished";
  players: Member[];
  seats: Seat[] | null;
  /** The full game blob. Opaque to the server — the rules live in the client. */
  state: unknown;
  version: number;
  updatedAt: number;
}

export type Failure = { ok: false; status: number; error: string };
export type Outcome = { ok: true; room: Room } | Failure;

/** What a room's WebSocket carries, server → client. */
type Message =
  | { type: "room"; room: Room }
  | { type: "presence"; online: string[] }
  | { type: "closed" };

const MAX_PLAYERS = 4;
/** A room nobody has touched (and nobody is connected to) for this long is deleted. */
const IDLE_MS = 24 * 60 * 60 * 1000;
/** Close code telling the client the room is gone and it shouldn't reconnect. */
export const CLOSE_GONE = 4404;

const fail = (status: number, error: string): Failure => ({ ok: false, status, error });

/** Seat indexes the AI is holding with no owner — free for a newcomer to take. */
const freeSeats = (room: Room): number[] =>
  room.seats?.flatMap((s, i) => (s.isAI && !s.userId ? [i] : [])) ?? [];

/**
 * One room. A Durable Object runs one request at a time, so every
 * read-modify-write below is atomic — two people joining at once, or reaching
 * for the same seat, can't trample each other.
 *
 * Connected clients hold a hibernatable WebSocket tagged with their user id.
 * That doubles as presence: whoever has a socket open is "online". Every write
 * pushes the whole room to every socket.
 */
export class RoomObject extends DurableObject<Env> {
  private room: Room | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    void ctx.blockConcurrencyWhile(async () => {
      this.room = (await ctx.storage.get<Room>("room")) ?? null;
    });
    // Heartbeats are answered without waking the object.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  /** Claim this (fresh) room for `host`; null if the code is already in use. */
  async create(code: string, host: Member): Promise<Room | null> {
    if (this.room) return null;
    return this.save({
      code,
      hostId: host.userId,
      status: "lobby",
      players: [host],
      seats: null,
      state: null,
      version: 0,
      updatedAt: Date.now(),
    });
  }

  async get(): Promise<Room | null> {
    return this.room;
  }

  /**
   * Add `user` to the lobby (idempotent). Once a game is under way only its own
   * players may re-enter — that's the reconnect path — though a newcomer may
   * still look in if the AI is holding a seat they could claim.
   */
  async join(user: Member): Promise<Outcome> {
    const room = this.room;
    if (!room) return fail(404, "No room with that code.");
    if (room.players.some((p) => p.userId === user.userId)) return { ok: true, room };

    if (room.status !== "lobby") {
      const seated = room.seats?.some((s) => s.userId === user.userId) ?? false;
      if (!seated) {
        // Nothing is written until they actually claim a seat.
        if (freeSeats(room).length) return { ok: true, room };
        return fail(409, "That game has already started.");
      }
      // Seated but dropped out of `players` (left / lost connection) → re-list them.
    } else if (room.players.length >= MAX_PLAYERS) {
      return fail(409, "That room is full.");
    }
    return { ok: true, room: await this.save({ ...room, players: [...room.players, user] }) };
  }

  /**
   * The host leaving closes the room for everyone. Anyone else is dropped from
   * `players` and — mid-game — their seat goes back to the AI.
   */
  async leave(user: Member): Promise<void> {
    const room = this.room;
    if (!room) return;
    if (room.hostId === user.userId) return this.destroy();
    await this.save({
      ...room,
      players: room.players.filter((p) => p.userId !== user.userId),
      seats:
        room.seats?.map((s) =>
          s.userId === user.userId ? { userId: null, username: s.username, isAI: true } : s,
        ) ?? null,
    });
  }

  /**
   * Take over a seat the AI is holding, mid-game. Only the seat is written —
   * flipping that player in the game state back to human is the host's job.
   */
  async claim(user: Member, seat: number): Promise<Outcome> {
    const room = this.room;
    if (!room) return fail(404, "No room with that code.");
    if (room.status !== "playing" || !room.seats?.[seat]) {
      return fail(409, "That game isn't running any more.");
    }
    if (room.seats.some((s, i) => i !== seat && s.userId === user.userId)) {
      return fail(409, "You're already sitting at this table.");
    }
    if (room.seats[seat].userId) return fail(409, "Someone just took that seat.");

    const seats = room.seats.map((s, i) =>
      i === seat ? { userId: user.userId, username: user.username, isAI: false } : s,
    );
    const players = room.players.some((p) => p.userId === user.userId)
      ? room.players
      : [...room.players, user];
    return { ok: true, room: await this.save({ ...room, seats, players }) };
  }

  /** Host only: publish the seating and opening deal, and flip to `playing`. */
  async start(user: Member, seats: Seat[], state: unknown): Promise<Outcome> {
    const room = this.room;
    if (!room) return fail(404, "No room with that code.");
    if (room.hostId !== user.userId) return fail(403, "Only the host can start the game.");
    if (room.status !== "lobby") return fail(409, "This room has already started.");
    return { ok: true, room: await this.save({ ...room, status: "playing", seats, state, version: 1 }) };
  }

  /**
   * Publish a new game state. `version` must beat the stored one, so a
   * straggling write can never overwrite a fresher state; `applied: false`
   * tells the caller it lost that race and should resync.
   */
  async pushState(
    user: Member,
    state: unknown,
    version: number,
  ): Promise<{ ok: true; applied: boolean } | Failure> {
    const room = this.room;
    if (!room) return fail(404, "No room with that code.");
    const atTable =
      room.hostId === user.userId ||
      room.players.some((p) => p.userId === user.userId) ||
      (room.seats?.some((s) => s.userId === user.userId) ?? false);
    if (!atTable) return fail(403, "You're not at this table.");
    if (version <= room.version) return { ok: true, applied: false };
    await this.save({ ...room, state, version });
    return { ok: true, applied: true };
  }

  /** WebSocket upgrade. The Worker has already authenticated the user. */
  async fetch(request: Request): Promise<Response> {
    const userId = request.headers.get("X-User-Id");
    if (!userId || request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected a WebSocket upgrade.", { status: 426 });
    }
    const [client, server] = Object.values(new WebSocketPair());

    if (!this.room) {
      // Say why before hanging up, so the client doesn't keep reconnecting.
      server.accept();
      server.send(JSON.stringify({ type: "closed" } satisfies Message));
      server.close(CLOSE_GONE, "No such room");
      return new Response(null, { status: 101, webSocket: client });
    }

    this.ctx.acceptWebSocket(server, [userId]);
    // A fresh snapshot on every (re)connect is how a client catches up.
    server.send(JSON.stringify({ type: "room", room: this.room } satisfies Message));
    this.broadcastPresence();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(): Promise<void> {
    // Clients only send heartbeats, which the auto-response answers.
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    this.broadcastPresence(ws);
    try {
      ws.close(code, reason);
    } catch {
      /* already closed, or a code that can't be echoed */
    }
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.broadcastPresence(ws);
  }

  async alarm(): Promise<void> {
    const room = this.room;
    if (!room) return;
    const idleUntil = room.updatedAt + IDLE_MS;
    if (Date.now() < idleUntil || this.ctx.getWebSockets().length) {
      await this.ctx.storage.setAlarm(Math.max(idleUntil, Date.now() + IDLE_MS / 24));
      return;
    }
    await this.destroy();
  }

  private async save(room: Room): Promise<Room> {
    const next = { ...room, updatedAt: Date.now() };
    this.room = next;
    await this.ctx.storage.put("room", next);
    await this.ctx.storage.setAlarm(next.updatedAt + IDLE_MS);
    this.broadcast({ type: "room", room: next });
    return next;
  }

  private async destroy(): Promise<void> {
    this.room = null;
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
    this.broadcast({ type: "closed" });
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.close(CLOSE_GONE, "Room closed");
      } catch {
        /* already closing */
      }
    }
  }

  private broadcast(msg: Message, except?: WebSocket): void {
    const data = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except) continue;
      try {
        ws.send(data);
      } catch {
        /* closing — its close handler will update presence */
      }
    }
  }

  /** Tell everyone who's connected. `leaving` is a socket that's on its way out. */
  private broadcastPresence(leaving?: WebSocket): void {
    const online = new Set<string>();
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== leaving) for (const tag of this.ctx.getTags(ws)) online.add(tag);
    }
    this.broadcast({ type: "presence", online: [...online] }, leaving);
  }
}
