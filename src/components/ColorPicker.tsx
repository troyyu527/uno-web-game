import { useState } from "react";
import { motion } from "framer-motion";
import type { ColorSuit } from "@/game/types";
import { COLOR_SUITS } from "@/game/types";
import { WILD_TINT } from "@/game/rules";

export function ColorPicker({ onPick }: { onPick: (c: ColorSuit) => void }) {
  const [picked, setPicked] = useState<ColorSuit | null>(null);

  // Blink the chosen swatch a couple of times, then commit — so the colour
  // choice is clearly shown before the wild card turns that colour.
  const choose = (color: ColorSuit) => {
    if (picked) return;
    setPicked(color);
    setTimeout(() => onPick(color), 620);
  };

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-center shadow-2xl"
      >
        <h2 className="mb-4 text-lg font-bold text-slate-100">
          {picked ? `${picked}!` : "Choose a color"}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {COLOR_SUITS.map((color: ColorSuit) => {
            const isPicked = picked === color;
            const dimmed = picked && !isPicked;
            return (
              <motion.button
                key={color}
                onClick={() => choose(color)}
                disabled={!!picked}
                className="h-20 w-20 rounded-xl border-2 border-white/30 shadow-lg"
                style={{ background: WILD_TINT[color] }}
                aria-label={color}
                animate={
                  isPicked
                    ? {
                        scale: [1, 1.18, 1.05, 1.18, 1.08],
                        boxShadow: [
                          `0 0 0px 0px ${WILD_TINT[color]}`,
                          `0 0 30px 10px ${WILD_TINT[color]}`,
                          `0 0 8px 2px ${WILD_TINT[color]}`,
                          `0 0 30px 10px ${WILD_TINT[color]}`,
                          `0 0 14px 4px ${WILD_TINT[color]}`,
                        ],
                        borderColor: "#ffffff",
                      }
                    : { opacity: dimmed ? 0.35 : 1, scale: 1 }
                }
                transition={isPicked ? { duration: 0.6, times: [0, 0.25, 0.5, 0.75, 1] } : { duration: 0.2 }}
                whileHover={picked ? undefined : { scale: 1.06 }}
              />
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
