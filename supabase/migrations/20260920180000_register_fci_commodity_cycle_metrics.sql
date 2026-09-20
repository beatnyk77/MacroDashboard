-- =====================================================
-- Migration: Register Barclays Financial Conditions Index & Commodity Cycle Metrics
-- Sourced from FRED:
--   CS:      BAMLH0A0HYM2 (ICE BofA US High Yield OAS)
--   r10Y:    DFII10 (US 10Y TIPS Real Yield - registered in 20260531000002)
--   Slope:   T10Y2Y (10Y-2Y Treasury Yield Spread)
--   FX:      DTWEXBGS (Nominal Broad U.S. Dollar Index)
--   Equities:SP500 (S&P 500 Daily Index)
--   Commodities: PALLFNFINDEXM (IMF All Commodity Price Index via FRED) / PPIACO
-- Derived Metrics:
--   BARCLAYS_GLOBAL_FCI, COMMODITIES_CYCLE_ZSCORE, and 5-pillar Z-scores
-- =====================================================

DO $$
DECLARE
  fred_source_id INTEGER;
BEGIN
  SELECT id INTO fred_source_id FROM data_sources WHERE name = 'FRED';

  -- 1. Raw Component Series from FRED
  INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, expected_interval_days, metadata) VALUES
    ('US_HY_OAS', 'US High Yield Credit Spread (OAS)', 'ICE BofA US High Yield Index Option-Adjusted Spread (FRED: BAMLH0A0HYM2)', fred_source_id, 'daily', 'daily', 'percent', '%', 'core', 'funding', 2, '{"fred_id": "BAMLH0A0HYM2"}'),
    ('US_YIELD_CURVE_10Y2Y', 'Yield Curve Slope (10Y - 2Y)', '10-Year Treasury Constant Maturity Minus 2-Year Treasury Constant Maturity (FRED: T10Y2Y)', fred_source_id, 'daily', 'daily', 'percent', '%', 'core', 'funding', 2, '{"fred_id": "T10Y2Y"}'),
    ('US_BROAD_DOLLAR', 'Nominal Broad US Dollar Index', 'Trade-Weighted Nominal Broad U.S. Dollar Index (FRED: DTWEXBGS)', fred_source_id, 'daily', 'daily', 'index', 'Index', 'core', 'macro_regime', 2, '{"fred_id": "DTWEXBGS"}'),
    ('US_SP500_INDEX', 'S&P 500 Index', 'S&P 500 Daily Price Index (FRED: SP500)', fred_source_id, 'daily', 'daily', 'index', 'Index', 'core', 'valuation', 2, '{"fred_id": "SP500"}'),
    ('GLOBAL_COMMODITIES_INDEX', 'Global Commodity Price Index', 'Global Price Index of All Commodities (FRED: PALLFNFINDEXM)', fred_source_id, 'monthly', 'monthly', 'index', 'Index 2016=100', 'core', 'macro_regime', 35, '{"fred_id": "PALLFNFINDEXM"}')
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
    expected_interval_days = EXCLUDED.expected_interval_days,
    metadata = EXCLUDED.metadata;

  -- 2. Derived Composite Metrics
  INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, expected_interval_days, metadata) VALUES
    ('BARCLAYS_GLOBAL_FCI', 'Global Financial Conditions Index (Barclays Model)', 'Financial Conditions Index based on Barclays model: equal-weighted rolling Z-score YoY of Credit Spreads, Real 10Y Yields, Yield Curve Slope, Broad Dollar FX, and Equities. Positive = restrictive/tight, Negative = accommodative/loose.', fred_source_id, 'weekly', 'weekly', 'z_score', 'σ', 'core', 'liquidity', 7, '{"model": "Barclays_FCI_YoY_ZScore", "convention": "Positive Tightening"}'),
    ('COMMODITIES_CYCLE_ZSCORE', 'Global Commodity Cycle Index', 'Standardized rolling Z-score of YoY broad commodity price impulse (IMF PALLFNFINDEXM / PPIACO), capturing structural cost-push inflation cycles that mechanically tighten financial conditions.', fred_source_id, 'weekly', 'weekly', 'z_score', 'σ', 'core', 'macro_regime', 7, '{"model": "Commodity_YoY_ZScore_Cycle"}'),
    ('FCI_CS_ZSCORE', 'FCI Pillar: Credit Spread Z-Score', 'Standardized YoY change Z-score for US High Yield OAS component (+ = widening/tightening).', fred_source_id, 'weekly', 'weekly', 'z_score', 'σ', 'secondary', 'funding', 7, '{}'),
    ('FCI_R10Y_ZSCORE', 'FCI Pillar: 10Y Real Rate Z-Score', 'Standardized YoY change Z-score for US 10Y TIPS Yield component (+ = rising real yield/tightening).', fred_source_id, 'weekly', 'weekly', 'z_score', 'σ', 'secondary', 'funding', 7, '{}'),
    ('FCI_SLOPE_ZSCORE', 'FCI Pillar: Yield Curve Slope Z-Score', 'Standardized YoY change Z-score for 10Y-2Y Treasury spread (- = curve inversion/flattening/tightening).', fred_source_id, 'weekly', 'weekly', 'z_score', 'σ', 'secondary', 'funding', 7, '{}'),
    ('FCI_FX_ZSCORE', 'FCI Pillar: Broad Dollar FX Z-Score', 'Standardized YoY change Z-score for Broad Trade-Weighted Dollar component (+ = dollar strength/global tightening).', fred_source_id, 'weekly', 'weekly', 'z_score', 'σ', 'secondary', 'macro_regime', 7, '{}'),
    ('FCI_EQUITY_ZSCORE', 'FCI Pillar: Equities Z-Score', 'Standardized YoY % change Z-score for S&P 500 component (- = equity selloff/tightening).', fred_source_id, 'weekly', 'weekly', 'z_score', 'σ', 'secondary', 'valuation', 7, '{}')
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
    expected_interval_days = EXCLUDED.expected_interval_days,
    metadata = EXCLUDED.metadata;

END $$;
