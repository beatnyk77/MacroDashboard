# Populate Country P-SEO Pages — Top 40 Countries, 12 GMD Metrics

## Context

The country profile pages (`/countries/:iso`) are the P-SEO landing pages for macro intelligence. The `vw_country_terminal` view currently covers ~25 countries with limited FRED metrics (yields, reserves). Only ~8-10 countries have yield data.

**Goal**: Populate 12 high-value macro metrics from the Global-Macro-Database (GMD) for all **top 40 countries** as a supplementary data layer. Everything is additive — keep existing FRED real-time data, add GMD annual fundamentals.

---

## Top 40 Countries (Already Defined)

From `supabase/functions/ingest-country-metrics/index.ts` — `COUNTRIES` array:

```typescript
['US','GB','DE','FR','IT','JP','CA','AU','BR','AR','MX','CN','IN','KR','ID','SA','TR','RU','ZA','SG','CH','TH','MY','AE','QA','IL','CL','NL','ES','VN','PH','EG','NG','KW','NO','SE','PL','GR','IE']
```

40 countries = G20 + major EM + key Asian/Latin American + secondary Eurozone markets.

---

## 12 GMD Metrics to Add

| Metric Key | GMD Variable | Unit | Source | Transformation |
|---|---|---|---|---|
| `gdp_usd_bn` | `nGDP_USD` | $Bn | WB/IMF | ÷ 1,000 (millions → billions) |
| `gdp_yoy_pct` | `rGDP_yoy` | % | WB/IMF | identity (if missing, compute from `rGDP`) |
| `gdp_per_capita_usd` | `rGDP_pc_USD` | $ | WB/IMF | identity |
| `population_mn` | `pop` | Millions | UN/WB | identity |
| `cpi_yoy_pct` | `infl` | % | IMF/WB | identity (×100 if stored as fraction) |
| `unemployment_pct` | `unemp` | % | ILO/IMF | identity (×100 if stored as fraction) |
| `central_bank_rate_pct` | `cbrate` | % | FRED/GMD | identity (fills FRED gaps) |
| `ca_gdp_pct` | `CA_GDP` | % | IMF | identity (×100 if stored as fraction) |
| `exports_gdp_pct` | `exports_GDP` | % | WTO/IMF | identity (×100 if stored as fraction) |
| `imports_gdp_pct` | `imports_GDP` | % | WTO/IMF | identity (×100 if stored as fraction) |
| `gov_debt_gdp_pct` | `gen_govdebt_GDP` (fallback: `govdebt_GDP`) | % | IMF | identity (×100 if stored as fraction) |
| `budget_deficit_gdp_pct` | `gen_govdef_GDP` (fallback: `govdef_GDP`) | % | IMF | identity (×100 if stored as fraction) |

**Sources**: Global-Macro-Database `data/final/data_final.dta` panel (73 variables × ~240 countries × ~900 years).

---

## Data Preparation: One-Shot JSON Conversion

**Script**: `scripts/convert-gmd-to-json.py`

Converts the GMD Stata `.dta` file to a single static JSON file:

