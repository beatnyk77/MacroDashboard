-- Add entitlements column to us_fiscal_stress for Social Security + Medicare
-- FRED series: W068RC1Q027SBEA (Social Security, Medicaid, Medicare - quarterly, billions)
ALTER TABLE public.us_fiscal_stress
    ADD COLUMN IF NOT EXISTS entitlements NUMERIC,
    ADD COLUMN IF NOT EXISTS fiscal_dominance_ratio NUMERIC;

-- Recompute fiscal_dominance_ratio: (interest_expense + entitlements) / total_receipts * 100
-- Will be populated on next ingest cycle. For existing rows without entitlements, fall back to interest-only ratio.
UPDATE public.us_fiscal_stress
SET fiscal_dominance_ratio = 
    CASE
        WHEN entitlements IS NOT NULL AND total_receipts > 0
        THEN ((interest_expense + entitlements) / total_receipts) * 100
        WHEN total_receipts > 0
        THEN (interest_expense / total_receipts) * 100
        ELSE NULL
    END;

COMMENT ON COLUMN public.us_fiscal_stress.entitlements IS 'Social Security + Medicare (FRED: W068RC1Q027SBEA), quarterly billions USD';
COMMENT ON COLUMN public.us_fiscal_stress.fiscal_dominance_ratio IS '(Interest + Entitlements) / Tax Receipts × 100 — fiscal dominance ratio percent';
