import { create } from "zustand";
import { api, ApiError, API_URL } from "@/lib/api";

export type ServerStatus = "checking" | "online" | "offline" | "unconfigured";

/** How long to wait for the server before calling it unreachable. */
const TIMEOUT_MS = 6000;

const UNCONFIGURED = "Online play needs the server URL (VITE_API_URL) in .env.";

interface ServerStore {
  status: ServerStatus;
  /** Why, in words the player can act on. */
  detail: string;
  check: () => Promise<void>;
}

/**
 * Whether the multiplayer backend is actually reachable — which is a different
 * question from whether it's configured. The Worker's /health reads the
 * database, so a pass means the server answered *and* its schema is really
 * there; a database that was never migrated fails here rather than at sign-up.
 */
export const useServer = create<ServerStore>((set) => ({
  status: API_URL ? "checking" : "unconfigured",
  detail: API_URL ? "Checking the server…" : UNCONFIGURED,

  check: async () => {
    if (!API_URL) {
      set({ status: "unconfigured", detail: UNCONFIGURED });
      return;
    }
    set({ status: "checking", detail: "Checking the server…" });

    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
    try {
      await api("/health", { signal: abort.signal });
      set({ status: "online", detail: "Connected — online play is available." });
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      if (status === 0) {
        set({ status: "offline", detail: "Can't reach the server — check your connection." });
      } else if (e instanceof ApiError && /not migrated/i.test(e.message)) {
        // Reached the server, but its database was never set up.
        set({
          status: "offline",
          detail: "Server is up, but its database is missing tables — run `npm run db:migrate`.",
        });
      } else {
        set({ status: "offline", detail: `Server rejected the check: ${(e as Error).message}` });
      }
    } finally {
      clearTimeout(timer);
    }
  },
}));

/** True only when a game can actually be hosted or joined. */
export const canPlayOnline = (s: ServerStatus) => s === "online";
