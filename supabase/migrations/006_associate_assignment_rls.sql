-- =============================================================
-- Restrict associate access to ONLY their assigned cases.
--
-- Previously associates could see ALL cases belonging to their
-- advocate. This migration updates every associate RLS policy
-- to use the case_associates join table instead, so associates
-- can only view/update cases they have been explicitly assigned.
--
-- Fully idempotent: drops then recreates all affected policies.
-- Does NOT touch any row data.
-- =============================================================

-- -------------------------------------------------------
-- CASES
-- -------------------------------------------------------
drop policy if exists "cases: associate view"   on public.cases;
drop policy if exists "cases: associate update" on public.cases;

create policy "cases: associate view"
  on public.cases for select
  using (
    exists (
      select 1 from public.case_associates ca
      where ca.case_id = id and ca.associate_id = auth.uid()
    )
  );

create policy "cases: associate update"
  on public.cases for update
  using (
    exists (
      select 1 from public.case_associates ca
      where ca.case_id = id and ca.associate_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- CASE_UPDATES
-- -------------------------------------------------------
drop policy if exists "case_updates: associate insert and view" on public.case_updates;
drop policy if exists "case_updates: associate insert"          on public.case_updates;
drop policy if exists "case_updates: associate view"            on public.case_updates;

create policy "case_updates: associate view"
  on public.case_updates for select
  using (
    exists (
      select 1 from public.case_associates ca
      where ca.case_id = case_id and ca.associate_id = auth.uid()
    )
  );

create policy "case_updates: associate insert"
  on public.case_updates for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.case_associates ca
      where ca.case_id = case_id and ca.associate_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- CASE_DOCUMENTS
-- -------------------------------------------------------
drop policy if exists "case_documents: associate insert and view" on public.case_documents;
drop policy if exists "case_documents: associate insert"          on public.case_documents;
drop policy if exists "case_documents: associate view"            on public.case_documents;

create policy "case_documents: associate view"
  on public.case_documents for select
  using (
    exists (
      select 1 from public.case_associates ca
      where ca.case_id = case_id and ca.associate_id = auth.uid()
    )
  );

create policy "case_documents: associate insert"
  on public.case_documents for insert
  with check (
    uploader_id = auth.uid()
    and exists (
      select 1 from public.case_associates ca
      where ca.case_id = case_id and ca.associate_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- STORAGE
-- -------------------------------------------------------
drop policy if exists "storage: associate access" on storage.objects;

create policy "storage: associate access"
  on storage.objects for all
  using (
    bucket_id = 'case-documents'
    and exists (
      select 1 from public.case_associates ca
      where ca.case_id::text = (storage.foldername(name))[1]
        and ca.associate_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'case-documents'
    and exists (
      select 1 from public.case_associates ca
      where ca.case_id::text = (storage.foldername(name))[1]
        and ca.associate_id = auth.uid()
    )
  );