```python
#!/usr/bin/env python3
import pandas as pd
import json
from pathlib import Path

GMD_DTA = "Global-Macro-Database/data/final/data_final.dta"
OUTPUT = Path("public/data/gmd/40-countries-latest.json")

# Target metric mapping: (gmd_var, transform_fn)
METRICS = [
    ("nGDP_USD",     lambda v: round(float(v)/1000, 2), "gdp_usd_bn"),           # $Bn
    ("rGDP_yoy",     lambda v: round(float(v), 2),    "gdp_yoy_pct"),            # %
    ("rGDP_pc_USD",  lambda v: round(float(v), 0),    "gdp_per_capita_usd"),    # $
    ("pop",          lambda v: round(float(v), 2),    "population_mn"),         # Mn
    ("infl",         lambda v: round(float(v)*100, 2) if float(v) < 10 else round(float(v), 2), "cpi_yoy_pct"),
    ("unemp",        lambda v: round(float(v)*100, 2) if float(v) < 1 else round(float(v), 2), "unemployment_pct"),
    ("cbrate",       lambda v: round(float(v), 2),    "central_bank_rate_pct"),
    ("CA_GDP",       lambda v: round(float(v)*100, 2) if float(v) < 10 else round(float(v), 2), "ca_gdp_pct"),
    ("exports_GDP",  lambda v: round(float(v)*100, 2) if float(v) < 10 else round(float(v), 2), "exports_gdp_pct"),
    ("imports_GDP",  lambda v: round(float(v)*100, 2) if float(v) < 10 else round(float(v), 2), "imports_gdp_pct"),
    ("gen_govdebt_GDP", lambda v: round(float(v)*100, 2) if float(v) < 10 else round(float(v), 2), "gov_debt_gdp_pct"),
    ("gen_govdef_GDP",  lambda v: round(float(v)*100, 2) if float(v) < 10 else round(float(v), 2), "budget_deficit_gdp_pct"),
]

TARGET_ISOS = ['US','GB','DE','FR','IT','JP','CA','AU','BR','AR','MX','CN','IN','KR','ID','SA','TR','RU','ZA','SG','CH','TH','MY','AE','QA','IL','CL','NL','ES','VN','PH','EG','NG','KW','NO','SE','PL','GR','IE']

# Read panel dataset
df = pd.read_stata(GMD_DTA)

# Determine format: long (iso, year, variable, value) or wide (iso, year, col_per_var)
is_long = 'variable' in df.columns and 'value' in df.columns

# Get latest year available
latest_year = int(df['year'].max())
print(f"Latest year: {latest_year}")

result = {}
for iso in TARGET_ISOS:
    iso_rows = df[(df['iso'] == iso) & (df['year'] == latest_year)]
    if iso_rows.empty:
        print(f"  ⚠️  {iso}: no data in year {latest_year}")
        continue
    metrics = {}
    for gmd_var, transform, key in METRICS:
        val = None
        if is_long:
            row = iso_rows[iso_rows['variable'] == gmd_var]
            if not row.empty:
                val = transform(row['value'].iloc[0])
        else:
            if gmd_var in iso_rows.columns:
                val = transform(iso_rows[gmd_var].iloc[0])
        if val is not None:
            metrics[key] = val
    if metrics:
        result[iso] = metrics
        print(f"  ✓ {iso}: {len(metrics)} metrics")
    else:
        print(f"  ✗ {iso}: no matching metrics")

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps({
    "source": "Global-Macro-Database",
    "source_url": "https://github.com/beatnyk77/Global-Macro-Database",
    "year": latest_year,
    "retrieved_at": pd.Timestamp.now().isoformat(),
    "countries": result
}, indent=2))
print(f"\n✅ Written {len(result)} countries → {OUTPUT}")

---
## 2. Edge Function: `ingest-country-gmd-supplement`

**File structure**:
```
supabase/functions/ingest-country-gmd-supplement/
├── index.ts
└── deno.json (optional, if you want to set imports)
```

### Function Code

`supabase/functions/ingest-country-gmd-supplement/index.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import { runIngestion, IngestionContext } from '@shared/logging.ts'

// All 40 countries (same as ingest-country-metrics COUNTRIES array)
const COUNTRIES = [
  'US','GB','DE','FR','IT','JP','CA','AU','BR','AR','MX','CN','IN','KR','ID','SA','TR','RU','ZA',
  'SG','CH','TH','MY','AE','QA','IL','CL','NL','ES','VN','PH','EG','NG','KW','NO','SE','PL','GR','IE'
]

// JSON file path within Supabase project's public/ bucket
const GMD_JSON_PATH = '/data/gmd/40-countries-latest.json'

