-- FC Trading: Datenbank einrichten
-- Im Supabase-Dashboard unter "SQL Editor" einfügen und mit "Run" ausführen.
-- Das Skript kann bei Bedarf ein zweites Mal laufen, ohne etwas doppelt anzulegen.

-- 1) Tabellen ------------------------------------------------------------

create table if not exists public.card_versions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete cascade,  -- NULL = Standardversion für alle
  name       text not null check (char_length(btrim(name)) between 1 and 40),
  color      text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.trades (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  player_name     text not null check (char_length(btrim(player_name)) > 0),
  card_version_id uuid references public.card_versions (id),
  rating          int check (rating between 1 and 99),
  chemstyle       text not null default 'Keiner',
  buy_price       bigint not null check (buy_price >= 0),
  bid_price       bigint check (bid_price >= 0),
  buy_now_price   bigint check (buy_now_price >= 0),
  status          text not null default 'listed' check (status in ('listed', 'sold')),
  sold_price      bigint check (sold_price >= 0),
  sold_type       text check (sold_type in ('buy_now', 'bid')),
  sold_at         timestamptz,
  created_at      timestamptz not null default now(),
  -- ein verkaufter Spieler braucht Preis, Art und Zeitpunkt
  check (status = 'listed' or (sold_price is not null and sold_type is not null and sold_at is not null))
);

-- Standardversionen dürfen nur einmal existieren
create unique index if not exists card_versions_default_name_idx
  on public.card_versions (name) where user_id is null;

create index if not exists card_versions_user_idx on public.card_versions (user_id);
create index if not exists trades_user_status_idx on public.trades (user_id, status, created_at desc);

-- 2) Standardversionen ---------------------------------------------------

insert into public.card_versions (user_id, name, color) values
  (null, 'Gold',             '#E5B93C'),
  (null, 'Icon',             '#F1E4B3'),
  (null, 'Hero',             '#A78BFA'),
  (null, 'Team of the Week', '#475569')
on conflict (name) where user_id is null do nothing;

-- 3) Zugriffsschutz (Row Level Security) ---------------------------------

alter table public.card_versions enable row level security;
alter table public.trades        enable row level security;

grant select, insert, update, delete on public.card_versions to authenticated;
grant select, insert, update, delete on public.trades        to authenticated;

drop policy if exists versions_select on public.card_versions;
drop policy if exists versions_insert on public.card_versions;
drop policy if exists versions_update on public.card_versions;
drop policy if exists versions_delete on public.card_versions;
drop policy if exists trades_all      on public.trades;

-- Standardversionen (user_id ist NULL) sind für alle lesbar, aber nicht änderbar
create policy versions_select on public.card_versions for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));
create policy versions_insert on public.card_versions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy versions_update on public.card_versions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy versions_delete on public.card_versions for delete to authenticated
  using (user_id = (select auth.uid()));

-- Trades: jeder sieht und ändert nur die eigenen
create policy trades_all on public.trades for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 4) "Konto und alle Daten löschen" ---------------------------------------
-- Löscht den eigenen Login. Trades und eigene Versionen verschwinden automatisch mit.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
