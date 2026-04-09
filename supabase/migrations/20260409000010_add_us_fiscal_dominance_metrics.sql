-- =====================================================
-- US Fiscal Dominance Meter — Metric Definitions
-- =====================================================
-- Adds FRED-sourced metrics needed to compute:
--   Fiscal Dominance Ratio = (Interest Payments + Major Entitlements) / Tax Receipts
-- Series: FYOINT, W068RCQ027SBEA, W006RC1Q027SBEA
-- =====================================================

-- NOTE: source_id = 1 is FRED (from data_sources seed in 001_initial_schema.sql)

INSERT INTO metrics (
  id, name, description, source_id, native_frequency, display_frequency,
  unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata
) VALUES
  (
    'US_FEDERAL_INTEREST',
    'US Federal Interest Payments',
    'Quarterly interest payments on the US federal debt (FRED: FYOINT)',
    1, 'quarterly', 'quarterly',
    'USD bn', 'billion USD', 'core', 'sovereign',
    'FRED series FYOINT: Federal Government Current Interest Payments. Includes all interest paid on Treasury debt held by the public and intra-governmental accounts.',
    40,
    '{"fred_id": "FYOINT"}'::jsonb
  ),
  (
    'US_MAJOR_ENTITLEMENTS',
    'US Major Entitlements',
    'Major entitlement outlays — primarily Social Security and Medicare (FRED: W068RCQ027SBEA)',
    1, 'quarterly', 'quarterly',
    'USD bn', 'billion USD', 'core', 'sovereign',
    'FRED series W068RCQ027SBEA: Government social benefits (social security & medicare) to persons. This captures the two largest mandatory spending programs.',
    40,
    '{"fred_id": "W068RCQ027SBEA"}'::jsonb
  ),
  (
    'US_TAX_RECEIPTS',
    'US Federal Tax Receipts',
    'Total federal government current tax receipts (FRED: W006RC1Q027SBEA)',
    1, 'quarterly', 'quarterly',
    'USD bn', 'billion USD', 'core', 'sovereign',
    'FRED series W006RC1Q027SBEA: Federal Government Current Tax Receipts. Includes individual income, payroll, and corporate taxes.',
    40,
    '{"fred_id": "W006RC1Q027SBEA"}'::jsonb
  )
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
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- =====================================================
-- Index: Speed up FRED-id scans for processFred
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_metrics_fred_id_gin ON metrics USING GIN ((metadata->'fred_id')) WHERE (metadata->'fred_id') IS NOT NULL;

COMMENT ON INDEX idx_metrics_fred_id_gin IS 'GIN index for fast lookups of fred_id in metadata JSONB';
