import { create } from "zustand";
import { supabase } from "@/lib/backend/supabase";

export type ServerStatus = "checking" | "online" | "offline" | "unconfigured";

/** How long to wait for the server before calling it unreachable. */
const TIMEOUT_MS = 6000;

/**
 * "That table isn't there." PostgREST answers from its schema cache
 * (PGRST205); 42P01 is Postgres' own undefined_table, in case the request ever
 * gets far enough to hit it.
 */
const MISSING_TABLE = new Set(["PGRST205", "42P01"]);

interface ServerStore {
  status: ServerStatus;
  /** Why, in words the player can act on. */
  detail: string;
  check: () => Promise<void>;
}

/**
 * Whether the multiplayer backend is actually reachable — which is a different
 * question from whether it's configured. The probe reads the rooms table, so a
 * pass means the server answered *and* the multiplayer schema is really there;
 * a project that was never migrated fails here rather than at "Create a room".
 */
export const useServer = create<ServerStore>((set) => ({
  status: supabase ? "checking" : "unconfigured",
  detail: supabase ? "Checking the server…" : "Online play needs Supabase keys in .env.",

  check: async () => {
    if (!supabase) {
      set({ status: "unconfigured", detail: "Online play needs Supabase keys in .env." });
      return;
    }
    set({ status: "checking", detail: "Checking the server…" });

    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
    try {
      // Anonymous readers see no rows through RLS, so an empty result is the
      // success case — we only care that the request completed.
      const { error } = await supabase
        .from("rooms")
        .select("code")
        .limit(1)
        .abortSignal(abort.signal);

      if (!error) {
        set({ status: "online", detail: "Connected — online play is available." });
      } else if (MISSING_TABLE.has(error.code)) {
        // Reached the server, but this project was never migrated.
        set({
          status: "offline",
          detail: "Server is up, but the rooms table is missing — run docs/supabase-rooms.sql.",
        });
      } else {
        set({ status: "offline", detail: `Server rejected the check: ${error.message}` });
      }
    } catch {
      set({ status: "offline", detail: "Can't reach the server — check your connection." });
    } finally {
      clearTimeout(timer);
    }
  },
}));

/** True only when a game can actually be hosted or joined. */
export const canPlayOnline = (s: ServerStatus) => s === "online";
