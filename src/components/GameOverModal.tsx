import { motion } from "framer-motion";

interface Props {
  winnerName: string;
  youWon: boolean;
  onPlayAgain: () => void;
  onExit: () => void;
  /** Host-only rematch in online play; non-hosts see `waitingText` instead. */
  canPlayAgain?: boolean;
  playAgainLabel?: string;
  exitLabel?: string;
  waitingText?: string;
}

export function GameOverModal({
  winnerName,
  youWon,
  onPlayAgain,
  onExit,
  canPlayAgain = true,
  playAgainLabel = "Play again",
  exitLabel = "Back to menu",
  waitingText,
}: Props) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/30">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-[22rem] rounded-2xl border border-white/10 bg-slate-900/85 p-8 text-center shadow-2xl"
      >
        <div className="mb-2 text-5xl">{youWon ? "🏆" : "🎮"}</div>
        <h2 className="mb-1 text-2xl font-extrabold text-slate-50">
          {youWon ? "You win!" : `${winnerName} wins`}
        </h2>
        <p className="mb-6 text-slate-400">
          {youWon ? "Nicely played." : "Better luck next round."}
        </p>
        <div className="flex flex-col gap-3">
          {canPlayAgain ? (
            <button
              onClick={onPlayAgain}
              className="rounded-full bg-gradient-to-br from-uno-red to-rose-600 px-6 py-2.5 font-bold text-white transition hover:brightness-110"
            >
              {playAgainLabel}
            </button>
          ) : (
            waitingText && (
              <p className="rounded-full bg-white/5 px-6 py-2.5 text-sm text-slate-300">{waitingText}</p>
            )
          )}
          <button
            onClick={onExit}
            className="rounded-full border border-white/15 bg-white/5 px-6 py-2.5 font-semibold text-slate-200 transition hover:bg-white/10"
          >
            {exitLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
