import { type Backend, type SaveSlot, type User, BackendError } from "./types";

// localStorage-backed auth + saves. Passwords are SHA-256 hashed. This is a
// convenience/offline store, NOT a security boundary — data lives in the
// browser and is per-device. The Supabase adapter is the real backend.

const USERS_KEY = "uno.users";
const SESSION_KEY = "uno.session";
const savesKey = (userId: string) => `uno.saves.${userId}`;

interface StoredUser extends User {
  passwordHash: string;
}

const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const publicUser = (u: StoredUser): User => ({ id: u.id, username: u.username, email: u.email });

export const localBackend: Backend = {
  kind: "local",

  async init() {
    const id = read<string | null>(SESSION_KEY, null);
    if (!id) return null;
    const users = read<Record<string, StoredUser>>(USERS_KEY, {});
    const u = Object.values(users).find((x) => x.id === id);
    return u ? publicUser(u) : null;
  },

  async signUp(username, email, password) {
    const users = read<Record<string, StoredUser>>(USERS_KEY, {});
    const key = email.trim().toLowerCase();
    if (!username.trim() || !key || !password) throw new BackendError("All fields are required.");
    if (users[key]) throw new BackendError("An account with that email already exists.");
    const user: StoredUser = {
      id: crypto.randomUUID(),
      username: username.trim(),
      email: key,
      passwordHash: await sha256(password),
    };
    users[key] = user;
    write(USERS_KEY, users);
    write(SESSION_KEY, user.id);
    return publicUser(user);
  },

  async signIn(email, password) {
    const users = read<Record<string, StoredUser>>(USERS_KEY, {});
    const u = users[email.trim().toLowerCase()];
    if (!u || u.passwordHash !== (await sha256(password))) {
      throw new BackendError("Incorrect email or password.");
    }
    write(SESSION_KEY, u.id);
    return publicUser(u);
  },

  async signOut() {
    localStorage.removeItem(SESSION_KEY);
  },

  async listSaves(user) {
    return read<SaveSlot[]>(savesKey(user.id), []);
  },

  async putSave(user, slot) {
    const saves = read<SaveSlot[]>(savesKey(user.id), []).filter((s) => s.index !== slot.index);
    saves.push(slot);
    saves.sort((a, b) => a.index - b.index);
    write(savesKey(user.id), saves);
  },

  async deleteSave(user, index) {
    const saves = read<SaveSlot[]>(savesKey(user.id), []).filter((s) => s.index !== index);
    write(savesKey(user.id), saves);
  },
};
