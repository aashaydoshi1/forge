-- Phase 1: Update profiles schema for onboarding fields
-- Safe to run after Phase 0 migration

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

alter table public.profiles drop column if exists display_name;
alter table public.profiles drop column if exists avatar_url;
alter table public.profiles drop column if exists units;
alter table public.profiles drop column if exists experience_level;
alter table public.profiles drop column if exists updated_at;

alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists age integer;
alter table public.profiles add column if not exists height integer;
alter table public.profiles add column if not exists weight decimal;
alter table public.profiles add column if not exists goal text
  check (goal is null or goal in ('build_muscle', 'lose_fat', 'maintain'));
alter table public.profiles add column if not exists experience text
  check (experience is null or experience in ('beginner', 'intermediate', 'advanced'));
