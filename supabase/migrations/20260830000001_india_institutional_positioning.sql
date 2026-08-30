-- India Institutional Positioning contract
-- Canonical metric registry entries + public sector observation table.

CREATE UNIQUE INDEX IF NOT EXISTS idx_india_metric_observations_metric_date
  ON public.metric_observations (metric_id, as_of_date);

DO $$
BEGIN
  INSERT INTO public.metrics (
    id,
    name,
    description,
    source_id,
    native_frequency,
    display_frequency,
    unit,
    unit_label,
    tier,
    category,
    methodology_note,
    expected_interval_days,
    source,
    metadata,
    is_active
  )
  VALUES
    ('IN_FII_CASH_NET', 'India FII Cash Net', 'Net FII/FPI cash flow from NSE cash trading activity.', NULL, 'daily', 'daily', 'INR crore', '₹ crore', 'core', 'capital_flows', 'NSE fiidiiTradeReact cash row.', 1, 'NSE', '{"module":"india_institutional_positioning","source_endpoint":"https://www.nseindia.com/api/fiidiiTradeReact"}'::jsonb, true),
    ('IN_DII_CASH_NET', 'India DII Cash Net', 'Net DII cash flow from NSE cash trading activity.', NULL, 'daily', 'daily', 'INR crore', '₹ crore', 'core', 'capital_flows', 'NSE fiidiiTradeReact cash row.', 1, 'NSE', '{"module":"india_institutional_positioning","source_endpoint":"https://www.nseindia.com/api/fiidiiTradeReact"}'::jsonb, true),
    ('IN_FII_INDEX_FUTURE_NET', 'India FII Index Futures Net', 'Net FII participation in NSE index futures.', NULL, 'daily', 'daily', 'contracts', 'contracts', 'core', 'capital_flows', 'NSE participant OI CSV index-futures long minus short.', 1, 'NSE', '{"module":"india_institutional_positioning","source_endpoint":"https://nsearchives.nseindia.com/content/nsccl"}'::jsonb, true),
    ('IN_FII_INDEX_FUTURE_LONG_SHORT_RATIO', 'India FII Index Futures Long/Short Ratio', 'Index futures long divided by short positioning for FII rows.', NULL, 'daily', 'daily', 'ratio', 'ratio', 'core', 'capital_flows', 'Computed from NSE participant OI CSV long and short fields.', 1, 'NSE', '{"module":"india_institutional_positioning","source_endpoint":"https://nsearchives.nseindia.com/content/nsccl"}'::jsonb, true),
    ('IN_FII_PUT_CALL_POSITIONING', 'India FII Put/Call Positioning', 'Put-call short positioning ratio for FII index options.', NULL, 'daily', 'daily', 'ratio', 'ratio', 'core', 'capital_flows', 'Computed from NSE participant OI CSV option short fields.', 1, 'NSE', '{"module":"india_institutional_positioning","source_endpoint":"https://nsearchives.nseindia.com/content/nsccl"}'::jsonb, true),
    ('IN_INDIA_VIX', 'India VIX', 'India Volatility Index close.', NULL, 'daily', 'daily', 'index', 'Index', 'core', 'market_regime', 'NSE India VIX daily close.', 1, 'NSE', '{"module":"india_institutional_positioning","source_endpoint":"https://www.nseindia.com"}'::jsonb, true),
    ('IN_NSDL_SECTOR_FLOW', 'NSDL Sector Net Flow', 'Fortnightly NSDL sector flow observation by sector.', NULL, 'fortnightly', 'fortnightly', 'INR crore', '₹ crore', 'core', 'sector_rotation', 'NSDL sector report flow column by sector.', 14, 'NSDL', '{"module":"india_institutional_positioning","source_endpoint":"https://www.fpi.nsdl.co.in/web/StaticReports/Fortnightly_Sector_wise_FII_Investment_Data"}'::jsonb, true),
    ('IN_NSDL_SECTOR_AUM', 'NSDL Sector AUM', 'Fortnightly NSDL sector AUM observation by sector.', NULL, 'fortnightly', 'fortnightly', 'INR crore', '₹ crore', 'core', 'sector_rotation', 'NSDL sector report AUM column by sector.', 14, 'NSDL', '{"module":"india_institutional_positioning","source_endpoint":"https://www.fpi.nsdl.co.in/web/StaticReports/Fortnightly_Sector_wise_FII_Investment_Data"}'::jsonb, true),
    ('IN_MARKET_BREADTH', 'India Market Breadth', 'Advances and declines breadth input for India market confirmation.', NULL, 'daily', 'daily', 'count', 'advances / declines', 'core', 'market_regime', 'NSE breadth close data.', 1, 'NSE', '{"module":"india_institutional_positioning","source":"nse_market_breadth"}'::jsonb, true),
    ('IN_NIFTY_RETURN', 'Nifty 50 Return', 'Nifty 50 daily return used in positioning confirmation.', NULL, 'daily', 'daily', '%', '%', 'core', 'market_regime', 'NSE Nifty 50 close-to-close return.', 1, 'NSE', '{"module":"india_institutional_positioning","source":"nse_nifty50"}'::jsonb, true),
    ('IN_USD_INR_RETURN', 'USD/INR Return', 'USD/INR close-to-close return for INR confirmation.', NULL, 'daily', 'daily', '%', '%', 'core', 'fx', 'RBI reference rate or approved market close.', 1, 'RBI', '{"module":"india_institutional_positioning","source":"rbi_reference_rate"}'::jsonb, true),
    ('IN_RBI_LIQUIDITY_IMPULSE', 'RBI Liquidity Impulse', 'Weekly liquidity impulse score derived from RBI liquidity telemetry.', NULL, 'weekly', 'weekly', 'score', 'percentile score', 'core', 'liquidity', 'Derived from RBI liquidity observations already in GraphiQuestor.', 7, 'RBI', '{"module":"india_institutional_positioning","source":"rbi_liquidity_telemetry"}'::jsonb, true),
    ('IN_BANK_CREDIT_GROWTH_YOY', 'India Bank Credit Growth YoY', 'Year-over-year bank credit growth from RBI DBIE.', NULL, 'monthly', 'monthly', '%', '%', 'core', 'credit', 'RBI DBIE bank credit series already ingested by GraphiQuestor.', 45, 'RBI', '{"module":"india_institutional_positioning","source":"rbi_dbie_bsc1"}'::jsonb, true)
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
    methodology_note = EXCLUDED.methodology_note,
    expected_interval_days = EXCLUDED.expected_interval_days,
    source = EXCLUDED.source,
    metadata = EXCLUDED.metadata,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
