import { RoomObject, type Failure, type Member, type Seat } from "./room";
import { hashPassword, signToken, verifyPassword, verifyToken, type TokenUser } from "./auth";

export { RoomObject };

export interface Env {
  DB: D1Database;
  ROOMS: DurableObjectNamespace<RoomObject>;
  /** HMAC key for session tokens — `wrangler secret put JWT_SECRET`. */
  JWT_SECRET: string;
  /** Comma-separated browser origins allowed to call the API ("*" for any). */
  ALLOWED_ORIGINS: string;
}

/**
 * The UNO backend: accounts, cloud saves and online rooms.
 *
 *   GET    /health                    is the server up and migrated?
 *   POST   /auth/signup | /auth/signin → { token, user }
 *   GET    /auth/me                   → { user }
 *   GET    /saves                     → { saves }
 *   PUT    /saves/:index              ← { name, savedAt, snapshot }
 *   DELETE /saves/:index
 *   POST   /rooms                     → { room }  (create)
 *   GET    /rooms/:code               → { room | null }
 *   POST   /rooms/:code/join | leave | claim | start | state
 *   GET    /rooms/:code/socket?token= WebSocket: live room + presence
 *
 * Every route but /health and the sign-up/in pair needs `Authorization: Bearer <token>`.
 */
export default {
  async fetch(request, env): Promise<Response> {
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    let res: Response;
    try {
      res = await route(request, env);
    } catch (e) {
      if (!(e instanceof HttpError)) console.error(e);
      res =
        e instanceof HttpError
          ? json({ error: e.message }, e.status)
          : json({ error: "Something went wrong on the server." }, 500);
    }
    if (res.webSocket) return res;
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(cors)) out.headers.set(k, v);
    return out;
  },
} satisfies ExportedHandler<Env>;

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const NOT_SIGNED_IN = "You're not signed in. Please log in again, then try once more.";
const MAX_BODY = 256 * 1024;
const SAVE_SLOTS = 3;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("Origin");
  const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  if (!origin || !(allowed.includes("*") || allowed.includes(origin))) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

async function body<T>(request: Request): Promise<T> {
  const text = await request.text();
  if (text.length > MAX_BODY) throw new HttpError(413, "That request is too large.");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, "Malformed request.");
  }
}

async function authed(request: Request, env: Env, token?: string | null): Promise<TokenUser> {
  const bearer = token ?? request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  const user = bearer ? await verifyToken(bearer, env.JWT_SECRET) : null;
  if (!user) throw new HttpError(401, NOT_SIGNED_IN);
  return user;
}

const member = (u: TokenUser): Member => ({ userId: u.id, username: u.username });

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const is = (method: string, ...path: string[]) =>
    request.method === method &&
    parts.length === path.length &&
    path.every((p, i) => p === "*" || p === parts[i]);

  if (is("GET", "health")) return health(env);
  if (!env.JWT_SECRET) throw new HttpError(503, "The server is missing its JWT_SECRET.");

  if (is("POST", "auth", "signup")) return signUp(request, env);
  if (is("POST", "auth", "signin")) return signIn(request, env);
  if (is("GET", "auth", "me")) return json({ user: await authed(request, env) });

  if (parts[0] === "saves") {
    const user = await authed(request, env);
    if (is("GET", "saves")) return listSaves(user, env);
    const index = Number(parts[1]);
    if (!Number.isInteger(index) || index < 0 || index >= SAVE_SLOTS) {
      throw new HttpError(400, "No such save slot.");
    }
    if (is("PUT", "saves", "*")) return putSave(user, index, request, env);
    if (is("DELETE", "saves", "*")) return deleteSave(user, index, env);
  }

  if (parts[0] === "rooms") return rooms(request, env, parts.slice(1), url);

  throw new HttpError(404, "Not found.");
}

// --- health -----------------------------------------------------------------

/**
 * Reads the users table, so a pass means the Worker answered *and* the D1
 * schema is really there — an unmigrated database fails here rather than at
 * the first sign-up.
 */
async function health(env: Env): Promise<Response> {
  if (!env.JWT_SECRET) return json({ ok: false, reason: "config", error: "JWT_SECRET is not set." }, 503);
  try {
    await env.DB.prepare("SELECT 1 FROM users LIMIT 1").first();
    return json({ ok: true });
  } catch (e) {
    const missing = /no such table/i.test(String(e));
    return json(
      { ok: false, reason: missing ? "schema" : "db", error: missing ? "Database not migrated." : String(e) },
      503,
    );
  }
}

