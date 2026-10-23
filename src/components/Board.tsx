import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/store/gameStore";
import { canPlay } from "@/game/rules";
import { topOf } from "@/game/deck";
import type { ColorSuit } from "@/game/types";
import { Hand } from "./Hand";
import { PlayerBadge } from "./PlayerBadge";
import { DrawDeck } from "./DrawDeck";
import { DiscardPile } from "./DiscardPile";
import { DirectionArrows } from "./DirectionArrows";
import { ActionEffect } from "./ActionEffect";
import { ActionStamp } from "./ActionStamp";
import { DealFly } from "./DealFly";
import { Fireworks } from "./Fireworks";
import { ColorPicker } from "./ColorPicker";
import { GameOverModal } from "./GameOverModal";

interface Props {
  viewerSeat: number;
  soundOn: boolean;
  onPlay: (id: string) => void;
  onDraw: () => void;
  onPass: () => void;
  onChooseColor: (c: ColorSuit) => void;
  topBar: ReactNode;
  onPlayAgain: () => void;
  onExit: () => void;
  canPlayAgain?: boolean;
  playAgainLabel?: string;
  exitLabel?: string;
  waitingText?: string;
}

/**
 * The UNO table, rendered from `viewerSeat`'s point of view — that seat sits at
 * the bottom and the other three are placed left / top / right around it. All
 * game state comes from the store; actions are delegated to the props so the
 * same board serves single-player and online play.
 */
