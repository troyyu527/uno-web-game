// The UNO domain model — plain, serializable data (no classes, no DOM).

export type ColorSuit = "Red" | "Green" | "Blue" | "Yellow";
export type Suit = ColorSuit | "Wild";

export type NumberValue =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
export type ActionValue = "Skip" | "Reverse" | "Draw Two";
export type WildValue = "Wild" | "Draw Four";
export type CardValue = NumberValue | ActionValue | WildValue;

export interface Card {
  /** Stable unique id — used for React keys and layout animations. */
  id: string;
  suit: Suit;
  value: CardValue;
  /** For a Wild card, the color its player chose (null until chosen). */
  wildColor?: ColorSuit | null;
}

export type PlayerId = "p1" | "p2" | "p3" | "p4";

export interface Player {
  id: PlayerId;
  name: string;
  isAI: boolean;
  hand: Card[];
}

export const COLOR_SUITS: ColorSuit[] = ["Red", "Green", "Blue", "Yellow"];
export const NUMBER_VALUES: NumberValue[] = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
];
export const ACTION_VALUES: ActionValue[] = ["Skip", "Reverse", "Draw Two"];
export const WILD_VALUES: WildValue[] = ["Wild", "Draw Four"];

