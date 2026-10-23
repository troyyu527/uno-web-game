import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { asset } from "@/lib/assets";
import { useAuth } from "@/store/authStore";
import { useServer, canPlayOnline, type ServerStatus } from "@/store/serverStore";
import { RulesModal } from "@/components/RulesModal";

// How the connection reads on the home page. Only "online" opens the door.
const BADGE: Record<ServerStatus, { text: string; className: string }> = {
  checking: {
    text: "Checking server…",
    className: "animate-pulse border-white/15 bg-white/5 text-slate-400",
  },
  online: {
    text: "☁ Server connected — online play available",
    className: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  },
  offline: {
    text: "⚠ Server unreachable — online play unavailable",
    className: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  },
  unconfigured: {
    text: "💾 Local only — saves stay on this device",
    className: "border-white/15 bg-white/5 text-slate-400",
  },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export default function Menu() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const status = useServer((s) => s.status);
  const detail = useServer((s) => s.detail);
  const recheck = useServer((s) => s.check);
  const [showRules, setShowRules] = useState(false);

  const online = canPlayOnline(status);
  const badge = BADGE[status];
  const onlineBtn =
    "whitespace-nowrap rounded-full px-8 py-3 text-lg font-bold text-white shadow-[0_12px_30px_rgba(99,102,241,0.4)] transition";
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-6">
      {user && (
        <div className="absolute right-5 top-5 flex items-center gap-3 text-sm">
          <Link to="/profile" className="font-semibold text-slate-200 hover:text-white">
            {user.username}
          </Link>
          <button
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-slate-300 transition hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      )}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        // Wide enough for the four action buttons to sit on one row without
        // being squeezed into wrapping their labels. The prose below sets its
        // own narrower max-width, so only this row gets the extra space.
        className="flex w-full max-w-3xl flex-col items-center text-center"
      >
        <motion.img
          variants={item}
          src={asset("img/UNO_Logo.svg")}
          alt="UNO"
          className="mb-8 w-52 drop-shadow-[0_18px_40px_rgba(228,52,47,0.45)] md:w-64"
        />

        <motion.p
          variants={item}
          className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-indigo-300"
        >
          Play the classic card game
        </motion.p>
        <motion.h1
          variants={item}
          className="mb-3 bg-gradient-to-br from-slate-50 via-uno-yellow to-uno-red bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-6xl"
        >
          UNO Game Place
        </motion.h1>
        <motion.p variants={item} className="mb-4 max-w-md text-slate-300">
          Take on three AI opponents in a fast, animated game of UNO — right in your browser.
        </motion.p>

        <motion.div variants={item} className="mb-8 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${badge.className}`}
            title={detail}
          >
            {badge.text}
          </span>
          {status === "offline" && (
            <button
              onClick={() => void recheck()}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
            >
              Retry
            </button>
          )}
        </motion.div>

        {/* Wraps to a second row on narrow screens rather than compressing the
            buttons — every label stays on a single line either way. */}
        <motion.div
          variants={item}
          className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center"
        >
          <Link
            to="/game"
            className="whitespace-nowrap rounded-full bg-gradient-to-br from-uno-red to-rose-600 px-8 py-3 text-lg font-bold text-white shadow-[0_12px_30px_rgba(228,52,47,0.4)] transition hover:-translate-y-0.5 hover:brightness-110"
          >
            Play vs AI
          </Link>
          {online ? (
            <Link
              to="/online"
              className={`${onlineBtn} bg-gradient-to-br from-indigo-500 to-violet-600 hover:-translate-y-0.5 hover:brightness-110`}
            >
              Play Online
            </Link>
          ) : (
            <button
              disabled
              title={detail}
              aria-label={`Play Online — unavailable. ${detail}`}
              className={`${onlineBtn} cursor-not-allowed bg-gradient-to-br from-slate-600 to-slate-700 opacity-60 shadow-none`}
            >
              {status === "checking" ? "Play Online…" : "Play Online"}
            </button>
          )}
          <button
            onClick={() => setShowRules(true)}
            className="whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-8 py-3 text-lg font-semibold text-slate-100 backdrop-blur transition hover:border-white/40 hover:bg-white/10"
          >
            How to Play
          </button>
          {!user && (
            <Link
              to="/login"
              className="whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-8 py-3 text-lg font-semibold text-slate-100 backdrop-blur transition hover:border-white/40 hover:bg-white/10"
            >
              Log in
            </Link>
          )}
        </motion.div>

        {!user && (
          <motion.p variants={item} className="mt-6 text-sm text-slate-400">
            No account?{" "}
            <Link to="/register" className="font-semibold text-indigo-300 hover:text-indigo-200">
              Create one
            </Link>{" "}
            to save your games across the cloud.
          </motion.p>
        )}
      </motion.div>

      <footer className="absolute bottom-5 text-xs text-slate-500">
        © {new Date().getFullYear()} Troy Yu — a personal web-dev study project.
      </footer>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
