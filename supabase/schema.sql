-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Households
create table households (
  id uuid primary key default gen_random_uuid(),
  name text,
  invite_code text unique,
  created_at timestamptz default now()
);

-- Profiles
create table profiles (
  id uuid primary key references auth.users,
  name text,
  avatar_color text,
  household_id uuid references households(id),
  created_at timestamptz default now()
);

-- Routine blocks
create table routine_blocks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id),
  name text,
  category text,
  person text,
  start_time time,
  duration_minutes int,
  frequency text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Day blocks
create table day_blocks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id),
  profile_id uuid references profiles(id),
  routine_block_id uuid references routine_blocks(id),
  name text,
  category text,
  date date,
  planned_start time,
  actual_start time,
  planned_duration int,
  actual_duration int,
  status text default 'planejado',
  notes text,
  created_at timestamptz default now()
);

-- Sleep logs
create table sleep_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  date date,
  sleep_time time,
  wake_time time,
  quality int,
  created_at timestamptz default now()
);

-- Market items
create table market_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id),
  name text,
  quantity text,
  checked boolean default false,
  added_by uuid references profiles(id),
  checked_by uuid references profiles(id),
  checked_at timestamptz,
  created_at timestamptz default now()
);

-- RLS
alter table households enable row level security;
alter table profiles enable row level security;
alter table routine_blocks enable row level security;
alter table day_blocks enable row level security;
alter table sleep_logs enable row level security;
alter table market_items enable row level security;

-- Policies
create policy "household members" on households for all using (
  id in (select household_id from profiles where id = auth.uid())
);
create policy "own profile" on profiles for all using (id = auth.uid());
create policy "household profiles read" on profiles for select using (
  household_id in (select household_id from profiles where id = auth.uid())
);
create policy "household routine_blocks" on routine_blocks for all using (
  household_id in (select household_id from profiles where id = auth.uid())
);
create policy "household day_blocks" on day_blocks for all using (
  household_id in (select household_id from profiles where id = auth.uid())
);
create policy "own sleep_logs" on sleep_logs for all using (profile_id = auth.uid());
create policy "household market_items" on market_items for all using (
  household_id in (select household_id from profiles where id = auth.uid())
);
