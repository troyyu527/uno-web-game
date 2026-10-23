import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/store/gameStore";
import { CardView } from "./CardView";

interface Flight {
  id: string;
  tx: number; // target centre (viewport px)
  ty: number;
  dx: number; // start offset from target = deck − target
  dy: number;
  delay: number;
}

const W = 4.4;

/**
 * A real card that flies off the draw deck into a player's hand whenever their
 * hand grows (a draw, or a +2 / +4 penalty). It reads the live on-screen
 * positions of the deck and the target hand, so the card visibly travels the
 * whole way — not a vague pop near the pile.
 */
export function DealFly() {
  const players = useGame((s) => s.players);
  const event = useGame((s) => s.event);
  const [flights, setFlights] = useState<Flight[]>([]);
  const prev = useRef<number[]>(players.map((p) => p.hand.length));

  useEffect(() => {
    const counts = players.map((p) => p.hand.length);

    // A fresh deal resets the baseline without flying 28 cards.
    if (event?.type === "deal") {
      prev.current = counts;
      return;
    }

    const deck = document.querySelector(".deck-btn")?.getBoundingClientRect();
    if (!deck) {
      prev.current = counts;
      return;
    }
    const dcx = deck.left + deck.width / 2;
    const dcy = deck.top + deck.height / 2;

    const add: Flight[] = [];
    players.forEach((p, i) => {
      const grew = counts[i] - (prev.current[i] ?? counts[i]);
      if (grew <= 0 || grew > 4) return; // ignore deals / no change
      const t = document.querySelector(`[data-hand="${p.id}"]`)?.getBoundingClientRect();
      if (!t) return;
      const tcx = t.left + t.width / 2;
      const tcy = t.top + t.height / 2;
      for (let k = 0; k < grew; k++) {
        add.push({
          id: `${event?.n ?? 0}-${p.id}-${counts[i]}-${k}`,
          tx: tcx,
          ty: tcy,
          dx: dcx - tcx,
          dy: dcy - tcy,
          delay: k * 0.14,
        });
      }
    });

    prev.current = counts;
    if (add.length) setFlights((f) => [...f, ...add]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.n]);

  const done = (id: string) => setFlights((f) => f.filter((x) => x.id !== id));

  return (
    <AnimatePresence>
      {flights.map((fl) => (
        <div
          key={fl.id}
          className="pointer-events-none fixed z-50"
          style={{ left: fl.tx, top: fl.ty, transform: "translate(-50%, -50%)" }}
        >
          <motion.div
            initial={{ x: fl.dx, y: fl.dy, scale: 0.86, opacity: 0, rotate: -8 }}
            animate={{ x: 0, y: 0, scale: 1, opacity: [0, 1, 1, 0], rotate: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: fl.delay, opacity: { times: [0, 0.1, 0.85, 1], duration: 0.6, delay: fl.delay } }}
            onAnimationComplete={() => done(fl.id)}
          >
            <CardView faceDown animateIn={false} width={W} />
          </motion.div>
        </div>
      ))}
    </AnimatePresence>
  );
}
