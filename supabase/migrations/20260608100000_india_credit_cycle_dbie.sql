-- ─────────────────────────────────────────────────────────────────────────────
-- India Credit Cycle Clock: switch ingestion source from FRED (annual) to
-- RBI DBIE BSC1 (monthly SCB aggregate credit & deposits).
--
-- Changes:
--   1. Ensure india_credit_cycle table has all columns the new function writes.
--      The table was originally created via seed; this migration makes it
--      schema-of-record and adds any columns that may be absent.
--   2. Drop stale cron (monthly, 1st-of-month) — too infrequent for monthly
--      RBI data that is published with a ~4–6 week rolling lag.
--   3. Schedule new weekly cron (every Sunday 05:30 UTC) so new RBI DBIE
--      observations are picked up within days of publication.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Table: create if absent, then add any missing columns idempotently -------

CREATE TABLE IF NOT EXISTS public.india_credit_cycle (
    date                DATE        PRIMARY KEY,
    credit_growth_yoy   NUMERIC(6,2),
    deposit_growth_yoy  NUMERIC(6,2),
    cd_ratio            NUMERIC(6,2),
    phase               TEXT        CHECK (phase IN ('Recovery','Expansion','Downturn','Repair')),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Legacy columns written by the old FRED-based ingestion — keep them so
-- existing rows aren't broken, but the new function no longer populates them.
ALTER TABLE public.india_credit_cycle
    ADD COLUMN IF NOT EXISTS npa_ratio          NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS credit_to_gdp_gap  NUMERIC(6,2),
    ADD COLUMN IF NOT EXISTS provenance         TEXT DEFAULT 'rbi_dbie_bsc1';

-- Keep RLS consistent with the rest of the read-only public tables
ALTER TABLE public.india_credit_cycle ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'india_credit_cycle'
          AND policyname = 'Allow public read access'
    ) THEN
        CREATE POLICY "Allow public read access"
            ON public.india_credit_cycle FOR SELECT USING (true);
    END IF;
END $$;

-- 2. Drop old monthly cron and reschedule as weekly ---------------------------

SELECT cron.unschedule('ingest-india-credit-cycle-monthly');

-- Every Sunday at 05:30 UTC — well clear of weekend maintenance windows and
-- before European open. RBI typically publishes monthly SCB data mid-month,
-- so a weekly sweep guarantees pickup within 7 days of release.
SELECT public.schedule_standard_cron(
    'ingest-india-credit-cycle-weekly',
    '30 5 * * 0',
    'ingest-india-credit-cycle'
);
