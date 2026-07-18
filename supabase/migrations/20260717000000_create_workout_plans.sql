-- Forge: workout_plans and exercises
-- Run via Supabase CLI: supabase db push

-- ---------------------------------------------------------------------------
-- workout_plans
-- ---------------------------------------------------------------------------
create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists workout_plans_user_id_idx
  on public.workout_plans (user_id);

alter table public.workout_plans enable row level security;

create policy "Users can view own workout plans"
  on public.workout_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own workout plans"
  on public.workout_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workout plans"
  on public.workout_plans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own workout plans"
  on public.workout_plans for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- exercises
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references public.workout_plans (id) on delete cascade,
  exercise_name text not null,
  sets integer not null,
  reps text not null,
  created_at timestamptz not null default now()
);

create index if not exists exercises_workout_plan_id_idx
  on public.exercises (workout_plan_id);

alter table public.exercises enable row level security;

create policy "Users can view exercises on own workout plans"
  on public.exercises for select
  using (
    exists (
      select 1
      from public.workout_plans
      where public.workout_plans.id = workout_plan_id
        and public.workout_plans.user_id = auth.uid()
    )
  );

create policy "Users can insert exercises on own workout plans"
  on public.exercises for insert
  with check (
    exists (
      select 1
      from public.workout_plans
      where public.workout_plans.id = workout_plan_id
        and public.workout_plans.user_id = auth.uid()
    )
  );

create policy "Users can update exercises on own workout plans"
  on public.exercises for update
  using (
    exists (
      select 1
      from public.workout_plans
      where public.workout_plans.id = workout_plan_id
        and public.workout_plans.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.workout_plans
      where public.workout_plans.id = workout_plan_id
        and public.workout_plans.user_id = auth.uid()
    )
  );

create policy "Users can delete exercises on own workout plans"
  on public.exercises for delete
  using (
    exists (
      select 1
      from public.workout_plans
      where public.workout_plans.id = workout_plan_id
        and public.workout_plans.user_id = auth.uid()
    )
  );
