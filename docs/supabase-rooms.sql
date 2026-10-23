-- Multiplayer rooms. Run once in the Supabase SQL editor (after supabase.sql).
--
-- Trust-based: the full game lives in `state` and any signed-in user can update
-- the room. Turn order and move legality are enforced client-side, which is the
-- right trade for a game you play with friends — a modified client could cheat.
--
-- Clients coordinate on `version`: it must strictly increase, so a straggling
-- write can never overwrite a fresher state. Realtime pushes each new state to
-- every client; player presence rides on a Realtime channel and needs no table.

create table if not exists public.rooms (
  code       text        primary key,                 -- 4-digit join code
  host_id    uuid        not null references auth.users (id) on delete cascade,
  status     text        not null default 'lobby',     -- lobby | playing | finished
  players    jsonb       not null default '[]'::jsonb,  -- [{ userId, username }]
  seats      jsonb,                                     -- [{ userId|null, username, isAI }] once started
  state      jsonb,                                     -- full game blob while playing
  version    bigint      not null default 0,            -- bumps on every state write (ordering)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

-- Any signed-in user can look up a room (needed to join by code).
create policy "rooms - select" on public.rooms
  for select to authenticated using (true);

-- Create a room you host.
create policy "rooms - insert" on public.rooms
  for insert to authenticated with check (auth.uid() = host_id);

-- Trust-based: any signed-in user can update a room (join, play a move, start).
create policy "rooms - update" on public.rooms
  for update to authenticated using (true) with check (true);

-- The host can delete their room.
create policy "rooms - delete" on public.rooms
  for delete to authenticated using (auth.uid() = host_id);

-- Push row changes to subscribed clients (Supabase Realtime).
alter publication supabase_realtime add table public.rooms;
