# Debug: US Equities Data Not Populating

**Date**: 2026-04-02  
**Status**: Root Causes Identified - Multiple Schema & Query Issues  
**Page**: `/us-equities` (GraphiQuestor.com)

---

## Executive Summary

The `/us-equities` page is showing no data because **the frontend components query database tables that do not exist**. This is a **schema gap** - the database migrations never created the required tables for US equities data, and the Edge Functions that should populate them reference these non-existent tables.

**Impact**: All tabs on the US Equities page are blank (Screener, Sectors, Insider Ops, 13F Whales, Live Filings, Macro Pulse).

---

## Root Causes Identified

### 1. Missing Database Tables (Critical)

The following tables are **absent from the database schema**:

| Table Name | Component Using It | Edge Function |
|------------|-------------------|---------------|
| `us_companies` | USScreener, USInsiderActivity | `ingest-us-edgar-fundamentals` (syncCompanies) |
| `us_fundamentals` | USScreener | `ingest-us-edgar-fundamentals` (syncFundamentals) |
| `us_filings` | USFilingsFeed | `ingest-us-edgar-fundamentals` (syncDailyFilingsAndInsider) |
| `us_insider_trades` | USInsiderActivity | `ingest-us-edgar-fundamentals` (syncDailyFilingsAndInsider) |
| `us_sector_summary` | USSectorHeatmap | Should be populated by `refresh_us_sector_summary` procedure |
| `us_13f_holdings` | USWhaleTracker | **Wrong name** - should be `institutional_13f_holdings` |

**Evidence**:  
- Searched 42 migration files in `supabase/migrations/` - no CREATE TABLE statements for these tables  
- `ingest-us-edgar-fundamentals` function (line 99, 182, 256) attempts to upsert into these tables  
- All USC components query these tables directly via Supabase client

---

### 2. Missing Stored Procedure (Critical)

The function `refresh_us_sector_summary` is called at the end of `syncFundamentals` (line 210) but **does not exist**. This would cause the Edge Function to fail after inserting fundamentals.

**What it should do**: Aggregate `us_companies` + `us_fundamentals` into `us_sector_summary` by sector (avg P/E, avg Debt/Equity, avg ROE, company_count).

---

### 3. Table Name Mismatch (High Impact)

**USWhaleTracker** queries `us_13f_holdings` but the actual table created by migrations is `institutional_13f_holdings`.

**File**: `src/features/USC/USWhaleTracker.tsx` line 13  
**Should be**: `from('institutional_13f_holdings')`

This explains why the "13F Whales" tab shows empty (unless the query error is silently swallowed).

---

### 4. Potential Table Name Mismatch in USMacroCorrelation (Medium Impact)

Component queries `metric_data` (line 14) but the schema defines `metric_observations`. Either:
- There is a view `metric_data` that joins to `metrics`, or
- This is a bug and should query `metric_observations` with a join

**Investigation needed**: Check if `metric_data` exists or if this component is broken by design.

---

### 5. Edge Functions May Be Failing Silently

Even if scheduled, the `ingest-us-edgar-fundamentals` function would fail with errors like:
- `relation "us_companies" does not exist`
- `relation "us_fundamentals" does not exist`
- `function refresh_us_sector_summary() does not exist`

These failures would be logged in the `ingestion_logs` table (which exists), so we can verify.

---

## Architecture Intended vs Reality

**Intended Design** (from code inspection):
```
SEC EDGAR → ingest-us-edgar-fundamentals → us_companies, us_fundamentals, us_filings, us_insider_trades
                              ↓ refresh_us_sector_summary
                              ↓ us_sector_summary
Alpha Vantage → ingest-institutional-13f → institutional_13f_holdings
```

**Reality**:
- Only `institutional_13f_holdings` table exists (for 13F data)
- US core tables (`us_companies`, etc.) were **never created**
- `ingest-us-edgar-fundamentals` is crippled and likely failing

---

## Recommended Fix Plan

### Phase 1: Database Schema Recovery (Create Missing Tables)

Create a new migration file: `supabase/migrations/20260402000011_us_equities_schema.sql`

