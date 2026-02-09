-- Migration: Create Oil Data Schema (Refining Capacity & Imports)

-- 1. Create tables
create table if not exists public.oil_refining_capacity (
    id uuid primary key default gen_random_uuid(),
    country_code text not null,        -- ISO 3166-1 alpha-2
    country_name text not null,
    capacity_mbpd numeric not null,    -- Million barrels per day
    capacity_share_pct numeric,        -- % of global capacity
    as_of_year int not null,
    last_updated_at timestamptz default now(),
    source_id int references public.data_sources(id),
    unique(country_code, as_of_year)
);

create table if not exists public.oil_imports_by_origin (
    id uuid primary key default gen_random_uuid(),
    importer_country_code text not null,
    exporter_country_code text not null,
    import_volume_mbbl numeric not null,  -- Million barrels
    as_of_date date not null,
    frequency text not null,              -- monthly, annual
    last_updated_at timestamptz default now(),
    source_id int references public.data_sources(id),
    unique(importer_country_code, exporter_country_code, as_of_date)
);

-- Enable RLS (read-only for anon, write for service_role)
alter table public.oil_refining_capacity enable row level security;
alter table public.oil_imports_by_origin enable row level security;

create policy "Allow public read access" on public.oil_refining_capacity for select using (true);
create policy "Allow public read access" on public.oil_imports_by_origin for select using (true);

-- 2. Ensure EIA Data Source exists
insert into public.data_sources (name, api_endpoint, auth_type, metadata)
values (
    'EIA',
    'https://api.eia.gov/v2/',
    'api_key',
    '{"description": "U.S. Energy Information Administration", "reliability_tier": "tier_1", "update_frequency": "monthly"}'::jsonb
)
on conflict (name) do update 
set api_endpoint = EXCLUDED.api_endpoint,
    auth_type = EXCLUDED.auth_type,
    metadata = data_sources.metadata || EXCLUDED.metadata;

-- 3. Define Metrics
-- Expand categories to include 'energy'
ALTER TABLE metrics DROP CONSTRAINT IF EXISTS metrics_category_check;
ALTER TABLE metrics ADD CONSTRAINT metrics_category_check CHECK (
  category = ANY (ARRAY[
    'liquidity', 'valuation', 'funding', 'de_dollarization', 'sovereign', 'macro_regime',
    'capital_flows', 'inflation_regime', 'balance_of_payments', 'housing_cycle', 'activity_regime', 'labor_market', 'energy'
  ])
);

-- We use a CTE to get the source_id to avoid hardcoding UUIDs
with source as (
    select id from public.data_sources where name = 'EIA' limit 1
)
insert into public.metrics (id, name, description, category, source_id, native_frequency, display_frequency, expected_interval_days, is_active, metadata)
values 
(
    'OIL_REFINING_CAPACITY_US',
    'US Oil Refining Capacity',
    'Total operative atmospheric crude oil distillation capacity.',
    'energy',
    (select id from source),
    'annual',
    'annual',
    366,
    true,
    '{"unit": "mbpd", "eia_series_id": "PET.MCRMNUS2.A"}'::jsonb
),
(
    'OIL_IMPORT_DEPENDENCY_US',
    'US Oil Import Dependency Ratio',
    'Percentage of total US crude oil consumption met by imports.',
    'energy',
    (select id from source),
    'monthly',
    'monthly',
    35,
    true,
    '{"unit": "percent", "calculation": "imports / (refinery_input + spr_draws)"}'::jsonb
),
(
    'OIL_IMPORTS_CONCENTRATION_US',
    'US Oil Import Concentration (Top 5)',
    'Herfindahl-Hirschman Index (HHI) proxy or simple share of Top 5 origins.',
    'energy',
    (select id from source),
    'monthly',
    'monthly',
    35,
    true,
    '{"unit": "percent", "calculation": "sum(share_top_5)"}'::jsonb
)
on conflict (id) do update 
set 
    description = EXCLUDED.description,
    metadata = EXCLUDED.metadata,
    category = EXCLUDED.category,
    display_frequency = EXCLUDED.display_frequency,
    expected_interval_days = EXCLUDED.expected_interval_days;
