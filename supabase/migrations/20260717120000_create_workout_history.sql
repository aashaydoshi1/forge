-- Forge: workout_sessions and completed_sets (workout history)
-- Run via Supabase CLI: supabase db push

-- ---------------------------------------------------------------------------
-- workout_sessions
-- ---------------------------------------------------------------------------
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_plan_id uuid not null references public.workout_plans (id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists workout_sessions_user_id_idx
  on public.workout_sessions (user_id);

create index if not exists workout_sessions_workout_plan_id_idx
  on public.workout_sessions (workout_plan_id);

alter table public.workout_sessions enable row level security;

create policy "Users can view own workout sessions"
  on public.workout_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own workout sessions"
  on public.workout_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workout sessions"
  on public.workout_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own workout sessions"
  on public.workout_sessions for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- completed_sets
-- ---------------------------------------------------------------------------
create table if not exists public.completed_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  weight numeric,
  reps integer not null,
  set_number integer not null,
  created_at timestamptz not null default now()
);

create index if not exists completed_sets_session_id_idx
  on public.completed_sets (session_id);

create index if not exists completed_sets_exercise_id_idx
  on public.completed_sets (exercise_id);

alter table public.completed_sets enable row level security;

create policy "Users can view completed sets on own sessions"
  on public.completed_sets for select
  using (
    exists (
      select 1
      from public.workout_sessions
      where public.workout_sessions.id = session_id
        and public.workout_sessions.user_id = auth.uid()
    )
  );

create policy "Users can insert completed sets on own sessions"
  on public.completed_sets for insert
  with check (
    exists (
      select 1
      from public.workout_sessions
      where public.workout_sessions.id = session_id
        and public.workout_sessions.user_id = auth.uid()
    )
  );

create policy "Users can update completed sets on own sessions"
  on public.completed_sets for update
  using (
    exists (
      select 1
      from public.workout_sessions
      where public.workout_sessions.id = session_id
        and public.workout_sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.workout_sessions
      where public.workout_sessions.id = session_id
        and public.workout_sessions.user_id = auth.uid()
    )
  );

create policy "Users can delete completed sets on own sessions"
  on public.completed_sets for delete
  using (
    exists (
      select 1
      from public.workout_sessions
      where public.workout_sessions.id = session_id
        and public.workout_sessions.user_id = auth.uid()
    )
  );
