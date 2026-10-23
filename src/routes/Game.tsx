import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/store/gameStore";
import { useAuth } from "@/store/authStore";
import { useAIDriver } from "@/hooks/useAIDriver";
import { useSound } from "@/hooks/useSound";
import { useBGM } from "@/hooks/useBGM";
import { PENALTY_DELAY_MS } from "@/lib/timing";
import { Board } from "@/components/Board";
import { PauseMenu } from "@/components/PauseMenu";

const btn =
  "rounded-full border border-white/15 bg-black/30 px-4 py-1.5 text-sm font-semibold text-slate-200 backdrop-blur transition hover:bg-white/10";

export default function Game() {
  const navigate = useNavigate();
  const phase = useGame((s) => s.phase);
  const pendingPenalty = useGame((s) => s.pendingPenalty);
  const newGame = useGame((s) => s.newGame);
  const humanName = useAuth((s) => s.user?.username) ?? "Player";

  const [soundOn, setSoundOn] = useState(true);
  const [paused, setPaused] = useState(false);

  useAIDriver();
  useSound(soundOn);
  useBGM(soundOn && !paused);

  useEffect(() => {
    if (useGame.getState().phase !== "playing") useGame.getState().newGame(humanName);
  }, [humanName]);

  // Apply a queued +2/+4 draw once its effect animation has finished.
  useEffect(() => {
    if (!pendingPenalty) return;
    const t = setTimeout(() => useGame.getState().applyPendingPenalty(), PENALTY_DELAY_MS);
    return () => clearTimeout(t);
  }, [pendingPenalty?.key]);

  if (phase === "menu") return null;

  return (
    <>
      <Board
        viewerSeat={0}
        soundOn={soundOn}
        onPlay={(id) => useGame.getState().playCard(id)}
        onDraw={() => useGame.getState().drawForCurrent()}
        onPass={() => useGame.getState().pass()}
        onChooseColor={(c) => useGame.getState().chooseColor(c)}
        onPlayAgain={() => newGame(humanName)}
        onExit={() => {
          useGame.getState().toMenu();
          navigate("/");
        }}
        topBar={
          <>
            <button className={btn} onClick={() => setPaused(true)}>⏸ Menu</button>
            <button className={btn} onClick={() => newGame(humanName)}>New game</button>
            <button
              className={btn}
              onClick={() => setSoundOn((v) => !v)}
              aria-label="Toggle sound & music"
            >
              {soundOn ? "🔊" : "🔇"}
            </button>
          </>
        }
      />
      {paused && <PauseMenu onClose={() => setPaused(false)} />}
    </>
  );
}
