create table if not exists public.packing_items (
  id text primary key,
  trip_id text not null,
  category text not null,
  text text not null,
  done boolean not null default false,
  added_by text,
  checked_by text,
  updated_at timestamptz not null default now()
);

create index if not exists packing_items_trip_id_idx on public.packing_items(trip_id);
alter table public.packing_items enable row level security;

-- Persönliche Reise-App mit nicht erratbarer Projekt-URL/Trip-ID.
-- Für höhere Sicherheit später Supabase Auth aktivieren.
create policy "agger read" on public.packing_items for select to anon using (trip_id = 'agger-2026-marc-anne');
create policy "agger insert" on public.packing_items for insert to anon with check (trip_id = 'agger-2026-marc-anne');
create policy "agger update" on public.packing_items for update to anon using (trip_id = 'agger-2026-marc-anne') with check (trip_id = 'agger-2026-marc-anne');
create policy "agger delete" on public.packing_items for delete to anon using (trip_id = 'agger-2026-marc-anne');

