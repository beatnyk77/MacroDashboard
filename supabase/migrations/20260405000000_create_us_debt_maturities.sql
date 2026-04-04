-- =====================================================
-- Migration: Create US Debt Maturities Table
-- =====================================================
-- This table stores the US Treasury debt maturity schedule
-- with cost segregation (low/medium/high) and T-bill breakdown.
-- Data source: US Treasury MSPD (Marketable Securities of the Public Debt)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.us_debt_maturities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    bucket VARCHAR(50) NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    tbill_amount NUMERIC DEFAULT 0,
    tbill_avg_yield NUMERIC DEFAULT 0,
    low_cost_amount NUMERIC DEFAULT 0,
    medium_cost_amount NUMERIC DEFAULT 0,
    high_cost_amount NUMERIC DEFAULT 0,
    total_debt NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, bucket)
);

-- Row Level Security Policies
ALTER TABLE public.us_debt_maturities ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access on us_debt_maturities"
    ON public.us_debt_maturities FOR SELECT
    TO public
    USING (true);

-- Service role full access
CREATE POLICY "Allow service role full access on us_debt_maturities"
    ON public.us_debt_maturities FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_us_debt_maturities_date ON public.us_debt_maturities(date);
CREATE INDEX IF NOT EXISTS idx_us_debt_maturities_date_bucket ON public.us_debt_maturities(date, bucket);

-- Comments
COMMENT ON TABLE public.us_debt_maturities IS 'US Treasury debt maturity schedule by bucket, cost type, and T-bill breakdown. Populated by ingest-us-macro function.';
COMMENT ON COLUMN public.us_debt_maturities.date IS 'The record date as of which the maturity amounts are calculated (typically latest available from Treasury MSPD).';
COMMENT ON COLUMN public.us_debt_maturities.bucket IS 'Maturity bucket: <1M, 1-3M, 3-6M, 6-12M, 1-2Y, 2-5Y, 5-10Y, 10Y+';
COMMENT ON COLUMN public.us_debt_maturities.amount IS 'Total amount outstanding in this bucket (sum of tbill_amount + low + medium + high)';