// --- accounts ---------------------------------------------------------------

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function signUp(request: Request, env: Env): Promise<Response> {
  const b = await body<{ username?: string; email?: string; password?: string }>(request);
  const username = (b.username ?? "").trim();
  const email = (b.email ?? "").trim().toLowerCase();
  const password = b.password ?? "";
  if (!username || !email || !password) throw new HttpError(400, "All fields are required.");
  if (username.length > 24) throw new HttpError(400, "Usernames are at most 24 characters.");
  if (!EMAIL.test(email)) throw new HttpError(400, "That doesn't look like an email address.");
  if (password.length < 6) throw new HttpError(400, "Password should be at least 6 characters.");

  const user: TokenUser = { id: crypto.randomUUID(), username, email };
  try {
    await env.DB.prepare(
      "INSERT INTO users (id, email, username, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(user.id, email, username, await hashPassword(password), Date.now())
      .run();
  } catch (e) {
    if (/UNIQUE/i.test(String(e))) throw new HttpError(409, "An account with that email already exists.");
    throw e;
  }
  return json({ token: await signToken(user, env.JWT_SECRET), user });
}

async function signIn(request: Request, env: Env): Promise<Response> {
  const b = await body<{ email?: string; password?: string }>(request);
  const email = (b.email ?? "").trim().toLowerCase();
  const row = await env.DB.prepare("SELECT id, email, username, password_hash FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: string; email: string; username: string; password_hash: string }>();
  if (!row || !(await verifyPassword(b.password ?? "", row.password_hash))) {
    throw new HttpError(401, "Incorrect email or password.");
  }
  const user: TokenUser = { id: row.id, username: row.username, email: row.email };
  return json({ token: await signToken(user, env.JWT_SECRET), user });
}

// --- saves ------------------------------------------------------------------

async function listSaves(user: TokenUser, env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    "SELECT slot_index, name, saved_at, snapshot FROM game_saves WHERE user_id = ? ORDER BY slot_index",
  )
    .bind(user.id)
    .all<{ slot_index: number; name: string; saved_at: number; snapshot: string }>();
  return json({
    saves: results.map((r) => ({
      index: r.slot_index,
      name: r.name,
      savedAt: r.saved_at,
      snapshot: JSON.parse(r.snapshot),
    })),
  });
}

async function putSave(user: TokenUser, index: number, request: Request, env: Env): Promise<Response> {
  const b = await body<{ name?: string; savedAt?: number; snapshot?: unknown }>(request);
  if (typeof b.name !== "string" || typeof b.savedAt !== "number" || b.snapshot == null) {
    throw new HttpError(400, "Malformed save.");
  }
  await env.DB.prepare(
    `INSERT INTO game_saves (user_id, slot_index, name, saved_at, snapshot) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (user_id, slot_index) DO UPDATE SET
       name = excluded.name, saved_at = excluded.saved_at, snapshot = excluded.snapshot`,
  )
    .bind(user.id, index, b.name.slice(0, 64), b.savedAt, JSON.stringify(b.snapshot))
    .run();
  return json({ ok: true });
}

async function deleteSave(user: TokenUser, index: number, env: Env): Promise<Response> {
  await env.DB.prepare("DELETE FROM game_saves WHERE user_id = ? AND slot_index = ?")
    .bind(user.id, index)
    .run();
  return json({ ok: true });
}

// --- rooms ------------------------------------------------------------------

/**
 * The room's stub, typed as the object's own methods. Workers' generated RPC
 * types choke on the opaque game `state`; at runtime the calls are identical.
 */
type RoomRpc = Pick<RoomObject, "create" | "get" | "join" | "leave" | "claim" | "start" | "pushState" | "fetch">;
const roomStub = (env: Env, code: string) =>
  env.ROOMS.get(env.ROOMS.idFromName(code)) as unknown as RoomRpc;
const randomCode = () => String(1000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000));

/** Unwrap a Durable Object result, turning its failure into an HTTP error. */
function settle<T extends { ok: true }>(r: T | Failure): T {
  if (!r.ok) throw new HttpError(r.status, r.error);
  return r;
}

async function rooms(request: Request, env: Env, parts: string[], url: URL): Promise<Response> {
  const [code, action] = parts;
  const validCode = !!code && /^\d{4}$/.test(code);

  // The browser WebSocket API can't set headers, so the token rides in the URL.
  if (request.method === "GET" && action === "socket" && parts.length === 2) {
    if (request.headers.get("Upgrade") !== "websocket") throw new HttpError(426, "Expected a WebSocket.");
    if (!validCode) return refuseSocket(4404, "No room with that code.");
    const user = await verifyToken(url.searchParams.get("token") ?? "", env.JWT_SECRET);
    if (!user) return refuseSocket(4401, NOT_SIGNED_IN);
    const headers = new Headers(request.headers);
    headers.set("X-User-Id", user.id);
    return roomStub(env, code).fetch(new Request(request.url, { headers }));
  }

  const user = member(await authed(request, env));

  if (request.method === "POST" && parts.length === 0) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const fresh = randomCode();
      const room = await roomStub(env, fresh).create(fresh, user);
      if (room) return json({ room });
    }
    throw new HttpError(503, "Could not create a room — please try again.");
  }

  if (!validCode) throw new HttpError(404, "No room with that code.");
  const stub = roomStub(env, code);

  if (request.method === "GET" && parts.length === 1) return json({ room: await stub.get() });
  if (request.method !== "POST" || parts.length !== 2) throw new HttpError(404, "Not found.");

  switch (action) {
    case "join":
      return json({ room: settle(await stub.join(user)).room });
    case "leave":
      await stub.leave(user);
      return json({ ok: true });
    case "claim": {
      const { seat } = await body<{ seat?: number }>(request);
      if (!Number.isInteger(seat)) throw new HttpError(400, "Pick a seat.");
      return json({ room: settle(await stub.claim(user, seat!)).room });
    }
    case "start": {
      const b = await body<{ seats?: Seat[]; state?: unknown }>(request);
      if (!Array.isArray(b.seats) || b.seats.length !== 4 || b.state == null) {
        throw new HttpError(400, "Malformed start.");
      }
      return json({ room: settle(await stub.start(user, b.seats, b.state)).room });
    }
    case "state": {
      const b = await body<{ state?: unknown; version?: number }>(request);
      if (b.state == null || !Number.isInteger(b.version)) throw new HttpError(400, "Malformed state.");
      return json({ applied: settle(await stub.pushState(user, b.state, b.version!)).applied });
    }
  }
  throw new HttpError(404, "Not found.");
}

/**
 * A failed upgrade looks like a generic network error to the browser, so
 * accept the socket just long enough to say why and hang up with a code the
 * client knows not to retry.
 */
function refuseSocket(code: number, reason: string): Response {
  const [client, server] = Object.values(new WebSocketPair());
  server.accept();
  server.send(JSON.stringify({ type: "error", error: reason }));
  server.close(code, reason);
  return new Response(null, { status: 101, webSocket: client });
}
