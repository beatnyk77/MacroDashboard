-- Central Bank Gold Net Purchases Table
-- Stores multi-period net change data for central bank gold reserves
-- Periods: Since 2000, Since 2008, Since 2015, Since 2020

CREATE TABLE IF NOT EXISTS public.cb_gold_net (
    period_start_year INTEGER PRIMARY KEY, -- 2000, 2008, 2015, 2020
    period_label TEXT NOT NULL,          -- "Since 2000", "Since 2008", etc.
    buyers_tonnes NUMERIC,               -- Gross purchases
    sellers_tonnes NUMERIC,              -- Gross sales
    net_tonnes NUMERIC,                  -- Net change
    net_pct_global_stock NUMERIC,        -- Net / ~205k tonnes
    top_buyers_json JSONB,               -- [{country: "China", tonnes: 1200, code: "CN"}, ...]
    top_sellers_json JSONB,              -- [{country: "UK", tonnes: 400, code: "GB"}, ...]
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.cb_gold_net ENABLE ROW LEVEL SECURITY;

-- Allow public read access (dashboard is public)
CREATE POLICY "Allow public read access" ON public.cb_gold_net
    FOR SELECT USING (true);

-- Allow service role full access (for ingestion)
CREATE POLICY "Allow service role full access" ON public.cb_gold_net
    FOR ALL USING (auth.role() = 'service_role');

-- Add table comment
COMMENT ON TABLE public.cb_gold_net IS 'Central Bank Gold Net Purchases by multi-year periods (Source: IMF IFS / World Gold Council)';
