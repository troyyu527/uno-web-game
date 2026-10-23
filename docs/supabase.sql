-- Schema for the optional Supabase backend. Run this once in the Supabase
-- SQL editor after creating your project. Auth (email/password) is built in;
-- the player's username is stored in the auth user's metadata at sign-up, so
-- the only table needed is the game saves.

create table if not exists public.game_saves (
  user_id    uuid   not null references auth.users (id) on delete cascade,
  slot_index int    not null,
  name       text   not null,
  saved_at   bigint not null,
  snapshot   jsonb  not null,
  primary key (user_id, slot_index)
);

alter table public.game_saves enable row level security;

-- Each user can only see and modify their own saves.
create policy "own saves - select" on public.game_saves
  for select using (auth.uid() = user_id);
create policy "own saves - insert" on public.game_saves
  for insert with check (auth.uid() = user_id);
create policy "own saves - update" on public.game_saves
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own saves - delete" on public.game_saves
  for delete using (auth.uid() = user_id);
