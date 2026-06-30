create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_id_user_id_match check (id = user_id)
);

create table public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  owner_name text,
  trade_type text,
  country text not null,
  currency text not null default 'USD',
  default_tax_rate_bps integer not null default 0,
  default_hourly_rate_minor integer not null default 0,
  business_email text,
  business_phone text,
  business_address text,
  logo_url text,
  estimate_prefix text not null default 'EST',
  invoice_prefix text not null default 'INV',
  default_terms text,
  default_payment_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_profiles_user_id_key unique (user_id),
  constraint business_profiles_currency_check check (currency in ('USD', 'CAD', 'GBP', 'AUD', 'EUR')),
  constraint business_profiles_default_tax_rate_bps_check check (default_tax_rate_bps between 0 and 100000),
  constraint business_profiles_default_hourly_rate_minor_check check (default_hourly_rate_minor >= 0)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_id_user_id_key unique (id, user_id)
);

create table public.service_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  unit_type text not null default 'fixed',
  default_price_minor integer not null default 0,
  category text not null default 'service',
  taxable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_items_unit_type_check check (unit_type in ('hour', 'fixed', 'item', 'day')),
  constraint service_items_category_check check (category in ('labor', 'material', 'service', 'fee', 'other')),
  constraint service_items_default_price_minor_check check (default_price_minor >= 0)
);

create table public.estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  estimate_number text not null,
  title text not null,
  status text not null default 'draft',
  issue_date date not null default current_date,
  expiration_date date,
  currency text not null default 'USD',
  subtotal_minor integer not null default 0,
  discount_type text not null default 'none',
  discount_value_minor integer not null default 0,
  discount_rate_bps integer not null default 0,
  tax_rate_bps integer not null default 0,
  tax_amount_minor integer not null default 0,
  total_minor integer not null default 0,
  notes text,
  terms text,
  internal_notes text,
  follow_up_date date,
  last_follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint estimates_user_number_key unique (user_id, estimate_number),
  constraint estimates_id_user_id_key unique (id, user_id),
  constraint estimates_client_user_fk foreign key (client_id, user_id) references public.clients(id, user_id) on delete restrict,
  constraint estimates_status_check check (status in ('draft', 'sent', 'accepted', 'declined')),
  constraint estimates_currency_check check (currency in ('USD', 'CAD', 'GBP', 'AUD', 'EUR')),
  constraint estimates_discount_type_check check (discount_type in ('none', 'fixed', 'percent')),
  constraint estimates_currency_amounts_check check (
    subtotal_minor >= 0
    and discount_value_minor >= 0
    and discount_rate_bps between 0 and 10000
    and tax_rate_bps between 0 and 100000
    and tax_amount_minor >= 0
    and total_minor >= 0
  ),
  constraint estimates_discount_shape_check check (
    (discount_type = 'none' and discount_value_minor = 0 and discount_rate_bps = 0)
    or (discount_type = 'fixed' and discount_rate_bps = 0)
    or (discount_type = 'percent' and discount_value_minor = 0)
  ),
  constraint estimates_expiration_date_check check (expiration_date is null or expiration_date >= issue_date)
);

create table public.estimate_line_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  estimate_id uuid not null,
  description text not null,
  quantity_milli integer not null default 1000,
  unit_price_minor integer not null default 0,
  taxable boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint estimate_line_items_estimate_user_fk foreign key (estimate_id, user_id) references public.estimates(id, user_id) on delete cascade,
  constraint estimate_line_items_quantity_milli_check check (quantity_milli > 0),
  constraint estimate_line_items_unit_price_minor_check check (unit_price_minor >= 0),
  constraint estimate_line_items_sort_order_check check (sort_order >= 0)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  estimate_id uuid,
  invoice_number text not null,
  title text not null,
  status text not null default 'draft',
  issue_date date not null default current_date,
  due_date date,
  currency text not null default 'USD',
  subtotal_minor integer not null default 0,
  discount_type text not null default 'none',
  discount_value_minor integer not null default 0,
  discount_rate_bps integer not null default 0,
  tax_rate_bps integer not null default 0,
  tax_amount_minor integer not null default 0,
  total_minor integer not null default 0,
  notes text,
  payment_instructions text,
  internal_notes text,
  follow_up_date date,
  last_follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_user_number_key unique (user_id, invoice_number),
  constraint invoices_id_user_id_key unique (id, user_id),
  constraint invoices_client_user_fk foreign key (client_id, user_id) references public.clients(id, user_id) on delete restrict,
  constraint invoices_estimate_user_fk foreign key (estimate_id, user_id) references public.estimates(id, user_id) on delete restrict,
  constraint invoices_status_check check (status in ('draft', 'sent', 'unpaid', 'overdue', 'paid')),
  constraint invoices_currency_check check (currency in ('USD', 'CAD', 'GBP', 'AUD', 'EUR')),
  constraint invoices_discount_type_check check (discount_type in ('none', 'fixed', 'percent')),
  constraint invoices_currency_amounts_check check (
    subtotal_minor >= 0
    and discount_value_minor >= 0
    and discount_rate_bps between 0 and 10000
    and tax_rate_bps between 0 and 100000
    and tax_amount_minor >= 0
    and total_minor >= 0
  ),
  constraint invoices_discount_shape_check check (
    (discount_type = 'none' and discount_value_minor = 0 and discount_rate_bps = 0)
    or (discount_type = 'fixed' and discount_rate_bps = 0)
    or (discount_type = 'percent' and discount_value_minor = 0)
  ),
  constraint invoices_due_date_check check (due_date is null or due_date >= issue_date)
);

