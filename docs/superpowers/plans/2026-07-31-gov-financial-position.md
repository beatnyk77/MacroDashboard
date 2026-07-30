# Government Financial Position Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Government Financial Position board fed by official Fiscal Data JSON (FRUSG accrual five statements, MTS Table 5 monthly agency outlays, annual receipts by department), cached in Supabase, linked from the US Macro & Fiscal Lab.

**Architecture:** Edge Function `ingest-gov-financial-position` paginates Fiscal Data APIs into domain tables; SQL views precompute ranks, shares, HHI, and narrative scalars; React board at `/labs/gov-financial-position` reads views via TanStack Query; teaser strip on US Macro & Fiscal Lab deep-links into the board.

**Tech Stack:** Vite + React 18 + TypeScript, TanStack Query v5, Supabase (Postgres + Deno Edge Functions + RLS), Recharts, React Router v7, Tailwind/shadcn, vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-31-gov-financial-position-design.md`
- Official Fiscal Data JSON only — no HTML scrape; no Monthly Treasury Disbursements XLSX in v1
- No mock / placeholder numbers — skeleton or explicit unavailable
- Dual-basis labeling: FRUSG = accrual/GAAP; MTS + receipts = cash/budget
- Views default `restmt_flag = 'N'`; store all restatements in raw tables
- HHI displayed as **0–1 scale** (sum of squared shares); label “HHI (0–1)”
- Path alias `@/` → `src/`
- Pages: named exports; routes lazy in `App.tsx`
- ESLint `--max-warnings 0`; vitest green; `npm run build` green
- Ingest uses `serveIngest` + `fetchWithRetry` from `supabase/functions/_shared/`
- RLS: public SELECT, service_role write (match `us_debt_maturities`)

---

## File Map

**Create:**
- `supabase/migrations/20260731000000_gov_financial_position.sql` — tables, RLS, indexes, views, agency map seed, optional cron
- `supabase/functions/ingest-gov-financial-position/index.ts` — multi-endpoint ingest
- `docs/gfp-fiscal-data-endpoints.md` — endpoint/field/refresh docs
- `src/features/gfp/lib/types.ts` — TS types for views/rows
- `src/features/gfp/lib/insights.ts` — pure insight builders
- `src/features/gfp/lib/exportSeries.ts` — CSV/JSON export helpers
- `src/features/gfp/lib/format.ts` — $B / $T formatters, basis labels
- `src/features/gfp/lib/__tests__/insights.test.ts`
- `src/features/gfp/lib/__tests__/exportSeries.test.ts`
- `src/hooks/useGfpNetCost.ts`
- `src/hooks/useGfpBalanceSheet.ts`
- `src/hooks/useGfpBridges.ts`
- `src/hooks/useGfpMtsOutlays.ts`
- `src/hooks/useGfpReceipts.ts`
- `src/hooks/useGfpInsights.ts`
- `src/features/gfp/components/GfpKpiStrip.tsx`
- `src/features/gfp/components/NetCostByAgencyChart.tsx`
- `src/features/gfp/components/BalanceSheetTrendChart.tsx`
- `src/features/gfp/components/AccrualBridgeTables.tsx`
- `src/features/gfp/components/AgencyOutlaysRankTable.tsx`
- `src/features/gfp/components/AgencyOutlaysSeriesChart.tsx`
- `src/features/gfp/components/ReceiptsByAgencyPanel.tsx`
- `src/features/gfp/components/ConcentrationPanel.tsx`
- `src/features/gfp/components/GfpInsightList.tsx`
- `src/features/gfp/components/GfpExportButton.tsx`
- `src/features/gfp/components/GfpProvenanceFooter.tsx`
- `src/features/gfp/components/GfpTeaserCard.tsx`
- `src/pages/labs/GovFinancialPositionLab.tsx`

**Modify:**
- `src/App.tsx` — lazy route
- `src/layout/GlobalLayout.tsx` — nav item
- `src/pages/labs/USMacroFiscalLab.tsx` — teaser section
- `src/lib/pipelineCatalog.ts` — pipeline entry
- `src/pages/DataSourcesPage.tsx` — source blurb (optional short)
- `src/smoke.test.tsx` — page smoke test
- `src/config/contentRelations.ts` — related links both ways
- `src/types/database.types.ts` — add tables/views if not regenerating via CLI

---

### Task 1: Schema migration (tables + RLS + agency map)

**Files:**
- Create: `supabase/migrations/20260731000000_gov_financial_position.sql`

**Interfaces:**
- Consumes: none
- Produces: tables `frusg_net_cost`, `frusg_balance_sheet`, `frusg_net_position`, `frusg_reconciliations`, `frusg_cash_balance`, `mts_agency_outlays`, `treasury_receipts_by_dept`, `agency_code_map` with RLS

- [ ] **Step 1: Write migration SQL**

```sql
-- supabase/migrations/20260731000000_gov_financial_position.sql
-- Government Financial Position: FRUSG accrual + MTS outlays + receipts by dept

CREATE TABLE IF NOT EXISTS public.frusg_net_cost (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date date NOT NULL,
  stmt_fiscal_year integer NOT NULL,
  restmt_flag text NOT NULL CHECK (restmt_flag IN ('Y', 'N')),
  agency_nm text NOT NULL,
  gross_cost_bil numeric,
  earned_revenue_bil numeric,
  change_assumptions_bil numeric,
  net_cost_bil numeric,
  src_line_nbr text NOT NULL,
  source_endpoint text NOT NULL DEFAULT 'v2/accounting/od/statement_net_cost',
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stmt_fiscal_year, restmt_flag, agency_nm, src_line_nbr)
);

CREATE TABLE IF NOT EXISTS public.frusg_balance_sheet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date date NOT NULL,
  stmt_fiscal_year integer NOT NULL,
  restmt_flag text NOT NULL CHECK (restmt_flag IN ('Y', 'N')),
  account_desc text NOT NULL,
  line_item_desc text NOT NULL,
  position_bil numeric,
  src_line_nbr text NOT NULL,
  source_endpoint text NOT NULL DEFAULT 'v2/accounting/od/balance_sheets',
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stmt_fiscal_year, restmt_flag, account_desc, line_item_desc, src_line_nbr)
);

