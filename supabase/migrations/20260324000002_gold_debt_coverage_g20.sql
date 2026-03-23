-- Migration: G20 Debt per Gold Ounce Coverage
-- Creates table to track government debt relative to gold reserves in local currency

CREATE TABLE IF NOT EXISTS public.gold_debt_coverage_g20 (
    country_code TEXT NOT NULL,
    date DATE NOT NULL,
    gold_price_usd NUMERIC NOT NULL,
    fx_rate_local_per_usd NUMERIC NOT NULL,
    gold_price_local NUMERIC NOT NULL,
    debt_local NUMERIC NOT NULL,
    gold_reserves_oz NUMERIC NOT NULL,
    debt_per_oz_local NUMERIC NOT NULL,
    coverage_ratio NUMERIC NOT NULL,
    implied_gold_price_usd NUMERIC NOT NULL,
    last_updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (country_code, date)
);

-- Enable RLS
ALTER TABLE public.gold_debt_coverage_g20 ENABLE ROW LEVEL SECURITY;

-- Read policy for everyone
CREATE POLICY "Allow public read access" ON public.gold_debt_coverage_g20
    FOR SELECT USING (true);

-- Service role can do everything
CREATE POLICY "Allow service_role full access" ON public.gold_debt_coverage_g20
    FOR ALL USING (auth.role() = 'service_role');

-- Grant access to authenticated and anon
GRANT SELECT ON public.gold_debt_coverage_g20 TO anon, authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.gold_debt_coverage_g20 IS 'Government debt per gold ounce metrics for G20 countries in local currency.';
COMMENT ON COLUMN public.gold_debt_coverage_g20.debt_local IS 'Total government debt in local currency units.';
COMMENT ON COLUMN public.gold_debt_coverage_g20.coverage_ratio IS 'Percentage of government debt backed by gold reserves at current market prices.';

-- Schedule monthly ingestion if not already exists
-- Using public.schedule_standard_cron helper from 20260310000001 migration
-- Note: This assumes the helper exists. If not, the cron.schedule should be used directly.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'schedule_standard_cron') THEN
        PERFORM public.schedule_standard_cron('ingest-gold-debt-coverage-monthly', '30 2 1 * *', 'ingest-gold-debt-coverage');
    ELSE
        PERFORM cron.schedule(
            'ingest-gold-debt-coverage-monthly',
            '30 2 1 * *',
            format(
                'SELECT net.http_post(' ||
                'url := ''https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-gold-debt-coverage'', ' ||
                'headers := jsonb_build_object(' ||
                '''Content-Type'', ''application/json'', ' ||
                '''Authorization'', ''Bearer '' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''SUPABASE_SERVICE_ROLE_KEY'' LIMIT 1)' ||
                '), ' ||
                'body := ''{}''::jsonb, ' ||
                'timeout_milliseconds := 55000' ||
                ') AS request_id;'
            )
        );
    END IF;
END $$;
