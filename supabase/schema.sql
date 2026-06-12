-- =====================================================================
--  Ma Cave Virtuelle — schéma Supabase
--  À exécuter une fois dans le SQL Editor de votre projet Supabase
--  (Dashboard > SQL Editor > New query > coller > Run).
--  Idempotent : peut être ré-exécuté sans danger.
-- =====================================================================

-- --- Tables -----------------------------------------------------------

create table if not exists public.storage_units (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists public.bottles (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name           text not null default '',
  producer       text,
  winemaker      text,
  vintage        integer,
  color          text,
  country        text,
  region         text,
  sub_region     text,
  appellation    text,
  grapes         text,
  cuvee          text,
  quantity       integer not null default 0,
  format         text,
  purchase_date  date,
  purchase_price numeric,
  storage_unit_id uuid references public.storage_units (id) on delete set null,
  location       text,
  drink_from     integer,
  drink_to       integer,
  occasion       text,
  rating         numeric,
  rating_scale   text,
  rating_count   integer,
  rating_source  text,
  notes          text,
  photo_url      text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  bottle_id   uuid,
  name        text not null default '',
  producer    text,
  vintage     integer,
  color       text,
  country     text,
  region      text,
  appellation text,
  grapes      text,
  date        date not null default current_date,
  rating      integer,
  notes       text,
  meal        text,
  photo_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists bottles_user_idx on public.bottles (user_id);
create index if not exists history_user_idx on public.history (user_id);
create index if not exists units_user_idx on public.storage_units (user_id);

-- --- Row Level Security : chaque utilisateur ne voit que ses lignes ---

alter table public.bottles       enable row level security;
alter table public.storage_units enable row level security;
alter table public.history       enable row level security;

drop policy if exists "own bottles" on public.bottles;
create policy "own bottles" on public.bottles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own units" on public.storage_units;
create policy "own units" on public.storage_units
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own history" on public.history;
create policy "own history" on public.history
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --- Stockage des photos d'étiquettes / dégustations ------------------

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos public read" on storage.objects;
create policy "photos public read" on storage.objects
  for select using (bucket_id = 'photos');

drop policy if exists "photos auth insert" on storage.objects;
create policy "photos auth insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos');

drop policy if exists "photos auth update" on storage.objects;
create policy "photos auth update" on storage.objects
  for update to authenticated using (bucket_id = 'photos');

drop policy if exists "photos auth delete" on storage.objects;
create policy "photos auth delete" on storage.objects
  for delete to authenticated using (bucket_id = 'photos');
