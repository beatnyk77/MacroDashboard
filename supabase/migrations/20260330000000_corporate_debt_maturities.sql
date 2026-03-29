CREATE TABLE IF NOT EXISTS public.corporate_debt_maturities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    as_of_date DATE NOT NULL,
    bucket VARCHAR(50) NOT NULL,
    maturing_amount NUMERIC NOT NULL DEFAULT 0,
    weighted_avg_coupon NUMERIC DEFAULT 0,
    implied_refinancing_cost_delta NUMERIC DEFAULT 0,
    percent_of_total_debt NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(as_of_date, bucket)
);

ALTER TABLE public.corporate_debt_maturities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on corporate_debt_maturities"
    ON public.corporate_debt_maturities FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow service role full access on corporate_debt_maturities"
    ON public.corporate_debt_maturities FOR ALL
    TO service_role
    USING (true);
