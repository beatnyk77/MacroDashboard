-- =====================================================
-- Migration: Register Market Telemetry & CFTC COT Metrics
-- Date: 2026-08-29
-- =====================================================

DO $$
DECLARE
    openbb_source_id integer;
    cftc_source_id integer;
BEGIN
    -- Ensure data source records exist
    INSERT INTO data_sources (name, api_endpoint, auth_type, is_active, metadata)
    VALUES 
      ('OpenBB', 'https://openbb.co', 'none', true, '{"provider": "openbb_multi_vendor"}'),
      ('CFTC', 'https://www.cftc.gov', 'none', true, '{"report": "commitments_of_traders"}')
    ON CONFLICT (name) DO UPDATE SET
      api_endpoint = EXCLUDED.api_endpoint,
      is_active = true;

    SELECT id INTO openbb_source_id FROM data_sources WHERE name = 'OpenBB';
    SELECT id INTO cftc_source_id FROM data_sources WHERE name = 'CFTC';

    -- ── 1. Global Market & Cross-Asset Metrics ───────────────────────────────────

    INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, is_active)
    VALUES
      ('DXY_INDEX', 'US Dollar Index', 'US Dollar Currency Index (DXY) against basket of major currencies', openbb_source_id, 'daily', 'daily', 'index', 'Index', 'core', 'liquidity', 'Market close daily series via OpenBB / ICE exchange index.', 1, true),
      ('GOLD_PRICE_USD', 'Gold Continuous Futures', 'Continuous Gold Futures Price (USD/troy oz)', openbb_source_id, 'daily', 'daily', 'USD/oz', 'USD/oz', 'core', 'valuation', 'COMEX Gold Continuous Settlement Price.', 1, true),
      ('OIL_BRENT_PRICE_USD', 'Brent Crude Oil Futures', 'Brent Crude Oil Continuous Futures Price (USD/barrel)', openbb_source_id, 'daily', 'daily', 'USD/bbl', 'USD/bbl', 'core', 'valuation', 'ICE Brent Crude Continuous Settlement Price.', 1, true),
      ('VIX_INDEX', 'CBOE Volatility Index', 'CBOE 30-day Implied S&P 500 Volatility Index', openbb_source_id, 'daily', 'daily', 'index', 'Index', 'core', 'macro_regime', 'CBOE Volatility Index official close.', 1, true),
      ('UST_10Y_YIELD', 'US 10-Year Treasury Yield', 'US 10-Year Treasury Benchmark Constant Maturity Yield', openbb_source_id, 'daily', 'daily', '%', '%', 'core', 'funding', 'CBOE / Treasury 10-Year benchmark yield in percentage.', 1, true),
      ('BITCOIN_PRICE_USD', 'Bitcoin Price (USD)', 'Bitcoin spot price in USD (Macro liquidity proxy)', openbb_source_id, 'daily', 'daily', 'USD', 'USD', 'secondary', 'liquidity', 'Spot daily close across composite exchanges.', 1, true),
      ('SPX_INDEX', 'S&P 500 Index', 'S&P 500 US Large Cap Equity Benchmark Index', openbb_source_id, 'daily', 'daily', 'index', 'Index', 'core', 'valuation', 'S&P 500 official daily closing price.', 1, true),
      ('USD_INR_RATE', 'USD/INR Cross Rate', 'US Dollar to Indian Rupee spot exchange rate', openbb_source_id, 'daily', 'daily', 'INR', '₹/USD', 'core', 'funding', 'Daily spot exchange rate.', 1, true),
      ('USD_CNY_RATE', 'USD/CNY Cross Rate', 'US Dollar to Chinese Yuan spot exchange rate', openbb_source_id, 'daily', 'daily', 'CNY', '¥/USD', 'core', 'funding', 'Daily spot exchange rate.', 1, true),
      ('USD_BRL_RATE', 'USD/BRL Cross Rate', 'US Dollar to Brazilian Real spot exchange rate', openbb_source_id, 'daily', 'daily', 'BRL', 'R$/USD', 'secondary', 'funding', 'Daily spot exchange rate.', 1, true),
      ('USD_MXN_RATE', 'USD/MXN Cross Rate', 'US Dollar to Mexican Peso spot exchange rate', openbb_source_id, 'daily', 'daily', 'MXN', '$/USD', 'secondary', 'funding', 'Daily spot exchange rate.', 1, true),
      ('CRACK_SPREAD_321_USD', '3:2:1 Refinery Crack Spread', '3:2:1 Refining Margin proxy: (2*Gasoline + 1*Heating Oil - 3*Crude)/3 in USD/bbl', openbb_source_id, 'daily', 'daily', 'USD/bbl', 'USD/bbl', 'secondary', 'macro_regime', 'Derived physical refining margin from petroleum futures.', 1, true),
      ('US_NET_LIQUIDITY_USD_BN', 'US Net Liquidity Gauge', 'Fed Balance Sheet Assets minus TGA minus Reverse Repo in USD Billion', openbb_source_id, 'daily', 'daily', 'USD bn', 'bn USD', 'core', 'liquidity', 'Fed Total Assets - TGA Balance - ON RRP Balance.', 1, true)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      unit = EXCLUDED.unit,
      unit_label = EXCLUDED.unit_label,
      tier = EXCLUDED.tier,
      category = EXCLUDED.category,
      methodology_note = EXCLUDED.methodology_note,
      expected_interval_days = EXCLUDED.expected_interval_days,
      is_active = true;

    -- ── 2. CFTC Commitments of Traders (COT) Metrics ──────────────────────────────

    INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, is_active)
    VALUES
      ('COT_UST_10Y_NET_SPEC', '10Y UST Speculator Net Position', 'CFTC 10-Year Treasury Notes Non-Commercial / Leveraged Money Net Contracts', cftc_source_id, 'weekly', 'weekly', 'contracts', 'contracts', 'core', 'macro_regime', 'CFTC Traders in Financial Futures weekly report (CBOT 043602). Leveraged Money Long minus Short.', 7, true),
      ('COT_GOLD_NET_SPEC', 'Gold COMEX Speculator Net Position', 'CFTC Gold Futures Managed Money Net Position (COMEX 088691)', cftc_source_id, 'weekly', 'weekly', 'contracts', 'contracts', 'core', 'macro_regime', 'CFTC Disaggregated Futures weekly report. Managed Money Long minus Short.', 7, true),
      ('COT_OIL_WTI_NET_SPEC', 'WTI Crude Speculator Net Position', 'CFTC WTI Light Sweet Crude Managed Money Net Position (NYMEX 067651)', cftc_source_id, 'weekly', 'weekly', 'contracts', 'contracts', 'core', 'macro_regime', 'CFTC Disaggregated Futures weekly report. Managed Money Long minus Short.', 7, true),
      ('COT_DXY_NET_SPEC', 'USD Index Speculator Net Position', 'CFTC US Dollar Index Non-Commercial Net Position (ICE 098662)', cftc_source_id, 'weekly', 'weekly', 'contracts', 'contracts', 'core', 'macro_regime', 'CFTC Financial Futures weekly report. Non-Commercial Long minus Short.', 7, true),
      ('COT_SP500_NET_SPEC', 'E-Mini S&P 500 Net Spec Position', 'CFTC E-Mini S&P 500 Leveraged Money Net Position (CME 13874A)', cftc_source_id, 'weekly', 'weekly', 'contracts', 'contracts', 'core', 'macro_regime', 'CFTC Financial Futures weekly report. Leveraged Money Long minus Short.', 7, true)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      unit = EXCLUDED.unit,
      unit_label = EXCLUDED.unit_label,
      tier = EXCLUDED.tier,
      category = EXCLUDED.category,
      methodology_note = EXCLUDED.methodology_note,
      expected_interval_days = EXCLUDED.expected_interval_days,
      is_active = true;

END $$;