async function ingestGMDSupplement(ctx: IngestionContext) {
  const { supabase } = ctx
  const timestamp = new Date().toISOString()
  const batchRows: any[] = []

  // Supabase auto-serves /public as CDN; fetch from project URL
  const baseUrl = (Deno.env.get('SUPABASE_URL') || '').replace(/\/$/, '')
  const url = baseUrl + GMD_JSON_PATH

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`GMD JSON fetch failed: ${res.status} ${res.statusText} from ${url}`)
  }

  const gmd = await res.json()
  const year = gmd.year
  const data = gmd.countries || {}

  for (const iso of COUNTRIES) {
    const metrics = data[iso]
    if (!metrics) continue

    for (const [key, value] of Object.entries(metrics)) {
      if (value != null && typeof value === 'number') {
        batchRows.push({
          iso,
          metric_key: key,
          value,
          as_of: `${year}-12-31`,
          source: 'GMD',
          confidence: 0.95,
          last_cron: timestamp,
          metadata: JSON.stringify({ gmd_year: year, source_repo: gmd.source_url })
        })
      }
    }
  }

  if (batchRows.length > 0) {
    const { error } = await supabase
      .from('country_metrics')
      .upsert(batchRows, { onConflict: 'iso, metric_key' })
    if (error) throw error
    console.log(`[ingest-country-gmd-supplement] Upserted ${batchRows.length} rows for ${year}`)
  } else {
    console.warn('[ingest-country-gmd-supplement] No rows to upsert — check JSON format')
  }

  return { rows_inserted: batchRows.length, metadata: { timestamp, year, source: 'GMD' } }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const client = createClient(supabaseUrl, supabaseKey)

  return await runIngestion(client, 'ingest-country-gmd-supplement', ingestGMDSupplement)
})
```

### Deploy

```bash
npx supabase functions deploy ingest-country-gmd-supplement --no-verify-jwt
```

### Test Invoke

```bash
npx supabase functions invoke ingest-country-gmd-supplement
# Follow logs:
npx supabase functions logs ingest-country-gmd-supplement --tail
```

Expected log line:
```
[ingest-country-gmd-supplement] Upserted 480 rows for 2024
```

(40 countries × average 12 metrics = ~480 rows)

---

## 3. Database Migration: Add 20 Countries

**File**: `supabase/migrations/20260412000000_add_remaining_40.sql`

```sql
-- Insert 20 additional countries to bring g20_countries from 20 → 40 total
INSERT INTO public.g20_countries (code, name, is_major, region) VALUES
  ('SG','Singapore', FALSE, 'Asia'),
  ('CH','Switzerland', FALSE, 'Europe'),
  ('TH','Thailand', FALSE, 'Asia'),
  ('MY','Malaysia', FALSE, 'Asia'),
  ('AE','United Arab Emirates', FALSE, 'Middle East'),
  ('QA','Qatar', FALSE, 'Middle East'),
  ('IL','Israel', FALSE, 'Middle East'),
  ('CL','Chile', FALSE, 'South America'),
  ('NL','Netherlands', FALSE, 'Europe'),
  ('ES','Spain', FALSE, 'Europe'),
  ('VN','Vietnam', FALSE, 'Asia'),
  ('PH','Philippines', FALSE, 'Asia'),
  ('EG','Egypt', FALSE, 'Africa'),
  ('NG','Nigeria', FALSE, 'Africa'),
  ('KW','Kuwait', FALSE, 'Middle East'),
  ('NO','Norway', FALSE, 'Europe'),
  ('SE','Sweden', FALSE, 'Europe'),
  ('PL','Poland', FALSE, 'Europe'),
  ('GR','Greece', FALSE, 'Europe'),
  ('IE','Ireland', FALSE, 'Europe')
