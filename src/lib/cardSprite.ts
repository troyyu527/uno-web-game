import type { Card, CardValue, ColorSuit, Suit } from "@/game/types";
import { asset } from "@/lib/assets";

// Maps a card onto the UNO_cards_deck.svg sprite sheet. Ported verbatim from
// the original: background-size 1700% 930%, one step = 7.586%.
const STEP = 7.586;

const SUIT_OFFSET: Record<Suit, { x: number; y: number }> = {
  Red: { x: 0, y: 0 },
  Yellow: { x: 0, y: 14 },
  Green: { x: 0, y: 28 },
  Blue: { x: 0, y: 42 },
  Wild: { x: STEP * 13, y: 0 },
};

const VALUE_OFFSET: Record<CardValue, { x: number; y: number }> = {
  "0": { x: 0, y: 0 },
  "1": { x: STEP, y: 0 },
  "2": { x: STEP * 2, y: 0 },
  "3": { x: STEP * 3, y: 0 },
  "4": { x: STEP * 4, y: 0 },
  "5": { x: STEP * 5, y: 0 },
  "6": { x: STEP * 6, y: 0 },
  "7": { x: STEP * 7, y: 0 },
  "8": { x: STEP * 8, y: 0 },
  "9": { x: STEP * 9, y: 0 },
  Skip: { x: STEP * 10, y: 0 },
  Reverse: { x: STEP * 11, y: 0 },
  "Draw Two": { x: STEP * 12, y: 0 },
  Wild: { x: 0, y: 0 },
  "Draw Four": { x: 0, y: 56 },
};

/** The `background-position` value that shows this card's face. */
export function cardFacePosition(card: Card): string {
  const s = SUIT_OFFSET[card.suit];
  const v = VALUE_OFFSET[card.value];
  return `${0.68 + s.x + v.x}% ${1 + s.y + v.y}%`;
}

export const CARD_SHEET_SIZE = "1700% 930%";

const MAIN_SHEET = asset("img/cards/UNO_cards_deck.svg");
// A same-grid overlay sheet whose last column holds the pre-coloured wild and
// +4 cards, one per colour (ported verbatim from the original setWildCard).
const WILD_SHEET = asset("img/cards/UNO_cards_deck_wild.svg");
const WILD_POS: Record<"Wild" | "Draw Four", Record<ColorSuit, string>> = {
  Wild: { Red: "99.298% 1%", Blue: "99.298% 15%", Yellow: "99.298% 29%", Green: "99.298% 43%" },
  "Draw Four": { Red: "99.298% 57%", Blue: "99.298% 71%", Yellow: "99.298% 85%", Green: "99.298% 99%" },
};

/**
 * The sheet + position that shows a card's face. A wild/+4 that has had its
 * colour chosen switches to the coloured variant on the wild overlay sheet, so
 * the whole card takes on the chosen colour (rather than a corner dot).
 */
export function cardFace(card: Card): { sheet: string; position: string } {
  if (
    card.suit === "Wild" &&
    card.wildColor &&
    (card.value === "Wild" || card.value === "Draw Four")
  ) {
    return { sheet: WILD_SHEET, position: WILD_POS[card.value][card.wildColor] };
  }
  return { sheet: MAIN_SHEET, position: cardFacePosition(card) };
}
