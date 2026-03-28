-- =====================================================
-- Institutional Macro Metrics Seeding
-- =====================================================

INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, metadata, expected_interval_days) VALUES
  -- 1. Offshore Dollar Stress
  -- DEPRECATED: TED_SPREAD (LIBOR-based, discontinued 2023). Historical data preserved for backtest.
  ('TED_SPREAD', 'TED Spread', 'DEPRECATED: Difference between 3-month LIBOR and 3-month T-bill rate', 1, 'daily', 'daily', 'bps', 'basis points', 'deprecated', 'liquidity', '{"fred_id": "TEDRATE", "deprecated": true, "reason": "LIBOR discontinued"}', 2),
  ('SOFR_OIS_SPREAD', 'SOFR-OIS Spread', 'Secured Overnight Financing Rate minus Effective Fed Funds Rate (basis points). Modern replacement for TED Spread, measures institutional funding stress.', 1, 'daily', 'daily', 'bps', 'basis points', 'core', 'liquidity', '{"fred_series": ["SOFR", "EFFR"], "computed": true}', 2),
  ('ED_F_FRONT', 'Eurodollar Futures (Front)', 'Front month Eurodollar futures price', 6, 'daily', 'daily', 'index', 'index', 'core', 'liquidity', '{"yahoo_ticker": "GE=F"}', 2),
  ('ED_F_DEFERRED', 'Eurodollar Futures (Deferred)', 'Deferred Eurodollar futures price (2y out)', 6, 'daily', 'daily', 'index', 'index', 'core', 'liquidity', '{"yahoo_ticker": "GEZ2027.CME"}', 2),

  -- 2. Credit Creation Pulse (Credit Impulse Proxies)
  ('US_CREDIT_TOTAL', 'US Total Commercial Bank Loans', 'Total Loans and Leases, All Commercial Banks', 1, 'weekly', 'monthly', 'USD bn', 'billion USD', 'core', 'liquidity', '{"fred_id": "TOTLL"}', 8),
  ('CN_CREDIT_TOTAL', 'China Total Social Financing', 'Total Social Financing (TSF) - Stock', 1, 'monthly', 'monthly', 'CNY bn', 'billion CNY', 'core', 'liquidity', '{"fred_id": "CHNTOTSOCFINAN"}', 35),
  ('IN_CREDIT_TOTAL', 'India Bank Credit', 'Scheduled Commercial Banks - Bank Credit', 1, 'fortnightly', 'monthly', 'INR bn', 'billion INR', 'core', 'liquidity', '{"fred_id": "INDCBRLOANSTOTL"}', 20),
  ('EU_CREDIT_TOTAL', 'Eurozone Net Lending', 'Net Lending/Borrowing of Euro Area MFIs', 1, 'quarterly', 'quarterly', 'EUR bn', 'billion EUR', 'core', 'liquidity', '{"fred_id": "BOGZFU194190005Q"}', 100),
  ('JP_CREDIT_TOTAL', 'Japan Bank Loans', 'Loans and Discounts, All Banks in Japan', 1, 'monthly', 'monthly', 'JPY bn', 'billion JPY', 'core', 'liquidity', '{"fred_id": "JPNLOAN"}', 35),

  -- 3. Geopolitical Risk Pulse
  ('MOVE_INDEX', 'MOVE Index', 'ICE BofA Merrill Lynch Option Volatility Estimate Index', 1, 'daily', 'daily', 'index', 'index', 'core', 'macro_regime', '{"fred_id": "MOVE"}', 2),
  -- VIX is already present as ^VIX in some versions, but let's ensure it's here if not.
  -- Gold is already GOLD_PRICE_USD.

  -- 4. Demographic Fiscal Drag (Old-age dependency ratio)
  ('US_DEPENDENCY_RATIO', 'US Dependency Ratio', 'Age dependency ratio, old (% of working-age population)', 1, 'annual', 'annual', '%', 'percent', 'secondary', 'macro_regime', '{"fred_id": "SPPOPDPNDOLUSA"}', 400),
  ('CN_DEPENDENCY_RATIO', 'China Dependency Ratio', 'Age dependency ratio, old (% of working-age population)', 1, 'annual', 'annual', '%', 'percent', 'secondary', 'macro_regime', '{"fred_id": "SPPOPDPNDOLCHN"}', 400),
  ('JP_DEPENDENCY_RATIO', 'Japan Dependency Ratio', 'Age dependency ratio, old (% of working-age population)', 1, 'annual', 'annual', '%', 'percent', 'secondary', 'macro_regime', '{"fred_id": "SPPOPDPNDOLJPN"}', 400),
  ('EU_DEPENDENCY_RATIO', 'Eurozone Dependency Ratio', 'Age dependency ratio, old (% of working-age population)', 1, 'annual', 'annual', '%', 'percent', 'secondary', 'macro_regime', '{"fred_id": "SPPOPDPNDOLEMU"}', 400),
  ('IN_DEPENDENCY_RATIO', 'India Dependency Ratio', 'Age dependency ratio, old (% of working-age population)', 1, 'annual', 'annual', '%', 'percent', 'secondary', 'macro_regime', '{"fred_id": "SPPOPDPNDOLIND"}', 400)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  metadata = EXCLUDED.metadata,
  source_id = EXCLUDED.source_id,
  category = EXCLUDED.category;
