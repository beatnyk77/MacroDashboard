-- =====================================================
-- GFCF Metrics Seeding (Gross Fixed Capital Formation)
-- =====================================================

INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days) VALUES
  -- UNITED STATES
  ('US_GFCF_GDP_PCT', 'US Investment % GDP', 'US Gross Private Domestic Investment as % of GDP', 1, 'quarterly', 'quarterly', '%', 'percent', 'core', 'macro_regime', 'FRED (A006RE1Q156NBEA)', 100),
  ('US_PRIVATE_GFCF_GDP_PCT', 'US Private Investment % GDP', 'US Private Fixed Investment as % of GDP', 1, 'quarterly', 'quarterly', '%', 'percent', 'core', 'macro_regime', 'FRED (A006RE1Q156NBEA)', 100),

  -- CHINA
  ('CN_GFCF_GDP_PCT', 'China Investment % GDP', 'China Fixed Asset Investment as % of GDP', 3, 'monthly', 'monthly', '%', 'percent', 'core', 'macro_regime', 'NBS / Trading Economics Proxy', 35),

  -- JAPAN
  ('JP_GFCF_GDP_PCT', 'Japan Investment % GDP', 'Japan Gross Fixed Capital Formation as % of GDP', 3, 'quarterly', 'quarterly', '%', 'percent', 'core', 'macro_regime', 'Cabinet Office / FRED', 100),

  -- INDIA
  ('IN_GFCF_GDP_PCT', 'India Investment % GDP', 'India Gross Fixed Capital Formation as % of GDP', 3, 'quarterly', 'quarterly', '%', 'percent', 'core', 'macro_regime', 'MoSPI / FRED', 100),

  -- EUROZONE
  ('EU_GFCF_GDP_PCT', 'Eurozone Investment % GDP', 'Euro Area Gross Fixed Capital Formation as % of GDP', 3, 'quarterly', 'quarterly', '%', 'percent', 'core', 'macro_regime', 'Eurostat / FRED', 100)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  source_id = EXCLUDED.source_id,
  methodology_note = EXCLUDED.methodology_note;


-- =====================================================
-- Cron Schedule for GFCF Ingestion
-- =====================================================

SELECT cron.schedule(
    'ingest-gfcf-monthly',
    '30 5 2 * *', -- Run at 05:30 AM UTC on day 2 of every month
    $$
    SELECT
      net.http_post(
          url:='https://project-ref.supabase.co/functions/v1/ingest-gfcf',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
      ) as request_id;
    $$
);
