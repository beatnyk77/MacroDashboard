-- Create us_fiscal_stress table
CREATE TABLE IF NOT EXISTS public.us_fiscal_stress (
    date DATE PRIMARY KEY,
    interest_expense NUMERIC,
    total_receipts NUMERIC,
    payroll_taxes NUMERIC,
    personal_taxes NUMERIC,
    gdp NUMERIC,
    insolvency_ratio NUMERIC,
    employment_tax_share NUMERIC,
    receipts_gdp NUMERIC,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.us_fiscal_stress ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on us_fiscal_stress" ON public.us_fiscal_stress
    FOR SELECT USING (true);

-- Comment on table
COMMENT ON TABLE public.us_fiscal_stress IS 'Tracks US fiscal vulnerability metrics including insolvency ratio and employment tax share.';
