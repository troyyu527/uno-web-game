import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/store/gameStore";
import { EFFECT_DELAY_MS, EFFECT_HOLD_MS } from "@/lib/timing";
import type { CardValue, PlayerId } from "@/game/types";

// Every action card gets the same greyed-panel + bordered word stamp (the
// original "SKIPPED" style), so Skip / +2 / +4 / Reverse all read alike.
const LABEL: Partial<Record<CardValue, string>> = {
  Skip: "SKIPPED",
  "Draw Two": "DRAW +2",
  "Draw Four": "DRAW +4",
  Reverse: "REVERSE",
};

// Over the affected player's hand; Reverse (no single victim) sits at centre.
// Indexed by the victim's position relative to the viewer (0 me/bottom … 3 right).
const ANCHOR_REL: { left: string; top: string; w: string; h: string }[] = [
  { left: "50%", top: "84%", w: "26rem", h: "12rem" }, // bottom
  { left: "7%", top: "50%", w: "12rem", h: "26rem" }, // left
  { left: "50%", top: "12%", w: "26rem", h: "12rem" }, // top
  { left: "93%", top: "50%", w: "12rem", h: "26rem" }, // right
];
const CENTER = { left: "50%", top: "44%", w: "22rem", h: "12rem" };
const relOf = (id: PlayerId, viewerSeat: number) =>
  (Number(id.slice(1)) - 1 - viewerSeat + 4) % 4;

const HOLD = EFFECT_HOLD_MS / 1000;

/** A greyed panel with a bordered word stamp, shown once an action's effect begins. */
export function ActionStamp({ viewerSeat = 0 }: { viewerSeat?: number }) {
  const lastAction = useGame((s) => s.lastAction);
  const [active, setActive] = useState<{
    label: string;
    at: (typeof CENTER);
    key: number;
  } | null>(null);

  // Keyed on the action rather than the event — see the note in ActionEffect.
  useEffect(() => {
    if (lastAction && LABEL[lastAction.value]) {
      const at = lastAction.victim ? ANCHOR_REL[relOf(lastAction.victim, viewerSeat)] : CENTER;
      const label = LABEL[lastAction.value]!;
      const show = setTimeout(() => setActive({ label, at, key: lastAction.key }), EFFECT_DELAY_MS);
      const hide = setTimeout(() => setActive(null), EFFECT_DELAY_MS + EFFECT_HOLD_MS);
      return () => {
        clearTimeout(show);
        clearTimeout(hide);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAction?.key]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={active.key}
          className="pointer-events-none absolute z-[60] grid place-items-center rounded-2xl"
          style={{
            left: active.at.left,
            top: active.at.top,
            width: active.at.w,
            height: active.at.h,
            background: "rgba(15,23,42,0.6)",
            backdropFilter: "grayscale(1) brightness(0.6)",
            WebkitBackdropFilter: "grayscale(1) brightness(0.6)",
          }}
          initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
          animate={{ opacity: [0, 1, 1, 0], scale: 1, x: "-50%", y: "-50%" }}
          exit={{ opacity: 0 }}
          transition={{ duration: HOLD, times: [0, 0.15, 0.8, 1] }}
        >
          <span
            className="rotate-[-8deg] whitespace-nowrap rounded-lg border-[3px] border-slate-200 px-3 py-1 text-2xl font-black uppercase tracking-widest text-slate-100"
            style={{ textShadow: "0 2px 6px rgba(0,0,0,0.7)" }}
          >
            {active.label}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
