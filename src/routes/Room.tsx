import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/store/authStore";
import { useGame } from "@/store/gameStore";
import OnlineGame from "./OnlineGame";
import {
  buildSeats,
  joinRoom,
  leaveRoom,
  startGame,
  subscribeRoom,
  type Room as RoomT,
} from "@/lib/rooms";

const NO_ONE: Set<string> = new Set();

export default function Room() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const [room, setRoom] = useState<RoomT | null>(null);
  const [online, setOnline] = useState(NO_ONE);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/online");
      return;
    }
    let alive = true;
    (async () => {
      try {
        const r = await joinRoom(code); // idempotent — also handles refresh/direct nav
        if (alive) setRoom(r);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Could not open that room.");
      }
    })();
    // The socket delivers every change to the room plus who's connected, and
    // resends the whole room whenever it reconnects — so a dropped connection
    // or a sleeping tab catches up without polling.
    const unsub = subscribeRoom(code, {
      room: (r) => {
        if (!alive) return;
        if (!r) {
          setError("The host closed this room.");
          setRoom(null);
        } else {
          setRoom(r);
        }
      },
      presence: (ids) => {
        if (alive) setOnline(ids);
      },
      error: (message) => {
        if (alive) setError(message);
      },
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [code, user, navigate]);

  const isHost = !!user && room?.hostId === user.id;
  const canStart = isHost && (room?.players.length ?? 0) >= 2;

  // The host deals the opening hands and publishes them with the seating, so
  // every client starts from the same shuffle.
  const onStart = async () => {
    if (!room || !canStart) return;
    setStarting(true);
    try {
      const seats = buildSeats(room.players);
      useGame.getState().startMultiplayer(seats);
      // Apply the started room directly — the host shouldn't sit on the lobby
      // waiting for its own write to travel back over the socket.
      setRoom(await startGame(code, seats, useGame.getState().getMultiState()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the game.");
      setStarting(false);
    }
  };

  const onLeave = async () => {
    if (user) await leaveRoom(code).catch(() => {});
    useGame.getState().toMenu();
    navigate("/online");
  };

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="mb-4 text-lg text-slate-200">{error}</p>
          <button
            onClick={() => navigate("/online")}
            className="rounded-full bg-white/10 px-5 py-2 font-semibold text-slate-100 hover:bg-white/15"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (room?.status === "playing" && user) {
    return (
      <OnlineGame
        code={code}
        room={room}
        user={user}
        online={online}
        onRoomChange={setRoom}
        onLeave={onLeave}
      />
    );
  }

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 p-8 text-center shadow-2xl"
      >
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-indigo-300">Room code</p>
        <div className="my-2 text-5xl font-black tracking-[0.35em] text-slate-50">{code}</div>
        <p className="mb-6 text-sm text-slate-400">Share this code with friends so they can join.</p>

        <div className="mb-6 space-y-2">
          <p className="text-xs uppercase tracking-widest text-slate-500">
            Players ({room?.players.length ?? 0}/4)
          </p>
          <AnimatePresence initial={false}>
            {room?.players.map((p) => (
              <motion.div
                key={p.userId}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2"
              >
                <span className="flex items-center gap-2 font-semibold text-slate-100">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      online.has(p.userId) ? "bg-emerald-400" : "bg-slate-600"
                    }`}
                    title={online.has(p.userId) ? "Connected" : "Reconnecting…"}
                  />
                  {p.username}
                </span>
                <span className="text-xs text-slate-400">
                  {p.userId === room.hostId ? "Host" : "Ready"}
                  {p.userId === user?.id ? " · you" : ""}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          <p className="pt-1 text-xs text-slate-500">
            Any empty seats are filled by AI, so 2 players is enough to start.
          </p>
        </div>

        {isHost ? (
          <button
            onClick={onStart}
            disabled={!canStart || starting}
            className="w-full rounded-full bg-gradient-to-br from-uno-red to-rose-600 px-6 py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {starting ? "Starting…" : canStart ? "Start game" : "Waiting for one more player…"}
          </button>
        ) : (
          <p className="rounded-full bg-white/5 px-6 py-3 text-slate-300">
            Waiting for the host to start…
          </p>
        )}

        <button onClick={onLeave} className="mt-6 text-sm text-slate-400 hover:text-slate-200">
          ← Leave room
        </button>
      </motion.div>
    </div>
  );
}
