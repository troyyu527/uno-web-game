import {
  type Card,
  type CardValue,
  type ColorSuit,
  type Suit,
  COLOR_SUITS,
} from "./types";
import { canPlay } from "./rules";

/** The value(s) that appear most often in `items` (ties all returned). */
function mostCommon<T extends string>(items: T[]): T[] {
  const counts = new Map<T, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  let max = 0;
  for (const n of counts.values()) max = Math.max(max, n);
  return [...counts.entries()].filter(([, n]) => n === max).map(([k]) => k);
}

export const maxSuits = (hand: readonly Card[]): Suit[] =>
  mostCommon(hand.map((c) => c.suit));
export const maxValues = (hand: readonly Card[]): CardValue[] =>
  mostCommon(hand.map((c) => c.value));

/**
 * Weight a card so the AI prefers keeping its majority color/value and spends
 * wilds last. Ported from the original weighted-point strategy.
 */
export function cardWeight(card: Card, maxSuit: Suit[], maxValue: CardValue[]): number {
  let pt = 0;
  if (card.suit !== "Wild") {
    pt += 2;
    if (maxSuit.includes(card.suit)) pt += 3;
  } else {
    pt -= 1;
  }
  if (card.value !== "Wild" && card.value !== "Draw Four") {
    pt += 1;
    if (maxValue.includes(card.value)) pt += 2;
  } else {
    pt -= 1;
    if (maxValue.includes(card.value)) pt += 1;
  }
  return pt;
}

/**
 * The AI's move: the index of the best playable card in `candidates`, or null
 * to draw when nothing is playable. Ties are broken randomly.
 *
 * `hand` is the full hand when `candidates` is only part of it (after a draw,
 * where just the drawn card may be played) — cards are weighted against
 * everything the player holds, not only what they're allowed to play.
 */
export function chooseCardIndex(
  candidates: readonly Card[],
  top: Card | undefined,
  hand: readonly Card[] = candidates,
): number | null {
  const maxSuit = maxSuits(hand);
  const maxValue = maxValues(hand);
  let best: number[] = [];
  let bestWeight = -Infinity;
  candidates.forEach((card, i) => {
    if (!canPlay(card, top)) return;
    const w = cardWeight(card, maxSuit, maxValue);
    if (w > bestWeight) {
      bestWeight = w;
      best = [i];
    } else if (w === bestWeight) {
      best.push(i);
    }
  });
  if (best.length === 0) return null;
  return best[Math.floor(Math.random() * best.length)];
}

/** The color an AI declares for a wild card — its majority color, else random. */
export function chooseWildColor(hand: readonly Card[]): ColorSuit {
  const colors = maxSuits(hand).filter((s): s is ColorSuit => s !== "Wild");
  if (colors.length > 0) {
    return colors[Math.floor(Math.random() * colors.length)];
  }
  return COLOR_SUITS[Math.floor(Math.random() * COLOR_SUITS.length)];
}
