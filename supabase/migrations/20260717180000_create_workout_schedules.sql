-- Forge: workout_schedules (weekly plan assignments)
-- Run via Supabase CLI: supabase db push

create table if not exists public.workout_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  workout_plan_id uuid references public.workout_plans (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, day_of_week)
);

create index if not exists workout_schedules_user_id_idx
  on public.workout_schedules (user_id);

create index if not exists workout_schedules_workout_plan_id_idx
  on public.workout_schedules (workout_plan_id);

alter table public.workout_schedules enable row level security;

create policy "Users can view own workout schedules"
  on public.workout_schedules for select
  using (auth.uid() = user_id);

create policy "Users can insert own workout schedules"
  on public.workout_schedules for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workout schedules"
  on public.workout_schedules for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own workout schedules"
  on public.workout_schedules for delete
  using (auth.uid() = user_id);
