import { describe, it, expect } from "vitest";
import { useGame } from "./gameStore";
import { chooseCardIndex, chooseWildColor } from "@/game/ai";
import { topOf } from "@/game/deck";

const total = () => {
  const s = useGame.getState();
  return (
    s.players.reduce((n, p) => n + p.hand.length, 0) +
    s.drawPile.length +
    s.discardPile.length
  );
};

/** Drive the current player (human or AI) with the AI policy. */
function driveCurrent() {
  const g = useGame.getState();
  if (g.phase !== "playing") return;
  const player = g.players[g.currentIndex];
  const idx = chooseCardIndex(player.hand, topOf(g.discardPile));
  if (idx !== null) {
    const card = player.hand[idx];
    useGame.getState().playCard(card.id, card.suit === "Wild" ? chooseWildColor(player.hand) : undefined);
    return;
  }
  useGame.getState().drawForCurrent();
  const g2 = useGame.getState();
  if (g2.awaitingPostDraw) {
    const p = g2.players[g2.currentIndex];
    const i2 = chooseCardIndex(p.hand, topOf(g2.discardPile));
    if (i2 !== null) {
      const c = p.hand[i2];
      useGame.getState().playCard(c.id, c.suit === "Wild" ? chooseWildColor(p.hand) : undefined);
    } else {
      useGame.getState().pass();
    }
  }
}

describe("game store — full simulated games", () => {
  it("deals 7 to each of 4 players and keeps 108 cards", () => {
    // Run enough deals to cover every kind of opening card, since the starter
    // acts on the first player — a Draw Two opener leaves them holding nine.
    for (let i = 0; i < 60; i++) {
      useGame.getState().newGame("Tester");
      const s = useGame.getState();
      expect(s.players).toHaveLength(4);
      const opener = topOf(s.discardPile);
      expect(opener?.suit).not.toBe("Wild"); // starter is never wild
      expect(s.players[0].hand).toHaveLength(opener?.value === "Draw Two" ? 9 : 7);
      for (const p of s.players.slice(1)) expect(p.hand).toHaveLength(7);
      expect(s.discardPile.length).toBeGreaterThanOrEqual(1);
      expect(total()).toBe(108);
    }
  });

  it("plays 30 full games to completion with cards always conserved", () => {
    for (let game = 0; game < 30; game++) {
      useGame.getState().newGame("Tester");
      let steps = 0;
      while (useGame.getState().phase !== "gameover" && steps < 6000) {
        driveCurrent();
        expect(total()).toBe(108); // conservation invariant, every step
        steps++;
      }
      const s = useGame.getState();
      expect(s.phase).toBe("gameover");
      expect(s.winner).not.toBeNull();
      expect(s.winner!.hand).toHaveLength(0);
      // everyone else still holds cards
      expect(s.players.filter((p) => p.hand.length === 0)).toHaveLength(1);
    }
  });

  it("human wild play routes through color choice", () => {
    useGame.getState().newGame("Tester");
    // Force a known state: human to move, holding a wild, red on top.
    useGame.setState({
      currentIndex: 0,
      direction: 1,
      phase: "playing",
      discardPile: [{ id: "top", suit: "Red", value: "3" }],
      players: useGame.getState().players.map((p, i) =>
        i === 0 ? { ...p, hand: [{ id: "w1", suit: "Wild", value: "Wild" }] } : p,
      ),
    });
    useGame.getState().playCard("w1"); // no color yet
    expect(useGame.getState().phase).toBe("choosingColor");
    useGame.getState().chooseColor("Blue");
    const s = useGame.getState();
    expect(s.phase).toBe("gameover"); // that was the human's last card
    expect(topOf(s.discardPile)).toMatchObject({ suit: "Wild", wildColor: "Blue" });
  });
});
