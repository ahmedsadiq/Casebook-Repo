-- =============================================================
-- Fix infinite recursion in profiles RLS policy.
--
-- Root cause:
--   "profiles: select own or own team" queries public.profiles
--   from inside a policy on public.profiles, which can recurse.
--
-- Fix:
--   Use SECURITY DEFINER helper(s) to read the caller's advocate_id
--   without evaluating profiles RLS in the middle of policy checks.
-- =============================================================

create or replace function public.get_my_advocate_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select advocate_id
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

drop policy if exists "profiles: select own or own team" on public.profiles;

create policy "profiles: select own or own team"
  on public.profiles
  for select
  using (
    auth.uid() = id
    or advocate_id = auth.uid()
    or id = public.get_my_advocate_id()
    or (
      advocate_id = public.get_my_advocate_id()
      and advocate_id is not null
    )
  );
