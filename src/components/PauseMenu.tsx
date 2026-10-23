import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useGame } from "@/store/gameStore";
import { useAuth } from "@/store/authStore";
import { listSaves, putSave, deleteSave, SAVE_SLOTS, type SaveSlot } from "@/lib/backend";

type Tab = "main" | "save" | "load";

const rowBtn =
  "flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left text-slate-100 transition hover:bg-white/10 disabled:opacity-50";

interface Props {
  onClose: () => void;
  /**
   * Online games live in the room on the server, shared by everyone at the
   * table — there's no single-player snapshot to write or restore, so the
   * save/load slots are hidden rather than offered and then failing.
   */
  allowSaves?: boolean;
  /** What "quit" does; defaults to abandoning a local game for the menu. */
  onQuit?: () => void;
  quitLabel?: string;
}

export function PauseMenu({ onClose, allowSaves = true, onQuit, quitLabel }: Props) {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const [tab, setTab] = useState<Tab>("main");
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = () => listSaves(user).then(setSlots).catch(() => setSlots([]));
  useEffect(() => {
    if (tab !== "main") refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const byIndex = (i: number) => slots.find((s) => s.index === i);

  const doSave = async (i: number) => {
    setBusy(true);
    const snapshot = useGame.getState().getSnapshot();
    await putSave(user, { index: i, name: `Slot ${i + 1}`, savedAt: Date.now(), snapshot });
    await refresh();
    setBusy(false);
  };
  const doLoad = (slot: SaveSlot) => {
    useGame.getState().loadSnapshot(slot.snapshot);
    onClose();
  };
  const doDelete = async (i: number) => {
    await deleteSave(user, i);
    refresh();
  };

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-[24rem] rounded-2xl border border-white/10 bg-slate-900/85 p-6 shadow-2xl"
      >
        {tab === "main" && (
          <div className="flex flex-col gap-3">
            <h2 className="mb-1 text-xl font-extrabold text-slate-50">Paused</h2>
            <button className={rowBtn} onClick={onClose}>Resume</button>
            {allowSaves && (
              <>
                <button className={rowBtn} onClick={() => setTab("save")}>Save game</button>
                <button className={rowBtn} onClick={() => setTab("load")}>Load game</button>
              </>
            )}
            <button
              className={rowBtn}
              onClick={
                onQuit ??
                (() => {
                  useGame.getState().toMenu();
                  navigate("/");
                })
              }
            >
              {quitLabel ?? "Quit to menu"}
            </button>
            {allowSaves && !user && (
              <p className="mt-1 text-center text-xs text-slate-500">
                Playing as guest — saves stay on this device.
              </p>
            )}
            {!allowSaves && (
              <p className="mt-1 text-center text-xs text-slate-500">
                Online games can't be saved — the table lives on the server.
              </p>
            )}
          </div>
        )}

        {(tab === "save" || tab === "load") && (
          <div className="flex flex-col gap-3">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-50">
                {tab === "save" ? "Save game" : "Load game"}
              </h2>
              <button className="text-sm text-slate-400 hover:text-slate-200" onClick={() => setTab("main")}>
                ← Back
              </button>
            </div>
            {Array.from({ length: SAVE_SLOTS }, (_, i) => {
              const slot = byIndex(i);
              return (
                <div key={i} className="flex items-center gap-2">
                  <button
                    className={rowBtn}
                    disabled={busy || (tab === "load" && !slot)}
                    onClick={() => (tab === "save" ? doSave(i) : slot && doLoad(slot))}
                  >
                    <span>Slot {i + 1}</span>
                    <span className="text-xs text-slate-400">
                      {slot ? new Date(slot.savedAt).toLocaleString() : "empty"}
                    </span>
                  </button>
                  {slot && (
                    <button
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-uno-red transition hover:bg-white/10"
                      onClick={() => doDelete(i)}
                      aria-label={`Delete slot ${i + 1}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