CREATE TABLE IF NOT EXISTS public.frusg_net_position (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date date NOT NULL,
  stmt_fiscal_year integer NOT NULL,
  restmt_flag text NOT NULL CHECK (restmt_flag IN ('Y', 'N')),
  account_desc text NOT NULL,
  line_item_desc text NOT NULL,
  non_dedicated_funds_bil numeric,
  dedicated_funds_bil numeric,
  eliminations_bil numeric,
  consolidated_bil numeric,
  src_line_nbr text NOT NULL,
  source_endpoint text NOT NULL DEFAULT 'v1/accounting/od/net_position',
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stmt_fiscal_year, restmt_flag, account_desc, line_item_desc, src_line_nbr)
);

CREATE TABLE IF NOT EXISTS public.frusg_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date date NOT NULL,
  stmt_fiscal_year integer NOT NULL,
  restmt_flag text NOT NULL CHECK (restmt_flag IN ('Y', 'N')),
  account_desc text NOT NULL,
  component_desc text,
  line_item_desc text NOT NULL,
  position_bil numeric,
  src_line_nbr text NOT NULL,
  source_endpoint text NOT NULL DEFAULT 'v1/accounting/od/reconciliations',
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stmt_fiscal_year, restmt_flag, account_desc, line_item_desc, src_line_nbr)
);

CREATE TABLE IF NOT EXISTS public.frusg_cash_balance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date date NOT NULL,
  stmt_fiscal_year integer NOT NULL,
  restmt_flag text NOT NULL CHECK (restmt_flag IN ('Y', 'N')),
  account_desc text NOT NULL,
  component_desc text,
  line_item_desc text NOT NULL,
  position_bil numeric,
  src_line_nbr text NOT NULL,
  source_endpoint text NOT NULL DEFAULT 'v1/accounting/od/cash_balance',
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stmt_fiscal_year, restmt_flag, account_desc, line_item_desc, src_line_nbr)
);

CREATE TABLE IF NOT EXISTS public.mts_agency_outlays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date date NOT NULL,
  classification_id text NOT NULL,
  parent_id text,
  classification_desc text NOT NULL,
  current_month_net_outly numeric,
  current_fytd_net_outly numeric,
  prior_fytd_net_outly numeric,
  data_type_cd text,
  record_type_cd text,
  sequence_level_nbr text,
  line_code_nbr text,
  src_line_nbr text NOT NULL,
  source_endpoint text NOT NULL DEFAULT 'v1/accounting/mts/mts_table_5',
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (record_date, classification_id, src_line_nbr)
);

CREATE TABLE IF NOT EXISTS public.treasury_receipts_by_dept (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date date NOT NULL,
  receipt_line_item_nm text NOT NULL,
  aid_cd text NOT NULL,
  a_cd text,
  main_cd text NOT NULL,
  sub_cd text NOT NULL,
  receipt_amt numeric,
  src_line_nbr text NOT NULL,
  source_endpoint text NOT NULL DEFAULT 'v1/accounting/od/receipts_by_department',
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (record_date, aid_cd, main_cd, sub_cd, receipt_line_item_nm, src_line_nbr)
);

CREATE TABLE IF NOT EXISTS public.agency_code_map (
  aid_cd text PRIMARY KEY,
  agency_name text NOT NULL,
  notes text
);

-- Seed major AID codes (OMB A-11 Appendix C subset; extend as needed)
INSERT INTO public.agency_code_map (aid_cd, agency_name) VALUES
  ('000', 'Government-wide / Unassigned'),
  ('005', 'Government Accountability Office'),
  ('010', 'The Judiciary'),
  ('011', 'Executive Office of the President'),
  ('012', 'Department of Agriculture'),
  ('013', 'Department of Commerce'),
  ('014', 'Department of the Interior'),
  ('015', 'Department of Justice'),
  ('016', 'Department of Labor'),
  ('017', 'Department of the Navy'),
  ('019', 'Department of State'),
  ('020', 'Department of the Treasury'),
  ('021', 'Department of the Army'),
  ('024', 'Office of Personnel Management'),
  ('025', 'National Credit Union Administration'),
  ('028', 'Social Security Administration'),
  ('029', 'Federal Trade Commission'),
  ('031', 'Nuclear Regulatory Commission'),
  ('033', 'Smithsonian Institution'),
  ('036', 'Department of Veterans Affairs'),
  ('047', 'General Services Administration'),
  ('049', 'National Science Foundation'),
  ('050', 'Securities and Exchange Commission'),
  ('051', 'Federal Deposit Insurance Corporation'),
  ('057', 'Department of the Air Force'),
  ('068', 'Environmental Protection Agency'),
  ('069', 'Department of Transportation'),
  ('070', 'Department of Homeland Security'),
  ('072', 'Agency for International Development'),
  ('073', 'Small Business Administration'),
  ('075', 'Department of Health and Human Services'),
  ('080', 'National Aeronautics and Space Administration'),
  ('086', 'Department of Housing and Urban Development'),
  ('089', 'Department of Energy'),
  ('091', 'Department of Education'),
  ('097', 'Department of Defense (Military Programs)')
ON CONFLICT (aid_cd) DO UPDATE SET agency_name = EXCLUDED.agency_name;

