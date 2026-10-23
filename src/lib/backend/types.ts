import type { Snapshot } from "@/store/gameStore";

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface SaveSlot {
  index: number; // 0-based slot
  name: string;
  savedAt: number; // epoch ms
  snapshot: Snapshot;
}

/**
 * Everything the app needs from a backend. Two adapters implement it — a
 * localStorage one (always available) and a Supabase one (used when the
 * VITE_SUPABASE_* env vars are set). The app only ever talks to this interface.
 */
export interface Backend {
  readonly kind: "local" | "supabase";

  /** Restore an existing session, if any. */
  init(): Promise<User | null>;
  signUp(username: string, email: string, password: string): Promise<User>;
  signIn(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;

  listSaves(user: User): Promise<SaveSlot[]>;
  putSave(user: User, slot: SaveSlot): Promise<void>;
  deleteSave(user: User, index: number): Promise<void>;
}

export class BackendError extends Error {}

/**
 * The operation succeeded but can't finish here — e.g. Supabase created the
 * account and is waiting on an emailed confirmation. It travels the same path
 * as an error because it interrupts the flow, but it is good news and must not
 * be shown as a failure.
 */
export class BackendNotice extends BackendError {}
