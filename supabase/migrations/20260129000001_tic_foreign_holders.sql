-- =====================================================
-- TIC Foreign Holders of U.S. Treasury Securities
-- =====================================================

-- Table: tic_foreign_holders
-- Stores monthly data on holdings of Treasury bonds and notes by country
CREATE TABLE IF NOT EXISTS tic_foreign_holders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_name TEXT NOT NULL,
  as_of_date DATE NOT NULL,
  holdings_usd_bn NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (country_name, as_of_date)
);

COMMENT ON TABLE tic_foreign_holders IS 'Monthly holdings of U.S. Treasury securities by foreign residents (TIC Data)';

-- View: vw_tic_foreign_holders
-- Computes MoM/YoY changes and share of total foreign holdings
CREATE OR REPLACE VIEW vw_tic_foreign_holders AS
WITH monthly_totals AS (
    -- Total foreign holdings for each month to calculate share
    -- Note: 'Grand Total' or 'Total Foreign' might be in the data, 
    -- but we can also sum the top holders if those are the only ones we care about.
    -- For now, let's assume we want to calculate % of the sum of categories we ingest.
    SELECT 
        as_of_date,
        SUM(holdings_usd_bn) as total_foreign_holdings
    FROM tic_foreign_holders
    GROUP BY as_of_date
),
holdings_with_lags AS (
    SELECT 
        h.country_name,
        h.as_of_date,
        h.holdings_usd_bn,
        LAG(h.holdings_usd_bn) OVER (PARTITION BY h.country_name ORDER BY h.as_of_date) as prev_month_holdings,
        LAG(h.holdings_usd_bn, 12) OVER (PARTITION BY h.country_name ORDER BY h.as_of_date) as prev_year_holdings,
        t.total_foreign_holdings
    FROM tic_foreign_holders h
    JOIN monthly_totals t ON h.as_of_date = t.as_of_date
)
SELECT 
    country_name,
    as_of_date,
    holdings_usd_bn,
    CASE 
        WHEN prev_month_holdings IS NOT NULL AND prev_month_holdings > 0 
        THEN ((holdings_usd_bn - prev_month_holdings) / prev_month_holdings) * 100 
        ELSE NULL 
    END as mom_pct_change,
    CASE 
        WHEN prev_year_holdings IS NOT NULL AND prev_year_holdings > 0 
        THEN ((holdings_usd_bn - prev_year_holdings) / prev_year_holdings) * 100 
        ELSE NULL 
    END as yoy_pct_change,
    CASE 
        WHEN total_foreign_holdings > 0 
        THEN (holdings_usd_bn / total_foreign_holdings) * 100 
        ELSE NULL 
    END as pct_of_total_foreign
FROM holdings_with_lags;

-- Register Cron Job (Scheduled for 16th of each month, 10:00 AM)
-- The TIC data is usually released around the 15th of the month.
SELECT cron.schedule(
    'ingest-tic-foreign-holders-monthly',
    '0 10 16 * *',
    $$ SELECT net.http_post(
        url := 'https://debdriyzfcwvgrhzzzre.functions.supabase.co/ingest-tic-foreign-holders',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('vault.anon_key') || '"}'::jsonb
    ) $$
);
