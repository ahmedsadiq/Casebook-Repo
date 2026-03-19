-- =============================================================
-- View: cases with overdue alert flag (needs_date_update)
-- =============================================================

create or replace view public.case_with_alerts as
select
  c.*,
  case
    when c.next_hearing_date is not null
     and c.next_hearing_date < current_date
     and not exists (
       select 1
       from public.case_updates u
       where u.case_id = c.id
         and u.hearing_date is not null
         and u.hearing_date > c.next_hearing_date
     )
    then true
    else false
  end as needs_date_update
from public.cases c;

-- Ensure RLS is evaluated for the invoker (Postgres 15+)
alter view public.case_with_alerts set (security_invoker = true);

grant select on public.case_with_alerts to authenticated;
