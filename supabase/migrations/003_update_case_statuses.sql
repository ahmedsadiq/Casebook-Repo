-- Update case statuses to new set

update public.cases
set status = 'Pending'
where status in ('open', 'Open', 'pending', 'Pending');

update public.cases
set status = 'Disposed of'
where status in ('closed', 'Closed');

alter table public.cases drop constraint if exists cases_status_check;

alter table public.cases
  alter column status set default 'Pending';

alter table public.cases
  add constraint cases_status_check
  check (status in (
    'Pending',
    'Decided',
    'Disposed of',
    'Date in Office',
    'Rejected',
    'Accepted'
  ));
