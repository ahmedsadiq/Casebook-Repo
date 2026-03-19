-- =============================================================
-- Tasks: personal to-do items (Google Keep-style)
-- =============================================================

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  due_date    date,
  completed   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks(user_id);

alter table public.tasks enable row level security;

create policy "tasks: select own"
  on public.tasks for select
  using (user_id = auth.uid());

create policy "tasks: insert own"
  on public.tasks for insert
  with check (user_id = auth.uid());

create policy "tasks: update own"
  on public.tasks for update
  using (user_id = auth.uid());

create policy "tasks: delete own"
  on public.tasks for delete
  using (user_id = auth.uid());

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();
