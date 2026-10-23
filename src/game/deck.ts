import {
  type Card,
  type CardValue,
  type ColorSuit,
  type Suit,
  COLOR_SUITS,
  NUMBER_VALUES,
  ACTION_VALUES,
  WILD_VALUES,
} from "./types";

let idCounter = 0;
const nextId = () => `c${(idCounter++).toString(36)}`;

export function makeCard(
  suit: Suit,
  value: CardValue,
  wildColor: ColorSuit | null = null,
): Card {
  return { id: nextId(), suit, value, wildColor };
}

/**
 * A full 108-card UNO deck:
 * - per color: one "0" + two of each of 1–9, Skip, Reverse, Draw Two  → 25 × 4 = 100
 * - Wild + Draw Four, four copies each                                → 8
 */
export function freshDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of COLOR_SUITS) {
    deck.push(makeCard(suit, "0"));
    for (const value of [...NUMBER_VALUES.slice(1), ...ACTION_VALUES] as CardValue[]) {
      deck.push(makeCard(suit, value));
      deck.push(makeCard(suit, value));
    }
  }
  for (let i = 0; i < 4; i++) {
    for (const value of WILD_VALUES) {
      deck.push(makeCard("Wild", value));
    }
  }
  return deck;
}

/** Fisher–Yates. Returns a NEW shuffled array; never mutates the input. */
export function shuffle<T>(cards: readonly T[]): T[] {
  const out = [...cards];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const topOf = (pile: readonly Card[]): Card | undefined =>
  pile[pile.length - 1];
