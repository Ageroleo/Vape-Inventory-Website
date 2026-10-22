-- ============================================================
-- Rash Vape Live Inventory - Supabase Schema Setup
-- Paste and run this script in your Supabase SQL Editor:
-- (Supabase Dashboard -> Project -> SQL Editor -> New Query -> Run)
-- ============================================================

-- 1. Create the inventory table
create table if not exists public.vape_inventory (
  id text primary key default 'current',
  data jsonb not null,
  updated_at timestamptz default now()
);

-- 2. Enable Row Level Security (RLS)
alter table public.vape_inventory enable row level security;

-- 3. Allow public read access (so any customer can view live stock)
create policy "Allow public read access"
  on public.vape_inventory
  for select
  using (true);

-- 4. Allow public write access for stock updates
-- (Protected in the frontend by your Staff PIN: 2026)
create policy "Allow public insert"
  on public.vape_inventory
  for insert
  with check (true);

create policy "Allow public update"
  on public.vape_inventory
  for update
  using (true);

-- 5. Enable Supabase Realtime broadcast for instant multi-user syncing
alter publication supabase_realtime add table public.vape_inventory;
