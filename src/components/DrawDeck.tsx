import { motion } from "framer-motion";
import { CardView } from "./CardView";
import { useGame } from "@/store/gameStore";

const W = 4.6;

/** The draw deck — an isometric 3D stack of card backs, top-left of the table. */
export function DrawDeck({ canDraw, onDraw }: { canDraw: boolean; onDraw: () => void }) {
  const drawCount = useGame((s) => s.drawPile.length);
  const layers = Math.min(9, Math.max(1, Math.ceil(drawCount / 10)));
  const lift = (layers - 1) * 2.4;

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={canDraw ? onDraw : undefined}
        disabled={!canDraw}
        aria-label="Draw a card"
        className={`deck-btn preserve-3d relative ${canDraw ? "cursor-pointer" : "cursor-default"}`}
        style={{
          width: `${W}rem`,
          height: `${(W * 10) / 7}rem`,
          transform: "rotateX(52deg) rotateZ(-42deg)",
        }}
      >
        {Array.from({ length: layers }).map((_, i) => {
          const isTop = i === layers - 1;
          const z = i * 2.4;
          const peel = isTop && canDraw;
          return (
            <div
              key={i}
              className={`absolute inset-0 ${peel ? "deck-peel" : ""}`}
              // The peel layer must NOT set transform inline — an inline transform
              // would override the :hover rule in CSS. It gets its base transform
              // from the .deck-peel class via the --z variable instead.
              style={peel ? { ["--z" as string]: `${z}px` } : { transform: `translateZ(${z}px)` }}
            >
              <CardView faceDown animateIn={false} width={W} />
            </div>
          );
        })}
        {canDraw && (
          // Floats above the stack and squarely faces the viewer: the rotations
          // undo the deck's isometric tilt, and the -50% shift lands last so it
          // centres the label on screen rather than in the tilted frame.
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transform: `translateZ(${lift + 12}px) rotateZ(42deg) rotateX(-52deg) translate(-50%, -50%)`,
            }}
          >
            <motion.span
              className="block whitespace-nowrap rounded-full bg-indigo-500 px-5 py-2 text-xl font-extrabold uppercase tracking-widest text-white shadow-[0_8px_24px_rgba(2,6,23,0.7)] ring-2 ring-white/80"
              // A gentle throb rather than Tailwind's animate-pulse, which
              // fades to half opacity — the opposite of easy to see.
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
            >
              Draw
            </motion.span>
          </div>
        )}
      </button>
      <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-bold text-slate-200 ring-1 ring-white/15">
        {drawCount} left
      </span>
    </div>
  );
}
