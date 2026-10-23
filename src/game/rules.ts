import { type Card, type ColorSuit, type Suit } from "./types";

/** The suit currently in force on top of the discard pile. */
export function activeSuit(top: Card | undefined): Suit | null {
  if (!top) return null;
  return top.suit === "Wild" ? (top.wildColor ?? null) : top.suit;
}

/**
 * Can `card` be played on top of `top`?
 *
 * Both wilds — including Wild Draw Four — are playable on any turn, with no
 * regard for the rest of the hand. Official rules restrict Draw Four to players
 * who can't follow colour; this table deliberately doesn't, which keeps the
 * card a live option and needs no challenge mechanic to police it. What it
 * *does* is unchanged: the next player draws four and loses their turn.
 */
export function canPlay(card: Card, top: Card | undefined): boolean {
  if (!top) return true;
  if (card.suit === "Wild") return true;
  if (card.suit === activeSuit(top)) return true;
  return card.value === top.value;
}

/** Standard UNO scoring for a card. */
export function cardPoints(card: Card): number {
  if (card.suit === "Wild") return 50;
  switch (card.value) {
    case "Skip":
    case "Reverse":
    case "Draw Two":
      return 20;
    default:
      return Number(card.value);
  }
}

export const handPoints = (hand: readonly Card[]): number =>
  hand.reduce((sum, c) => sum + cardPoints(c), 0);

export type PlayerStatus = "Normal" | "Urgent" | "Critical" | "UNO" | "Winner";

export function playerStatus(handSize: number): PlayerStatus {
  if (handSize === 0) return "Winner";
  if (handSize === 1) return "UNO";
  if (handSize === 2) return "Critical";
  if (handSize <= 4) return "Urgent";
  return "Normal";
}

export const WILD_TINT: Record<ColorSuit, string> = {
  Red: "#e4342f",
  Green: "#3aa856",
  Blue: "#2a7de1",
  Yellow: "#f4c542",
};
