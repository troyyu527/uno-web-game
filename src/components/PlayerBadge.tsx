import { motion } from "framer-motion";
import type { Player, PlayerId } from "@/game/types";
import { playerStatus } from "@/game/rules";
import { asset } from "@/lib/assets";

const AVATAR: Record<PlayerId, string> = {
  p1: "avatar_1",
  p2: "avatar_4",
  p3: "avatar_7",
  p4: "avatar_9",
};

export function PlayerBadge({ player, current }: { player: Player; current: boolean }) {
  const status = playerStatus(player.hand.length);
  return (
    <motion.div
      layout
      animate={{ scale: current ? 1.06 : 1 }}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur transition ${
        current
          ? "border-yellow-300/70 bg-yellow-300/20 shadow-[0_0_22px_rgba(244,197,66,0.55)]"
          : "border-white/10 bg-black/35"
      }`}
    >
      <img
        src={asset(`img/avatar_photo/${AVATAR[player.id]}.svg`)}
        alt=""
        className="h-8 w-8 rounded-full bg-white/10 ring-1 ring-white/20"
      />
      <div className="leading-tight">
        <div className="text-sm font-bold text-slate-100">{player.name}</div>
        <div
          className={`text-[0.7rem] font-semibold ${
            status === "UNO" ? "text-uno-yellow" : status === "Critical" ? "text-uno-red" : "text-slate-300"
          }`}
        >
          {player.hand.length} card{player.hand.length === 1 ? "" : "s"}
          {status === "UNO" && " · UNO!"}
        </div>
      </div>
    </motion.div>
  );
}
