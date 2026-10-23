/** Shared animation timing so the played-card → pause → effect → draw sequence stays in sync. */

/** How long the just-played card takes to fly onto the discard pile. */
export const CARD_PLACE_MS = 750;

/** A short beat after the card lands, before any effect flourish begins. */
export const EFFECT_WAIT_MS = 500;

/** When an action effect starts, measured from the play event (card lands, then waits). */
export const EFFECT_DELAY_MS = CARD_PLACE_MS + EFFECT_WAIT_MS; // 1250

/** How long an action effect stays on screen once it starts. */
export const EFFECT_HOLD_MS = 1300;

/** When a +2 / +4 penalty draw begins — only after the effect has finished. */
export const PENALTY_DELAY_MS = EFFECT_DELAY_MS + EFFECT_HOLD_MS; // 2550

/** How long the penalty cards take to fly into the victim's hand (with stagger). */
export const PENALTY_FLY_MS = 1200;

/** Time a Skip / Reverse needs (place + wait + effect) before the next player moves. */
export const ACTION_TURN_MS = EFFECT_DELAY_MS + EFFECT_HOLD_MS + 300; // ~2850
