import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/store/authStore";
import { useServer, canPlayOnline } from "@/store/serverStore";
import { createRoom, joinRoom } from "@/lib/rooms";

export default function Online() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const status = useServer((s) => s.status);
  const detail = useServer((s) => s.detail);
  const recheck = useServer((s) => s.check);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connected = canPlayOnline(status);

  const guard = () => {
    if (!connected) {
      setError(detail);
      return false;
    }
    if (!user) {
      setError("Please log in first to play online.");
      return false;
    }
    return true;
  };

  const onCreate = async () => {
    if (!guard() || !user) return;
    setBusy("create");
    setError(null);
    try {
      const room = await createRoom();
      navigate(`/room/${room.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create a room.");
      setBusy(null);
    }
  };

  const onJoin = async () => {
    if (!guard() || !user) return;
    if (!/^\d{4}$/.test(code)) {
      setError("Enter the 4-digit room code.");
      return;
    }
    setBusy("join");
    setError(null);
    try {
      await joinRoom(code);
      navigate(`/room/${code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join that room.");
      setBusy(null);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 p-8 text-center shadow-2xl"
      >
        <h1 className="mb-1 text-2xl font-extrabold text-slate-50">Play Online</h1>
        <p className="mb-6 text-sm text-slate-400">
          Create a room and share the code, or join a friend's room.
        </p>

        {!connected && (
          // Amber reads as a problem, which "still checking" isn't yet.
          <div
            className={`mb-4 rounded-lg px-3 py-2 text-sm ${
              status === "checking"
                ? "animate-pulse bg-white/5 text-slate-400"
                : "bg-amber-400/10 text-amber-300"
            }`}
          >
            <p>{detail}</p>
            {status === "offline" && (
              <button
                onClick={() => void recheck()}
                className="mt-2 rounded-full border border-amber-300/30 px-3 py-1 text-xs font-semibold transition hover:bg-amber-300/10"
              >
                Retry
              </button>
            )}
          </div>
        )}
        {connected && !user && (
          <p className="mb-4 rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-300">
            You need an account.{" "}
            <Link to="/login" className="font-semibold text-indigo-300 hover:text-indigo-200">
              Log in
            </Link>{" "}
            or{" "}
            <Link to="/register" className="font-semibold text-indigo-300 hover:text-indigo-200">
              register
            </Link>
            .
          </p>
        )}

        <button
          onClick={onCreate}
          disabled={busy !== null || !connected}
          className="mb-5 w-full rounded-full bg-gradient-to-br from-uno-red to-rose-600 px-6 py-3 font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "create" ? "Creating…" : "Create a room"}
        </button>

        <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-widest text-slate-500">
          <span className="h-px flex-1 bg-white/10" /> or join <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            placeholder="4-digit code"
            disabled={!connected}
            className="w-full rounded-full border border-white/15 bg-white/5 px-5 py-3 text-center text-lg font-bold tracking-[0.3em] text-slate-100 outline-none focus:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            onKeyDown={(e) => e.key === "Enter" && onJoin()}
          />
          <button
            onClick={onJoin}
            disabled={busy !== null || !connected}
            className="rounded-full border border-white/15 bg-white/5 px-6 py-3 font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "join" ? "…" : "Join"}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-uno-red">{error}</p>}

        <Link to="/" className="mt-6 inline-block text-sm text-slate-400 hover:text-slate-200">
          ← Back to menu
        </Link>
      </motion.div>
    </div>
  );
}
