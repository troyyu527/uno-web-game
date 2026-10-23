import { create } from "zustand";
import {
  type Card,
  type ColorSuit,
  type Player,
  type PlayerId,
} from "@/game/types";
import { freshDeck, shuffle, topOf } from "@/game/deck";
import { canPlay } from "@/game/rules";
import { chooseCardIndex, chooseWildColor } from "@/game/ai";

export type Phase = "menu" | "playing" | "choosingColor" | "gameover";

/** A sound/animation cue emitted by state transitions. */
export type GameEvent =
  | "deal" | "play" | "action" | "draw" | "reject" | "uno" | "gameover";

/** The serializable slice of state — what save/load persists. */
export interface Snapshot {
  players: Player[];
  currentIndex: number;
  direction: 1 | -1;
  drawPile: Card[];
  discardPile: Card[];
}

/** The full game state synced between players in an online room. */
export interface MultiState {
  players: Player[];
  currentIndex: number;
  direction: 1 | -1;
  drawPile: Card[];
  discardPile: Card[];
  phase: Phase;
  awaitingPostDraw: boolean;
  drawnCardId: string | null;
  winner: Player | null;
  message: string;
  eventType: GameEvent | null;
  lastActor: PlayerId | null;
  lastAction: { value: Card["value"]; victim: PlayerId | null; key: number } | null;
  pendingPenalty: { victim: PlayerId; count: number; key: number } | null;
}

/** One table seat when starting an online game (index = seat 0–3). */
export interface SeatSpec {
  username: string;
  isAI: boolean;
}

interface GameStore extends Snapshot {
  phase: Phase;
  /** A wild card the human played that is awaiting a color choice. */
  pendingWildCardId: string | null;
  /** True when the current player drew a playable card and may play it or pass. */
  awaitingPostDraw: boolean;
  /** The card just drawn — the only one playable this turn, per official rules. */
  drawnCardId: string | null;
  winner: Player | null;
  message: string;
  /** Increments on every emitted event so listeners can react. */
  event: { type: GameEvent; n: number } | null;
  /** Who just acted (played/drew) — used to fly cards in from their seat. */
  lastActor: PlayerId | null;
  /**
   * The action a play just triggered (for the centre effect animation), with
   * its own key so listeners fire once per action. Deliberately independent of
   * `event`: an action card played as someone's second-to-last emits "uno"
   * rather than "action", so keying animations off the event made those plays
   * silently skip their effect.
   */
  lastAction: { value: Card["value"]; victim: PlayerId | null; key: number } | null;
  /** A +2/+4 draw that's been queued but not applied yet, so it can wait for the effect. */
  pendingPenalty: { victim: PlayerId; count: number; key: number } | null;

  newGame: (humanName: string) => void;
  playCard: (cardId: string, chosenColor?: ColorSuit) => void;
  drawForCurrent: () => void;
  applyPendingPenalty: () => void;
  pass: () => void;
  chooseColor: (color: ColorSuit) => void;
  /** Run an AI move for the current player. `force` also covers an idle human seat. */
  runAITurn: (force?: boolean) => void;
  loadSnapshot: (s: Snapshot) => void;
  getSnapshot: () => Snapshot;
  toMenu: () => void;

  // --- Online multiplayer ---
  /** Host deals a fresh online game from the seat assignment. */
  startMultiplayer: (seats: SeatSpec[]) => void;
  /** Replace local state with an authoritative snapshot received from the network. */
  hydrate: (s: MultiState) => void;
  /** Hand seats whose player has left over to the AI so the table isn't stuck. */
  takeOverSeats: (seatIndexes: number[]) => void;
  /** Hand seats back to the humans who just sat down in them. */
  seatPlayers: (seats: { index: number; username: string }[]) => void;
  /** The full state to push to the room after a move. */
  getMultiState: () => MultiState;
}

const HAND_SIZE = 7;

const makePlayers = (humanName: string): Player[] => [
  { id: "p1", name: humanName || "Player", isAI: false, hand: [] },
  { id: "p2", name: "AI-1", isAI: true, hand: [] },
  { id: "p3", name: "AI-2", isAI: true, hand: [] },
  { id: "p4", name: "AI-3", isAI: true, hand: [] },
];

