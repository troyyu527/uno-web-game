import { localBackend } from "./local";
import { cloudflareBackend, hasCloudflare } from "./cloudflare";
import type { Backend, SaveSlot, User } from "./types";

export type { User, SaveSlot, Backend } from "./types";
export { BackendError, BackendNotice } from "./types";

/** The Cloudflare Worker when configured (VITE_API_URL), else localStorage. */
export const backend: Backend = hasCloudflare ? cloudflareBackend : localBackend;
export const backendKind = backend.kind;

/** A pseudo-user so guests can still save/load locally (always via localStorage). */
export const GUEST: User = { id: "guest", username: "Guest", email: "" };

export const SAVE_SLOTS = 3;

/** Guests save to localStorage; logged-in users to the active backend. */
export const savesFor = (user: User | null): { backend: Backend; user: User } =>
  user ? { backend, user } : { backend: localBackend, user: GUEST };

export const listSaves = (user: User | null): Promise<SaveSlot[]> => {
  const t = savesFor(user);
  return t.backend.listSaves(t.user);
};
export const putSave = (user: User | null, slot: SaveSlot): Promise<void> => {
  const t = savesFor(user);
  return t.backend.putSave(t.user, slot);
};
export const deleteSave = (user: User | null, index: number): Promise<void> => {
  const t = savesFor(user);
  return t.backend.deleteSave(t.user, index);
};
