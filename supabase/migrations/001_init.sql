-- =============================================================
-- Casebook — Complete schema
-- Run this once in your Supabase SQL Editor
-- =============================================================

-- -------------------------------------------------------
-- PROFILES
-- -------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  email        text,
  phone        text,
  role         text not null default 'advocate'
                 constraint profiles_role_check check (role in ('advocate','associate','client')),
  advocate_id  uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Profiles: advocates see themselves + their associates/clients
create policy "profiles: select own or own team"
  on public.profiles for select
  using (
    auth.uid() = id
    or advocate_id = auth.uid()
    or (
      -- Associates and clients can see their advocate's profile
      id = (select advocate_id from public.profiles where id = auth.uid() limit 1)
    )
    or (
      -- Associates can see sibling associates (same advocate)
      advocate_id = (select advocate_id from public.profiles where id = auth.uid() limit 1)
      and advocate_id is not null
    )
  );

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- -------------------------------------------------------
-- CASES
-- -------------------------------------------------------
create table if not exists public.cases (
  id                uuid primary key default gen_random_uuid(),
  advocate_id       uuid not null references auth.users(id) on delete cascade,
  client_id         uuid references auth.users(id) on delete set null,
  title             text not null,
  description       text,
  status            text not null default 'open'
                      constraint cases_status_check check (status in ('open','pending','closed')),
  case_number       text,
  court             text,
  next_hearing_date date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists cases_advocate_id_idx on public.cases(advocate_id);
create index if not exists cases_client_id_idx   on public.cases(client_id);

alter table public.cases enable row level security;

-- Advocate: full access to own cases
create policy "cases: advocate full access"
  on public.cases for all
  using (advocate_id = auth.uid())
  with check (advocate_id = auth.uid());

-- Associate: can view and update cases belonging to their advocate
create policy "cases: associate view"
  on public.cases for select
  using (
    advocate_id = (select advocate_id from public.profiles where id = auth.uid() and role = 'associate' limit 1)
  );

create policy "cases: associate update"
  on public.cases for update
  using (
    advocate_id = (select advocate_id from public.profiles where id = auth.uid() and role = 'associate' limit 1)
  );

-- Client: can only view their own cases
create policy "cases: client view own"
  on public.cases for select
  using (client_id = auth.uid());

-- -------------------------------------------------------
-- CASE UPDATES
-- -------------------------------------------------------
create table if not exists public.case_updates (
  id           uuid primary key default gen_random_uuid(),
  case_id      uuid not null references public.cases(id) on delete cascade,
  author_id    uuid not null references auth.users(id) on delete cascade,
  content      text not null,
  hearing_date date,
  created_at   timestamptz not null default now()
);

create index if not exists case_updates_case_id_idx on public.case_updates(case_id);

alter table public.case_updates enable row level security;

create policy "case_updates: advocate full access"
  on public.case_updates for all
  using (
    exists (select 1 from public.cases where id = case_id and advocate_id = auth.uid())
  )
  with check (
    exists (select 1 from public.cases where id = case_id and advocate_id = auth.uid())
  );

create policy "case_updates: associate insert and view"
  on public.case_updates for select
  using (
    exists (
      select 1 from public.cases c
      join public.profiles p on p.id = auth.uid() and p.role = 'associate'
      where c.id = case_id and c.advocate_id = p.advocate_id
    )
  );

create policy "case_updates: associate insert"
  on public.case_updates for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.cases c
      join public.profiles p on p.id = auth.uid() and p.role = 'associate'
      where c.id = case_id and c.advocate_id = p.advocate_id
    )
  );

create policy "case_updates: client view own"
  on public.case_updates for select
  using (
    exists (select 1 from public.cases where id = case_id and client_id = auth.uid())
  );

-- -------------------------------------------------------
-- PAYMENTS
-- -------------------------------------------------------
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  case_id      uuid not null references public.cases(id) on delete cascade,
  advocate_id  uuid not null references auth.users(id) on delete cascade,
  description  text not null,
  amount       numeric(12,2) not null check (amount >= 0),
  due_date     date,
  status       text not null default 'pending'
                 constraint payments_status_check check (status in ('pending','paid','overdue')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists payments_case_id_idx     on public.payments(case_id);
create index if not exists payments_advocate_id_idx on public.payments(advocate_id);

alter table public.payments enable row level security;

create policy "payments: advocate full access"
  on public.payments for all
  using (advocate_id = auth.uid())
  with check (advocate_id = auth.uid());

create policy "payments: client view own"
  on public.payments for select
  using (
    exists (select 1 from public.cases where id = case_id and client_id = auth.uid())
  );

-- -------------------------------------------------------
-- CASE DOCUMENTS
-- -------------------------------------------------------
create table if not exists public.case_documents (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references public.cases(id) on delete cascade,
  uploader_id   uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  storage_path  text not null,
  size_bytes    bigint,
  created_at    timestamptz not null default now()
);

create index if not exists case_documents_case_id_idx on public.case_documents(case_id);

alter table public.case_documents enable row level security;

create policy "case_documents: advocate full access"
  on public.case_documents for all
  using (
    exists (select 1 from public.cases where id = case_id and advocate_id = auth.uid())
  )
  with check (
    exists (select 1 from public.cases where id = case_id and advocate_id = auth.uid())
  );

create policy "case_documents: associate insert and view"
  on public.case_documents for select
  using (
    exists (
      select 1 from public.cases c
      join public.profiles p on p.id = auth.uid() and p.role = 'associate'
      where c.id = case_id and c.advocate_id = p.advocate_id
    )
  );

create policy "case_documents: associate insert"
  on public.case_documents for insert
  with check (
    uploader_id = auth.uid()
    and exists (
      select 1 from public.cases c
      join public.profiles p on p.id = auth.uid() and p.role = 'associate'
      where c.id = case_id and c.advocate_id = p.advocate_id
    )
  );

create policy "case_documents: client view own"
  on public.case_documents for select
  using (
    exists (select 1 from public.cases where id = case_id and client_id = auth.uid())
  );

-- -------------------------------------------------------
-- TRIGGERS: updated_at
-- -------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger cases_updated_at
  before update on public.cases
  for each row execute function public.set_updated_at();

create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------
-- TRIGGER: auto-create advocate profile on signup
-- (Associates and clients are created by the API route)
-- -------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'advocate')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------
-- STORAGE BUCKET for documents
-- -------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('case-documents', 'case-documents', false)
on conflict (id) do nothing;

-- Storage RLS: advocate can upload/view their case docs
create policy "storage: advocate full access"
  on storage.objects for all
  using (
    bucket_id = 'case-documents'
    and exists (
      select 1 from public.cases
      where id::text = (storage.foldername(name))[1]
      and advocate_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'case-documents'
    and exists (
      select 1 from public.cases
      where id::text = (storage.foldername(name))[1]
      and advocate_id = auth.uid()
    )
  );

-- Associates can upload and view docs for their advocate's cases
create policy "storage: associate access"
  on storage.objects for all
  using (
    bucket_id = 'case-documents'
    and exists (
      select 1 from public.cases c
      join public.profiles p on p.id = auth.uid() and p.role = 'associate'
      where c.id::text = (storage.foldername(name))[1]
      and c.advocate_id = p.advocate_id
    )
  )
  with check (
    bucket_id = 'case-documents'
    and exists (
      select 1 from public.cases c
      join public.profiles p on p.id = auth.uid() and p.role = 'associate'
      where c.id::text = (storage.foldername(name))[1]
      and c.advocate_id = p.advocate_id
    )
  );