create table public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null,
  description text not null,
  quantity_milli integer not null default 1000,
  unit_price_minor integer not null default 0,
  taxable boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoice_line_items_invoice_user_fk foreign key (invoice_id, user_id) references public.invoices(id, user_id) on delete cascade,
  constraint invoice_line_items_quantity_milli_check check (quantity_milli > 0),
  constraint invoice_line_items_unit_price_minor_check check (unit_price_minor >= 0),
  constraint invoice_line_items_sort_order_check check (sort_order >= 0)
);

create table public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  estimates_created integer not null default 0,
  invoices_created integer not null default 0,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint usage_counters_user_month_key unique (user_id, month),
  constraint usage_counters_counts_check check (estimates_created >= 0 and invoices_created >= 0),
  constraint usage_counters_plan_check check (plan in ('free', 'pro')),
  constraint usage_counters_month_check check (extract(day from month) = 1)
);

create index profiles_user_id_idx on public.profiles(user_id);
create index business_profiles_user_id_idx on public.business_profiles(user_id);
create index clients_user_id_idx on public.clients(user_id);
create index service_items_user_id_idx on public.service_items(user_id);
create index service_items_user_category_idx on public.service_items(user_id, category);

create index estimates_user_id_idx on public.estimates(user_id);
create index estimates_client_id_idx on public.estimates(client_id);
create index estimates_user_status_idx on public.estimates(user_id, status);
create index estimates_user_issue_date_idx on public.estimates(user_id, issue_date desc);
create index estimates_user_expiration_date_idx on public.estimates(user_id, expiration_date);
create index estimates_user_follow_up_date_idx on public.estimates(user_id, follow_up_date);

create index estimate_line_items_user_id_idx on public.estimate_line_items(user_id);
create index estimate_line_items_estimate_id_idx on public.estimate_line_items(estimate_id);
create index estimate_line_items_estimate_sort_idx on public.estimate_line_items(estimate_id, sort_order);

create index invoices_user_id_idx on public.invoices(user_id);
create index invoices_client_id_idx on public.invoices(client_id);
create index invoices_estimate_id_idx on public.invoices(estimate_id);
create index invoices_user_status_idx on public.invoices(user_id, status);
create index invoices_user_issue_date_idx on public.invoices(user_id, issue_date desc);
create index invoices_user_due_date_idx on public.invoices(user_id, due_date);
create index invoices_user_follow_up_date_idx on public.invoices(user_id, follow_up_date);

create index invoice_line_items_user_id_idx on public.invoice_line_items(user_id);
create index invoice_line_items_invoice_id_idx on public.invoice_line_items(invoice_id);
create index invoice_line_items_invoice_sort_idx on public.invoice_line_items(invoice_id, sort_order);

create index usage_counters_user_id_idx on public.usage_counters(user_id);
create index usage_counters_month_idx on public.usage_counters(month);
create index usage_counters_user_plan_idx on public.usage_counters(user_id, plan);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger business_profiles_set_updated_at
before update on public.business_profiles
for each row execute function public.set_updated_at();

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

create trigger service_items_set_updated_at
before update on public.service_items
for each row execute function public.set_updated_at();

create trigger estimates_set_updated_at
before update on public.estimates
for each row execute function public.set_updated_at();

create trigger estimate_line_items_set_updated_at
before update on public.estimate_line_items
for each row execute function public.set_updated_at();

create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

create trigger invoice_line_items_set_updated_at
before update on public.invoice_line_items
for each row execute function public.set_updated_at();

create trigger usage_counters_set_updated_at
before update on public.usage_counters
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.business_profiles enable row level security;
alter table public.clients enable row level security;
alter table public.service_items enable row level security;
alter table public.estimates enable row level security;
alter table public.estimate_line_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.usage_counters enable row level security;

grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.business_profiles to authenticated;
grant select, insert, update, delete on table public.clients to authenticated;
grant select, insert, update, delete on table public.service_items to authenticated;
grant select, insert, update, delete on table public.estimates to authenticated;
grant select, insert, update, delete on table public.estimate_line_items to authenticated;
grant select, insert, update, delete on table public.invoices to authenticated;
grant select, insert, update, delete on table public.invoice_line_items to authenticated;
grant select, insert, update, delete on table public.usage_counters to authenticated;

revoke all on table public.profiles from anon;
revoke all on table public.business_profiles from anon;
revoke all on table public.clients from anon;
revoke all on table public.service_items from anon;
revoke all on table public.estimates from anon;
revoke all on table public.estimate_line_items from anon;
revoke all on table public.invoices from anon;
revoke all on table public.invoice_line_items from anon;
revoke all on table public.usage_counters from anon;

create policy "profiles_owner_all"
on public.profiles
for all
to authenticated
using (
  (select auth.uid()) is not null
  and id = (select auth.uid())
  and user_id = (select auth.uid())
)
with check (
  (select auth.uid()) is not null
  and id = (select auth.uid())
  and user_id = (select auth.uid())
);

create policy "business_profiles_owner_all"
on public.business_profiles
for all
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "clients_owner_all"
on public.clients
for all
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "service_items_owner_all"
on public.service_items
for all
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "estimates_owner_all"
on public.estimates
for all
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "estimate_line_items_owner_all"
on public.estimate_line_items
for all
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "invoices_owner_all"
on public.invoices
for all
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "invoice_line_items_owner_all"
on public.invoice_line_items
for all
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy "usage_counters_owner_all"
on public.usage_counters
for all
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));
