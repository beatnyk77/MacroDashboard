-- India Fiscal Stress Table
-- Stores India central government fiscal vulnerability metrics

CREATE TABLE IF NOT EXISTS public.india_fiscal_stress (
    date DATE PRIMARY KEY,
    interest_payments NUMERIC,
    revenue_receipts NUMERIC,
    total_expenditure NUMERIC,
    gross_tax_revenue NUMERIC,
    gdp NUMERIC,
    revenue_deficit NUMERIC,
    fiscal_deficit NUMERIC,
    general_govt_debt NUMERIC,
    -- Calculated ratios (stored for performance)
    interest_revenue_pct NUMERIC,
    interest_expenditure_pct NUMERIC,
    interest_gtr_pct NUMERIC,
    interest_gdp_pct NUMERIC,
    revenue_deficit_gdp_pct NUMERIC,
    fiscal_deficit_gdp_pct NUMERIC,
    debt_gdp_pct NUMERIC,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.india_fiscal_stress ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON public.india_fiscal_stress
    FOR SELECT USING (true);

-- Add table comment
COMMENT ON TABLE public.india_fiscal_stress IS 'India central government fiscal stress indicators and debt sustainability metrics';