END $$;

CREATE TABLE IF NOT EXISTS public.india_institutional_sector_observations (
  sector_key text NOT NULL,
  source_sector_label text NOT NULL,
  report_period_end date NOT NULL,
  equity_flow_inr_crore numeric,
  total_flow_inr_crore numeric,
  equity_aum_inr_crore numeric,
  total_aum_inr_crore numeric,
  source_url text NOT NULL,
  source_hash text NOT NULL,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  parser_version text NOT NULL,
  provenance text NOT NULL,
  is_provisional boolean NOT NULL DEFAULT true,
  PRIMARY KEY (sector_key, report_period_end)
);

ALTER TABLE public.india_institutional_sector_observations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'india_institutional_sector_observations'
      AND policyname = 'Allow public read access on india_institutional_sector_observations'
  ) THEN
    CREATE POLICY "Allow public read access on india_institutional_sector_observations"
      ON public.india_institutional_sector_observations
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'india_institutional_sector_observations'
      AND policyname = 'Service role write access on india_institutional_sector_observations'
  ) THEN
    CREATE POLICY "Service role write access on india_institutional_sector_observations"
      ON public.india_institutional_sector_observations
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_india_institutional_sector_observations_report_period_end
  ON public.india_institutional_sector_observations (report_period_end DESC);

CREATE INDEX IF NOT EXISTS idx_india_institutional_sector_observations_sector_key
  ON public.india_institutional_sector_observations (sector_key);

CREATE INDEX IF NOT EXISTS idx_india_institutional_sector_observations_provenance
  ON public.india_institutional_sector_observations (provenance);

CREATE INDEX IF NOT EXISTS idx_india_institutional_sector_observations_source_hash
  ON public.india_institutional_sector_observations (source_hash);

COMMENT ON TABLE public.india_institutional_sector_observations IS
  'Fortnightly NSDL sector observations for India institutional positioning. Public read via RLS. Source hash keeps report corrections auditable.';