/** Draw `n` cards, recycling the discard pile (minus its top) when the draw pile runs out. */
function drawCards(
  drawPile: Card[],
  discardPile: Card[],
  n: number,
): { drawn: Card[]; drawPile: Card[]; discardPile: Card[] } {
  let pile = [...drawPile];
  let discard = discardPile;
  const drawn: Card[] = [];
  for (let i = 0; i < n; i++) {
    if (pile.length === 0) {
      if (discard.length <= 1) break; // nothing left to recycle
      const keep = discard[discard.length - 1];
      // Recycled wild cards forget their chosen color.
      pile = shuffle(
        discard.slice(0, -1).map((c) => (c.suit === "Wild" ? { ...c, wildColor: null } : c)),
      );
      discard = [keep];
    }
    const card = pile.pop();
    if (!card) break;
    drawn.push(card);
  }
  return { drawn, drawPile: pile, discardPile: discard };
}

let eventSeq = 0;
const emit = (type: GameEvent) => ({ event: { type, n: eventSeq++ } });

/**
 * Shuffle, deal seven to each seat, and flip a starter. Shared by the
 * single-player and online deals so the two can't drift.
 *
 * Official rules apply the starter to the first player: a Draw Two makes them
 * draw two and lose the turn, a Skip passes them by, a Reverse turns the table
 * around before anyone plays. A wild starter is re-flipped instead — officially
 * the first player would name a colour, but that means a prompt before the game
 * has begun, and re-flipping is what digital UNO generally does.
 */
function deal(players: Player[]) {
  let drawPile = shuffle(freshDeck());
  for (let r = 0; r < HAND_SIZE; r++) {
    for (const p of players) p.hand.push(drawPile.pop() as Card);
  }
  const discardPile: Card[] = [];
  do {
    discardPile.push(drawPile.pop() as Card);
  } while (topOf(discardPile)?.suit === "Wild" && drawPile.length > 0);

  const starter = topOf(discardPile) as Card;
  let currentIndex = 0;
  let direction: 1 | -1 = 1;
  if (starter.value === "Reverse") {
    // Play still opens on seat 0, but runs the other way around the table.
    direction = -1;
  } else if (starter.value === "Skip") {
    currentIndex = 1;
  } else if (starter.value === "Draw Two") {
    const taken = drawCards(drawPile, discardPile, 2);
    players[0].hand.push(...taken.drawn);
    drawPile = taken.drawPile;
    currentIndex = 1;
  }

  return {
    phase: "playing" as Phase,
    players,
    drawPile,
    discardPile,
    currentIndex,
    direction,
    winner: null,
    pendingWildCardId: null,
    awaitingPostDraw: false,
    drawnCardId: null,
    lastActor: null,
    lastAction: null,
    pendingPenalty: null,
    message: `${players[currentIndex].name}'s turn`,
    ...emit("deal"),
  };
}

