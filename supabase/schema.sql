-- Budget by Paycheck schema
-- Applied to the "budget-by-paycheck" Supabase project.

create extension if not exists pgcrypto;

create type public.budget_section as enum ('income', 'bill', 'expense', 'savings', 'debt');

create table public.pay_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now()
);

create table public.line_items (
  id uuid primary key default gen_random_uuid(),
  pay_period_id uuid not null references public.pay_periods(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  section public.budget_section not null,
  name text not null,
  due_date date,
  is_sinking_fund boolean not null default false,
  is_paid boolean not null default false,
  budget_amount numeric(12, 2) not null default 0,
  actual_amount numeric(12, 2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.expense_entries (
  id uuid primary key default gen_random_uuid(),
  pay_period_id uuid not null references public.pay_periods(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date date,
  line_item_id uuid references public.line_items(id) on delete set null,
  amount numeric(12, 2) not null default 0,
  description text,
  created_at timestamptz not null default now()
);

create table public.reference_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  section public.budget_section not null,
  name text not null,
  default_amount numeric(12, 2),
  created_at timestamptz not null default now(),
  unique (user_id, section, name)
);

create index line_items_pay_period_idx on public.line_items (pay_period_id);
create index expense_entries_pay_period_idx on public.expense_entries (pay_period_id);
create index expense_entries_line_item_idx on public.expense_entries (line_item_id);
create index pay_periods_user_idx on public.pay_periods (user_id);

alter table public.pay_periods enable row level security;
alter table public.line_items enable row level security;
alter table public.expense_entries enable row level security;
alter table public.reference_items enable row level security;

create policy "pay_periods_owner" on public.pay_periods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "line_items_owner" on public.line_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "expense_entries_owner" on public.expense_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reference_items_owner" on public.reference_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
