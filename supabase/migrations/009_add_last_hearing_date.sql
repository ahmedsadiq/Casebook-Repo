-- Add last hearing date to cases

alter table public.cases
  add column if not exists last_hearing_date date;
