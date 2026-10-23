import { useState } from "react";
import { useGame } from "@/store/gameStore";
import { useSound } from "@/hooks/useSound";
import { useBGM } from "@/hooks/useBGM";
import { useOnlineGame } from "@/hooks/useOnlineGame";
import { Board } from "@/components/Board";
import { PauseMenu } from "@/components/PauseMenu";
import { claimSeat, freeSeats, type Room } from "@/lib/rooms";
import type { User } from "@/lib/backend";

const btn =
  "rounded-full border border-white/15 bg-black/30 px-4 py-1.5 text-sm font-semibold text-slate-200 backdrop-blur transition hover:bg-white/10";

interface Props {
  code: string;
  room: Room;
  user: User;
  /** User ids currently connected to the room (Supabase presence). */
  online: Set<string>;
  /** Report a room we wrote ourselves, so it applies without a round trip. */
  onRoomChange: (room: Room) => void;
  onLeave: () => void;
}

/**
 * The online table. Identical to the single-player board except that the game
 * state comes from the room rather than this browser, and the viewer sits at
 * their assigned seat instead of always at seat 0.
 */
export default function OnlineGame({ code, room, user, online, onRoomChange, onLeave }: Props) {
  const mySeat = room.seats?.findIndex((s) => s.userId === user.id) ?? -1;
  const isHost = room.hostId === user.id;
  const { synced, myTurn, act, publish } = useOnlineGame(code, room, mySeat, isHost, online);

  const [soundOn, setSoundOn] = useState(true);
  const [paused, setPaused] = useState(false);
  useSound(soundOn);
  useBGM(soundOn && !paused);

  const phase = useGame((s) => s.phase);
  const seatIsBot = useGame((s) => s.players[mySeat]?.isAI ?? false);
  const players = useGame((s) => s.players);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Arrived mid-game: offer whichever seats the AI is holding. Claiming only
  // writes the seat — the host swaps the AI out for us on its next sweep.
  if (mySeat < 0) {
    const open = freeSeats(room);
    const take = async (seat: number) => {
      setClaiming(seat);
      setClaimError(null);
      try {
        onRoomChange(await claimSeat(user, code, seat));
      } catch (e) {
        setClaimError(e instanceof Error ? e.message : "Could not take that seat.");
        setClaiming(null);
      }
    };

    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 p-8 text-center shadow-2xl">
          <h1 className="mb-1 text-2xl font-extrabold text-slate-50">Game in progress</h1>
          <p className="mb-6 text-sm text-slate-400">
            {open.length
              ? "Take over one of the seats the AI is playing. You'll inherit its hand."
              : "Every seat is taken — hang on for the next round."}
          </p>

          <div className="space-y-2">
            {open.map((seat) => (
              <button
                key={seat}
                onClick={() => take(seat)}
                disabled={claiming !== null}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10 disabled:opacity-50"
              >
                <span className="font-semibold text-slate-100">
                  {room.seats?.[seat]?.username ?? `Seat ${seat + 1}`}
                </span>
                <span className="text-xs text-slate-400">
                  {claiming === seat
                    ? "Sitting down…"
                    : synced
                      ? `${players[seat]?.hand.length ?? 0} cards · take this seat`
                      : "take this seat"}
                </span>
              </button>
            ))}
          </div>

          {claimError && <p className="mt-4 text-sm text-uno-red">{claimError}</p>}

          <button onClick={onLeave} className="mt-6 text-sm text-slate-400 hover:text-slate-200">
            ← Leave room
          </button>
        </div>
      </div>
    );
  }

  if (!synced) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <p className="animate-pulse text-lg text-slate-300">Dealing…</p>
      </div>
    );
  }

  const rematch = () => {
    if (!isHost) return;
    const seats = useGame.getState().players.map((p) => ({ username: p.name, isAI: p.isAI }));
    useGame.getState().startMultiplayer(seats);
    publish();
  };

  return (
    <>
      <Board
        viewerSeat={mySeat}
        soundOn={soundOn}
        onPlay={(id) => act(() => useGame.getState().playCard(id))}
        onDraw={() => act(() => useGame.getState().drawForCurrent())}
        onPass={() => act(() => useGame.getState().pass())}
        onChooseColor={(c) => act(() => useGame.getState().chooseColor(c))}
        onPlayAgain={rematch}
        onExit={onLeave}
        canPlayAgain={isHost}
        playAgainLabel="Play again"
        exitLabel="Leave room"
        waitingText="Waiting for the host to start another round…"
        topBar={
          <>
            <button className={btn} onClick={() => setPaused(true)}>
              ⏸ Menu
            </button>
            <span className={`${btn} pointer-events-none tracking-[0.2em]`}>Room {code}</span>
            <button className={btn} onClick={() => setSoundOn((v) => !v)} aria-label="Toggle sound & music">
              {soundOn ? "🔊" : "🔇"}
            </button>
            {phase === "playing" && (
              <span
                className={`${btn} pointer-events-none ${
                  myTurn ? "!border-emerald-400/50 !bg-emerald-500/20 !text-emerald-200" : ""
                }`}
              >
                {myTurn ? "Your turn" : seatIsBot ? "Your seat is on autoplay" : "Waiting…"}
              </span>
            )}
          </>
        }
      />
      {paused && (
        <PauseMenu
          onClose={() => setPaused(false)}
          allowSaves={false}
          onQuit={onLeave}
          quitLabel="Leave room"
        />
      )}
    </>
  );
}