ON CONFLICT (code) DO NOTHING;
```

Apply:
```bash
npx supabase db push
```

Verify:
```sql
SELECT COUNT(*) FROM g20_countries WHERE code IN (
  'SG','CH','TH','MY','AE','QA','IL','CL','NL','ES','VN','PH','EG','NG','KW','NO','SE','PL','GR','IE'
);
-- Should return 20
SELECT COUNT(*) FROM g20_countries;  -- Should return 40 or 41 (EU also present)
```

---

## 4. Database Migration: Extend `vw_country_terminal` to 40 Countries

**File**: `supabase/migrations/20260412000001_extend_vw_country_terminal.sql`

Key changes:
- Replace 25-country `WHERE c.code IN (…)` with 40-country list
- Add GMD joins (LEFT JOIN to `country_metrics` CTE filtered by `source='GMD'`)
- Add 12 new output columns: `gdp_usd_bn`, `gdp_yoy_pct`, `gdp_per_capita_usd`, `population_mn`, `cpi_yoy_pct`, `unemployment_pct`, `ca_gdp_pct`, `exports_gdp_pct`, `imports_gdp_pct`, `gov_debt_gdp_pct`, `budget_deficit_gdp_pct`

Full SQL (replace entire view):

```sql
CREATE OR REPLACE VIEW vw_country_terminal AS
WITH
latest_obs AS (
  SELECT DISTINCT ON (metric_id) metric_id, as_of_date, value FROM metric_observations ORDER BY metric_id, as_of_date DESC
),
policy_rates AS (
  SELECT DISTINCT ON (c.code) c.code AS iso, lo.value AS central_bank_rate_pct, lo.as_of_date AS central_bank_rate_date
  FROM g20_countries c
  LEFT JOIN latest_obs lo ON lo.metric_id = c.code || '_POLICY_RATE' OR lo.metric_id = c.code || '_SHORTTERM_INTEREST_RATE'
  WHERE c.code IN (
    'US','GB','DE','FR','IT','JP','CA','AU','BR','AR','MX','CN','IN','KR','ID','SA','TR','RU','ZA',
    'SG','CH','TH','MY','AE','QA','IL','CL','NL','ES','VN','PH','EG','NG','KW','NO','SE','PL','GR','IE'
  )
  ORDER BY c.code, lo.as_of_date DESC NULLS LAST
),
yields_2y AS (
  SELECT DISTINCT ON (country) country AS iso, yield_pct AS yield_2y_pct, as_of_date AS yield_2y_date
  FROM yield_curves WHERE tenor = '2Y' AND yield_pct IS NOT NULL ORDER BY country, as_of_date DESC
),
yields_10y AS (
  SELECT DISTINCT ON (country) country AS iso, yield_pct AS yield_10y_pct, as_of_date AS yield_10y_date
  FROM yield_curves WHERE tenor = '10Y' AND yield_pct IS NOT NULL ORDER BY country, as_of_date DESC
),
fx_reserves AS (
  SELECT DISTINCT ON (country_code) country_code AS iso, fx_reserves_usd / 1e9 AS fx_reserves_bn, as_of_date AS fx_reserves_date
  FROM country_reserves WHERE fx_reserves_usd IS NOT NULL ORDER BY country_code, as_of_date DESC
),
gold_reserves AS (
  SELECT DISTINCT ON (country_code) country_code AS iso, gold_tonnes, as_of_date AS gold_date
  FROM country_reserves WHERE gold_tonnes IS NOT NULL ORDER BY country_code, as_of_date DESC
),
gmd_metrics AS (
  SELECT
    iso,
    MAX(CASE WHEN metric_key = 'gdp_usd_bn' THEN value END) AS gdp_usd_bn,
    MAX(CASE WHEN metric_key = 'gdp_yoy_pct' THEN value END) AS gdp_yoy_pct,
    MAX(CASE WHEN metric_key = 'gdp_per_capita_usd' THEN value END) AS gdp_per_capita_usd,
    MAX(CASE WHEN metric_key = 'population_mn' THEN value END) AS population_mn,
    MAX(CASE WHEN metric_key = 'cpi_yoy_pct' THEN value END) AS cpi_yoy_pct,
    MAX(CASE WHEN metric_key = 'unemployment_pct' THEN value END) AS unemployment_pct,
    MAX(CASE WHEN metric_key = 'ca_gdp_pct' THEN value END) AS ca_gdp_pct,
    MAX(CASE WHEN metric_key = 'exports_gdp_pct' THEN value END) AS exports_gdp_pct,
    MAX(CASE WHEN metric_key = 'imports_gdp_pct' THEN value END) AS imports_gdp_pct,
    MAX(CASE WHEN metric_key = 'gov_debt_gdp_pct' THEN value END) AS gov_debt_gdp_pct,
    MAX(CASE WHEN metric_key = 'budget_deficit_gdp_pct' THEN value END) AS budget_deficit_gdp_pct
  FROM country_metrics
  WHERE source = 'GMD'
    AND iso IN (
      'US','GB','DE','FR','IT','JP','CA','AU','BR','AR','MX','CN','IN','KR','ID','SA','TR','RU','ZA',
      'SG','CH','TH','MY','AE','QA','IL','CL','NL','ES','VN','PH','EG','NG','KW','NO','SE','PL','GR','IE'
    )
  GROUP BY iso
)
SELECT
  c.code AS iso,
  c.name AS country_name,
  c.region,
  pr.central_bank_rate_pct,
  pr.central_bank_rate_date,
  y2.yield_2y_pct, y2.yield_2y_date,
  y10.yield_10y_pct, y10.yield_10y_date,
  fx.fx_reserves_bn, fx.fx_reserves_date,
  g.gold_tonnes, g.gold_date,
  -- GMD columns
  gmd.gdp_usd_bn,
  gmd.gdp_yoy_pct,
  gmd.gdp_per_capita_usd,
  gmd.population_mn,
  gmd.cpi_yoy_pct,
  gmd.unemployment_pct,
  gmd.ca_gdp_pct,
  gmd.exports_gdp_pct,
  gmd.imports_gdp_pct,
  gmd.gov_debt_gdp_pct,
  gmd.budget_deficit_gdp_pct,
  -- Derived slope in bps
  CASE WHEN y2.yield_2y_pct IS NOT NULL AND y10.yield_10y_pct IS NOT NULL
    THEN ROUND((y10.yield_10y_pct - y2.yield_2y_pct) * 100, 2)
    ELSE NULL
  END AS yield_slope_2s10s,
  NOW() AS updated_at
FROM g20_countries c
LEFT JOIN policy_rates pr ON pr.iso = c.code
LEFT JOIN yields_2y y2 ON y2.iso = c.code
LEFT JOIN yields_10y y10 ON y10.iso = c.code
LEFT JOIN fx_reserves fx ON fx.iso = c.code
LEFT JOIN gold_reserves g ON g.iso = c.code
LEFT JOIN gmd_metrics gmd ON gmd.iso = c.code
WHERE c.code IN (
  'US','GB','DE','FR','IT','JP','CA','AU','BR','AR','MX','CN','IN','KR','ID','SA','TR','RU','ZA',
  'SG','CH','TH','MY','AE','QA','IL','CL','NL','ES','VN','PH','EG','NG','KW','NO','SE','PL','GR','IE'
)
ORDER BY c.code;

