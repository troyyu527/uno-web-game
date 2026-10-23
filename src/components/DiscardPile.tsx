import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CardView } from "./CardView";
import { useGame } from "@/store/gameStore";
import { WILD_TINT } from "@/game/rules";
import { asset } from "@/lib/assets";
import { CARD_PLACE_MS } from "@/lib/timing";
import type { Card, PlayerId } from "@/game/types";

const W = 5;

// A card flies in from the actor's on-screen direction. Indexed by the actor's
// position *relative to the viewer* (0 = me/bottom, 1 = left, 2 = top, 3 = right),
// so it's correct from every player's rotated point of view.
const FROM_REL: { x: number; y: number }[] = [
  { x: 0, y: 300 }, // bottom (you)
  { x: -420, y: -40 }, // left
  { x: 0, y: -320 }, // top
  { x: 420, y: -40 }, // right
];
const relOf = (id: PlayerId, viewerSeat: number) =>
  (Number(id.slice(1)) - 1 - viewerSeat + 4) % 4;

/** Stable, chaotic offset+tilt for a card, from its id. */
function scatter(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return {
    a: (h % 111) - 55, // -55°..55°
    dx: ((h >> 3) % 41) - 20, // -20..20 px
    dy: ((h >> 8) % 41) - 20,
  };
}

const isColoredWild = (c: Card) => c.suit === "Wild" && !!c.wildColor;

/** The discard pile — a messy heap; each card lands at its own angle, newest on top. */
export function DiscardPile({
  soundOn = true,
  viewerSeat = 0,
}: {
  soundOn?: boolean;
  viewerSeat?: number;
}) {
  const discardPile = useGame((s) => s.discardPile);
  const lastActor = useGame((s) => s.lastActor);
  const recent = discardPile.slice(-6);
  const top = discardPile[discardPile.length - 1];

  // A wild/+4 lands as the plain black card, then its chosen colour fades in a
  // beat later — a gradual change, with a single sound at the start.
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const sfx = useRef<HTMLAudioElement | null>(null);
  const soundedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (top && isColoredWild(top) && !revealed.has(top.id)) {
      const id = top.id;
      const t = setTimeout(() => {
        setRevealed((prev) => new Set(prev).add(id));
        // Exactly one sound, at the moment the transition begins.
        if (soundOn && !soundedRef.current.has(id)) {
          soundedRef.current.add(id);
          if (!sfx.current) sfx.current = new Audio(asset("audio/card-delt.mp3"));
          sfx.current.currentTime = 0;
          sfx.current.play().catch(() => {});
        }
      }, CARD_PLACE_MS + 250);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top?.id]);

  return (
    <div className="relative" style={{ width: `${W}rem`, height: `${(W * 10) / 7}rem` }}>
      {recent.map((card, i) => {
        const newest = i === recent.length - 1;
        const { a, dx, dy } = scatter(card.id);
        const from = lastActor ? FROM_REL[relOf(lastActor, viewerSeat)] : { x: 0, y: -240 };
        // Newest coloured wild stays black until its reveal; older ones show colour.
        const pendingReveal = isColoredWild(card) && newest && !revealed.has(card.id);
        const showColor = isColoredWild(card) && !pendingReveal;
        const blackCard: Card = { ...card, wildColor: null };
        const tint = newest && showColor && card.wildColor ? WILD_TINT[card.wildColor] : null;
        return (
          <motion.div
            key={card.id}
            className="absolute inset-0"
            style={{ zIndex: i }} // array order → newest always on top
            initial={newest ? { rotate: a - 35, x: from.x, y: from.y, scale: 1.35, opacity: 0 } : false}
            animate={{ rotate: a, x: dx, y: dy, scale: 1, opacity: 1 }}
            transition={newest ? { duration: 0.75, ease: [0.2, 0.7, 0.3, 1] } : { duration: 0 }}
          >
            {tint && (
              <motion.div
                key={`glow-${card.id}`}
                className="absolute inset-0 rounded-[0.6rem]"
                initial={{ opacity: 0, boxShadow: `0 0 0px 0px ${tint}` }}
                animate={{
                  opacity: [0, 1, 0.6, 1, 0],
                  boxShadow: [
                    `0 0 0px 0px ${tint}`,
                    `0 0 48px 16px ${tint}`,
                    `0 0 22px 7px ${tint}`,
                    `0 0 48px 16px ${tint}`,
                    `0 0 0px 0px ${tint}`,
                  ],
                }}
                transition={{ duration: 1.4, times: [0, 0.25, 0.5, 0.75, 1] }}
              />
            )}
            {isColoredWild(card) ? (
              // Gradual reveal: the black card stays put and the coloured version
              // cross-fades in over it (no flip, no hard swap).
              <div className="relative">
                <CardView card={blackCard} width={W} animateIn={false} />
                {showColor && (
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                  >
                    <CardView card={card} width={W} animateIn={false} />
                  </motion.div>
                )}
              </div>
            ) : (
              <CardView card={card} width={W} animateIn={false} />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
