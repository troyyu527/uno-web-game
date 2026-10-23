import { create } from "zustand";
import { backend, BackendError, BackendNotice, type User } from "@/lib/backend";

interface AuthStore {
  user: User | null;
  ready: boolean;
  loading: boolean;
  error: string | null;
  /** Good news that still stops the flow — e.g. "confirm your email". */
  notice: string | null;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (username: string, email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const message = (e: unknown) =>
  e instanceof BackendError ? e.message : "Something went wrong. Please try again.";

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  ready: false,
  loading: false,
  error: null,
  notice: null,

  init: async () => {
    try {
      const user = await backend.init();
      set({ user, ready: true });
    } catch {
      set({ ready: true });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null, notice: null });
    try {
      const user = await backend.signIn(email, password);
      set({ user, loading: false });
      return true;
    } catch (e) {
      set({ error: message(e), loading: false });
      return false;
    }
  },

  signUp: async (username, email, password) => {
    set({ loading: true, error: null, notice: null });
    try {
      const user = await backend.signUp(username, email, password);
      set({ user, loading: false });
      return true;
    } catch (e) {
      // "Confirm your email" means the account exists — say so in those terms
      // rather than colouring a successful sign-up as a failure.
      if (e instanceof BackendNotice) set({ notice: e.message, loading: false });
      else set({ error: message(e), loading: false });
      return false;
    }
  },

  signOut: async () => {
    await backend.signOut();
    set({ user: null });
  },

  clearError: () => set({ error: null, notice: null }),
}));