COMMENT ON VIEW vw_country_terminal IS
  'Country macro terminal for top 40 economies. Combines real-time FRED metrics (policy rates, yield curves) with Global-Macro-Database annual fundamentals (GDP, debt, trade). NULLs indicate metric not available for that country.';
```

Apply:
```bash
npx supabase db push
```

Verify:
```sql
SELECT COUNT(*) FROM vw_country_terminal;   -- Expected: 40
SELECT iso, gdp_usd_bn, gdp_yoy_pct FROM vw_country_terminal WHERE iso IN ('US','VN','NG') ORDER BY iso;
```

---

## 5. Cron Schedule: Quarterly

**File**: `supabase/migrations/20260412000002_country_gmd_cron.sql`

```sql
-- Remove old if exists (safe no-op if not)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-country-gmd-supplement-quarterly') THEN
    SELECT cron.unschedule('ingest-country-gmd-supplement-quarterly');
  END IF;
END $$;

-- Schedule: quarterly on day 1 at 04:00 UTC
SELECT cron.schedule(
  'ingest-country-gmd-supplement-quarterly',
  '0 4 1 1,4,7,10 *',
  $$
    SELECT net.http_post(
      'https://ohefbbvldkoflrcjixow.functions.supabase.co/ingest-country-gmd-supplement',
      '{}'::jsonb,
      '{"Authorization": "Bearer '' || current_setting(''app.settings.service_role_key'') || ''", "Content-Type": "application/json"}'::jsonb
    )
  $$
);

-- Log for debugging
SELECT cron.unschedule('ingest-country-gmd-supplement-quarterly-2026-04'); -- placeholder cleanup
```

Apply:
```bash
npx supabase db push
```

Verify:
```sql
SELECT * FROM cron.job WHERE jobname LIKE '%gmd%';
-- Should show: ingest-country-gmd-supplement-quarterly, schedule = '0 4 1 1,4,7,10 *', next_run at next quarter boundary
```

---

## 6. Frontend Updates

### 6.1 `src/lib/macro-metrics.ts`

Replace entire file content:

```typescript
/**
 * Standardized metric keys for programmatic country pages.
 * Maps 1:1 to vw_country_terminal column names.
 */
export const COUNTRY_METRIC_GROUPS = {
  ECONOMIC_SIZE: [
    { key: 'gdp_usd_bn', label: 'GDP (Nominal)', unit: '$Bn', source: 'IMF' },
    { key: 'gdp_per_capita_usd', label: 'GDP per Capita', unit: '$', source: 'WB' },
    { key: 'population_mn', label: 'Population', unit: 'Mn', source: 'UN' },
  ],
  GROWTH_INFLATION: [
    { key: 'gdp_yoy_pct', label: 'Real GDP Growth', unit: '%', source: 'WB' },
    { key: 'cpi_yoy_pct', label: 'Inflation (CPI)', unit: '%', source: 'IMF' },
    { key: 'unemployment_pct', label: 'Unemployment', unit: '%', source: 'ILO' },
  ],
  MONETARY_POLICY: [
    { key: 'central_bank_rate_pct', label: 'Policy Rate', unit: '%', source: 'FRED/GMD' },
    { key: 'yield_2y_pct', label: '2Y Yield', unit: '%', source: 'FRED' },
    { key: 'yield_10y_pct', label: '10Y Yield', unit: '%', source: 'FRED' },
  ],
  EXTERNAL_SECTOR: [
    { key: 'ca_gdp_pct', label: 'Current Account % GDP', unit: '%', source: 'IMF' },
    { key: 'exports_gdp_pct', label: 'Exports % GDP', unit: '%', source: 'WTO' },
    { key: 'imports_gdp_pct', label: 'Imports % GDP', unit: '%', source: 'WTO' },
    { key: 'fx_reserves_bn', label: 'FX Reserves', unit: '$Bn', source: 'IMF' },
    { key: 'gold_tonnes', label: 'Gold Reserves', unit: 'T', source: 'WGC' },
  ],
  FISCAL_HEALTH: [
    { key: 'gov_debt_gdp_pct', label: 'Gov Debt % GDP', unit: '%', source: 'IMF' },
    { key: 'budget_deficit_gdp_pct', label: 'Budget Deficit % GDP', unit: '%', source: 'IMF' },
  ],
};