```sql
-- US Equities Core Schema
-- Creates tables for corporate fundamentals, SEC filings, insider trades

CREATE TABLE IF NOT EXISTS us_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cik TEXT UNIQUE NOT NULL,
    ticker TEXT UNIQUE,
    name TEXT NOT NULL,
    sector TEXT,
    exchange TEXT DEFAULT 'US',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS us_fundamentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES us_companies(id) ON DELETE CASCADE,
    cik TEXT NOT NULL,
    period_end DATE NOT NULL,
    form_type TEXT CHECK (form_type IN ('10-K', '10-Q')),
    revenue NUMERIC,
    operating_income NUMERIC,
    net_income NUMERIC,
    eps_diluted NUMERIC,
    shares_outstanding NUMERIC,
    total_assets NUMERIC,
    total_debt NUMERIC,
    stockholders_equity NUMERIC,
    cash_equivalents NUMERIC,
    roe NUMERIC,
    operating_margin NUMERIC,
    debt_equity NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cik, period_end, form_type)
);

CREATE TABLE IF NOT EXISTS us_filings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES us_companies(id) ON DELETE SET NULL,
    cik TEXT NOT NULL,
    form_type TEXT NOT NULL,
    filing_date DATE NOT NULL,
    accession_no TEXT UNIQUE NOT NULL,
    description TEXT,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS us_insider_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES us_companies(id) ON DELETE SET NULL,
    ticker TEXT NOT NULL,
    insider_name TEXT NOT NULL,
    insider_title TEXT,
    transaction_type TEXT CHECK (transaction_type IN ('BUY', 'SELL', 'OTHER')),
    shares_traded INTEGER,
    total_value NUMERIC,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS us_sector_summary (
    sector TEXT PRIMARY KEY,
    company_count INTEGER DEFAULT 0,
    avg_pe NUMERIC,
    avg_pb NUMERIC,
    avg_roe NUMERIC,
    avg_debt_equity NUMERIC,
    avg_operating_margin NUMERIC,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);
```

Add indexes for performance (create after data exists to avoid lock contention).

---

### Phase 2: Create Stored Procedure

Create `supabase/functions/shared/refresh_us_sector_summary.ts` (or as SQL migration):

```sql
CREATE OR REPLACE FUNCTION refresh_us_sector_summary()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Truncate existing summary
    TRUNCATE us_sector_summary;

    -- Insert fresh aggregates from us_fundamentals joined with us_companies
    INSERT INTO us_sector_summary
    SELECT 
        c.sector,
        COUNT(DISTINCT c.id) as company_count,
        AVG(f.pe_ratio) as avg_pe,
        AVG(f.pb_ratio) as avg_pb,
        AVG(f.roe) as avg_roe,
        AVG(f.debt_equity) as avg_debt_equity,
        AVG(f.operating_margin) as avg_operating_margin,
        NOW() as last_updated
    FROM us_companies c
    LEFT JOIN LATERAL (
        SELECT * FROM us_fundamentals uf 
        WHERE uf.company_id = c.id 
        ORDER BY uf.period_end DESC 
        LIMIT 1
    ) f ON true
    WHERE c.sector IS NOT NULL
    GROUP BY c.sector;
END;
$$;
```

---

### Phase 3: Fix Frontend Component Queries

**File**: `src/features/USC/USWhaleTracker.tsx`

Change line 13:
```typescript
.from('us_13f_holdings')  // ❌ Wrong
```
to:
```typescript
.from('institutional_13f_holdings')  // ✅ Correct
```

**Optional**: Also rename query key from `'us-whale-holdings'` to `'institutional-13f'` for consistency.

---

**File**: `src/features/USC/USMacroCorrelation.tsx` (if needed)

If `metric_data` doesn't exist, change to:

```typescript
.from('metric_observations')
.select('*, metrics!inner(name)')
.in('metrics.name', metricsList)
.order('date', { ascending: false })
```

But verify first if a view `metric_data` exists.

---

### Phase 4: Verify Ingestion Function Compatibility

Review `supabase/functions/ingest-us-edgar-fundamentals/index.ts`:

1. Ensure it only inserts columns that match the table schema
2. The `syncFundamentals` function currently calculates derived metrics (P/E, P/B, etc.) but these are **not being inserted** into `us_fundamentals`. Need to add:
   - `pe_ratio`
   - `pb_ratio`  
   - `ev_ebitda`
   - (these are used by USScreener component)

**Add to syncFundamentals** (around line 182):
```javascript
const pe = sharesVal > 0 ? equityVal / sharesVal : 0;
const pb = equityVal > 0 ? equityVal / assetsVal : 0;
const ev = equityVal + debtVal - cashVal;
const ebitda = opIncomeVal + depreciation_amortization; // need to fetch from SEC
const ev_ebitda = ebitda > 0 ? ev / ebitda : 0;

await client.from('us_fundamentals').upsert({
    company_id: company.id,
    cik: company.cik,
    period_end: periodEnd,
    form_type: '10-K',
    revenue: revenueVal,
    operating_income: opIncomeVal,
    net_income: netIncomeVal,
    eps_diluted: eps,
    shares_outstanding: sharesVal,
    total_assets: assetsVal,
    total_debt: debtVal,
    stockholders_equity: equityVal,
    cash_equivalents: cashVal,
    pe_ratio: pe,
    pb_ratio: pb,
    ev_ebitda: ev_ebitda,
    roe: roe,
    operating_margin: opMargin,
    debt_equity: debtEquity
}, { onConflict: 'cik, period_end, form_type' });
```

