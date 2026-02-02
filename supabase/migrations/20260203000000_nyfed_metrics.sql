-- =====================================================
-- NY Fed Markets Metrics Migration
-- =====================================================

-- 1. Register NY Fed Markets as a Data Source
INSERT INTO data_sources (name, api_endpoint, auth_type, metadata) VALUES
  ('NY Fed Markets', 'https://markets.newyorkfed.org/api', 'none', '{"rate_limit": 100, "rate_window": "60s"}')
ON CONFLICT (name) DO NOTHING;

-- 2. Seed NY Fed Metrics
DO $$
DECLARE
  source_id_val INTEGER;
BEGIN
  SELECT id INTO source_id_val FROM data_sources WHERE name = 'NY Fed Markets';

  INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, expected_interval_days) VALUES
    ('PRIMARY_DEALER_TREASURY_HOLDINGS_BN', 'Primary Dealer Treasury Holdings', 'Total Treasury securities held by primary dealers', source_id_val, 'weekly', 'weekly', 'USD bn', 'billion USD', 'core', 'sovereign', 8),
    ('RRP_BALANCE_BN', 'Reverse Repo (RRP) Balance', 'Federal Reserve Overnight Reverse Repo Facility balance', source_id_val, 'daily', 'daily', 'USD bn', 'billion USD', 'core', 'liquidity', 2),
    ('TGA_BALANCE_BN', 'Treasury General Account (TGA) Balance', 'Treasury cash balance held at the Federal Reserve', source_id_val, 'daily', 'daily', 'USD bn', 'billion USD', 'core', 'liquidity', 2),
    ('SOFR_EFFR_SPREAD_BPS', 'SOFR-EFFR Spread', 'Spread between Secured Overnight Financing Rate and Effective Federal Funds Rate', source_id_val, 'daily', 'daily', 'bps', 'basis points', 'core', 'liquidity', 2)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    source_id = EXCLUDED.source_id,
    native_frequency = EXCLUDED.native_frequency,
    display_frequency = EXCLUDED.display_frequency,
    unit = EXCLUDED.unit,
    unit_label = EXCLUDED.unit_label,
    tier = EXCLUDED.tier,
    category = EXCLUDED.category,
    expected_interval_days = EXCLUDED.expected_interval_days;
END $$;

-- 3. Update Cron Schedule for Ingestion
-- We use a single cron entry for NY Fed ingestion
SELECT cron.unschedule('ingest-nyfed-markets-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-nyfed-markets-daily');

SELECT cron.schedule(
    'ingest-nyfed-markets-daily',
    '0 14 * * *',
    'select net.http_post(url:=''https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-nyfed-markets'', headers:='''', body:=''{}\'')'
);
