import { useEffect } from "react";
import { useGame, type GameEvent, type Phase } from "@/store/gameStore";
import { ACTION_TURN_MS, PENALTY_FLY_MS } from "@/lib/timing";

export const AI_THINK_MS = 1300;

/**
 * Whether an AI seat may take its turn right now.
 *
 * The `pendingPenalty` check is what keeps a +2/+4 honest: the victim's cards
 * are dealt on a delay so they land after the effect animation, and moving in
 * the meantime can end the game before they're ever drawn.
 */
export function aiShouldMove(s: {
  phase: Phase;
  pendingPenalty: unknown;
  currentIndex: number;
  players: { isAI: boolean }[];
}): boolean {
  if (s.phase !== "playing" || s.pendingPenalty) return false;
  return !!s.players[s.currentIndex]?.isAI;
}

/**
 * How long to leave the table alone before an AI seat moves.
 *
 * An action card's effect has to finish playing before the next player moves,
 * so the flourish isn't cut off. This keys off `lastAction` rather than the
 * event on purpose — a card played as someone's second-to-last emits "uno", so
 * keying off the event let a +4 played on UNO race ahead of its own penalty.
 *
 * A +2/+4 needs no special case here: callers wait for `pendingPenalty` to
 * clear first, and by then the ordinary thinking pause covers the cards flying
 * into the victim's hand.
 */
export function aiTurnDelay(
  s: { lastAction: unknown; event: { type: GameEvent } | null },
  baseMs = AI_THINK_MS,
): number {
  // A draw is the last beat of an action, not the middle of one — once the
  // cards are on their way, the effect has already had its time.
  const drawing = s.event?.type === "draw";
  if (s.lastAction && !drawing) return ACTION_TURN_MS;
  // Those cards are still in flight; don't move until they've landed.
  return drawing ? Math.max(baseMs, PENALTY_FLY_MS) : baseMs;
}

/**
 * Drives AI turns: when it becomes an AI's turn, run its move after a short
 * "thinking" pause. Nothing moves while a +2/+4 is still owed — the victim has
 * to actually take those cards first, or a quick win would strand the draw.
 */
export function useAIDriver(baseMs = AI_THINK_MS) {
  const phase = useGame((s) => s.phase);
  const currentIndex = useGame((s) => s.currentIndex);
  const pendingPenalty = useGame((s) => s.pendingPenalty);

  useEffect(() => {
    const s = useGame.getState();
    if (!aiShouldMove(s)) return;
    const timer = setTimeout(() => useGame.getState().runAITurn(), aiTurnDelay(s, baseMs));
    return () => clearTimeout(timer);
  }, [phase, currentIndex, pendingPenalty, baseMs]);
}