Note: May need to adjust based on what fields are actually available from SEC API. At minimum, compute P/E = price/EPS needs stock price, which isn't fetched. The current component expects these fields to exist.

---

### Phase 5: Deploy Schema & Test Ingestion

**Steps**:

1. Apply the new migration:
```bash
supabase migration up 20260402000011_us_equities_schema.sql
```

2. Verify tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'us_%' ORDER BY table_name;
```

3. Deploy the stored procedure:
```bash
supabase functions deploy refresh_us_sector_summary
```
or as a migration SQL file.

4. Fix the USWhaleTracker component and redeploy frontend.

5. Manually trigger the EDGAR ingestion once to backfill:
```bash
supabase functions invoke ingest-us-edgar-fundamentals --body '{"mode":"companies"}' -o json
supabase functions invoke ingest-us-edgar-fundamentals --body '{"mode":"fundamentals"}' -o json
supabase functions invoke ingest-us-edgar-fundamentals --body '{"mode":"daily"}' -o json
```

6. Monitor `ingestion_logs` table for success/failure:
```sql
SELECT * FROM ingestion_logs 
WHERE function_name LIKE 'ingest-us-edgar%' 
ORDER BY start_time DESC LIMIT 10;
```

7. After companies and fundamentals are populated, run:
```sql
SELECT refresh_us_sector_summary();
```

8. Verify data is flowing:
```sql
SELECT COUNT(*) FROM us_companies;
SELECT COUNT(*) FROM us_fundamentals;
SELECT COUNT(*) FROM us_filings ORDER BY filing_date DESC LIMIT 5;
```

9. Refresh browser and check `/us-equities` page.

---

### Phase 6: Verify Environment Variables

Ensure these are set in Supabase Edge Function environment:

- `SUPABASE_URL` (auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-set)
- No additional keys needed for SEC EDGAR (public API)

For `ingest-institutional-13f` ensure:
- `ALPHA_VANTAGE_API_KEY` is set in Edge Function env

---

## Immediate Validation Queries

Run these in your Supabase SQL editor to confirm diagnosis:

```sql
-- Check for missing tables
SELECT 'us_companies exists' AS check FROM information_schema.tables 
WHERE table_name = 'us_companies'
UNION ALL
SELECT 'us_fundamentals exists' FROM information_schema.tables WHERE table_name = 'us_fundamentals'
UNION ALL
SELECT 'us_filings exists' FROM information_schema.tables WHERE table_name = 'us_filings'
UNION ALL
SELECT 'us_insider_trades exists' FROM information_schema.tables WHERE table_name = 'us_insider_trades'
UNION ALL
SELECT 'us_sector_summary exists' FROM information_schema.tables WHERE table_name = 'us_sector_summary'
UNION ALL
SELECT 'institutional_13f_holdings exists' FROM information_schema.tables WHERE table_name = 'institutional_13f_holdings';

-- Check ingestion logs (are functions running?)
SELECT function_name, status, COUNT(*) as runs 
FROM ingestion_logs 
WHERE start_time > NOW() - INTERVAL '7 days'
GROUP BY function_name, status
ORDER BY function_name, runs DESC;

-- Check for refresh_us_sector_summary procedure
SELECT proname FROM pg_proc WHERE proname = 'refresh_us_sector_summary';
```

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Edge Functions fail on missing tables | Critical | Create tables first |
| Wrong column names in ingestion | Medium | Review schema carefully, test with small batch |
| API rate limits (SEC, Alpha Vantage) | Medium | Existing delays should be sufficient |
| Migration conflicts | Low | Use `IF NOT EXISTS` in all CREATE statements |
| `us_sector_summary` stale | Low | Call refresh after each fundamentals batch |

---

## Estimated Effort

- **Schema migration creation**: 30 minutes
- **Stored procedure**: 15 minutes
- **Frontend fix** (USWhaleTracker): 5 minutes
- **Testing & validation**: 20 minutes

**Total**: ~1 hour to get data flowing

---

## Additional Recommendations

1. Add a **Data Health Dashboard** check for `us_companies` row count and show warning if < 1000.
2. Consider adding a **cron job** to run `ingest-us-edgar-fundamentals` in `companies` mode weekly, `fundamentals` mode monthly, `daily` mode daily.
3. Add **error alerting** on ingestion failures (Slack/email).
4. Document the US equities schema in `ER_DIAGRAM.md`.
5. Consider adding **data validation** in the ingestion function to check for null/zero values in critical fields.

---

## Conclusion

The `/us-equities` page is not broken due to frontend bugs, but due to **missing database infrastructure**. The components and Edge Functions are already written, but the tables they depend on were never created. 

This is a **schema deployment gap** - likely the migrations for these tables were created but never applied, or were lost during a merge.

**Next Step**: Apply the missing schema and verify the ingestion pipeline works.
