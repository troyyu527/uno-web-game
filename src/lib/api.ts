import { BackendError } from "./backend/types";

/**
 * Base URL of the Cloudflare Worker (VITE_API_URL), or null when it isn't
 * configured — in which case the app runs on the localStorage backend and
 * online play is unavailable.
 */
export const API_URL =
  ((import.meta.env.VITE_API_URL as string | undefined) ?? "").trim().replace(/\/+$/, "") || null;

const TOKEN_KEY = "uno.api.token";

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string | null) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

/** A failed API call. `status` is 0 when the server couldn't be reached at all. */
export class ApiError extends BackendError {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** JSON request to the Worker, signed with the session token when there is one. */
export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  if (!API_URL) throw new ApiError(0, "Online play needs the server URL (VITE_API_URL) in .env.");
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: init.signal,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server — check your connection.");
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Server error (${res.status}).`);
  return data as T;
}

/** WebSocket URL for `path`, carrying the token (browsers can't set socket headers). */
export function socketUrl(path: string): string {
  const url = new URL(API_URL + path);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("token", getToken() ?? "");
  return url.toString();
}
