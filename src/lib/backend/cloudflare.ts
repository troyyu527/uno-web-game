import { api, ApiError, getToken, setToken, API_URL } from "../api";
import type { Backend, SaveSlot, User } from "./types";

export const hasCloudflare = API_URL !== null;

// The signed-in user, cached so a session survives a moment offline.
const USER_KEY = "uno.api.user";

const cachedUser = (): User | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

const remember = ({ token, user }: { token: string; user: User }): User => {
  setToken(token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
};

const forget = () => {
  setToken(null);
  localStorage.removeItem(USER_KEY);
};

export const cloudflareBackend: Backend = {
  kind: "cloudflare",

  async init() {
    if (!getToken()) return null;
    try {
      const { user } = await api<{ user: User }>("/auth/me");
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch (e) {
      // Only a rejected token ends the session; an unreachable server doesn't.
      if (e instanceof ApiError && e.status === 401) {
        forget();
        return null;
      }
      return cachedUser();
    }
  },

  async signUp(username, email, password) {
    return remember(
      await api("/auth/signup", { method: "POST", body: { username, email, password } }),
    );
  },

  async signIn(email, password) {
    return remember(await api("/auth/signin", { method: "POST", body: { email, password } }));
  },

  async signOut() {
    // Tokens are stateless, so signing out is just dropping ours.
    forget();
  },

  async listSaves() {
    const { saves } = await api<{ saves: SaveSlot[] }>("/saves");
    return saves;
  },

  async putSave(_user, slot) {
    await api(`/saves/${slot.index}`, {
      method: "PUT",
      body: { name: slot.name, savedAt: slot.savedAt, snapshot: slot.snapshot },
    });
  },

  async deleteSave(_user, index) {
    await api(`/saves/${index}`, { method: "DELETE" });
  },
};
