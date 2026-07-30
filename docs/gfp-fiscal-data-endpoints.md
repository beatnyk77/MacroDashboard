# Government Financial Position — Fiscal Data Endpoints

**Surface:** `/labs/gov-financial-position`  
**Ingest function:** `ingest-gov-financial-position`  
**Spec:** [`docs/superpowers/specs/2026-07-31-gov-financial-position-design.md`](./superpowers/specs/2026-07-31-gov-financial-position-design.md)  
**Last updated:** 2026-07-31

---

## Base URL

```
https://api.fiscaldata.treasury.gov/services/api/fiscal_service
```

All requests use:

| Parameter | Value |
|-----------|--------|
| `format` | `json` |
| `page[size]` | `10000` |
| `page[number]` | `1…N` until a short/empty page |

Pagination is implemented in `supabase/functions/ingest-gov-financial-position/index.ts` via `fetchAll()`. Safety cap: 200 pages per endpoint.

**Portal:** [fiscaldata.treasury.gov](https://fiscaldata.treasury.gov/)  
**No API key** required for public Fiscal Data JSON endpoints.

---

## Endpoint catalog (7)

### FRUSG — Accrual / GAAP (annual)

| # | Statement | Path | Target table | Units |
|---|-----------|------|--------------|-------|
| 1 | Statements of Net Cost | `/v2/accounting/od/statement_net_cost` | `frusg_net_cost` | $ billions |
| 2 | Balance Sheets | `/v2/accounting/od/balance_sheets` | `frusg_balance_sheet` | $ billions |
| 3 | Operations & Changes in Net Position | `/v1/accounting/od/net_position` | `frusg_net_position` | $ billions |
| 4 | Reconciliations (NOC ↔ Budget Deficit) | `/v1/accounting/od/reconciliations` | `frusg_reconciliations` | $ billions |
| 5 | Changes in Cash Balance | `/v1/accounting/od/cash_balance` | `frusg_cash_balance` | $ billions |

### Cash / budget basis

| # | Dataset | Path | Target table | Cadence | Units |
|---|---------|------|--------------|---------|-------|
| 6 | Outlays of the U.S. Government (MTS Table 5) | `/v1/accounting/mts/mts_table_5` | `mts_agency_outlays` | Monthly | $ (cash) |
| 7 | Receipts by Department | `/v1/accounting/od/receipts_by_department` | `treasury_receipts_by_dept` | Annual | $ (cash) |

---

## Field mappings

API field names (right) → Postgres columns (left). Numeric conversion uses `Number(v)`; empty/`null` strings become SQL `null`.

### 1. `statement_net_cost` → `frusg_net_cost`

| DB column | API field | Notes |
|-----------|-----------|-------|
| `record_date` | `record_date` | Publish date |
| `stmt_fiscal_year` | `stmt_fiscal_year` | Statement FY |
| `restmt_flag` | `restmt_flag` | `Y` / `N` |
| `agency_nm` | `agency_nm` | Agency name |
| `gross_cost_bil` | `gross_cost_bil_amt` | Billions |
| `earned_revenue_bil` | `earned_revenue_bil_amt` | Nullable |
| `change_assumptions_bil` | `change_assumptions_bil_amt` | Nullable |
| `net_cost_bil` | `net_cost_bil_amt` | Billions |
| `src_line_nbr` | `src_line_nbr` | Source line (string) |
| `source_endpoint` | *(constant)* | `v2/accounting/od/statement_net_cost` |

**Unique:** `(stmt_fiscal_year, restmt_flag, agency_nm, src_line_nbr)`

### 2. `balance_sheets` → `frusg_balance_sheet`

| DB column | API field |
|-----------|-----------|
| `record_date` | `record_date` |
| `stmt_fiscal_year` | `stmt_fiscal_year` |
| `restmt_flag` | `restmt_flag` |
| `account_desc` | `account_desc` |
| `line_item_desc` | `line_item_desc` |
| `position_bil` | `position_bil_amt` |
| `src_line_nbr` | `src_line_nbr` |
| `source_endpoint` | `v2/accounting/od/balance_sheets` |

**Unique:** `(stmt_fiscal_year, restmt_flag, account_desc, line_item_desc, src_line_nbr)`

### 3. `net_position` → `frusg_net_position`

| DB column | API field |
|-----------|-----------|
| `record_date` | `record_date` |
| `stmt_fiscal_year` | `stmt_fiscal_year` |
| `restmt_flag` | `restmt_flag` |
| `account_desc` | `account_desc` |
| `line_item_desc` | `line_item_desc` |
| `non_dedicated_funds_bil` | `non_dedicated_funds_bil_amt` |
| `dedicated_funds_bil` | `dedicated_funds_bil_amt` |
| `eliminations_bil` | `eliminations_bil_amt` |
| `consolidated_bil` | `consolidated_bil_amt` |
| `src_line_nbr` | `src_line_nbr` |
| `source_endpoint` | `v1/accounting/od/net_position` |

**Unique:** `(stmt_fiscal_year, restmt_flag, account_desc, line_item_desc, src_line_nbr)`

### 4. `reconciliations` → `frusg_reconciliations`

| DB column | API field |
|-----------|-----------|
| `record_date` | `record_date` |
| `stmt_fiscal_year` | `stmt_fiscal_year` |
| `restmt_flag` | `restmt_flag` |
| `account_desc` | `account_desc` |
| `component_desc` | `component_desc` |
| `line_item_desc` | `line_item_desc` |
| `position_bil` | `position_bil_amt` |
| `src_line_nbr` | `src_line_nbr` |
| `source_endpoint` | `v1/accounting/od/reconciliations` |

**Unique:** `(stmt_fiscal_year, restmt_flag, account_desc, line_item_desc, src_line_nbr)`

### 5. `cash_balance` → `frusg_cash_balance`

| DB column | API field |
|-----------|-----------|
| `record_date` | `record_date` |
| `stmt_fiscal_year` | `stmt_fiscal_year` |
| `restmt_flag` | `restmt_flag` |
| `account_desc` | `account_desc` |
| `component_desc` | `component_desc` |
| `line_item_desc` | `line_item_desc` |
| `position_bil` | `position_bil_amt` |
| `src_line_nbr` | `src_line_nbr` |
| `source_endpoint` | `v1/accounting/od/cash_balance` |

**Unique:** `(stmt_fiscal_year, restmt_flag, account_desc, line_item_desc, src_line_nbr)`

### 6. `mts_table_5` → `mts_agency_outlays`

| DB column | API field |
|-----------|-----------|
| `record_date` | `record_date` |
| `classification_id` | `classification_id` |
| `parent_id` | `parent_id` |
| `classification_desc` | `classification_desc` |
| `current_month_net_outly` | `current_month_net_outly_amt` |
| `current_fytd_net_outly` | `current_fytd_net_outly_amt` |
| `prior_fytd_net_outly` | `prior_fytd_net_outly_amt` |
| `data_type_cd` | `data_type_cd` |
| `record_type_cd` | `record_type_cd` |
| `sequence_level_nbr` | `sequence_level_nbr` |
| `line_code_nbr` | `line_code_nbr` |
| `src_line_nbr` | `src_line_nbr` |
| `source_endpoint` | `v1/accounting/mts/mts_table_5` |

**Unique:** `(record_date, classification_id, src_line_nbr)`

Hierarchy: use `parent_id` / `sequence_level_nbr` for agency vs program rows. Views prefer detail rows and exclude pure totals from share denominators where applicable.

### 7. `receipts_by_department` → `treasury_receipts_by_dept`

| DB column | API field | Notes |
|-----------|-----------|-------|
| `record_date` | `record_date` | Annual statement date |
| `receipt_line_item_nm` | `receipt_line_item_nm` | Line label |
| `aid_cd` | `aid_cd` | Agency ID code |
| `a_cd` | `a_cd` | Nullable; API `"null"` coerced to SQL null |
| `main_cd` | `main_cd` | |
| `sub_cd` | `sub_cd` | |
| `receipt_amt` | `receipt_amt` | Cash dollars |
| `src_line_nbr` | `src_line_nbr` | |
| `source_endpoint` | `v1/accounting/od/receipts_by_department` | |

**Unique:** `(record_date, aid_cd, main_cd, sub_cd, receipt_line_item_nm, src_line_nbr)`

Rollup view `vw_receipts_by_agency_yearly` sums by `aid_cd` and joins `agency_code_map`.

---

## Restatement policy

FRUSG series carry `restmt_flag`:

| Flag | Meaning |
|------|---------|
| `N` | Original published values for that statement year |
| `Y` | Restated prior-year figures republished with a later FRUSG |

**Policy (locked):**

1. **Store all rows** — both `Y` and `N` land in raw tables. Upsert keys include `restmt_flag`, so restated and original coexist.
2. **Serving views default to `restmt_flag = 'N'`** — board KPIs, charts, and narrative scalars use original published figures unless a future UI toggle (v1.1) exposes restated connect.
3. Do not silently prefer restated rows for YoY comparisons without labeling.

Relevant views: `vw_frusg_net_cost_yearly`, `vw_frusg_balance_sheet_summary`, `vw_frusg_net_position_summary`, `vw_frusg_reconciliation_summary`, `vw_frusg_cash_balance_summary` (all filter `restmt_flag = 'N'`).

---

## Accrual vs cash labeling

| Layer | Accounting basis | Source |
|-------|------------------|--------|
| FRUSG (endpoints 1–5) | **Accrual / GAAP** | Financial Report of the U.S. Government |
| MTS Table 5 (endpoint 6) | **Cash / budget** | Monthly Treasury Statement |
| Receipts by Department (endpoint 7) | **Cash / budget** | Combined Statement (annual) |

**Rules:**

- UI must label basis on every panel (`Accrual / GAAP` vs `Cash / budget`).
- Never compute a mixed-basis ratio without dual-basis labeling.
- FRUSG “Changes in Cash Balance” is still an **accrual-report schedule** (cash bridge inside FRUSG), not MTS cash outlays — label as FRUSG / GAAP panel context.

Helpers: `GFP_BASIS` in `src/features/gfp/lib/format.ts`.

---

## Refresh cadence

| Source | Upstream publish | Ingest behavior | Suggested cron |
|--------|------------------|-----------------|----------------|
| FRUSG (5 statements) | Annual (FY report; occasional restatements) | Full fetch every run (small row counts) | Nightly |
| MTS Table 5 | Monthly (~mid-month after month-end) | Default: last ~800 days (`record_date` filter); full history with `?backfill=true` | Nightly |
| Receipts by Department | Annual | Full fetch every run | Nightly |

Nightly re-ingest is cheap for FRUSG + receipts. MTS defaults to a rolling window so routine runs stay bounded; use backfill after deploy or if history gaps appear.

Pipeline catalog cadence label: `Nightly / Monthly releases` (`ingest-gov-financial-position` in `src/lib/pipelineCatalog.ts`).

---

## Why Monthly Treasury Disbursements (MTD) XLSX is not used

| Dataset | Access | v1 status |
|---------|--------|-----------|
| **MTS Table 5** | Documented JSON API under Fiscal Data | **Used** for monthly agency cash outlays |
| **Monthly Treasury Disbursements (MTD)** | Published as XLSX under Fiscal Data “published reports” paths (`published-reports/mtd/…`) — **no documented JSON API** | **Out of scope** |

Reasons MTD is excluded:

1. No machine-readable JSON endpoint equivalent to MTS Table 5.
2. Parsing binary XLSX would require scrapers / fragile format assumptions — violates “official Fiscal Data JSON only.”
3. MTS Table 5 already provides hierarchical agency/program net outlays on a cash basis with stable field names.

Do not add HTML scrape or XLSX parse paths without a new product decision.

---

## How to run ingest

### First deploy / full history

```bash
# Deploy
npx supabase functions deploy ingest-gov-financial-position

# Full backfill (MTS Table 5 unrestricted; all other endpoints always full)
curl -X POST \
  "${SUPABASE_URL}/functions/v1/ingest-gov-financial-position?backfill=true" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json"
```

`?backfill=true` disables the MTS `record_date` rolling filter so the full Table 5 history is pulled. FRUSG and receipts always fetch all pages regardless of the flag.

### Routine refresh (default)

```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/ingest-gov-financial-position" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json"
```

Without `backfill`, MTS uses approximately the last 800 days of `record_date` (`filter=record_date:gte:YYYY-MM-DD`).

### Response shape

Success returns `ok: true` with per-table upsert counts, e.g.:

```json
{
  "ok": true,
  "counts": {
    "frusg_net_cost": 1947,
    "frusg_balance_sheet": 1330,
    "frusg_net_position": 863,
    "frusg_reconciliations": 594,
    "frusg_cash_balance": 514,
    "mts_agency_outlays": 12000,
    "treasury_receipts_by_dept": 8000
  },
  "meta": { "backfill": true }
}
```

Partial success is allowed: one endpoint failure is recorded in `meta.errors` and does not roll back other tables. The run fails only if **no** rows were upserted.

Timeout budget: 45 minutes (`serveIngest` option).

### Post-ingest sanity checks

```sql
SELECT stmt_fiscal_year, count(*) FROM frusg_net_cost GROUP BY 1 ORDER BY 1;
SELECT max(record_date), count(*) FROM mts_agency_outlays;
SELECT * FROM vw_mts_agency_outlays_rank LIMIT 10;
SELECT * FROM vw_frusg_net_cost_yearly WHERE stmt_fiscal_year = 2024 LIMIT 15;
```

---

## Agency code map (`agency_code_map`)

| Column | Type | Notes |
|--------|------|-------|
| `aid_cd` | text PK | Treasury agency ID code from receipts |
| `agency_name` | text | Display name |
| `notes` | text nullable | Optional |

**Source:** Static seed in migration  
`supabase/migrations/20260731000000_gov_financial_position.sql`

Codes are a **subset of OMB Circular A-11 Appendix C** (agency identifiers) covering major departments and agencies that appear in Fiscal Data receipts-by-department. Extend the seed when new `aid_cd` values show up as raw codes in `vw_receipts_by_agency_yearly`.

Examples seeded: `012` USDA, `020` Treasury, `028` SSA, `036` VA, `070` DHS, `075` HHS, `089` Energy, `097` DoD (Military Programs), etc.

Join path: `treasury_receipts_by_dept.aid_cd` → `agency_code_map.aid_cd` → `vw_receipts_by_agency_yearly.agency_name`.

---

## Cron schedule (documented; not auto-migrated here)

Canonical cron jobs are owned by [`docs/crons.md`](./crons.md) and generated from  
[`scripts/generate-canonical-crons.mjs`](../scripts/generate-canonical-crons.mjs) →  
`supabase/migrations/*_canonical_crons*.sql`.

**Do not** invent one-off `cron.schedule` + vault SQL for GFP. All HTTP jobs must use the shared auth pattern:

```sql
headers := jsonb_build_object(
  'Content-Type',  'application/json',
  'Authorization', 'Bearer ' || COALESCE(
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY'          LIMIT 1)
  ),
  'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
)
```

### Recommended job (add via generator, not ad-hoc SQL)

| jobname | schedule | function slug | notes |
|---------|----------|---------------|-------|
| `ingest-gov-financial-position-nightly` | `15 7 * * *` | `ingest-gov-financial-position` | Daily 07:15 UTC — after `ingest-fiscaldata` (07:00); stagger avoids stacking Treasury API load |

**Add steps when promoting to production:**

1. Append an entry to the `JOBS` array in `scripts/generate-canonical-crons.mjs`.
2. Regenerate SQL:  
   `node scripts/generate-canonical-crons.mjs > supabase/migrations/$(date +%Y%m%d%H%M%S)_canonical_crons_vN.sql`
3. Apply via the project’s migration process (see `docs/crons.md` Maintenance).
4. Confirm vault secrets `SUPABASE_SERVICE_ROLE_KEY` (or `SERVICE_ROLE_KEY`) and `CRON_SECRET` exist.

Until that canonical entry lands, invoke the function manually (see [How to run ingest](#how-to-run-ingest)) or via dashboard HTTP after each FRUSG/MTS publication window.

Related existing jobs (debt/auctions — **not** GFP FRUSG/MTS-5):

| jobname | schedule | function |
|---------|----------|----------|
| `ingest-fiscaldata` / `ingest-fiscaldata-daily` | 06:30 / 07:00 | `ingest-fiscaldata` (debt-to-penny etc.; F6 double-fire) |
| `ingest-us-macro-fiscal-daily` | 02:00 | `ingest-us-macro?task=fiscal` |

---

## Related artifacts

| Artifact | Path |
|----------|------|
| Edge function | `supabase/functions/ingest-gov-financial-position/index.ts` |
| Tables + agency seed | `supabase/migrations/20260731000000_gov_financial_position.sql` |
| Serving views | `supabase/migrations/20260731000001_gov_financial_position_views.sql` |
| Lab UI | `src/pages/labs/GovFinancialPositionLab.tsx` |
| Hooks | `src/hooks/useGfp*.ts` |
| Data Sources page | `src/pages/DataSourcesPage.tsx` (FiscalData entry) |
| Design spec | `docs/superpowers/specs/2026-07-31-gov-financial-position-design.md` |
