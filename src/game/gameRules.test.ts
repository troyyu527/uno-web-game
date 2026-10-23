import { describe, it, expect } from "vitest";
import { canPlay } from "./rules";
import { useGame } from "@/store/gameStore";
import { topOf } from "./deck";
import type { Card } from "./types";

const card = (id: string, suit: Card["suit"], value: Card["value"]): Card => ({ id, suit, value });

const RED3 = card("top", "Red", "3");
const D4 = card("d4", "Wild", "Draw Four");

const FOUR = ["Ana", "Ben", "Cal", "Dee"].map((username) => ({ username, isAI: false }));

/** Deal, then give seat 0 a known hand with a known card on top. */
function table(hand: Card[], top: Card = RED3) {
  useGame.getState().startMultiplayer(FOUR);
  useGame.setState({
    currentIndex: 0,
    direction: 1,
    discardPile: [top],
    players: useGame.getState().players.map((p, i) => (i === 0 ? { ...p, hand } : p)),
  });
}

// House rule, chosen deliberately over the official restriction: a Wild Draw
// Four is a live option on any turn. Officially it's only legal when you can't
// follow colour, which needs the challenge mechanic to be worth anything.
describe("table rule — Wild Draw Four is playable on any turn", () => {
  it("is legal even while holding the colour in force", () => {
    expect(canPlay(D4, RED3)).toBe(true);
  });

  it("is legal on top of a wild that named a colour you hold", () => {
    const wildTop = { ...card("t", "Wild", "Wild"), wildColor: "Blue" as const };
    expect(canPlay(D4, wildTop)).toBe(true);
  });

  it("is accepted by the store with a full hand of matching colour", () => {
    table([D4, card("r7", "Red", "7"), card("r2", "Red", "2")]);
    useGame.getState().playCard("d4", "Blue");
    const s = useGame.getState();
    expect(s.event?.type).not.toBe("reject");
    expect(topOf(s.discardPile)).toMatchObject({ value: "Draw Four", wildColor: "Blue" });
    expect(s.players[0].hand).toHaveLength(2);
  });

  it("still skips its victim and still costs them four", () => {
    table([D4, card("r7", "Red", "7"), card("r2", "Red", "2")]);
    useGame.getState().playCard("d4", "Blue");

    const s = useGame.getState();
    expect(s.pendingPenalty).toMatchObject({ victim: "p2", count: 4 });
    expect(s.currentIndex).toBe(2); // seat 1 skipped past

    useGame.getState().applyPendingPenalty();
    expect(useGame.getState().players[1].hand).toHaveLength(11);
  });

  it("leaves the plain Wild playable too, without a penalty", () => {
    table([card("w1", "Wild", "Wild"), card("r7", "Red", "7")]);
    useGame.getState().playCard("w1", "Green");
    const s = useGame.getState();
    expect(s.pendingPenalty).toBeNull();
    expect(s.currentIndex).toBe(1); // no skip
  });
});

// The user-facing shape of the previous player's action, which the Draw Four
// change must not disturb: your turn disappears, and +2/+4 also cost you cards.
describe("being skipped by the previous player", () => {
  const played = (c: Card, color?: "Red" | "Green" | "Blue" | "Yellow") => {
    table([c, card("keep1", "Yellow", "1"), card("keep2", "Yellow", "2")]);
    useGame.getState().playCard(c.id, color);
    return useGame.getState();
  };

  it("Skip takes the next player's turn and costs nothing", () => {
    const s = played(card("sk", "Red", "Skip"));
    expect(s.currentIndex).toBe(2);
    expect(s.pendingPenalty).toBeNull();
    expect(s.players[1].hand).toHaveLength(7);
  });

  it("Draw Two takes the turn and costs two", () => {
    const s = played(card("d2", "Red", "Draw Two"));
    expect(s.currentIndex).toBe(2);
    expect(s.pendingPenalty).toMatchObject({ victim: "p2", count: 2 });
    useGame.getState().applyPendingPenalty();
    expect(useGame.getState().players[1].hand).toHaveLength(9);
  });

  it("Draw Four takes the turn and costs four", () => {
    const s = played(D4, "Blue");
    expect(s.currentIndex).toBe(2);
    expect(s.pendingPenalty).toMatchObject({ victim: "p2", count: 4 });
    useGame.getState().applyPendingPenalty();
    expect(useGame.getState().players[1].hand).toHaveLength(11);
  });

  it("skips the right seat when play has been reversed", () => {
    table([card("d2", "Red", "Draw Two"), card("k", "Yellow", "1")]);
    useGame.setState({ direction: -1 });
    useGame.getState().playCard("d2");
    const s = useGame.getState();
    expect(s.pendingPenalty).toMatchObject({ victim: "p4", count: 2 }); // seat 3
    expect(s.currentIndex).toBe(2);
  });

  it("does not stack — a +2 victim draws rather than answering with their own", () => {
    table([card("d2", "Red", "Draw Two"), card("k", "Yellow", "1")]);
    useGame.getState().playCard("d2");
    // Seat 1 is the victim and never gets a turn to reply; play is already past.
    expect(useGame.getState().currentIndex).toBe(2);
    useGame.getState().applyPendingPenalty();
    expect(useGame.getState().players[1].hand).toHaveLength(9);
    expect(useGame.getState().currentIndex).toBe(2);
  });
});

