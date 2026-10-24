-- D1 schema for the Cloudflare backend. Safe to re-run.
--   local:  npm run db:migrate:local
--   remote: npm run db:migrate
--
-- Rooms don't live here — each room is its own Durable Object (see room.ts).

CREATE TABLE IF NOT EXISTS users (
  id            TEXT    PRIMARY KEY,
  email         TEXT    NOT NULL UNIQUE,   -- stored lower-cased
  username      TEXT    NOT NULL,
  password_hash TEXT    NOT NULL,          -- pbkdf2$<iterations>$<salt>$<hash>
  created_at    INTEGER NOT NULL           -- epoch ms
);

CREATE TABLE IF NOT EXISTS game_saves (
  user_id    TEXT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL,
  name       TEXT    NOT NULL,
  saved_at   INTEGER NOT NULL,             -- epoch ms
  snapshot   TEXT    NOT NULL,             -- JSON
  PRIMARY KEY (user_id, slot_index)
);
