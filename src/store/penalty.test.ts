import { describe, it, expect } from "vitest";
import { useGame } from "./gameStore";
import { aiShouldMove, aiTurnDelay, AI_THINK_MS } from "@/hooks/useAIDriver";
import { ACTION_TURN_MS } from "@/lib/timing";
import type { Card } from "@/game/types";

const SEATS = ["Ana", "Ben", "Cal", "Dee"].map((username) => ({ username, isAI: true }));

/** Deal, then hand seat `i` exactly these cards with a known card on top. */
function table(hands: Record<number, Card[]>, top: Card = { id: "top", suit: "Red", value: "3" }) {
  useGame.getState().startMultiplayer(SEATS);
  useGame.setState({
    currentIndex: 0,
    direction: 1,
    discardPile: [top],
    players: useGame.getState().players.map((p, i) => (hands[i] ? { ...p, hand: hands[i] } : p)),
  });
}

const driverWouldMove = () => aiShouldMove(useGame.getState());

describe("+2 / +4 penalties are always dealt out", () => {
  it("queues the draw against the skipped player and advances past them", () => {
    table({ 0: [{ id: "d4", suit: "Wild", value: "Draw Four" }, { id: "g9", suit: "Green", value: "9" }] });
    useGame.getState().playCard("d4", "Blue");

    const s = useGame.getState();
    expect(s.pendingPenalty).toMatchObject({ victim: "p2", count: 4 });
    expect(s.currentIndex).toBe(2); // seat 1 is skipped
    expect(s.players[1].hand).toHaveLength(7); // not yet — it waits for the effect

    useGame.getState().applyPendingPenalty();
    expect(useGame.getState().players[1].hand).toHaveLength(11);
    expect(useGame.getState().pendingPenalty).toBeNull();
  });

  // The reported bug: a +4 played as someone's second-to-last card emits "uno"
  // rather than "action". Everything keyed off that event fell through — the
  // next AI moved early, won, and the victim's four cards were never dealt.
  it("still holds the table when the +4 is played on UNO", () => {
    table({
      0: [
        { id: "d4", suit: "Wild", value: "Draw Four" },
        { id: "g9", suit: "Green", value: "9" },
      ],
    });
    useGame.getState().playCard("d4", "Blue");

    const s = useGame.getState();
    expect(s.event?.type).toBe("uno"); // the event that used to mask the action
    expect(s.lastAction).toMatchObject({ value: "Draw Four", victim: "p2" });
    expect(s.pendingPenalty).toMatchObject({ victim: "p2", count: 4 });

    // Nobody may move until those four cards have actually been drawn.
    expect(driverWouldMove()).toBe(false);
    useGame.getState().applyPendingPenalty();
    expect(useGame.getState().players[1].hand).toHaveLength(11);
    expect(driverWouldMove()).toBe(true);
  });

  it("shows the effect for an action card played on UNO", () => {
    // ActionEffect / ActionStamp fire on lastAction.key, so a "uno" event no
    // longer costs the play its animation.
    table({ 0: [{ id: "sk", suit: "Red", value: "Skip" }, { id: "r5", suit: "Red", value: "5" }] });
    useGame.getState().playCard("sk");

    const s = useGame.getState();
    expect(s.event?.type).toBe("uno");
    expect(s.lastAction).toMatchObject({ value: "Skip", victim: "p2" });
    expect(typeof s.lastAction?.key).toBe("number");
    expect(aiTurnDelay(s)).toBe(ACTION_TURN_MS); // effect gets its full time
  });

  it("gives each action its own key so an effect fires once, not per event", () => {
    table({ 0: [{ id: "d2", suit: "Red", value: "Draw Two" }, { id: "r5", suit: "Red", value: "5" }] });
    useGame.getState().playCard("d2");
    const first = useGame.getState().lastAction?.key;

    // The penalty draw is a fresh event but the same action — the animation
    // must not re-trigger off it.
    useGame.getState().applyPendingPenalty();
    expect(useGame.getState().lastAction?.key).toBe(first);
    expect(useGame.getState().event?.type).toBe("draw");
    // …and with the draw done, the next seat moves on the ordinary pause.
    expect(aiTurnDelay(useGame.getState())).toBe(AI_THINK_MS);
  });

  it("does not stall the table on an ordinary card", () => {
    table({ 0: [{ id: "r5", suit: "Red", value: "5" }, { id: "r6", suit: "Red", value: "6" }] });
    useGame.getState().playCard("r5");
    const s = useGame.getState();
    expect(s.lastAction).toBeNull();
    expect(s.pendingPenalty).toBeNull();
    expect(aiTurnDelay(s)).toBe(AI_THINK_MS);
    expect(driverWouldMove()).toBe(true);
  });

  it("conserves the deck across a penalty that recycles the draw pile", () => {
    table({ 0: [{ id: "d4", suit: "Wild", value: "Draw Four" }, { id: "g9", suit: "Green", value: "9" }] });
    // Strip the draw pile to one card so the penalty has to recycle discards.
    const s0 = useGame.getState();
    useGame.setState({
      drawPile: s0.drawPile.slice(0, 1),
      discardPile: [...s0.drawPile.slice(1), ...s0.discardPile],
    });
    const total = () => {
      const s = useGame.getState();
      return s.players.reduce((n, p) => n + p.hand.length, 0) + s.drawPile.length + s.discardPile.length;
    };
    const before = total();

    useGame.getState().playCard("d4", "Blue");
    useGame.getState().applyPendingPenalty();

    expect(useGame.getState().players[1].hand).toHaveLength(11);
    expect(total()).toBe(before);
  });

  it("always advances the turn after an AI draws, even if it can't play", () => {
    // The drawn card is playable by construction, so the AI plays it. The point
    // is that the fallback still works: `pass` needs `awaitingPostDraw` intact.
    table({ 0: [{ id: "g9", suit: "Green", value: "9" }] }, { id: "top", suit: "Red", value: "3" });
    const before = useGame.getState().currentIndex;
    useGame.getState().runAITurn();
    const s = useGame.getState();
    expect(s.phase === "gameover" || s.currentIndex !== before).toBe(true);
    expect(s.awaitingPostDraw).toBe(false);
  });

  it("plays 40 games without ever leaving a penalty unpaid", () => {
    for (let game = 0; game < 40; game++) {
      useGame.getState().startMultiplayer(SEATS);
      let steps = 0;
      while (useGame.getState().phase !== "gameover" && steps < 6000) {
        const s = useGame.getState();
        // Mirrors the drivers: settle any owed cards before anyone moves.
        if (s.pendingPenalty) {
          const owed = s.pendingPenalty.count;
          const victim = s.players.findIndex((p) => p.id === s.pendingPenalty!.victim);
          const had = s.players[victim].hand.length;
          s.applyPendingPenalty();
          expect(useGame.getState().players[victim].hand.length).toBe(had + owed);
        } else {
          s.runAITurn();
        }
        steps++;
      }
      expect(useGame.getState().phase).toBe("gameover");
      // A win can't leave a penalty hanging: commit ends the game before
      // queueing one, so there is never an unpaid draw at the final whistle.
      expect(useGame.getState().pendingPenalty).toBeNull();
    }
  });
});
