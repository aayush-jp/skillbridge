-- ─────────────────────────────────────────────────────────────────────────────
-- 001_initial_schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Tables ───────────────────────────────────────────────────────────────────

create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create table public.target_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  domain      text not null,
  role        text not null,
  created_at  timestamptz not null default now()
);

create table public.resumes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  file_name   text,
  file_url    text,
  raw_text    text,
  created_at  timestamptz not null default now()
);

create table public.skill_gap_reports (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  resume_id         uuid references public.resumes(id) on delete set null,
  target_role_id    uuid references public.target_roles(id) on delete set null,
  readiness_score   integer check (readiness_score between 0 and 100),
  skills_present    jsonb,
  skills_missing    jsonb,
  raw_ai_response   text,
  created_at        timestamptz not null default now()
);

create table public.learning_paths (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  report_id   uuid references public.skill_gap_reports(id) on delete set null,
  modules     jsonb,
  created_at  timestamptz not null default now()
);

create table public.progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  module_id     text,
  completed     boolean not null default false,
  score         integer,
  completed_at  timestamptz
);

-- ── Indexes on foreign keys ───────────────────────────────────────────────────

create index on public.target_roles    (user_id);
create index on public.resumes         (user_id);
create index on public.skill_gap_reports (user_id);
create index on public.skill_gap_reports (resume_id);
create index on public.skill_gap_reports (target_role_id);
create index on public.learning_paths  (user_id);
create index on public.learning_paths  (report_id);
create index on public.progress        (user_id);
create index on public.progress        (module_id);

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.profiles           enable row level security;
alter table public.target_roles       enable row level security;
alter table public.resumes            enable row level security;
alter table public.skill_gap_reports  enable row level security;
alter table public.learning_paths     enable row level security;
alter table public.progress           enable row level security;

-- profiles (pk is the user id, not a separate user_id column)
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- target_roles
create policy "target_roles: select own"
  on public.target_roles for select
  using (auth.uid() = user_id);

create policy "target_roles: insert own"
  on public.target_roles for insert
  with check (auth.uid() = user_id);

create policy "target_roles: update own"
  on public.target_roles for update
  using (auth.uid() = user_id);

create policy "target_roles: delete own"
  on public.target_roles for delete
  using (auth.uid() = user_id);

-- resumes
create policy "resumes: select own"
  on public.resumes for select
  using (auth.uid() = user_id);

create policy "resumes: insert own"
  on public.resumes for insert
  with check (auth.uid() = user_id);

create policy "resumes: update own"
  on public.resumes for update
  using (auth.uid() = user_id);

create policy "resumes: delete own"
  on public.resumes for delete
  using (auth.uid() = user_id);

-- skill_gap_reports
create policy "skill_gap_reports: select own"
  on public.skill_gap_reports for select
  using (auth.uid() = user_id);

create policy "skill_gap_reports: insert own"
  on public.skill_gap_reports for insert
  with check (auth.uid() = user_id);

create policy "skill_gap_reports: update own"
  on public.skill_gap_reports for update
  using (auth.uid() = user_id);

create policy "skill_gap_reports: delete own"
  on public.skill_gap_reports for delete
  using (auth.uid() = user_id);

-- learning_paths
create policy "learning_paths: select own"
  on public.learning_paths for select
  using (auth.uid() = user_id);

create policy "learning_paths: insert own"
  on public.learning_paths for insert
  with check (auth.uid() = user_id);

create policy "learning_paths: update own"
  on public.learning_paths for update
  using (auth.uid() = user_id);

create policy "learning_paths: delete own"
  on public.learning_paths for delete
  using (auth.uid() = user_id);

-- progress
create policy "progress: select own"
  on public.progress for select
  using (auth.uid() = user_id);

create policy "progress: insert own"
  on public.progress for insert
  with check (auth.uid() = user_id);

create policy "progress: update own"
  on public.progress for update
  using (auth.uid() = user_id);

create policy "progress: delete own"
  on public.progress for delete
  using (auth.uid() = user_id);

-- ── Auto-create profile on sign-up ───────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
