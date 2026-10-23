import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/store/gameStore";
import { getRoom, pushState, type Room } from "@/lib/rooms";
import { aiShouldMove, aiTurnDelay } from "./useAIDriver";
import { PENALTY_DELAY_MS } from "@/lib/timing";

/**
 * How long a seat's player may be off the air before the AI takes over. Long
 * enough to ride out a page refresh or a phone changing networks, short enough
 * that a closed tab doesn't strand everyone else.
 */
const OFFLINE_GRACE_MS = 45_000;
const OFFLINE_CHECK_MS = 5_000;

export interface OnlineGame {
  /** True once an authoritative state has been applied — the board can render. */
  synced: boolean;
  /** True when this client may act right now. */
  myTurn: boolean;
  /** Run a local move and publish the result; a no-op when it isn't my turn. */
  act: (move: () => void) => void;
  /** Publish whatever is in the store right now (for host-authored changes). */
  publish: () => void;
}

/**
 * Keeps one client in step with a room's shared game.
 *
 * Authority is held by exactly one client at a time, so writes never contend:
 * the seat whose turn it is owns its own move, and the host owns everything
 * nobody is sitting at — AI turns, deferred +2/+4 draws, and seats whose player
 * has walked away. Every authoritative change is published as the whole game
 * state under a strictly increasing version, and every other client simply
 * replays it.
 */
export function useOnlineGame(
  code: string,
  room: Room,
  mySeat: number,
  isHost: boolean,
  online: Set<string>,
): OnlineGame {
  const [synced, setSynced] = useState(false);
  /** Highest version we've applied from the room or written ourselves. */
  const version = useRef(0);
  /** Seat → when its player dropped off presence, for the grace period. */
  const offlineSince = useRef(new Map<number, number>());
  /** Substance of the last state we published, to recognise a no-op. */
  const lastSent = useRef("");

  const phase = useGame((s) => s.phase);
  const currentIndex = useGame((s) => s.currentIndex);
  const penaltyKey = useGame((s) => s.pendingPenalty?.key ?? null);
  const seatIsBot = useGame((s) => s.players[mySeat]?.isAI ?? false);
  // Watched so that handing the seat that's *currently* on turn to the AI wakes
  // the driver below — that change moves neither the phase nor the turn.
  const currentIsBot = useGame((s) => s.players[s.currentIndex]?.isAI ?? false);

  const publish = useCallback(async () => {
    const s = useGame.getState();
    // A colour prompt is a half-finished move — the card hasn't left the hand.
    if (s.phase === "choosingColor") return;

    // Some interactions only make noise: clicking an illegal card shakes it and
    // sounds the buzzer, but moves nothing. Comparing everything *except* the
    // event means those never burn a version or wake the other clients.
    const state = s.getMultiState();
    const { eventType: _sound, ...substance } = state;
    const signature = JSON.stringify(substance);
    if (signature === lastSent.current) return;

    const next = version.current + 1;
    version.current = next;
    try {
      if (await pushState(code, state, next)) {
        // Only once it's really stored does this count as said. Recording it
        // up front would make a failed write look published, and a retry of
        // the same move would be skipped as a no-op — losing it for good.
        lastSent.current = signature;
        return;
      }
      // Our write lost to a fresher one; adopt theirs rather than diverge.
      const fresh = await getRoom(code);
      if (fresh?.state && fresh.version >= version.current) {
        version.current = fresh.version;
        useGame.getState().hydrate(fresh.state);
      }
    } catch {
      /* transient network error — the next authoritative push re-syncs us */
    }
  }, [code]);

  // Apply incoming states. Anything at or below our own version is either stale
  // or the echo of our own write, which we've already applied locally.
  useEffect(() => {
    if (!room.state || room.version <= version.current) return;
    version.current = room.version;
    useGame.getState().hydrate(room.state);
    setSynced(true);
  }, [room]);

  // Host: play out a queued +2/+4 once its effect animation has finished.
  // `synced` matters here: until the room's state has landed, any penalty in
  // the store belongs to whatever was played before this room was opened.
  useEffect(() => {
    if (!isHost || !synced || penaltyKey === null) return;
    const t = setTimeout(() => {
      useGame.getState().applyPendingPenalty();
      void publish();
    }, PENALTY_DELAY_MS);
    return () => clearTimeout(t);
  }, [isHost, synced, penaltyKey, publish]);

  // Host: take the AI seats' turns after a short "thinking" pause, waiting out
  // an action card's animation so the next move doesn't land on top of it.
  useEffect(() => {
    if (!isHost || !synced) return;
    const s = useGame.getState();
    if (!aiShouldMove(s)) return;

    const t = setTimeout(() => {
      useGame.getState().runAITurn();
      void publish();
    }, aiTurnDelay(s));
    return () => clearTimeout(t);
  }, [isHost, synced, phase, currentIndex, currentIsBot, penaltyKey, publish]);

  // Host: keep the game's players in step with who is actually sitting down.
  // An empty seat would stall the table forever, so the AI takes it over —
  // leaving is immediate, dropping off the air gets a grace period first — and
  // a seat someone has just dropped into goes back to being played by a human.
  useEffect(() => {
    if (!isHost || !synced || !room.seats) return;
    const seats = room.seats;

    const sweep = () => {
      // An empty presence set means it simply hasn't synced yet; acting on it
      // would eventually declare every player, including us, to be missing.
      if (!online.size) return;

      const players = useGame.getState().players;
      const now = Date.now();
      const toAI: number[] = [];
      const toHuman: { index: number; username: string }[] = [];

      seats.forEach((seat, i) => {
        const player = players[i];
        if (!player) return;

        // Nobody owns this seat — it's the AI's until someone claims it.
        if (!seat.userId) {
          offlineSince.current.delete(i);
          if (!player.isAI) toAI.push(i);
          return;
        }

        const listed = room.players.some((p) => p.userId === seat.userId);
        if (listed && online.has(seat.userId)) {
          offlineSince.current.delete(i);
          if (player.isAI || player.name !== seat.username) {
            toHuman.push({ index: i, username: seat.username });
          }
          return;
        }
        if (!listed) {
          toAI.push(i); // left the room outright
          return;
        }
        const since = offlineSince.current.get(i) ?? now;
        offlineSince.current.set(i, since);
        if (now - since >= OFFLINE_GRACE_MS) toAI.push(i);
      });

      if (!toAI.length && !toHuman.length) return;
      toAI.forEach((i) => offlineSince.current.delete(i));
      if (toAI.length) useGame.getState().takeOverSeats(toAI);
      if (toHuman.length) useGame.getState().seatPlayers(toHuman);
      void publish();
    };

    sweep();
    const t = setInterval(sweep, OFFLINE_CHECK_MS);
    return () => clearInterval(t);
  }, [isHost, synced, room, online, publish]);

  const myTurn =
    synced && phase === "playing" && currentIndex === mySeat && !seatIsBot && penaltyKey === null;

  const act = useCallback(
    (move: () => void) => {
      const s = useGame.getState();
      // An unresolved +2/+4 means the host is still about to write; moving now
      // would race that write and lose the move.
      const mine = s.phase === "playing" && !s.players[mySeat]?.isAI && !s.pendingPenalty;
      // A pending colour choice is still my own move, so it counts as my turn.
      const choosing = s.phase === "choosingColor";
      if (s.currentIndex !== mySeat || (!mine && !choosing)) return;
      move();
      void publish();
    },
    [mySeat, publish],
  );

  return { synced, myTurn, act, publish };
}
