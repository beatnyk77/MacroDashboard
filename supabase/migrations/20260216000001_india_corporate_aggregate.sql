-- Corporate India Engine Aggregate Metrics
-- Stores quarterly aggregate results of listed Indian companies

CREATE TABLE IF NOT EXISTS public.india_corporate_aggregate (
    quarter_end_date DATE PRIMARY KEY,
    total_sales NUMERIC,
    net_profit NUMERIC,
    ebitda NUMERIC,
    sales_growth_yoy NUMERIC,
    profit_growth_yoy NUMERIC,
    net_profit_margin NUMERIC,
    positive_profit_growth_pct NUMERIC,
    top_20_profit_share_pct NUMERIC,
    num_companies INTEGER,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.india_corporate_aggregate ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON public.india_corporate_aggregate
    FOR SELECT USING (true);

-- Add table comment
COMMENT ON TABLE public.india_corporate_aggregate IS 'Quarterly aggregate profitability and growth metrics for listed Indian companies';
