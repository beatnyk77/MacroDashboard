-- Register US_10Y_TIPS_YIELD and CB_GOLD_NET in metrics table
-- Required for vw_latest_metrics to surface these to compute-daily-macro-signal.
-- Data is populated by ingest-fiscaldata edge function:
--   US_10Y_TIPS_YIELD: FRED DFII10 (daily, Federal Reserve H.15)
--   CB_GOLD_NET:       IMF IFS RAXG_FO (annual, net tonnes)

INSERT INTO metrics (
  id, name, category, unit, unit_label,
  native_frequency, display_frequency, expected_interval_days, frequency_type,
  source_id, is_active, metadata
) VALUES (
  'US_10Y_TIPS_YIELD',
  'US 10Y TIPS Yield (Real)',
  'macro_regime',
  'percent',
  '% real yield',
  'daily',
  'daily',
  1,
  'statistical',
  (SELECT id FROM data_sources WHERE name = 'FRED'),
  true,
  '{"fred_id": "DFII10", "release": "H.15 Selected Interest Rates", "note": "Market yield on US Treasury 10Y inflation-indexed securities (TIPS), daily"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  metadata = EXCLUDED.metadata;

INSERT INTO metrics (
  id, name, category, unit, unit_label,
  native_frequency, display_frequency, expected_interval_days, frequency_type,
  source_id, is_active, metadata
) VALUES (
  'CB_GOLD_NET',
  'Central Bank Net Gold Purchases',
  'macro_regime',
  'tonnes',
  'tonnes (net)',
  'annual',
  'annual',
  365,
  'structural',
  (SELECT id FROM data_sources WHERE name = 'IMF'),
  true,
  '{"indicator": "RAXG_FO", "release": "IMF International Financial Statistics", "note": "Annual net change in global central bank gold holdings (buyers minus sellers, tonnes)"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  metadata = EXCLUDED.metadata;
