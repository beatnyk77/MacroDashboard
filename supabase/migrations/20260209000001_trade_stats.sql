-- Create trade_stats table
create table if not exists public.trade_stats (
    id uuid primary key default gen_random_uuid(),
    country_code text not null references public.g20_countries(code),
    as_of_date date not null,
    exports_usd_bn double precision,
    imports_usd_bn double precision,
    trade_balance_usd_bn double precision generated always as (exports_usd_bn - imports_usd_bn) stored,
    exports_yoy_pct double precision,
    partners_json jsonb default '{}'::jsonb, -- Partner geography breakdown
    ftas_json jsonb default '{}'::jsonb, -- Trade deals and their impacts
    tariffs_avg_pct double precision,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique (country_code, as_of_date)
);

-- Enable RLS
alter table public.trade_stats enable row level security;

-- Create policy for public read
do $$ 
begin
    if not exists (
        select 1 from pg_policies 
        where tablename = 'trade_stats' and policyname = 'Enable read access for all users'
    ) then
        create policy "Enable read access for all users" on public.trade_stats for select using (true);
    end if;
end $$;

-- Indexes for performance
create index if not exists idx_trade_stats_country_date on public.trade_stats (country_code, as_of_date desc);

-- Add commentary
comment on table public.trade_stats is 'Monthly trade statistics including exports, imports, geography partners, and FTA impacts.';