export function Board({
  viewerSeat,
  soundOn,
  onPlay,
  onDraw,
  onPass,
  onChooseColor,
  topBar,
  onPlayAgain,
  onExit,
  canPlayAgain,
  playAgainLabel,
  exitLabel,
  waitingText,
}: Props) {
  const phase = useGame((s) => s.phase);
  const players = useGame((s) => s.players);
  const currentIndex = useGame((s) => s.currentIndex);
  const direction = useGame((s) => s.direction);
  const discardPile = useGame((s) => s.discardPile);
  const awaitingPostDraw = useGame((s) => s.awaitingPostDraw);
  const pendingPenalty = useGame((s) => s.pendingPenalty);
  const message = useGame((s) => s.message);
  const winner = useGame((s) => s.winner);

  const [celebrate, setCelebrate] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (phase === "gameover" && winner) {
      const t1 = setTimeout(() => setCelebrate(true), 650);
      const t2 = setTimeout(() => setShowResult(true), 1650);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    setCelebrate(false);
    setShowResult(false);
  }, [phase, winner]);

  // My turn = the current seat is mine and still mine to play. An online seat
  // whose player left is handed to the AI and plays itself from then on, and
  // nobody moves while a +2/+4 is still flying into its victim's hand.
  const me = players[viewerSeat];
  const interactable =
    phase === "playing" && currentIndex === viewerSeat && !me?.isAI && !pendingPenalty;
  const top = topOf(discardPile);
  const drawnCardId = useGame((s) => s.drawnCardId);
  const playableIds = useMemo(() => {
    if (!interactable || !me) return undefined;
    // Official rules: having drawn, the drawn card is your only option.
    const offer = awaitingPostDraw && drawnCardId
      ? me.hand.filter((c) => c.id === drawnCardId)
      : me.hand;
    return new Set(offer.filter((c) => canPlay(c, top)).map((c) => c.id));
  }, [interactable, me, top, awaitingPostDraw, drawnCardId]);
  const canDraw = interactable && !awaitingPostDraw;

  const cur = (i: number) => currentIndex === i && phase === "playing";
  // Distinct from `interactable`: still your turn while a +2/+4 is being dealt,
  // even though you can't act yet.
  const myTurn = cur(viewerSeat);
  const seatAt = (rel: number) => players[(viewerSeat + rel) % 4];
  const leftP = seatAt(1);
  const topP = seatAt(2);
  const rightP = seatAt(3);

  if (phase === "menu" || players.length < 4 || !me) return null;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="absolute left-4 top-4 z-40 flex gap-2">{topBar}</div>

      {/* Whose turn it is — the one thing a player checks constantly, so it
          sits dead centre at the top of the screen and is hard to miss.
          Centring rides on Framer's own `x`, not a -translate-x class: Framer
          writes `transform` itself, so a class-based translate is discarded and
          the panel would hang off to the right of centre. */}
      <motion.div
        key={message}
        initial={{ opacity: 0, y: -16, x: "-50%" }}
        animate={{ opacity: 1, y: 0, x: "-50%" }}
        className={`absolute left-1/2 top-4 z-40 flex items-center gap-2.5 whitespace-nowrap rounded-2xl px-3 py-1.5 text-lg font-extrabold tracking-wide text-white backdrop-blur-md md:px-5 md:py-2 md:text-2xl ${
          myTurn
            ? "bg-gradient-to-r from-amber-500/85 to-orange-500/85 shadow-[0_10px_32px_rgba(245,158,11,0.45)]"
            : "bg-gradient-to-r from-violet-600/80 to-indigo-600/80 shadow-[0_10px_32px_rgba(99,102,241,0.4)]"
        }`}
      >
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
            myTurn ? "animate-pulse bg-white" : "bg-white/70"
          }`}
        />
        {message}
      </motion.div>

      <div className="scene absolute inset-0">
        <div className="table-wood">
          <div className="felt" />
        </div>
      </div>

      {/* Top opponent (rel 2) — nudged down off the table's far edge. */}
      <div className="absolute left-1/2 top-[9%] z-10 flex -translate-x-1/2 items-center gap-3">
        <div data-hand={topP.id} style={{ transform: "rotate(180deg)" }}>
          <Hand cards={topP.hand} faceUp={false} cardWidth={4.3} layout="fan" maxSpread={26} />
        </div>
        <PlayerBadge player={topP} current={cur((viewerSeat + 2) % 4)} />
      </div>

      {/* Left opponent (rel 1) */}
      <div className="absolute left-[1.5%] top-1/2 z-10 flex -translate-y-1/2 items-center gap-2">
        <PlayerBadge player={leftP} current={cur((viewerSeat + 1) % 4)} />
        <div data-hand={leftP.id} style={{ transform: "rotate(90deg)" }}>
          <Hand cards={leftP.hand} faceUp={false} cardWidth={4.3} layout="fan" maxSpread={26} />
        </div>
      </div>

      {/* Right opponent (rel 3) */}
      <div className="absolute right-[1.5%] top-1/2 z-10 flex -translate-y-1/2 items-center gap-2">
        <div data-hand={rightP.id} style={{ transform: "rotate(-90deg)" }}>
          <Hand cards={rightP.hand} faceUp={false} cardWidth={4.3} layout="fan" maxSpread={26} />
        </div>
        <PlayerBadge player={rightP} current={cur((viewerSeat + 3) % 4)} />
      </div>

      {/* Draw deck */}
      <div className="absolute left-[19%] top-[18%] z-20">
        <DrawDeck canDraw={canDraw} onDraw={onDraw} />
      </div>

      {/* Center */}
      <div className="absolute left-1/2 top-[44%] z-20 -translate-x-1/2 -translate-y-1/2">
        <DirectionArrows direction={direction} />
        <DiscardPile soundOn={soundOn} viewerSeat={viewerSeat} />
      </div>
      <ActionEffect viewerSeat={viewerSeat} />
      <ActionStamp viewerSeat={viewerSeat} />
      <DealFly />

      {/* Me (rel 0) — foreground fan. The table stops ~8vh short of the bottom
          of the screen, so the hand sits well clear of that edge to stay on
          the felt rather than hanging off it. */}
      <div className="absolute bottom-24 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center">
        <div className="mb-1 flex items-center gap-3">
          <PlayerBadge player={me} current={cur(viewerSeat)} />
          {interactable && awaitingPostDraw && (
            <button
              className="rounded-full bg-indigo-500 px-5 py-1.5 text-sm font-bold text-white shadow transition hover:brightness-110"
              onClick={onPass}
            >
              Pass
            </button>
          )}
        </div>
        <div
          data-hand={me.id}
          style={{ transform: "perspective(1000px) rotateX(12deg)", transformOrigin: "bottom center" }}
        >
          <Hand
            cards={me.hand}
            faceUp
            cardWidth={4.7}
            layout="fan"
            maxSpread={32}
            interactive={interactable}
            playableIds={playableIds}
            onPlay={onPlay}
          />
        </div>
      </div>

      {celebrate && <Fireworks />}

      {phase === "choosingColor" && <ColorPicker onPick={onChooseColor} />}
      {phase === "gameover" && winner && showResult && (
        <GameOverModal
          winnerName={winner.name}
          youWon={winner.id === me.id}
          onPlayAgain={onPlayAgain}
          onExit={onExit}
          canPlayAgain={canPlayAgain}
          playAgainLabel={playAgainLabel}
          exitLabel={exitLabel}
          waitingText={waitingText}
        />
      )}
    </div>
  );
}
