-- =============================================================
-- case_associates: optionally link associates to specific cases.
-- This is informational only — existing associate access to all
-- advocate cases is preserved unchanged.
-- =============================================================

-- -------------------------------------------------------
-- TABLE
-- -------------------------------------------------------
create table if not exists public.case_associates (
  case_id      uuid not null references public.cases(id) on delete cascade,
  associate_id uuid not null references public.profiles(id) on delete cascade,
  added_at     timestamptz not null default now(),
  primary key (case_id, associate_id)
);

create index if not exists case_associates_case_id_idx      on public.case_associates(case_id);
create index if not exists case_associates_associate_id_idx on public.case_associates(associate_id);

alter table public.case_associates enable row level security;

-- Advocate: full CRUD on case_associates for their own cases
create policy "case_associates: advocate full access"
  on public.case_associates for all
  using (
    exists (select 1 from public.cases where id = case_id and advocate_id = auth.uid())
  )
  with check (
    exists (select 1 from public.cases where id = case_id and advocate_id = auth.uid())
  );

-- Associate: can see their own assignments
create policy "case_associates: associate view own"
  on public.case_associates for select
  using (associate_id = auth.uid());

-- NOTE: No changes to existing cases / case_updates / case_documents /
-- storage policies. Associates continue to see all of their advocate's
-- cases exactly as before.