describe("official rule — the opening flip acts on the first player", () => {
  const SEATS = ["Ana", "Ben", "Cal", "Dee"].map((username) => ({ username, isAI: true }));

  /** Deal repeatedly until the starter is the value we want to check. */
  const dealUntil = (value: Card["value"]) => {
    for (let i = 0; i < 4000; i++) {
      useGame.getState().startMultiplayer(SEATS);
      if (topOf(useGame.getState().discardPile)?.value === value) return useGame.getState();
    }
    throw new Error(`never dealt a ${value} starter`);
  };

  it("never opens on a wild", () => {
    for (let i = 0; i < 200; i++) {
      useGame.getState().startMultiplayer(SEATS);
      expect(topOf(useGame.getState().discardPile)?.suit).not.toBe("Wild");
    }
  });

  it("skips the first player on a Skip", () => {
    expect(dealUntil("Skip").currentIndex).toBe(1);
  });

  it("turns the table around on a Reverse", () => {
    const s = dealUntil("Reverse");
    expect(s.direction).toBe(-1);
    expect(s.currentIndex).toBe(0);
  });

  it("makes the first player draw two and lose the turn on a Draw Two", () => {
    const s = dealUntil("Draw Two");
    expect(s.players[0].hand).toHaveLength(9);
    expect(s.players[1].hand).toHaveLength(7);
    expect(s.currentIndex).toBe(1);
    // The two extra cards came out of the deck, not from nowhere.
    const total =
      s.players.reduce((n, p) => n + p.hand.length, 0) + s.drawPile.length + s.discardPile.length;
    expect(total).toBe(108);
  });

  it("opens normally on a number card", () => {
    const s = dealUntil("5");
    expect(s.currentIndex).toBe(0);
    expect(s.direction).toBe(1);
    expect(s.players[0].hand).toHaveLength(7);
  });
});

describe("official rule — after drawing, only the drawn card may be played", () => {
  const SEATS = ["Ana", "Ben", "Cal", "Dee"].map((username) => ({ username, isAI: false }));

  /** Seat 0 holds one unplayable card; the deck's next card is a known red. */
  const setup = () => {
    useGame.getState().startMultiplayer(SEATS);
    useGame.setState({
      currentIndex: 0,
      direction: 1,
      discardPile: [RED3],
      drawPile: [card("r9", "Red", "9")],
      players: useGame.getState().players.map((p, i) =>
        i === 0 ? { ...p, hand: [card("g5", "Green", "5"), card("r2", "Red", "2")] } : p,
      ),
    });
  };

  it("records the drawn card and offers only it", () => {
    setup();
    useGame.getState().drawForCurrent();
    const s = useGame.getState();
    expect(s.awaitingPostDraw).toBe(true);
    expect(s.drawnCardId).toBe("r9");
  });

  it("refuses a different card from hand, even a legal one", () => {
    setup();
    useGame.getState().drawForCurrent();
    // r2 is a perfectly legal red — but it isn't what was drawn.
    useGame.getState().playCard("r2");
    const s = useGame.getState();
    expect(s.event?.type).toBe("reject");
    expect(s.currentIndex).toBe(0);
    expect(s.players[0].hand).toHaveLength(3);
  });

  it("accepts the drawn card", () => {
    setup();
    useGame.getState().drawForCurrent();
    useGame.getState().playCard("r9");
    const s = useGame.getState();
    expect(topOf(s.discardPile)?.id).toBe("r9");
    expect(s.currentIndex).toBe(1);
    expect(s.drawnCardId).toBeNull();
  });

  it("clears the restriction when passing", () => {
    setup();
    useGame.getState().drawForCurrent();
    useGame.getState().pass();
    const s = useGame.getState();
    expect(s.awaitingPostDraw).toBe(false);
    expect(s.drawnCardId).toBeNull();
    expect(s.currentIndex).toBe(1);
  });

  it("holds the AI to the same restriction", () => {
    // Nothing in hand follows Red 3, so the AI has to draw. The drawn Red 9 is
    // playable, and under official rules it's the only card it may play — even
    // though drawing it also makes the Red 2 it then holds legal.
    useGame.getState().startMultiplayer(SEATS.map((s) => ({ ...s, isAI: true })));
    useGame.setState({
      currentIndex: 0,
      direction: 1,
      discardPile: [RED3],
      drawPile: [card("r2", "Red", "2"), card("r9", "Red", "9")],
      players: useGame.getState().players.map((p, i) =>
        i === 0 ? { ...p, hand: [card("g5", "Green", "5"), card("b7", "Blue", "7")] } : p,
      ),
    });
    useGame.getState().runAITurn();
    const s = useGame.getState();
    expect(topOf(s.discardPile)?.id).toBe("r9");
    expect(s.players[0].hand.map((c) => c.id).sort()).toEqual(["b7", "g5"]);
    expect(s.currentIndex).toBe(1);
  });
});
