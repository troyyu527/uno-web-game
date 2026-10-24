// Password hashing (PBKDF2-SHA256) and session tokens (HS256 JWT), using only
// Web Crypto so the Worker needs no dependencies.

const enc = new TextEncoder();

/** Workers caps PBKDF2 at 100k iterations. */
const ITERATIONS = 100_000;
const TOKEN_TTL_S = 60 * 60 * 24 * 30; // 30 days

const b64url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromB64url = (s: string): Uint8Array => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

/** `pbkdf2$<iterations>$<salt>$<hash>` — the iteration count travels with the hash. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${b64url(salt)}$${b64url(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iter, salt, hash] = stored.split("$");
  if (scheme !== "pbkdf2" || !iter || !salt || !hash) return false;
  const expected = fromB64url(hash);
  const actual = await pbkdf2(password, fromB64url(salt), Number(iter));
  return actual.byteLength === expected.byteLength && crypto.subtle.timingSafeEqual(actual, expected);
}

export interface TokenUser {
  id: string;
  username: string;
  email: string;
}

const hmacKey = (secret: string) =>
  crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);

export async function signToken(user: TokenUser, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = b64url(
    enc.encode(
      JSON.stringify({ sub: user.id, name: user.username, email: user.email, iat: now, exp: now + TOKEN_TTL_S }),
    ),
  );
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(`${header}.${payload}`));
  return `${header}.${payload}.${b64url(new Uint8Array(sig))}`;
}

/** The token's user, or null if it's malformed, forged or expired. */
export async function verifyToken(token: string, secret: string): Promise<TokenUser | null> {
  const [header, payload, sig] = token.split(".");
  if (!header || !payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      fromB64url(sig),
      enc.encode(`${header}.${payload}`),
    );
    if (!ok) return null;
    const claims = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as {
      sub?: string;
      name?: string;
      email?: string;
      exp?: number;
    };
    if (!claims.sub || !claims.exp || claims.exp * 1000 < Date.now()) return null;
    return { id: claims.sub, username: claims.name ?? "Player", email: claims.email ?? "" };
  } catch {
    return null;
  }
}