-- RLS helper: enable + public read + service write for each table
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'frusg_net_cost','frusg_balance_sheet','frusg_net_position',
    'frusg_reconciliations','frusg_cash_balance','mts_agency_outlays',
    'treasury_receipts_by_dept','agency_code_map'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Allow public read access on '||t, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO public USING (true)',
      'Allow public read access on '||t, t
    );
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Allow service role full access on '||t, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      'Allow service role full access on '||t, t
    );
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_frusg_net_cost_fy ON public.frusg_net_cost (stmt_fiscal_year, restmt_flag);
CREATE INDEX IF NOT EXISTS idx_frusg_bs_fy ON public.frusg_balance_sheet (stmt_fiscal_year, restmt_flag);
CREATE INDEX IF NOT EXISTS idx_mts_outlays_date ON public.mts_agency_outlays (record_date DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_date_aid ON public.treasury_receipts_by_dept (record_date, aid_cd);

COMMENT ON TABLE public.frusg_net_cost IS 'FRUSG Statement of Net Cost by agency ($B accrual). Source: Fiscal Data statement_net_cost.';
COMMENT ON TABLE public.mts_agency_outlays IS 'MTS Table 5 agency/program net outlays (cash). Source: Fiscal Data mts_table_5.';
```

- [ ] **Step 2: Apply migration locally (if Supabase stack available)**

```bash
npx supabase db push
# or: npx supabase migration up
```

Expected: migration applies without error.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260731000000_gov_financial_position.sql
git commit -m "feat(gfp): add Government Financial Position schema and agency map"
```

---

### Task 2: Serving views

**Files:**
- Modify: `supabase/migrations/20260731000000_gov_financial_position.sql` (append views)  
  OR create: `supabase/migrations/20260731000001_gov_financial_position_views.sql` if Task 1 already committed

**Interfaces:**
- Consumes: raw tables from Task 1
- Produces: views listed below for hooks

- [ ] **Step 1: Add views SQL**

```sql
-- Prefer original (non-restated) FRUSG rows
CREATE OR REPLACE VIEW public.vw_frusg_net_cost_yearly AS
SELECT
  stmt_fiscal_year,
  restmt_flag,
  agency_nm,
  net_cost_bil,
  gross_cost_bil,
  earned_revenue_bil,
  record_date,
  CASE
    WHEN lower(agency_nm) = 'total' THEN true
    ELSE false
  END AS is_total_row
FROM public.frusg_net_cost
WHERE restmt_flag = 'N';

CREATE OR REPLACE VIEW public.vw_frusg_net_cost_concentration AS
WITH agency AS (
  SELECT stmt_fiscal_year, agency_nm, net_cost_bil
  FROM public.vw_frusg_net_cost_yearly
  WHERE NOT is_total_row
    AND net_cost_bil IS NOT NULL
    AND net_cost_bil > 0
),
tot AS (
  SELECT stmt_fiscal_year, sum(net_cost_bil) AS total_net_cost
  FROM agency
  GROUP BY 1
),
ranked AS (
  SELECT
    a.stmt_fiscal_year,
    a.agency_nm,
    a.net_cost_bil,
    a.net_cost_bil / nullif(t.total_net_cost, 0) AS share,
    row_number() OVER (PARTITION BY a.stmt_fiscal_year ORDER BY a.net_cost_bil DESC) AS rnk
  FROM agency a
  JOIN tot t ON t.stmt_fiscal_year = a.stmt_fiscal_year
)
SELECT
  stmt_fiscal_year,
  sum(CASE WHEN rnk <= 5 THEN share ELSE 0 END) AS top5_share,
  sum(CASE WHEN rnk <= 10 THEN share ELSE 0 END) AS top10_share,
  sum(share * share) AS hhi,
  max(total_net_cost) AS total_net_cost
FROM ranked
JOIN tot USING (stmt_fiscal_year)
GROUP BY stmt_fiscal_year, total_net_cost;

-- Balance sheet summary: pick total rows by account_desc/line_item heuristics
CREATE OR REPLACE VIEW public.vw_frusg_balance_sheet_summary AS
SELECT
  stmt_fiscal_year,
  max(record_date) AS record_date,
  sum(CASE WHEN lower(line_item_desc) = 'total assets' THEN position_bil END) AS total_assets_bil,
  sum(CASE WHEN lower(line_item_desc) = 'total liabilities' THEN position_bil END) AS total_liabilities_bil,
  sum(CASE WHEN lower(line_item_desc) IN ('net position', 'total net position') THEN position_bil END) AS net_position_bil
FROM public.frusg_balance_sheet
WHERE restmt_flag = 'N'
GROUP BY stmt_fiscal_year;

CREATE OR REPLACE VIEW public.vw_frusg_bs_line_items AS
SELECT stmt_fiscal_year, record_date, account_desc, line_item_desc, position_bil, src_line_nbr
FROM public.frusg_balance_sheet
WHERE restmt_flag = 'N';

CREATE OR REPLACE VIEW public.vw_frusg_net_position_summary AS
SELECT stmt_fiscal_year, record_date, account_desc, line_item_desc,
       consolidated_bil, non_dedicated_funds_bil, dedicated_funds_bil, eliminations_bil
FROM public.frusg_net_position
WHERE restmt_flag = 'N';

CREATE OR REPLACE VIEW public.vw_frusg_reconciliation_summary AS
SELECT stmt_fiscal_year, record_date, account_desc, component_desc, line_item_desc, position_bil
FROM public.frusg_reconciliations
WHERE restmt_flag = 'N';

CREATE OR REPLACE VIEW public.vw_frusg_cash_balance_summary AS
SELECT stmt_fiscal_year, record_date, account_desc, component_desc, line_item_desc, position_bil
FROM public.frusg_cash_balance
WHERE restmt_flag = 'N';

-- MTS: keep detail-ish rows; exclude blank amounts for charts
CREATE OR REPLACE VIEW public.vw_mts_agency_outlays_monthly AS
SELECT
  record_date,
  classification_id,
  parent_id,
  classification_desc,
  current_month_net_outly,
  current_fytd_net_outly,
  prior_fytd_net_outly,
  sequence_level_nbr,
  data_type_cd,
  line_code_nbr
FROM public.mts_agency_outlays
WHERE current_month_net_outly IS NOT NULL;

CREATE OR REPLACE VIEW public.vw_mts_agency_outlays_rank AS
WITH latest AS (
  SELECT max(record_date) AS record_date FROM public.mts_agency_outlays
),
month_rows AS (
  SELECT m.*
  FROM public.mts_agency_outlays m
  JOIN latest l ON m.record_date = l.record_date
  WHERE m.current_month_net_outly IS NOT NULL
    AND m.current_month_net_outly > 0
    AND lower(m.classification_desc) NOT IN ('total', 'total outlays')
),
tot AS (
  SELECT sum(current_month_net_outly) AS total_outly FROM month_rows
),
hist AS (
  SELECT classification_desc,
         stddev_samp(current_month_net_outly) AS vol_12m
  FROM public.mts_agency_outlays
  WHERE record_date >= (SELECT record_date - interval '12 months' FROM latest)
    AND current_month_net_outly IS NOT NULL
  GROUP BY 1
)
SELECT
  m.record_date,
  m.classification_desc,
  m.current_month_net_outly,
  m.current_fytd_net_outly,
  m.prior_fytd_net_outly,
  CASE
    WHEN m.prior_fytd_net_outly IS NOT NULL AND m.prior_fytd_net_outly <> 0
    THEN (m.current_fytd_net_outly - m.prior_fytd_net_outly) / abs(m.prior_fytd_net_outly)
    ELSE NULL
  END AS yoy_fytd,
  m.current_month_net_outly / nullif(t.total_outly, 0) AS share,
  h.vol_12m,
  row_number() OVER (ORDER BY m.current_month_net_outly DESC) AS rnk
FROM month_rows m
CROSS JOIN tot t
LEFT JOIN hist h ON h.classification_desc = m.classification_desc;

CREATE OR REPLACE VIEW public.vw_receipts_by_agency_yearly AS
SELECT
  extract(year from r.record_date)::int AS fiscal_year_end_year,
  r.record_date,
  r.aid_cd,
  coalesce(m.agency_name, r.aid_cd) AS agency_name,
  sum(r.receipt_amt) AS receipt_amt
FROM public.treasury_receipts_by_dept r
LEFT JOIN public.agency_code_map m ON m.aid_cd = r.aid_cd
GROUP BY 1, 2, 3, 4;

CREATE OR REPLACE VIEW public.vw_gfp_narrative_inputs AS
WITH latest_fy AS (
  SELECT max(stmt_fiscal_year) AS fy FROM public.vw_frusg_net_cost_yearly
),
conc AS (
  SELECT c.* FROM public.vw_frusg_net_cost_concentration c
  JOIN latest_fy l ON c.stmt_fiscal_year = l.fy
),
bs AS (
  SELECT b.* FROM public.vw_frusg_balance_sheet_summary b
  JOIN latest_fy l ON b.stmt_fiscal_year = l.fy
),
prior_bs AS (
  SELECT b.* FROM public.vw_frusg_balance_sheet_summary b
  JOIN latest_fy l ON b.stmt_fiscal_year = l.fy - 1
)
SELECT
  (SELECT fy FROM latest_fy) AS latest_fy,
  conc.top5_share,
  conc.top10_share,
  conc.hhi,
  conc.total_net_cost,
  bs.total_assets_bil,
  bs.total_liabilities_bil,
  bs.net_position_bil,
  bs.net_position_bil - prior_bs.net_position_bil AS net_position_yoy_bil
FROM conc
CROSS JOIN bs
LEFT JOIN prior_bs ON true;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
-- Views inherit via table grants in many setups; ensure:
GRANT SELECT ON public.vw_frusg_net_cost_yearly TO anon, authenticated;
GRANT SELECT ON public.vw_frusg_net_cost_concentration TO anon, authenticated;
GRANT SELECT ON public.vw_frusg_balance_sheet_summary TO anon, authenticated;
GRANT SELECT ON public.vw_frusg_bs_line_items TO anon, authenticated;
GRANT SELECT ON public.vw_frusg_net_position_summary TO anon, authenticated;
GRANT SELECT ON public.vw_frusg_reconciliation_summary TO anon, authenticated;
GRANT SELECT ON public.vw_frusg_cash_balance_summary TO anon, authenticated;
GRANT SELECT ON public.vw_mts_agency_outlays_monthly TO anon, authenticated;
GRANT SELECT ON public.vw_mts_agency_outlays_rank TO anon, authenticated;
GRANT SELECT ON public.vw_receipts_by_agency_yearly TO anon, authenticated;
GRANT SELECT ON public.vw_gfp_narrative_inputs TO anon, authenticated;
```

- [ ] **Step 2: Apply + commit**

```bash
npx supabase db push
git add supabase/migrations/
git commit -m "feat(gfp): add GFP serving views for ranks, HHI, and narrative inputs"
```

---

### Task 3: Edge Function ingest

**Files:**
- Create: `supabase/functions/ingest-gov-financial-position/index.ts`
- Modify: `src/lib/pipelineCatalog.ts`

**Interfaces:**
- Consumes: Fiscal Data API; Supabase service role
- Produces: upserts into Task 1 tables; `IngestResult` counts per source

- [ ] **Step 1: Implement paginated fetch + upsert function**

```typescript
// supabase/functions/ingest-gov-financial-position/index.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { fetchWithRetry } from '../_shared/ingest_utils.ts';
import { serveIngest, IngestResult } from '../_shared/handler.ts';

const BASE = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service';
const PAGE = 10000;

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === 'null' || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function fetchAll(path: string, extraQuery = ''): Promise<any[]> {
  const rows: any[] = [];
  let page = 1;
  for (;;) {
    const url =
      `${BASE}/${path}?page%5Bsize%5D=${PAGE}&page%5Bnumber%5D=${page}&format=json` +
      (extraQuery ? `&${extraQuery}` : '');
    const res = await fetchWithRetry(url, { timeoutMs: 60_000, maxRetries: 2 });
    const json = await res.json();
    const data = json?.data ?? [];
    rows.push(...data);
    if (data.length < PAGE) break;
    page += 1;
    if (page > 200) break; // safety
  }
  return rows;
}

async function upsertChunk(supabase: any, table: string, rows: any[], onConflict: string) {
  if (!rows.length) return 0;
  const chunk = 500;
  let n = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const { error } = await supabase.from(table).upsert(slice, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
    n += slice.length;
  }
  return n;
}

serveIngest('ingest-gov-financial-position', async (req: Request): Promise<IngestResult> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const url = new URL(req.url);
  const backfill = url.searchParams.get('backfill') === 'true';
  const counts: Record<string, number> = {};
  const errors: string[] = [];

  // 1) Net Cost
  try {
    const raw = await fetchAll('v2/accounting/od/statement_net_cost');
    const rows = raw.map((r) => ({
      record_date: r.record_date,
      stmt_fiscal_year: Number(r.stmt_fiscal_year),
      restmt_flag: r.restmt_flag,
      agency_nm: r.agency_nm,
      gross_cost_bil: num(r.gross_cost_bil_amt),
      earned_revenue_bil: num(r.earned_revenue_bil_amt),
      change_assumptions_bil: num(r.change_assumptions_bil_amt),
      net_cost_bil: num(r.net_cost_bil_amt),
      src_line_nbr: String(r.src_line_nbr),
      source_endpoint: 'v2/accounting/od/statement_net_cost',
      ingested_at: new Date().toISOString(),
    }));
    counts.frusg_net_cost = await upsertChunk(
      supabase, 'frusg_net_cost', rows,
      'stmt_fiscal_year,restmt_flag,agency_nm,src_line_nbr',
    );
  } catch (e: any) {
    errors.push(`net_cost: ${e.message}`);
  }

  // 2) Balance sheets
  try {
    const raw = await fetchAll('v2/accounting/od/balance_sheets');
    const rows = raw.map((r) => ({
      record_date: r.record_date,
      stmt_fiscal_year: Number(r.stmt_fiscal_year),
      restmt_flag: r.restmt_flag,
      account_desc: r.account_desc,
      line_item_desc: r.line_item_desc,
      position_bil: num(r.position_bil_amt),
      src_line_nbr: String(r.src_line_nbr),
      source_endpoint: 'v2/accounting/od/balance_sheets',
      ingested_at: new Date().toISOString(),
    }));
    counts.frusg_balance_sheet = await upsertChunk(
      supabase, 'frusg_balance_sheet', rows,
      'stmt_fiscal_year,restmt_flag,account_desc,line_item_desc,src_line_nbr',
    );
  } catch (e: any) {
    errors.push(`balance_sheet: ${e.message}`);
  }

  // 3) Net position
  try {
    const raw = await fetchAll('v1/accounting/od/net_position');
    const rows = raw.map((r) => ({
      record_date: r.record_date,
      stmt_fiscal_year: Number(r.stmt_fiscal_year),
      restmt_flag: r.restmt_flag,
      account_desc: r.account_desc,
      line_item_desc: r.line_item_desc,
      non_dedicated_funds_bil: num(r.non_dedicated_funds_bil_amt),
      dedicated_funds_bil: num(r.dedicated_funds_bil_amt),
      eliminations_bil: num(r.eliminations_bil_amt),
      consolidated_bil: num(r.consolidated_bil_amt),
      src_line_nbr: String(r.src_line_nbr),
      source_endpoint: 'v1/accounting/od/net_position',
      ingested_at: new Date().toISOString(),
    }));
    counts.frusg_net_position = await upsertChunk(
      supabase, 'frusg_net_position', rows,
      'stmt_fiscal_year,restmt_flag,account_desc,line_item_desc,src_line_nbr',
    );
  } catch (e: any) {
    errors.push(`net_position: ${e.message}`);
  }

  // 4) Reconciliations
  try {
    const raw = await fetchAll('v1/accounting/od/reconciliations');
    const rows = raw.map((r) => ({
      record_date: r.record_date,
      stmt_fiscal_year: Number(r.stmt_fiscal_year),
      restmt_flag: r.restmt_flag,
      account_desc: r.account_desc,
      component_desc: r.component_desc ?? null,
      line_item_desc: r.line_item_desc,
      position_bil: num(r.position_bil_amt),
      src_line_nbr: String(r.src_line_nbr),
      source_endpoint: 'v1/accounting/od/reconciliations',
      ingested_at: new Date().toISOString(),
    }));
    counts.frusg_reconciliations = await upsertChunk(
      supabase, 'frusg_reconciliations', rows,
      'stmt_fiscal_year,restmt_flag,account_desc,line_item_desc,src_line_nbr',
    );
  } catch (e: any) {
    errors.push(`reconciliations: ${e.message}`);
  }

  // 5) Cash balance
  try {
    const raw = await fetchAll('v1/accounting/od/cash_balance');
    const rows = raw.map((r) => ({
      record_date: r.record_date,
      stmt_fiscal_year: Number(r.stmt_fiscal_year),
      restmt_flag: r.restmt_flag,
      account_desc: r.account_desc,
      component_desc: r.component_desc ?? null,
      line_item_desc: r.line_item_desc,
      position_bil: num(r.position_bil_amt),
      src_line_nbr: String(r.src_line_nbr),
      source_endpoint: 'v1/accounting/od/cash_balance',
      ingested_at: new Date().toISOString(),
    }));
    counts.frusg_cash_balance = await upsertChunk(
      supabase, 'frusg_cash_balance', rows,
      'stmt_fiscal_year,restmt_flag,account_desc,line_item_desc,src_line_nbr',
    );
  } catch (e: any) {
    errors.push(`cash_balance: ${e.message}`);
  }

  // 6) MTS Table 5 — full history if backfill; else last ~24 months via record_date filter
  try {
    const extra = backfill
      ? ''
      : `filter=record_date:gte:${new Date(Date.now() - 1000 * 60 * 60 * 24 * 800).toISOString().slice(0, 10)}`;
    const raw = await fetchAll('v1/accounting/mts/mts_table_5', extra);
    const rows = raw.map((r) => ({
      record_date: r.record_date,
      classification_id: String(r.classification_id),
      parent_id: r.parent_id != null ? String(r.parent_id) : null,
      classification_desc: r.classification_desc,
      current_month_net_outly: num(r.current_month_net_outly_amt),
      current_fytd_net_outly: num(r.current_fytd_net_outly_amt),
      prior_fytd_net_outly: num(r.prior_fytd_net_outly_amt),
      data_type_cd: r.data_type_cd ?? null,
      record_type_cd: r.record_type_cd ?? null,
      sequence_level_nbr: r.sequence_level_nbr != null ? String(r.sequence_level_nbr) : null,
      line_code_nbr: r.line_code_nbr != null ? String(r.line_code_nbr) : null,
      src_line_nbr: String(r.src_line_nbr),
      source_endpoint: 'v1/accounting/mts/mts_table_5',
      ingested_at: new Date().toISOString(),
    }));
    counts.mts_agency_outlays = await upsertChunk(
      supabase, 'mts_agency_outlays', rows,
      'record_date,classification_id,src_line_nbr',
    );
  } catch (e: any) {
    errors.push(`mts_table_5: ${e.message}`);
  }

  // 7) Receipts by department
  try {
    const raw = await fetchAll('v1/accounting/od/receipts_by_department');
    const rows = raw.map((r) => ({
      record_date: r.record_date,
      receipt_line_item_nm: r.receipt_line_item_nm,
      aid_cd: String(r.aid_cd),
      a_cd: r.a_cd === 'null' || r.a_cd == null ? null : String(r.a_cd),
      main_cd: String(r.main_cd),
      sub_cd: String(r.sub_cd),
      receipt_amt: num(r.receipt_amt),
      src_line_nbr: String(r.src_line_nbr),
      source_endpoint: 'v1/accounting/od/receipts_by_department',
      ingested_at: new Date().toISOString(),
    }));
    counts.treasury_receipts_by_dept = await upsertChunk(
      supabase, 'treasury_receipts_by_dept', rows,
      'record_date,aid_cd,main_cd,sub_cd,receipt_line_item_nm,src_line_nbr',
    );
  } catch (e: any) {
    errors.push(`receipts: ${e.message}`);
  }

  const anyOk = Object.values(counts).some((c) => c > 0);
  if (!anyOk) {
    return { ok: false, error: errors.join('; ') || 'No rows upserted', counts };
  }
  return {
    ok: true,
    counts,
    meta: { errors: errors.length ? errors : undefined, backfill },
  };
}, { timeoutMs: 45 * 60 * 1000 });
```

- [ ] **Step 2: Register pipeline catalog**

In `src/lib/pipelineCatalog.ts`, after `ingest-us-macro` entry, add:

```typescript
  {
    id: 'ingest-gov-financial-position',
    title: 'US Government Financial Position',
    tier: 'core',
    sources: ['US Treasury FiscalData (FRUSG, MTS Table 5, Receipts by Dept)'],
    surfaces: ['/labs/gov-financial-position', '/labs/us-macro-fiscal'],
    cadence: 'Nightly / Monthly releases',
  },
```

- [ ] **Step 3: Deploy function (when credentials available)**

```bash
npx supabase functions deploy ingest-gov-financial-position
# First full backfill:
# curl -X POST "$SUPABASE_URL/functions/v1/ingest-gov-financial-position?backfill=true" \
#   -H "Authorization: Bearer $SERVICE_ROLE_KEY"
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/ingest-gov-financial-position/index.ts src/lib/pipelineCatalog.ts
git commit -m "feat(gfp): add Fiscal Data ingest for FRUSG, MTS outlays, receipts"
```

---

### Task 4: Pure lib — types, insights, export, format + tests

**Files:**
- Create: `src/features/gfp/lib/types.ts`
- Create: `src/features/gfp/lib/format.ts`
- Create: `src/features/gfp/lib/insights.ts`
- Create: `src/features/gfp/lib/exportSeries.ts`
- Create: `src/features/gfp/lib/__tests__/insights.test.ts`
- Create: `src/features/gfp/lib/__tests__/exportSeries.test.ts`

**Interfaces:**
- Produces:
  - `buildGfpInsights(input: GfpNarrativeInputs, extras?: GfpInsightExtras): string[]`
  - `toCsv(rows: Record<string, unknown>[]): string`
  - `formatBillions(n: number | null): string`

- [ ] **Step 1: Write failing insight tests**

```typescript
// src/features/gfp/lib/__tests__/insights.test.ts
import { describe, it, expect } from 'vitest';
import { buildGfpInsights } from '../insights';

describe('buildGfpInsights', () => {
  it('emits top5 share and net position delta when data present', () => {
    const lines = buildGfpInsights({
      latest_fy: 2024,
      top5_share: 0.72,
      top10_share: 0.85,
      hhi: 0.18,
      total_net_cost: 7400,
      total_assets_bil: 5600,
      total_liabilities_bil: 45000,
      net_position_bil: -39000,
      net_position_yoy_bil: -1200,
    });
    expect(lines.some((l) => l.includes('Top 5') && l.includes('72%'))).toBe(true);
    expect(lines.some((l) => l.includes('net position') || l.includes('Net position'))).toBe(true);
  });

  it('returns empty array when latest_fy missing', () => {
    expect(buildGfpInsights({ latest_fy: null } as any)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx vitest run src/features/gfp/lib/__tests__/insights.test.ts
```

- [ ] **Step 3: Implement lib**

```typescript
// src/features/gfp/lib/types.ts
export interface GfpNarrativeInputs {
  latest_fy: number | null;
  top5_share?: number | null;
  top10_share?: number | null;
  hhi?: number | null;
  total_net_cost?: number | null;
  total_assets_bil?: number | null;
  total_liabilities_bil?: number | null;
  net_position_bil?: number | null;
  net_position_yoy_bil?: number | null;
}

export interface FrusgNetCostRow {
  stmt_fiscal_year: number;
  agency_nm: string;
  net_cost_bil: number | null;
  gross_cost_bil: number | null;
  is_total_row: boolean;
  record_date: string;
}

export interface FrusgBalanceSummary {
  stmt_fiscal_year: number;
  record_date: string;
  total_assets_bil: number | null;
  total_liabilities_bil: number | null;
  net_position_bil: number | null;
}

export interface MtsOutlayRankRow {
  record_date: string;
  classification_desc: string;
  current_month_net_outly: number | null;
  yoy_fytd: number | null;
  share: number | null;
  vol_12m: number | null;
  rnk: number;
}

export interface ReceiptsAgencyYear {
  fiscal_year_end_year: number;
  record_date: string;
  aid_cd: string;
  agency_name: string;
  receipt_amt: number | null;
}

export const GFP_BASIS = {
  accrual: 'Accrual / GAAP (Financial Report of the U.S. Government)',
  cash: 'Cash / budget (Monthly Treasury Statement / Combined Statement)',
} as const;
```

```typescript
// src/features/gfp/lib/format.ts
export function formatBillions(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1000) return `$${(n / 1000).toFixed(digits)}T`;
  return `$${n.toFixed(digits)}B`;
}

export function formatPct(share: number | null | undefined, digits = 1): string {
  if (share == null || Number.isNaN(share)) return '—';
  return `${(share * 100).toFixed(digits)}%`;
}
```

```typescript
// src/features/gfp/lib/insights.ts
import type { GfpNarrativeInputs } from './types';
import { formatBillions, formatPct } from './format';

export function buildGfpInsights(input: GfpNarrativeInputs): string[] {
  if (input.latest_fy == null) return [];
  const out: string[] = [];
  if (input.top5_share != null) {
    out.push(
      `Top 5 agencies account for ${formatPct(input.top5_share)} of net cost in FY${input.latest_fy} (accrual).`,
    );
  }
  if (input.hhi != null) {
    out.push(`Net cost concentration HHI (0–1) is ${input.hhi.toFixed(3)} in FY${input.latest_fy}.`);
  }
  if (input.net_position_yoy_bil != null) {
    const dir = input.net_position_yoy_bil < 0 ? 'declined' : 'improved';
    out.push(
      `Consolidated net position ${dir} by ${formatBillions(Math.abs(input.net_position_yoy_bil))} YoY (FY${input.latest_fy}).`,
    );
  }
  if (input.total_liabilities_bil != null && input.total_assets_bil != null) {
    out.push(
      `Balance sheet: assets ${formatBillions(input.total_assets_bil)} vs liabilities ${formatBillions(input.total_liabilities_bil)} (accrual).`,
    );
  }
  return out.slice(0, 6);
}
```

```typescript
// src/features/gfp/lib/exportSeries.ts
export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n');
}

export function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: Export test**

```typescript
// src/features/gfp/lib/__tests__/exportSeries.test.ts
import { describe, it, expect } from 'vitest';
import { toCsv } from '../exportSeries';

describe('toCsv', () => {
  it('serializes rows', () => {
    const csv = toCsv([{ a: 1, b: 'x,y' }]);
    expect(csv).toContain('a,b');
    expect(csv).toContain('"x,y"');
  });
});
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npx vitest run src/features/gfp/lib/__tests__
```

- [ ] **Step 6: Commit**

```bash
git add src/features/gfp/lib
git commit -m "feat(gfp): add types, formatters, insights, and export helpers"
```

---

### Task 5: Data hooks

**Files:**
- Create: `src/hooks/useGfpNetCost.ts`
- Create: `src/hooks/useGfpBalanceSheet.ts`
- Create: `src/hooks/useGfpBridges.ts`
- Create: `src/hooks/useGfpMtsOutlays.ts`
- Create: `src/hooks/useGfpReceipts.ts`
- Create: `src/hooks/useGfpInsights.ts`

**Interfaces:**
- Consumes: Supabase views from Task 2
- Produces: TanStack Query hooks with keys under `['gfp', ...]`

- [ ] **Step 1: Implement hooks** (pattern match `useUSFiscalStress`)

```typescript
// src/hooks/useGfpNetCost.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { FrusgNetCostRow } from '@/features/gfp/lib/types';

export function useGfpNetCost() {
  return useQuery({
    queryKey: ['gfp', 'net-cost'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_frusg_net_cost_yearly')
        .select('*')
        .order('stmt_fiscal_year', { ascending: true });
      if (error) throw error;
      return (data ?? []) as FrusgNetCostRow[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useGfpNetCostConcentration() {
  return useQuery({
    queryKey: ['gfp', 'net-cost-concentration'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_frusg_net_cost_concentration')
        .select('*')
        .order('stmt_fiscal_year', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 30,
  });
}
```

Implement remaining hooks similarly:

| Hook | View |
|------|------|
| `useGfpBalanceSheet` | `vw_frusg_balance_sheet_summary` + optional `vw_frusg_bs_line_items` |
| `useGfpBridges` | parallel queries: net_position_summary, reconciliation_summary, cash_balance_summary |
| `useGfpMtsOutlays` | `vw_mts_agency_outlays_rank` + `vw_mts_agency_outlays_monthly` (filter last 36 months client-side if needed) |
| `useGfpReceipts` | `vw_receipts_by_agency_yearly` |
| `useGfpInsights` | `vw_gfp_narrative_inputs` single row + map through `buildGfpInsights` |

**Note:** Until `database.types.ts` is regenerated, cast with `as` or use `.from('view_name' as any)` temporarily; prefer regenerating types:

```bash
npx supabase gen types typescript --local > src/types/database.types.ts
# or project-ref remote gen
```

If gen is heavy, add minimal table stubs to `database.types.ts` manually for new tables/views.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useGfp*.ts src/types/database.types.ts
git commit -m "feat(gfp): add TanStack Query hooks for GFP views"
```

---

### Task 6: UI components (ugly-correct)

**Files:** create all under `src/features/gfp/components/`

**Interfaces:**
- Consumes: hooks + format/insights/export
- Produces: presentational modules used by lab page

- [ ] **Step 1: Build components** (dark terminal aesthetic; Recharts; no mock data)

Minimum behavior:

1. **`GfpKpiStrip`** — 5 cards from concentration + BS summary + FreshnessChip if record_date available  
2. **`NetCostByAgencyChart`** — filter top 8 agencies by latest FY net cost; multi-line or stacked Recharts; label basis accrual  
3. **`BalanceSheetTrendChart`** — 3 series lines  
4. **`AccrualBridgeTables`** — three compact scrollable tables  
5. **`AgencyOutlaysRankTable`** — HTML table sortable by rnk; show size, share, yoy, vol; basis cash  
6. **`AgencyOutlaysSeriesChart`** — multi-select top agencies from monthly view  
7. **`ReceiptsByAgencyPanel`** — ranking for latest FY + simple bar  
8. **`ConcentrationPanel`** — HHI + top5/top10 lines  
9. **`GfpInsightList`** — bullet list  
10. **`GfpExportButton`** — export current net-cost or rank table as CSV/JSON via `toCsv` / `JSON.stringify`  
11. **`GfpProvenanceFooter`** — hardcode endpoint paths + last record dates from data  
12. **`GfpTeaserCard`** — compact KPIs + Link to `/labs/gov-financial-position`

Empty state pattern (all components):

```tsx
if (isLoading) return <div className="text-xs text-muted-foreground uppercase tracking-widest p-6">Loading…</div>;
if (error || !data?.length) return (
  <div className="text-xs text-muted-foreground/60 p-6 border border-white/5 rounded-xl">
    Data unavailable. Run ingest-gov-financial-position.
  </div>
);
```

- [ ] **Step 2: Commit**

```bash
git add src/features/gfp/components
git commit -m "feat(gfp): add GFP board UI modules"
```

---

### Task 7: Lab page + route + nav + teaser

**Files:**
- Create: `src/pages/labs/GovFinancialPositionLab.tsx`
- Modify: `src/App.tsx`
- Modify: `src/layout/GlobalLayout.tsx`
- Modify: `src/pages/labs/USMacroFiscalLab.tsx`
- Modify: `src/config/contentRelations.ts`
- Modify: `src/smoke.test.tsx`

- [ ] **Step 1: Page shell**

```tsx
// src/pages/labs/GovFinancialPositionLab.tsx — structure
export const GovFinancialPositionLab: React.FC = () => {
  return (
    <>
      <SEOManager
        title="Government Financial Position — FRUSG Net Cost, Balance Sheet & Agency Outlays"
        description="Institutional board for U.S. government GAAP net cost by agency, consolidated balance sheet, and monthly Treasury outlays by agency (MTS Table 5)."
        keywords={['FRUSG', 'Statement of Net Cost', 'US balance sheet', 'agency outlays', 'fiscal data']}
      />
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-16">
        {/* breadcrumbs + title + dual-basis callout */}
        <GfpKpiStrip />
        <GfpInsightList />
        <NetCostByAgencyChart />
        <ConcentrationPanel />
        <BalanceSheetTrendChart />
        <AccrualBridgeTables />
        <AgencyOutlaysRankTable />
        <AgencyOutlaysSeriesChart />
        <ReceiptsByAgencyPanel />
        <div className="flex justify-end"><GfpExportButton /></div>
        <GfpProvenanceFooter />
      </div>
    </>
  );
};
```

- [ ] **Step 2: Route in App.tsx**

```tsx
const GovFinancialPositionLab = lazy(() =>
  import('@/pages/labs/GovFinancialPositionLab').then((m) => ({ default: m.GovFinancialPositionLab })),
);
// inside Routes:
<Route path={trailRoute('/labs/gov-financial-position')} element={<GovFinancialPositionLab />} />
```

- [ ] **Step 3: Nav item in GlobalLayout `terminalNavItems`**

```tsx
{ id: 'gov-financial-position', label: 'Gov Financial Position', path: '/labs/gov-financial-position', icon: <ShieldAlert size={18} /> },
```

Place near `us-macro`.

- [ ] **Step 4: Teaser on USMacroFiscalLab**

After Fiscal Dominance section, insert:

```tsx
<section>
  <SectionErrorBoundary name="Government Financial Position Teaser">
    <GfpTeaserCard />
  </SectionErrorBoundary>
</section>
```

- [ ] **Step 5: contentRelations + smoke test**

```tsx
// smoke.test.tsx
import { GovFinancialPositionLab } from '@/pages/labs/GovFinancialPositionLab';
it('renders GovFinancialPositionLab without crashing', async () => {
  render(<...providers...><GovFinancialPositionLab /></...>);
  expect(await screen.findByText(/Government Financial Position/i, {}, { timeout: 10000 })).toBeInTheDocument();
});
```

- [ ] **Step 6: Run lint/tests/build**

```bash
npm run lint
npm run test
npm run build
```

Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add src/pages/labs/GovFinancialPositionLab.tsx src/App.tsx src/layout/GlobalLayout.tsx \
  src/pages/labs/USMacroFiscalLab.tsx src/config/contentRelations.ts src/smoke.test.tsx
git commit -m "feat(gfp): wire Government Financial Position lab, nav, and Fiscal Lab teaser"
```

---

### Task 8: Documentation + Data Sources page + cron note

**Files:**
- Create: `docs/gfp-fiscal-data-endpoints.md`
- Modify: `src/pages/DataSourcesPage.tsx` (short FRUSG/MTS bullet under FiscalData)

- [ ] **Step 1: Write endpoint doc** covering:

  - Base URL  
  - All 7 endpoints + fields  
  - Restatement policy  
  - Accrual vs cash  
  - Refresh cadence  
  - Why MTD XLSX is not used  
  - How to run ingest (`?backfill=true`)  

- [ ] **Step 2: Optional cron** — if project uses `cron.schedule` + `net.http_post` for edge functions, add migration schedule for nightly invoke of `ingest-gov-financial-position` following existing `docs/crons.md` pattern. If vault secrets pattern differs, document manual schedule instead of inventing.

- [ ] **Step 3: Commit**

```bash
git add docs/gfp-fiscal-data-endpoints.md src/pages/DataSourcesPage.tsx
git commit -m "docs(gfp): document Fiscal Data endpoints and refresh cadence"
```

---

### Task 9: Deploy verification

- [ ] **Step 1: Apply remote migration**

```bash
npx supabase db push
# or link + push to production project
```

- [ ] **Step 2: Deploy edge function + run backfill**

```bash
npx supabase functions deploy ingest-gov-financial-position
# POST with service role, backfill=true
```

- [ ] **Step 3: Verify views return rows**

```sql
SELECT count(*) FROM vw_frusg_net_cost_yearly;
SELECT * FROM vw_gfp_narrative_inputs;
SELECT * FROM vw_mts_agency_outlays_rank LIMIT 10;
```

- [ ] **Step 4: Final CI**

```bash
npm run lint && npm run test && npm run build
```

- [ ] **Step 5: Netlify** — push commits; confirm deploy green. Spot-check `/labs/gov-financial-position` and teaser on `/labs/us-macro-fiscal`.

---

## Spec Coverage Checklist

| Spec requirement | Task |
|------------------|------|
| FRUSG Net Cost ingest + UI | 3, 5, 6, 7 |
| Balance Sheet | 3, 5, 6 |
| Net Position / Reconciliations / Cash Balance | 3, 5, 6 |
| MTS Table 5 outlays rank + series | 3, 5, 6 |
| Annual receipts by department | 3, 5, 6 |
| Concentration HHI / top5 | 2, 6 |
| Insights rule-based | 4, 6 |
| Export CSV/JSON | 4, 6 |
| Provenance | 6, 8 |
| Hybrid placement + teaser | 7 |
| Endpoint documentation | 8 |
| No mock data | all UI empty states |
| CI green | 7, 9 |

## Placeholder Scan

No TBD steps. MTS hierarchy filtering may need iteration after first data load (exclude aggregate parents if double-counting) — handle in Task 6 by filtering `sequence_level_nbr` or known total labels when live data available.

## Type Consistency

- Insight function: `buildGfpInsights(input: GfpNarrativeInputs): string[]`
- Hooks query keys: always `['gfp', …]`
- Tables/views names match migration exactly

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-31-gov-financial-position.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — this session, batch with checkpoints  

**Which approach?**
