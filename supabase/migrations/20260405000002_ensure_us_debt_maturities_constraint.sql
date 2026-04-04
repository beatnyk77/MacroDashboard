-- =====================================================
-- Migration: Ensure unique constraint on us_debt_maturities
-- =====================================================
-- Ensures the required unique constraint on (date, bucket) exists
-- for upsert operations in the ingestion function.
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'us_debt_maturities_date_bucket_key'
        AND conrelid = 'public.us_debt_maturities'::regclass
    ) THEN
        ALTER TABLE public.us_debt_maturities
            ADD CONSTRAINT us_debt_maturities_date_bucket_key UNIQUE (date, bucket);
    END IF;
END $$;

-- Also ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_us_debt_maturities_date ON public.us_debt_maturities(date);
CREATE INDEX IF NOT EXISTS idx_us_debt_maturities_date_bucket ON public.us_debt_maturities(date, bucket);
