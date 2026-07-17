-- Forge: profiles table (Phase 1)
-- Run via Supabase CLI: supabase db push

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  age integer,
  height integer,
  weight decimal,
  goal text check (goal is null or goal in ('build_muscle', 'lose_fat', 'maintain')),
  experience text check (experience is null or experience in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);