export const ALL_COUNTRY_METRIC_KEYS = Object.values(COUNTRY_METRIC_GROUPS)
  .flat()
  .map(m => m.key);
```

### 6.2 `src/pages/CountryProfilePage.tsx`

Update `TERMINAL_SECTIONS` array order to match new groups:

```typescript
const TERMINAL_SECTIONS = [
  { id: 'size', title: 'Economic Size', icon: TrendingUp, metrics: COUNTRY_METRIC_GROUPS.ECONOMIC_SIZE },
  { id: 'growth', title: 'Growth & Inflation', icon: Activity, metrics: COUNTRY_METRIC_GROUPS.GROWTH_INFLATION },
  { id: 'monetary', title: 'Monetary Policy', icon: TrendingUp, metrics: COUNTRY_METRIC_GROUPS.MONETARY_POLICY },
  { id: 'external', title: 'External Sector', icon: Globe, metrics: COUNTRY_METRIC_GROUPS.EXTERNAL_SECTOR },
  { id: 'fiscal', title: 'Fiscal Health', icon: Lock, metrics: COUNTRY_METRIC_GROUPS.FISCAL_HEALTH },
];
```

The existing mapping logic (`countryData?.[viewKey as keyof typeof countryData]`) automatically picks up all 16 columns from the view. **No further changes required**.

### 6.3 Icons

Ensure these icons are imported (already present): `Activity, TrendingUp, Globe, Lock`. No changes needed.

---

## 7. JSON File Commit

Place converted file at:
```
public/data/gmd/40-countries-latest.json
```

Ensure `public/` directory exists, create `data/gmd/` subfolder.

Commit:
```bash
git add public/data/gmd/40-countries-latest.json
git commit -m "feat(seo): add GMD macro fundamentals JSON for 40 countries"
```

**Git LFS not needed** — file is ~10 KB.

---

## 8. Runbook / Step-by-Step Execution

### Day 1 — Local Conversion + Git Commit

```bash
# 1. Clone GMD repo (if not already)
git clone https://github.com/beatnyk77/Global-Macro-Database.git ../Global-Macro-Database

# 2. Install Python deps
pip install pandas pyreadstat

# 3. Run converter
python scripts/convert-gmd-to-json.py

# Expected output:
#   Latest year: 2024
#   ✓ US: 12 metrics
#   ✓ CN: 12 metrics
#   ...
#   ✅ Written 40 countries → public/data/gmd/40-countries-latest.json

# 4. Inspect top-level keys
jq '.countries | keys' public/data/gmd/40-countries-latest.json

# 5. Inspect one country
jq '.countries.US' public/data/gmd/40-countries-latest.json

# 6. Quick sanity check — US GDP should be ~28,000 ($Bn)
grep -A3 "gdp_usd_bn" public/data/gmd/40-countries-latest.json | head -3

# 7. Stage + commit
git add public/data/gmd/40-countries-latest.json
git commit -m "feat(seo): add GMD 40-country fundamentals snapshot (2024)"
```

### Day 2 — Database Migrations + Edge Function

```bash
# 8. Create migration files
# (already written per plan — verify file names under supabase/migrations/ with timestamps 20260412*)

# 9. Push all migrations
npx supabase db push

# 10. Verify country count
npx supabase db remote sql "SELECT COUNT(*) AS total FROM g20_countries;"
# Should return 41 (20 original + 20 new + EU = 41, or 40 if EU excluded from target set)

npx supabase db remote sql "
  SELECT COUNT(*) AS total
  FROM vw_country_terminal
  WHERE iso IN ('US','CN','VN','NG','IE');
"
# Should return 4 (all 40 rows exist in view)

# 11. Deploy Edge Function
npx supabase functions deploy ingest-country-gmd-supplement --no-verify-jwt

# 12. Manually invoke for backfill (one-time)
npx supabase functions invoke ingest-country-gmd-supplement

# 13. Watch logs
npx supabase functions logs ingest-country-gmd-supplement --tail

# 14. Verify data landed
npx supabase db remote sql "
  SELECT source, COUNT(*) AS rows FROM country_metrics WHERE source = 'GMD' GROUP BY source;
"
# Expected: ~480 rows (40×12)

npx supabase db remote sql "
  SELECT iso, metric_key, value, as_of
  FROM country_metrics
  WHERE source = 'GMD' AND iso = 'US'
  ORDER BY metric_key;
"
# Should show 12 rows with numeric values and as_of = '2024-12-31'

# 15. Verify view exposes GMD columns
npx supabase db remote sql "
  SELECT gdp_usd_bn, gdp_yoy_pct, population_mn, ca_gdp_pct, gov_debt_gdp_pct
  FROM vw_country_terminal
  WHERE iso = 'US';
