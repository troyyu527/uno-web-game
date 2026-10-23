import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useAnimationControls } from "framer-motion";
import type { Card } from "@/game/types";
import { CardView } from "./CardView";

type Layout = "fan" | "row" | "column";

/** The original game's refusal: stay lifted, shake side to side, drop back. */
const SHAKE = {
  x: ["0rem", "0.5rem", "-0.5rem", "0.5rem", "0rem"],
  transition: { duration: 0.2, ease: "linear" as const },
};

/**
 * Shakes its card whenever `nonce` ticks. The nonce is per-card and only ever
 * counts up, so clicking the same illegal card twice shakes it twice, and one
 * card's refusal never disturbs its neighbours.
 */
function ShakeOff({ nonce, children }: { nonce: number; children: ReactNode }) {
  const controls = useAnimationControls();
  const seen = useRef(nonce);
  useEffect(() => {
    if (nonce === seen.current) return; // first render, or someone else's card
    seen.current = nonce;
    void controls.start(SHAKE);
  }, [nonce, controls]);
  return <motion.div animate={controls}>{children}</motion.div>;
}

interface Props {
  cards: Card[];
  faceUp: boolean;
  cardWidth: number;
  layout: Layout;
  maxSpread?: number;
  /** This hand is the viewer's to play: every card lifts on hover and clicks. */
  interactive?: boolean;
  /** Which cards are legal. Illegal ones still click — they just shake. */
  playableIds?: Set<string>;
  onPlay?: (id: string) => void;
}

/**
 * A player's hand. `fan` = the arced hand you hold (player); `row`/`column` =
 * an overlapping stack of backs for opponents across the table. New cards pop
 * in place; the deck-to-hand travel is handled by <DealFly>.
 */
export function Hand({
  cards,
  faceUp,
  cardWidth,
  layout,
  maxSpread = 36,
  interactive = false,
  playableIds,
  onPlay,
}: Props) {
  const n = cards.length;
  const height = (cardWidth * 10) / 7;
  const overlap = cardWidth * (layout === "row" ? 0.62 : 0.72);
  const per = n > 1 ? Math.min(maxSpread / (n - 1), 7) : 0;
  const start = -((n - 1) * per) / 2;

  // How many times each card has been refused, so a repeat click shakes again.
  const [refusals, setRefusals] = useState<Record<string, number>>({});
  const clickable = interactive && !!onPlay;

  const click = (c: Card) => {
    if (!onPlay) return;
    // The store decides legality and sounds the buzzer; the shake is ours.
    if (playableIds && !playableIds.has(c.id)) {
      setRefusals((r) => ({ ...r, [c.id]: (r[c.id] ?? 0) + 1 }));
    }
    onPlay(c.id);
  };

  const card = (c: Card) => {
    const view = (
      <CardView
        card={faceUp ? c : undefined}
        faceDown={!faceUp}
        width={cardWidth}
        playable={faceUp && !!playableIds?.has(c.id)}
        onClick={clickable ? () => click(c) : undefined}
      />
    );
    // Only the viewer's own hand can be refused, and wrapping on a value that
    // never changes for a given hand keeps the cards from remounting on turn.
    return faceUp ? <ShakeOff nonce={refusals[c.id] ?? 0}>{view}</ShakeOff> : view;
  };

  if (layout === "fan") {
    return (
      <div
        className="relative"
        style={{ width: `${cardWidth * (1 + n * 0.3)}rem`, height: `${height + 1.5}rem` }}
      >
        {cards.map((c, i) => (
          <div
            key={c.id}
            className="absolute bottom-0 left-1/2"
            style={{
              transform: `translateX(-50%) rotate(${start + i * per}deg)`,
              transformOrigin: "50% 320%",
              zIndex: i,
            }}
          >
            {card(c)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex ${layout === "column" ? "flex-col" : "flex-row"} items-center`}>
      {cards.map((c, i) => (
        <div
          key={c.id}
          style={
            i === 0
              ? undefined
              : layout === "row"
                ? { marginLeft: `-${overlap}rem`, zIndex: i }
                : { marginTop: `-${overlap}rem`, zIndex: i }
          }
        >
          {card(c)}
        </div>
      ))}
    </div>
  );
}