export const useGame = create<GameStore>((set, get) => {
  const mod = (i: number) => ((i % 4) + 4) % 4;

  /** Actually commit a validated play (card already known playable; wild color resolved). */
  function commit(cardId: string, chosenColor?: ColorSuit) {
    const s = get();
    const cur = s.currentIndex;
    const player = s.players[cur];
    const idx = player.hand.findIndex((c) => c.id === cardId);
    if (idx === -1) return;
    const card = player.hand[idx];

    const played: Card = { ...card, wildColor: chosenColor ?? null };
    const players = s.players.map((p, i) =>
      i === cur ? { ...p, hand: p.hand.filter((c) => c.id !== cardId) } : { ...p },
    );
    let discardPile = [...s.discardPile, played];
    let drawPile = s.drawPile;
    let direction = s.direction;

    // Resolve the card's effect.
    let skip = false;
    let penalty = 0;
    switch (card.value) {
      case "Reverse":
        direction = (direction * -1) as 1 | -1;
        break;
      case "Skip":
        skip = true;
        break;
      case "Draw Two":
        penalty = 2;
        skip = true;
        break;
      case "Draw Four":
        penalty = 4;
        skip = true;
        break;
    }
    const isAction = card.value === "Reverse" || skip;

    // Win?
    if (players[cur].hand.length === 0) {
      set({
        players,
        discardPile,
        drawPile,
        direction,
        phase: "gameover",
        winner: players[cur],
        message: `${players[cur].name} wins!`,
        awaitingPostDraw: false,
        drawnCardId: null,
        pendingWildCardId: null,
        ...emit("gameover"),
      });
      return;
    }

    // The immediate next player is skipped past; any +2/+4 draw is queued and
    // applied later (see applyPendingPenalty) so it plays out AFTER the effect,
    // not on top of it.
    const victim = mod(cur + direction);

    const steps = skip ? 2 : 1;
    const nextIndex = mod(cur + direction * steps);

    const ev = emit(players[cur].hand.length === 1 ? "uno" : isAction ? "action" : "play");

    set({
      players,
      discardPile,
      drawPile,
      direction,
      currentIndex: nextIndex,
      awaitingPostDraw: false,
      drawnCardId: null,
      pendingWildCardId: null,
      phase: "playing",
      lastActor: players[cur].id,
      lastAction:
        isAction || penalty > 0
          ? { value: card.value, victim: skip ? players[victim].id : null, key: ev.event.n }
          : null,
      pendingPenalty:
        penalty > 0 ? { victim: players[victim].id, count: penalty, key: ev.event.n } : null,
      message:
        players[cur].hand.length === 1
          ? `${players[cur].name} has UNO!`
          : `${players[nextIndex].name}'s turn`,
      ...ev,
    });
  }

  return {
    phase: "menu",
    players: makePlayers("Player"),
    currentIndex: 0,
    direction: 1,
    drawPile: [],
    discardPile: [],
    pendingWildCardId: null,
    awaitingPostDraw: false,
    drawnCardId: null,
    winner: null,
    message: "",
    event: null,
    lastActor: null,
    lastAction: null,
    pendingPenalty: null,

    newGame: (humanName) => set(deal(makePlayers(humanName))),

    playCard: (cardId, chosenColor) => {
      const s = get();
      if (s.phase !== "playing") return;
      const player = s.players[s.currentIndex];
      const card = player.hand.find((c) => c.id === cardId);
      if (!card) return;
      // Having drawn, the drawn card is the only one you may play this turn.
      if (s.awaitingPostDraw && s.drawnCardId && cardId !== s.drawnCardId) {
        set(emit("reject"));
        return;
      }
      if (!canPlay(card, topOf(s.discardPile))) {
        set(emit("reject"));
        return;
      }
      // A human wild without a color yet → ask for one.
      if (card.suit === "Wild" && !chosenColor && !player.isAI) {
        set({ phase: "choosingColor", pendingWildCardId: cardId });
        return;
      }
      commit(cardId, chosenColor);
    },

    chooseColor: (color) => {
      const s = get();
      if (s.phase !== "choosingColor" || !s.pendingWildCardId) return;
      const cardId = s.pendingWildCardId;
      set({ phase: "playing" });
      commit(cardId, color);
    },

    drawForCurrent: () => {
      const s = get();
      if (s.phase !== "playing" || s.awaitingPostDraw) return;
      const { drawn, drawPile, discardPile } = drawCards(s.drawPile, s.discardPile, 1);
      const cur = s.currentIndex;
      const players = s.players.map((p, i) =>
        i === cur ? { ...p, hand: [...p.hand, ...drawn] } : p,
      );
      const drewPlayable = drawn.length > 0 && canPlay(drawn[0], topOf(discardPile));
      if (drewPlayable) {
        set({
          players,
          drawPile,
          discardPile,
          awaitingPostDraw: true,
          drawnCardId: drawn[0].id,
          lastActor: players[cur].id,
          lastAction: null,
          message: "Drew a playable card — play it or pass.",
          ...emit("draw"),
        });
      } else {
        const nextIndex = mod(cur + s.direction);
        set({
          players,
          drawPile,
          discardPile,
          currentIndex: nextIndex,
          drawnCardId: null,
          lastActor: players[cur].id,
          lastAction: null,
          message: `${players[nextIndex].name}'s turn`,
          ...emit("draw"),
        });
      }
    },

    applyPendingPenalty: () => {
      const s = get();
      const pp = s.pendingPenalty;
      if (!pp) return;
      // If the game ended (or reset) in the meantime, just drop it.
      const vi = s.phase === "playing" ? s.players.findIndex((p) => p.id === pp.victim) : -1;
      if (vi === -1) {
        set({ pendingPenalty: null });
        return;
      }
      const { drawn, drawPile, discardPile } = drawCards(s.drawPile, s.discardPile, pp.count);
      const players = s.players.map((p, i) =>
        i === vi ? { ...p, hand: [...p.hand, ...drawn] } : p,
      );
      set({ players, drawPile, discardPile, pendingPenalty: null, ...emit("draw") });
    },

    pass: () => {
      const s = get();
      if (s.phase !== "playing" || !s.awaitingPostDraw) return;
      const nextIndex = mod(s.currentIndex + s.direction);
      set({
        currentIndex: nextIndex,
        awaitingPostDraw: false,
        drawnCardId: null,
        message: `${s.players[nextIndex].name}'s turn`,
      });
    },

    runAITurn: (force = false) => {
      const s = get();
      if (s.phase !== "playing") return;
      const player = s.players[s.currentIndex];
      if (!player.isAI && !force) return;

      /**
       * Play the best of `candidates`. Legality and colour choice are judged
       * against the whole `hand`, which differs from the candidates after a
       * draw — only the drawn card may be played, but a Draw Four's legality
       * still depends on everything else being held.
       */
      const play = (candidates: Card[], hand: Card[] = candidates): boolean => {
        const idx = chooseCardIndex(candidates, topOf(get().discardPile), hand);
        if (idx === null) return false;
        const card = candidates[idx];
        const color = card.suit === "Wild" ? chooseWildColor(hand) : undefined;
        get().playCard(card.id, color);
        return true;
      };

      if (play(player.hand)) return;
      // Nothing playable → draw one, then try just that card.
      get().drawForCurrent();
      const after = get();
      // Leave `awaitingPostDraw` standing rather than clearing it first: `pass`
      // needs it to advance the turn, so pre-clearing would turn a surprise
      // here into a table that never moves again.
      if (after.awaitingPostDraw) {
        const hand = after.players[after.currentIndex].hand;
        const drawn = hand.filter((c) => c.id === after.drawnCardId);
        if (!play(drawn, hand)) get().pass();
      }
    },

    loadSnapshot: (snap) => {
      set({
        phase: "playing",
        players: snap.players,
        currentIndex: snap.currentIndex,
        direction: snap.direction,
        drawPile: snap.drawPile,
        discardPile: snap.discardPile,
        winner: null,
        pendingWildCardId: null,
        awaitingPostDraw: false,
        drawnCardId: null,
        pendingPenalty: null,
        message: `${snap.players[snap.currentIndex].name}'s turn`,
      });
    },

    getSnapshot: () => {
      const s = get();
      return {
        players: s.players,
        currentIndex: s.currentIndex,
        direction: s.direction,
        drawPile: s.drawPile,
        discardPile: s.discardPile,
      };
    },

    toMenu: () => set({ phase: "menu", winner: null }),

    startMultiplayer: (seats) =>
      set(
        deal(
          seats.map((s, i) => ({
            id: `p${i + 1}` as PlayerId,
            name: s.username,
            isAI: s.isAI,
            hand: [],
          })),
        ),
      ),

    hydrate: (s) => {
      set({
        players: s.players,
        currentIndex: s.currentIndex,
        direction: s.direction,
        drawPile: s.drawPile,
        discardPile: s.discardPile,
        phase: s.phase,
        awaitingPostDraw: s.awaitingPostDraw,
        drawnCardId: s.drawnCardId,
        winner: s.winner,
        message: s.message,
        lastActor: s.lastActor,
        lastAction: s.lastAction,
        pendingPenalty: s.pendingPenalty,
        pendingWildCardId: null,
        // Re-stamp with a fresh local event id so sound/animation fire once per sync.
        ...(s.eventType ? emit(s.eventType) : { event: null }),
      });
    },

    takeOverSeats: (seatIndexes) => {
      const seats = new Set(seatIndexes);
      set({
        players: get().players.map((p, i) =>
          seats.has(i) && !p.isAI ? { ...p, isAI: true, name: `${p.name} (bot)` } : p,
        ),
      });
    },

    seatPlayers: (seats) => {
      const byIndex = new Map(seats.map((s) => [s.index, s.username]));
      set({
        players: get().players.map((p, i) => {
          const username = byIndex.get(i);
          return username && (p.isAI || p.name !== username)
            ? { ...p, isAI: false, name: username }
            : p;
        }),
      });
    },

    getMultiState: () => {
      const s = get();
      return {
        players: s.players,
        currentIndex: s.currentIndex,
        direction: s.direction,
        drawPile: s.drawPile,
        discardPile: s.discardPile,
        phase: s.phase,
        awaitingPostDraw: s.awaitingPostDraw,
        drawnCardId: s.drawnCardId,
        winner: s.winner,
        message: s.message,
        eventType: s.event?.type ?? null,
        lastActor: s.lastActor,
        lastAction: s.lastAction,
        pendingPenalty: s.pendingPenalty,
      };
    },
  };
});