"
# All numeric (not NULL for US)
```

### Day 3 — Frontend Build + QA

```bash
# 16. Frontend deps + build
npm ci
npm run build
npm run preview

# 17. Local QA — visit in browser:
# - http://localhost:4173/countries/US
# - http://localhost:4173/countries/CN
# - http://localhost:4173/countries/IN
# - http://localhost:4173/countries/VN
# - http://localhost:4173/countries/NG

# Check:
# ✓ 5 sections visible
# ✓ ECONOMIC_SIZE: 3 cards (GDP, GDP/capita, Population)
# ✓ GROWTH_INFLATION: 3 cards (GDP growth, CPI, Unemployment)
# ✓ MONETARY_POLICY: 3 cards (Policy Rate, 2Y, 10Y)
# ✓ EXTERNAL_SECTOR: 5 cards (CA, Exports, Imports, FX Reserves, Gold)
# ✓ FISCAL_HEALTH: 2 cards (Gov Debt, Budget Deficit)
# Total: 16 cards

# ✓ No N/A placeholders for Tier-1 countries (US, CN, IN, JP, DE, GB)
# ✓ Some N/A expected for smaller EM (e.g., NG, PH) on select metrics — acceptable

# 18. DevTools → Console — no errors

# 19. View source → search for JSON-LD
# Should see <script type="application/ld+json"> with structured country data

# 20. Build + lint
npm run lint   # Should pass (or 0 errors)
npm run build  # Should pass (already run)
```

### Day 4 — Production Deploy + Cron Activation

```bash
# 21. Push to remote
git push origin main

# 22. Vercel deploys (or your hosting)
# Wait for production URL

# 23. Check cron is scheduled
npx supabase db remote sql "SELECT * FROM cron.job WHERE jobname LIKE '%gmd%';"
# next_run should show a future date

# 24. After first quarterly run (or trigger manually), verify production
curl -s https://<your-prod-url>/countries/US | grep -o '"gdp_usd_bn":[0-9.]*'
# Should output the value

# 25. Monitor function logs for 24h
npx supabase functions logs ingest-country-gmd-supplement --tail
```

---

## 9. Rollback Plan

**If data quality is poor or some metric values are clearly wrong**:

```sql
-- Remove only GMD data (FRED/yield/reserves preserved)
DELETE FROM country_metrics WHERE source = 'GMD';

-- Disable quarterly cron
SELECT cron.unschedule('ingest-country-gmd-supplement-quarterly');

-- Optionally remove 20 new countries (if you want to revert g20_countries to 20)
DELETE FROM g20_countries WHERE code IN (
  'SG','CH','TH','MY','AE','QA','IL','CL','NL','ES','VN','PH','EG','NG','KW','NO','SE','PL','GR','IE'
);
```

**No need to touch**:
- `vw_country_terminal` view (just won't return GMD columns once rows deleted)
- Frontend code (gracefully shows N/A if column is NULL)

---

## 10. Verification Checklist

### Database Coverage
- [ ] `g20_countries` contains 40 countries (COUNT = 40 or 41 with EU)
- [ ] `vw_country_terminal` returns a row for every of the 40 ISOs
- [ ] `SELECT COUNT(*) FROM country_metrics WHERE source = 'GMD'` → ~480+ rows
- [ ] US row has non-NULL: `gdp_usd_bn` ≈ 28000, `gdp_yoy_pct` ~ 2-3, `population_mn` ~ 333

### Frontend Rendering
- [ ] `/countries/US` → 16 metric cards with numbers
- [ ] `/countries/CN` → 16 metric cards (may have 1–2 N/A, OK)
- [ ] `/countries/VN` → ≥10 GMD cards populated
- [ ] No JavaScript console errors
- [ ] Page load time measured < 2s (Network →waterfall)

### SEO
- [ ] Page source contains `<script type="application/ld+json">`
- [ ] Structured data includes `"@type": "Country"` or economic indicators
- [ ] Title tag = `{ISO} Macro Intelligence Profile`
- [ ] Meta description present and meaningful

### CI/CD
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Migrations applied on staging + production
- [ ] Edge function status = ACTIVE in Supabase dashboard

### Cron
- [ ] `SELECT * FROM cron.job WHERE jobname = 'ingest-country-gmd-supplement-quarterly'` returns a row
- [ ] `next_run` column is in the future (next quarter)
- [ ] After manual invocation: logs show "Upserted X rows"

---

## 11. Expected File List

```
scripts/convert-gmd-to-json.py                      (NEW — local one-time script)
public/data/gmd/40-countries-latest.json            (NEW — committed data file)
supabase/functions/ingest-country-gmd-supplement/
  └── index.ts                                      (NEW — quarterly Edge Function)
