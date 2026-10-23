import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/store/gameStore";
import { EFFECT_DELAY_MS, EFFECT_HOLD_MS } from "@/lib/timing";

/**
 * Faint circular double-arrow ringing the discard pile, spinning with the play
 * direction. The outer div centres it on the pile; the inner motion.svg only
 * spins. On a Reverse it flashes bright, and the spin only switches to the new
 * direction AFTER that flash finishes — so the arrows keep their old direction
 * until the reverse effect is done.
 */
export function DirectionArrows({ direction }: { direction: 1 | -1 }) {
  const event = useGame((s) => s.event);
  const lastAction = useGame((s) => s.lastAction);
  const [flash, setFlash] = useState(0);
  // The direction actually shown, which lags the store on a reverse.
  const [shown, setShown] = useState<1 | -1>(direction);
  const pendingFlip = useRef(false);

  useEffect(() => {
    const dir = useGame.getState().direction;
    if (event?.type === "action" && lastAction?.value === "Reverse") {
      // Blink during the effect, then flip the spin once the effect has ended.
      pendingFlip.current = true;
      const blink = setTimeout(() => setFlash((n) => n + 1), EFFECT_DELAY_MS);
      const flip = setTimeout(() => {
        setShown(useGame.getState().direction);
        pendingFlip.current = false;
      }, EFFECT_DELAY_MS + EFFECT_HOLD_MS);
      return () => {
        clearTimeout(blink);
        clearTimeout(flip);
      };
    }
    if (event?.type === "deal") {
      pendingFlip.current = false; // a fresh game resets everything
      setShown(dir);
    } else if (!pendingFlip.current) {
      setShown(dir);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.n]);

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <motion.svg
        viewBox="0 0 120 120"
        className="h-[34rem] w-[34rem]"
        // scaleX mirrors the arrowheads AND reverses the visual spin, so the
        // rotation itself always increases — flipping only scaleX gives a true
        // counter-clockwise spin for direction -1.
        style={{ scaleX: shown === 1 ? 1 : -1 }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
      >
        <defs>
          <marker
            id="dir-head"
            viewBox="0 0 12 12"
            refX="3.2"
            refY="6"
            markerWidth="8.5"
            markerHeight="8.5"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M0,0 L12,6 L0,12 L3.4,6 Z" fill="currentColor" />
          </marker>
        </defs>
        <motion.g
          key={flash}
          initial={{ color: "#ffffff", opacity: 0.17 }}
          animate={
            flash
              ? { color: ["#facc15", "#ffffff", "#facc15", "#ffffff"], opacity: [0.95, 0.22, 0.95, 0.17] }
              : { color: "#ffffff", opacity: 0.17 }
          }
          transition={flash ? { duration: 1.4, times: [0, 0.33, 0.66, 1] } : { duration: 0 }}
        >
          <path
            d="M 23.6 39 A 42 42 0 0 1 96.4 39"
            fill="none"
            stroke="currentColor"
            strokeWidth="5.5"
            strokeLinecap="round"
            markerEnd="url(#dir-head)"
          />
          <path
            d="M 96.4 81 A 42 42 0 0 1 23.6 81"
            fill="none"
            stroke="currentColor"
            strokeWidth="5.5"
            strokeLinecap="round"
            markerEnd="url(#dir-head)"
          />
        </motion.g>
      </motion.svg>
    </div>
  );
}
