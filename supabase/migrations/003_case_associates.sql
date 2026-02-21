-- =============================================================
-- case_associates: link specific associates to specific cases
-- Associates can only see cases they are explicitly assigned to.
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

-- -------------------------------------------------------
-- UPDATE CASES POLICIES FOR ASSOCIATES
-- (now use case_associates instead of advocate_id matching)
-- -------------------------------------------------------
drop policy if exists "cases: associate view"   on public.cases;
drop policy if exists "cases: associate update" on public.cases;

create policy "cases: associate view"
  on public.cases for select
  using (
    exists (
      select 1 from public.case_associates
      where case_id = id and associate_id = auth.uid()
    )
  );

create policy "cases: associate update"
  on public.cases for update
  using (
    exists (
      select 1 from public.case_associates
      where case_id = id and associate_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- UPDATE CASE_UPDATES POLICIES FOR ASSOCIATES
-- -------------------------------------------------------
drop policy if exists "case_updates: associate insert and view" on public.case_updates;
drop policy if exists "case_updates: associate insert"         on public.case_updates;

create policy "case_updates: associate view"
  on public.case_updates for select
  using (
    exists (
      select 1 from public.case_associates
      where case_id = case_updates.case_id and associate_id = auth.uid()
    )
  );

create policy "case_updates: associate insert"
  on public.case_updates for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.case_associates
      where case_id = case_updates.case_id and associate_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- UPDATE CASE_DOCUMENTS POLICIES FOR ASSOCIATES
-- -------------------------------------------------------
drop policy if exists "case_documents: associate insert and view" on public.case_documents;
drop policy if exists "case_documents: associate insert"         on public.case_documents;

create policy "case_documents: associate view"
  on public.case_documents for select
  using (
    exists (
      select 1 from public.case_associates
      where case_id = case_documents.case_id and associate_id = auth.uid()
    )
  );

create policy "case_documents: associate insert"
  on public.case_documents for insert
  with check (
    uploader_id = auth.uid()
    and exists (
      select 1 from public.case_associates
      where case_id = case_documents.case_id and associate_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- UPDATE STORAGE POLICY FOR ASSOCIATES
-- -------------------------------------------------------
drop policy if exists "storage: associate access" on storage.objects;

create policy "storage: associate access"
  on storage.objects for all
  using (
    bucket_id = 'case-documents'
    and exists (
      select 1 from public.case_associates ca
      join public.cases c on c.id = ca.case_id
      where c.id::text = (storage.foldername(name))[1]
        and ca.associate_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'case-documents'
    and exists (
      select 1 from public.case_associates ca
      join public.cases c on c.id = ca.case_id
      where c.id::text = (storage.foldername(name))[1]
        and ca.associate_id = auth.uid()
    )
  );
