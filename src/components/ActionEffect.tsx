import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/store/gameStore";
import { asset } from "@/lib/assets";
import { EFFECT_DELAY_MS, EFFECT_HOLD_MS } from "@/lib/timing";
import type { CardValue, PlayerId } from "@/game/types";

const SYMBOL: Partial<Record<CardValue, string>> = {
  Skip: "skip_black",
  Reverse: "reverse_black",
  "Draw Two": "draw_two_black",
  "Draw Four": "draw_four_black",
};

// The "+N" a draw card makes its victim take, shown alongside the symbol.
const PLUS: Partial<Record<CardValue, string>> = {
  "Draw Two": "+2",
  "Draw Four": "+4",
};

// The effect flashes over the affected player's hand. Anchors are indexed by the
// victim's position *relative to the viewer* (0 me/bottom … 3 right), so they're
// correct from every rotated point of view. `null` victim → over the discard.
const ANCHOR_REL: { left: string; top: string }[] = [
  { left: "50%", top: "78%" }, // bottom (you)
  { left: "15%", top: "50%" }, // left
  { left: "50%", top: "20%" }, // top
  { left: "85%", top: "50%" }, // right
];
const CENTER = { left: "50%", top: "44%" };
const relOf = (id: PlayerId, viewerSeat: number) =>
  (Number(id.slice(1)) - 1 - viewerSeat + 4) % 4;

/** Flashes a big golden symbol over the player an action card affects. */
export function ActionEffect({ viewerSeat = 0 }: { viewerSeat?: number }) {
  const lastAction = useGame((s) => s.lastAction);
  const [active, setActive] = useState<{
    value: CardValue;
    at: { left: string; top: string };
    key: number;
  } | null>(null);

  // Driven by the action's own key, not the event: a card played as someone's
  // second-to-last emits "uno", and gating on "action" made those plays flash
  // nothing at all.
  useEffect(() => {
    if (lastAction && SYMBOL[lastAction.value]) {
      const at = lastAction.victim ? ANCHOR_REL[relOf(lastAction.victim, viewerSeat)] : CENTER;
      const show = setTimeout(
        () => setActive({ value: lastAction.value, at, key: lastAction.key }),
        EFFECT_DELAY_MS,
      );
      const hide = setTimeout(() => setActive(null), EFFECT_DELAY_MS + EFFECT_HOLD_MS);
      return () => {
        clearTimeout(show);
        clearTimeout(hide);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAction?.key]);

  const plus = active ? PLUS[active.value] : undefined;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={active.key}
          className="pointer-events-none absolute z-[58] grid h-44 w-44 place-items-center rounded-full"
          style={{
            left: active.at.left,
            top: active.at.top,
            background:
              "radial-gradient(circle, rgba(250,204,21,0.97) 0%, rgba(250,204,21,0.4) 58%, transparent 72%)",
            boxShadow: "0 0 80px 26px rgba(250,204,21,0.55)",
          }}
          initial={{ scale: 0.4, opacity: 0, x: "-50%", y: "-50%" }}
          animate={{
            scale: [0.4, 1.12, 1, 1, 1.16],
            opacity: [0, 1, 1, 1, 0],
            x: "-50%",
            y: "-50%",
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: EFFECT_HOLD_MS / 1000, times: [0, 0.14, 0.28, 0.82, 1] }}
        >
          <img src={asset(`img/symbols/${SYMBOL[active.value]}.svg`)} alt="" className="h-24 w-24" />
          {plus && (
            <span
              className="absolute -bottom-2 right-1 font-black italic leading-none text-black drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]"
              style={{ fontSize: "2.6rem" }}
            >
              {plus}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