supabase/migrations/
  ├── 20260412000000_add_remaining_40.sql           (NEW — 20 countries)
  ├── 20260412000001_extend_vw_country_terminal.sql(NEW — expanded view)
  ├── 20260412000002_country_gmd_cron.sql          (NEW — quarterly schedule)
src/lib/macro-metrics.ts                            (UPDATED — 5 sections, 16 metrics)
src/pages/CountryProfilePage.tsx                    (UPDATED — TERMINAL_SECTIONS order)
PLANS.md                                            (UPDATED — implementation note)
```

---

## 12. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `data_final.dta` format not as expected (wide vs long mismatch) | Medium | Script fails | Run locally first, inspect `df.columns`, adjust conditionals |
| Some GMD variables genuinely missing for target countries | Low-Med | Partial data (N/A shown) | Acceptable — already planned; fall back to FRED where possible |
| `nGDP_USD` unit ambiguity (millions vs billions) | Low | GDP off by 1000× | Verify with US sample: should be ~28,000 ($Bn). Adjust transform: ÷1e6 → ÷1e3 if units wrong |
| Fraction vs percent stored differently across vars | Medium | Numbers off by 100× | Use heuristic: if value < 10 → is %; if value >= 10 && < 100 → might be % or numeric; heuristics in script handle both |
| Cron HTTP auth fails (service_role_key missing) | Low | Ingest silently fails | Verify service key set in Supabase → Project Settings → API; test with `invoke` first |
| JSON file not publicly accessible at `/data/gmd/...` | Low | Function throws 404 | Upload to Supabase Storage (public) OR use GitHub raw URL; adjust `GMD_JSON_PATH` accordingly |
| `country_metrics` conflict on (iso, metric_key) with existing FRED rows | Very Low | GMD rows fail to upsert | Use `onConflict: 'iso, metric_key'` — GMD keys are disjoint from FRED keys, so no conflict expected |

---

## 13. Success Criteria (Post-Launch)

- ✅ All 40 country URLs (`/countries/{ISO}`) return HTTP 200 with 16 metric cards
- ✅ `vw_country_terminal` query returns 40 rows, all columns populated for US/CN/IN/JP/DE/GB/FR
- ✅ No Supabase error logs for `ingest-country-gmd-supplement` after initial run
- ✅ JSON file accessible at `https://<project>.supabase.co/data/gmd/40-countries-latest.json`
- ✅ Cron scheduled for next quarter (Jan/Apr/Jul/Oct 04:00 UTC)
- ✅ Production build size < 200 KB for country page
- ✅ SEO audit (Screaming Frog / Sitebulb) shows all 40 pages indexed with structured data

---

## 14. Rollback Triggers

Trigger rollback if:
- >20% of GMD values are clearly erroneous (negative GDP, population < 1000, etc.)
- Build fails after merging
- Database migration fails on production
- Cron schedule triggers errors continuously for 3+ runs

Rollback commands collected in Section 9 above.

---

## 15. Timeline Estimate

| Task | Owner | Est. Time |
|---|---|---|
| Convert GMD → JSON locally | You | 30 min (includes GMD clone) |
| Review output, validate units | You | 15 min |
| Commit JSON + create 40-country Git commit | You | 10 min |
| Write 3 migration files | Dev | 45 min |
| Write Edge Function code | Dev | 30 min |
| Update frontend (macro-metrics + CountryProfilePage) | Dev | 20 min |
| QA on localhost (all 5 representative countries) | QA | 30 min |
| Deploy to staging + smoke test | DevOps | 20 min |
| Production rollout | DevOps | 15 min |
| **Total** | | **~3.5 hours** |

---

## 16. Post-Launch: Scaling Beyond 40

Once top 40 are stable:

1. **Expand to all ~240 GMD countries**:
   - Add all ISO codes to `countries` reference (create new `all_countries` table or extend `g20_countries`)
   - Update COUNTRIES constant in Edge Function to 240
   - JSON file grows to ~240 × 12 ≈ 80 KB — still tiny (gzipped ~15 KB)

2. **Host JSON on CDN**: Move from Supabase public bucket → Vercel Blob / Cloudflare R2 for faster edge fetch

3. **Metric enrichment**: Add crisis flags (`BankingCrisis`, `SovDebtCrisis`, `CurrencyCrisis`) as badge overlays on country cards

4. **Historical time-series**: Convert GMD panel to wide-format per-country files with 10-year history; integrate with existing `metric_observations` table for charting

5. **SEO auto-submit**: Add endpoint to ping search engines after quarterly refresh

---

**End of Plan**
