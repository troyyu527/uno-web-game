import { describe, it, expect } from "vitest";
import { freshDeck, shuffle, makeCard } from "./deck";
import { canPlay, activeSuit, handPoints } from "./rules";
import { chooseCardIndex, chooseWildColor, maxSuits } from "./ai";
import type { Card } from "./types";

describe("deck", () => {
  it("builds a 108-card deck", () => {
    expect(freshDeck()).toHaveLength(108);
  });

  it("has the right composition", () => {
    const deck = freshDeck();
    const colored = deck.filter((c) => c.suit !== "Wild");
    const wild = deck.filter((c) => c.suit === "Wild");
    expect(colored).toHaveLength(100);
    expect(wild).toHaveLength(8);
    // one "0" per color, two of every other colored value
    const reds = deck.filter((c) => c.suit === "Red");
    expect(reds.filter((c) => c.value === "0")).toHaveLength(1);
    expect(reds.filter((c) => c.value === "5")).toHaveLength(2);
    expect(reds.filter((c) => c.value === "Skip")).toHaveLength(2);
  });

  it("gives every card a unique id", () => {
    const ids = new Set(freshDeck().map((c) => c.id));
    expect(ids.size).toBe(108);
  });

  it("shuffle preserves the multiset and does not mutate the input", () => {
    const deck = freshDeck();
    const snapshot = deck.map((c) => c.id);
    const shuffled = shuffle(deck);
    expect(shuffled).toHaveLength(108);
    expect(new Set(shuffled.map((c) => c.id))).toEqual(new Set(snapshot));
    expect(deck.map((c) => c.id)).toEqual(snapshot); // input untouched
  });
});

describe("rules", () => {
  const red5 = makeCard("Red", "5");
  it("matches by color", () => {
    expect(canPlay(makeCard("Red", "9"), red5)).toBe(true);
  });
  it("matches by value", () => {
    expect(canPlay(makeCard("Blue", "5"), red5)).toBe(true);
  });
  it("rejects a non-match", () => {
    expect(canPlay(makeCard("Blue", "9"), red5)).toBe(false);
  });
  it("wild is always playable", () => {
    expect(canPlay(makeCard("Wild", "Wild"), red5)).toBe(true);
  });
  it("honors a wild's chosen color", () => {
    const wildAsGreen = makeCard("Wild", "Wild", "Green");
    expect(activeSuit(wildAsGreen)).toBe("Green");
    expect(canPlay(makeCard("Green", "1"), wildAsGreen)).toBe(true);
    expect(canPlay(makeCard("Red", "1"), wildAsGreen)).toBe(false);
  });
  it("scores hands with standard UNO points", () => {
    const hand: Card[] = [makeCard("Red", "9"), makeCard("Blue", "Skip"), makeCard("Wild", "Wild")];
    expect(handPoints(hand)).toBe(9 + 20 + 50);
  });
});

describe("ai", () => {
  const top = makeCard("Red", "3");
  it("only ever chooses a playable card", () => {
    for (let t = 0; t < 200; t++) {
      const hand = shuffle(freshDeck()).slice(0, 7);
      const idx = chooseCardIndex(hand, top);
      if (idx !== null) expect(canPlay(hand[idx], top)).toBe(true);
    }
  });
  it("returns null (draw) when nothing is playable", () => {
    const hand: Card[] = [makeCard("Blue", "9"), makeCard("Green", "1")];
    expect(chooseCardIndex(hand, top)).toBeNull();
  });
  it("prefers its majority color", () => {
    const hand: Card[] = [
      makeCard("Blue", "3"), // playable by value
      makeCard("Red", "3"), // playable, and Red is majority
      makeCard("Red", "1"),
      makeCard("Red", "7"),
    ];
    expect(maxSuits(hand)).toContain("Red");
    const idx = chooseCardIndex(hand, top)!;
    expect(hand[idx].suit).toBe("Red");
  });
  it("picks a real color for a wild", () => {
    const hand: Card[] = [makeCard("Wild", "Wild"), makeCard("Green", "2"), makeCard("Green", "8")];
    expect(chooseWildColor(hand)).toBe("Green");
  });
});
