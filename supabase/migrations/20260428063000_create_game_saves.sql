create schema if not exists core;
create schema if not exists walk_the_world;
create schema if not exists walkerbucks;
create schema if not exists walker_world_discord;

grant usage on schema walk_the_world to anon, authenticated;

create table if not exists walk_the_world.game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_version integer not null,
  save_payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table walk_the_world.game_saves enable row level security;

grant select, insert, update on walk_the_world.game_saves to authenticated;

drop policy if exists "Players can read their own game save" on walk_the_world.game_saves;
create policy "Players can read their own game save"
on walk_the_world.game_saves
for select
using (auth.uid() = user_id);

drop policy if exists "Players can insert their own game save" on walk_the_world.game_saves;
create policy "Players can insert their own game save"
on walk_the_world.game_saves
for insert
with check (auth.uid() = user_id);

drop policy if exists "Players can update their own game save" on walk_the_world.game_saves;
create policy "Players can update their own game save"
on walk_the_world.game_saves
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
