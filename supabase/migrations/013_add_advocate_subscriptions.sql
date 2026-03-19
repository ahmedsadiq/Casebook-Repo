create table if not exists public.advocate_subscriptions (
  advocate_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_checkout_session_id text,
  status text not null default 'pending'
    constraint advocate_subscriptions_status_check
    check (status in ('pending', 'incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  currency text not null default 'pkr',
  amount_pkr integer not null default 0,
  monthly_usd numeric(10,2) not null default 5,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.advocate_subscriptions enable row level security;

create policy "advocate_subscriptions: select own"
  on public.advocate_subscriptions for select
  using (auth.uid() = advocate_id);

drop trigger if exists advocate_subscriptions_updated_at on public.advocate_subscriptions;
create trigger advocate_subscriptions_updated_at
  before update on public.advocate_subscriptions
  for each row execute function public.set_updated_at();
