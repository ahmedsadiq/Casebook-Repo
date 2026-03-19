-- =============================================================
-- Restore original associate access policies.
-- The previous migration replaced advocate_id-based policies
-- with case_associates-based ones, which broke existing cases.
-- This restores the original behaviour: associates see all of
-- their advocate's cases. The case_associates table remains for
-- optional assignment tracking only.
-- =============================================================

-- -------------------------------------------------------
-- CASES
-- -------------------------------------------------------
drop policy if exists "cases: associate view"   on public.cases;
drop policy if exists "cases: associate update" on public.cases;

create policy "cases: associate view"
  on public.cases for select
  using (
    advocate_id = (select advocate_id from public.profiles
                   where id = auth.uid() and role = 'associate' limit 1)
  );

create policy "cases: associate update"
  on public.cases for update
  using (
    advocate_id = (select advocate_id from public.profiles
                   where id = auth.uid() and role = 'associate' limit 1)
  );

-- -------------------------------------------------------
-- CASE_UPDATES
-- -------------------------------------------------------
drop policy if exists "case_updates: associate view"   on public.case_updates;
drop policy if exists "case_updates: associate insert" on public.case_updates;

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

-- -------------------------------------------------------
-- CASE_DOCUMENTS
-- -------------------------------------------------------
drop policy if exists "case_documents: associate view"   on public.case_documents;
drop policy if exists "case_documents: associate insert" on public.case_documents;

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

-- -------------------------------------------------------
-- STORAGE
-- -------------------------------------------------------
drop policy if exists "storage: associate access" on storage.objects;

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
