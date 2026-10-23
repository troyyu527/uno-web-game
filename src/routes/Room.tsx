import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/store/authStore";
import { useGame } from "@/store/gameStore";
import OnlineGame from "./OnlineGame";
import {
  buildSeats,
  getRoom,
  joinRoom,
  leaveRoom,
  startGame,
  subscribePresence,
  subscribeRoom,
  type Room as RoomT,
} from "@/lib/rooms";

const NO_ONE: Set<string> = new Set();
/** How often to re-read the room when Realtime hasn't told us anything. */
const POLL_MS = 3000;

/**
 * Cheap equality so a poll that found nothing new doesn't re-render the table.
 * `seats` has to be in here: claiming or releasing a seat rewrites it without
 * touching `version`, and treating that as "nothing new" would strand the
 * change whenever Realtime isn't delivering.
 */
const unchanged = (a: RoomT | null, b: RoomT) =>
  !!a &&
  a.version === b.version &&
  a.status === b.status &&
  JSON.stringify(a.players) === JSON.stringify(b.players) &&
  JSON.stringify(a.seats) === JSON.stringify(b.seats);

export default function Room() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const [room, setRoom] = useState<RoomT | null>(null);
  const [online, setOnline] = useState(NO_ONE);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const rejoins = useRef(0);
  /** When Realtime last delivered, so the fallback poll can stand down. */
  const liveAt = useRef(0);

  useEffect(() => {
    if (!user) {
      navigate("/online");
      return;
    }
    let alive = true;
    (async () => {
      try {
        const r = await joinRoom(user, code); // idempotent — also handles refresh/direct nav
        if (alive) setRoom(r);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Could not open that room.");
      }
    })();
    const unsub = subscribeRoom(code, (r) => {
      if (!alive) return;
      liveAt.current = Date.now();
      if (!r) {
        setError("The host closed this room.");
        setRoom(null);
      } else {
        setRoom(r);
      }
    });
    const unsubPresence = subscribePresence(code, user.id, (ids) => {
      if (alive) setOnline(ids);
    });
    // Safety net: Realtime is the fast path, but a dropped message (or a
    // project where Realtime was never enabled on the table) would otherwise
    // leave the table frozen. Re-reading the room is one small row, and states
    // no newer than what we hold are ignored downstream.
    const poll = setInterval(() => {
      if (!alive) return;
      // Realtime is doing its job — don't spend a read confirming it.
      if (Date.now() - liveAt.current < POLL_MS * 3) return;
      void getRoom(code).then((r) => {
        // A missing room is left to the Realtime DELETE, so that a single failed
        // read can't wrongly tell everyone the host closed the room.
        if (alive && r) setRoom((prev) => (unchanged(prev, r) ? prev : r));
      }, () => {});
    }, POLL_MS);
    return () => {
      alive = false;
      clearInterval(poll);
      unsub();
      unsubPresence();
    };
  }, [code, user, navigate]);

  // Joining is a read-modify-write, so two people arriving at once can drop one
  // of them from the list. If the room says we're not in it, put ourselves back.
  useEffect(() => {
    if (!user || !room || room.status !== "lobby") return;
    if (room.players.some((p) => p.userId === user.id)) {
      rejoins.current = 0;
      return;
    }
    if (rejoins.current >= 3) return;
    rejoins.current += 1;
    joinRoom(user, code).then(setRoom, () => {});
  }, [room, user, code]);

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
      // waiting for its own write to travel back over Realtime.
      setRoom(await startGame(code, seats, useGame.getState().getMultiState()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the game.");
      setStarting(false);
    }
  };

  const onLeave = async () => {
    if (user) await leaveRoom(user, code).catch(() => {});
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
