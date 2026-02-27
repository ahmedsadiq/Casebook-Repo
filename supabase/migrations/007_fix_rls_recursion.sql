-- =============================================================
-- Fix infinite RLS recursion introduced by migration 006.
--
-- Root cause:
--   "cases: associate view"          queries case_associates
--   "case_associates: advocate full access" queries cases
--   → Each policy triggers the other → 42P17 infinite recursion
--   → ALL case queries fail for every user, including the advocate.
--
-- Fix:
--   Create a SECURITY DEFINER helper function that reads
--   cases.advocate_id without triggering RLS.  Use it in the
--   case_associates policy so the cycle is broken.
-- =============================================================

-- -------------------------------------------------------
-- Helper: returns the advocate_id of a case, bypassing RLS.
-- SECURITY DEFINER means it runs as the function owner
-- (postgres / service role) so the cases RLS policies are
-- NOT evaluated inside it — breaking the recursion.
-- -------------------------------------------------------
create or replace function public.get_case_advocate_id(p_case_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select advocate_id from public.cases where id = p_case_id;
$$;

-- -------------------------------------------------------
-- Re-create case_associates advocate policy using the helper.
-- Now it no longer queries cases through RLS.
-- -------------------------------------------------------
drop policy if exists "case_associates: advocate full access" on public.case_associates;

create policy "case_associates: advocate full access"
  on public.case_associates for all
  using  (public.get_case_advocate_id(case_id) = auth.uid())
  with check (public.get_case_advocate_id(case_id) = auth.uid());
