-- =====================================================================
-- Migration: Create corporate_debt_maturities table
-- Populated by: ingest-corporate-debt-maturities edge function
-- Source: FRED ICE BofA US Corporate Index (market values + effective yields)
-- Schedule: Monthly (5th of each month via cron in next migration)
-- Amounts stored in USD trillions.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.corporate_debt_maturities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    as_of_date DATE NOT NULL,
    bucket VARCHAR(10) NOT NULL CHECK (bucket IN ('<1Y', '1-3Y', '3-5Y', '>5Y')),
    maturing_amount NUMERIC NOT NULL DEFAULT 0,         -- USD trillions
    percent_of_total_debt NUMERIC NOT NULL DEFAULT 0,   -- 0-100
    weighted_avg_coupon NUMERIC DEFAULT 0,              -- effective yield % (proxy for coupon)
    implied_refinancing_cost_delta NUMERIC DEFAULT 0,   -- bps vs current all-in IG yield
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(as_of_date, bucket)
);

ALTER TABLE public.corporate_debt_maturities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on corporate_debt_maturities"
    ON public.corporate_debt_maturities FOR SELECT TO public USING (true);

CREATE POLICY "Allow service role full access on corporate_debt_maturities"
    ON public.corporate_debt_maturities FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_corp_debt_mat_date
    ON public.corporate_debt_maturities(as_of_date DESC);
CREATE INDEX IF NOT EXISTS idx_corp_debt_mat_date_bucket
    ON public.corporate_debt_maturities(as_of_date, bucket);

COMMENT ON TABLE public.corporate_debt_maturities
    IS 'US investment-grade corporate bond market value by maturity bucket. '
       'Source: FRED ICE BofA US Corporate Index (BAMLCC* series). '
       'Amounts in USD trillions. Updated monthly by ingest-corporate-debt-maturities.';
COMMENT ON COLUMN public.corporate_debt_maturities.maturing_amount
    IS 'Outstanding market value in this maturity bucket, USD trillions.';
COMMENT ON COLUMN public.corporate_debt_maturities.weighted_avg_coupon
    IS 'Effective yield for this bucket (proxy for weighted-average coupon), percent.';
COMMENT ON COLUMN public.corporate_debt_maturities.implied_refinancing_cost_delta
    IS 'Basis points difference between current all-in IG corporate yield and bucket yield. '
       'Positive = refinancing at today''s market rates is more expensive than existing debt.';
