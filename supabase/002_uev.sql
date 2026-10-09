-- FC Trading: ÜV-Liste (Spieler, die du überteuert anbieten willst)
-- Im Supabase-Dashboard unter "SQL Editor" einfügen und mit "Run" ausführen.
-- Das Skript kann bei Bedarf ein zweites Mal laufen, ohne etwas doppelt anzulegen.

create table if not exists public.uev_players (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  player_name     text not null check (char_length(btrim(player_name)) > 0),
  rating          int check (rating between 1 and 99),
  club            text not null default '',
  -- Wird eine Version gelöscht, bleibt der Spieler in der Liste, nur ohne Version
  card_version_id uuid references public.card_versions (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists uev_players_user_idx on public.uev_players (user_id, created_at desc);

alter table public.uev_players enable row level security;
grant select, insert, update, delete on public.uev_players to authenticated;

drop policy if exists uev_all on public.uev_players;
create policy uev_all on public.uev_players for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
