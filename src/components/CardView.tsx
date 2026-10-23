import { motion } from "framer-motion";
import type { Card } from "@/game/types";
import { cardFace, CARD_SHEET_SIZE } from "@/lib/cardSprite";

/** How a card enters — e.g. flying in from the draw deck with a flip. */
export interface CardEnter {
  x: number;
  y: number;
  flip?: boolean;
  delay?: number;
}

interface Props {
  card?: Card;
  faceDown?: boolean;
  /** Card width in rem; height keeps the 7:10 UNO ratio. */
  width?: number;
  /** Legal to play right now — highlighted, but not a precondition for clicking. */
  playable?: boolean;
  animateIn?: boolean;
  enter?: CardEnter;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const BASE =
  "relative shrink-0 rounded-[0.55rem] border border-white/70 shadow-[0_6px_14px_rgba(2,6,23,0.5)] select-none";

export function CardView({
  card,
  faceDown,
  width = 4.9,
  playable = false,
  animateIn = true,
  enter,
  onClick,
  className = "",
  style,
}: Props) {
  // Any card the viewer can reach lifts and clicks — whether the rules allow it
  // is answered when they click, not by making it unreachable.
  const clickable = !!onClick;
  const size = { width: `${width}rem`, height: `${(width * 10) / 7}rem` };
  // One white-border width shared by the front (inset) and back (padding) so
  // every card — face up or down — has the same visible border.
  const bw = width * 0.024;

  const initial = enter
    ? { opacity: 0, scale: 0.5, x: enter.x, y: enter.y, rotateY: enter.flip ? 180 : 0 }
    : animateIn
      ? { opacity: 0, scale: 0.6, y: 10 }
      : false;

  const motionProps = {
    layout: true,
    initial,
    animate: { opacity: 1, scale: 1, x: 0, y: 0, rotateY: 0 },
    exit: { opacity: 0, scale: 0.7, transition: { duration: 0.18 } },
    transition: enter ? { duration: 0.6, ease: "easeOut" as const, delay: enter.delay ?? 0 } : undefined,
    whileHover: clickable ? { y: -18, scale: 1.05 } : undefined,
  };

  if (faceDown || !card) {
    // Classic UNO back: thin white border → black card → tilted red ellipse → "UNO".
    // Padding is kept in step with the front's (sprite-baked) white edge.
    return (
      <motion.div
        {...motionProps}
        onClick={onClick}
        className={`${BASE} overflow-hidden bg-white ${className}`}
        style={{ ...size, padding: `${bw}rem`, ...style }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[0.45rem] bg-black">
          <div className="absolute inset-x-[8%] inset-y-[26%] -rotate-[22deg] rounded-[50%] bg-uno-red shadow-[0_0_0_2px_rgba(0,0,0,0.35)]" />
          <div className="absolute inset-0 grid -rotate-[22deg] place-items-center">
            <span
              className="font-black italic leading-none text-white"
              style={{ fontSize: `${width * 0.3}rem`, textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
            >
              UNO
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  const face = cardFace(card);

  return (
    <motion.div
      {...motionProps}
      onClick={onClick}
      className={`${BASE} bg-white ${clickable ? "cursor-pointer" : ""} ${className}`}
      style={{
        ...size,
        ...style,
        backgroundImage: `url("${face.sheet}")`,
        backgroundPosition: face.position,
        backgroundSize: CARD_SHEET_SIZE,
        backgroundRepeat: "no-repeat",
        // Inset white ring = the front's border (matches the back's padding);
        // a soft gold glow marks a playable card — a highlight, not a border.
        boxShadow: playable
          ? `inset 0 0 0 ${bw}rem #ffffff, 0 0 16px 3px rgba(250,204,21,0.9), 0 10px 24px rgba(2,6,23,0.5)`
          : `inset 0 0 0 ${bw}rem #ffffff, 0 6px 14px rgba(2,6,23,0.5)`,
      }}
    />
  );
}
