-- =====================================================
-- Capital Flow Radar – Missing Metrics Definition
-- =====================================================

DO $$
DECLARE
  fred_id INTEGER;
  av_id INTEGER;
  imf_id INTEGER;
BEGIN
  SELECT id INTO fred_id FROM data_sources WHERE name = 'FRED';
  SELECT id INTO imf_id FROM data_sources WHERE name = 'IMF';
  
  -- Insert Alpha Vantage if missing
  INSERT INTO data_sources (name, api_endpoint, auth_type, metadata)
  VALUES ('Alpha Vantage', 'https://www.alphavantage.co/query', 'api_key', '{"rate_limit": 5, "rate_window": "60s"}')
  ON CONFLICT (name) DO NOTHING;
  
  SELECT id INTO av_id FROM data_sources WHERE name = 'Alpha Vantage';

  -- 2. Insert missing metrics for Capital Flow Radar
  INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, expected_interval_days, metadata)
  VALUES
    -- US
    ('CAPITAL_FROM_EQUITY_ETF_BN', 'US Equity Flow Proxy (SPY)', 'Flow proxy derived from SPY volume and price', av_id, 'daily', 'daily', 'USD bn', 'billion USD', 'secondary', 'liquidity', 2, '{"proxy_ticker": "SPY"}'),
    ('CAPITAL_FROM_TREASURIES_BN', 'US Debt Flow Proxy (TLT)', 'Flow proxy derived from TLT volume and price', av_id, 'daily', 'daily', 'USD bn', 'billion USD', 'secondary', 'liquidity', 2, '{"proxy_ticker": "TLT"}'),
    ('BITCOIN_PRICE_USD', 'Bitcoin Price', 'Bitcoin / USD exchange rate', fred_id, 'daily', 'daily', 'USD', 'USD', 'secondary', 'liquidity', 2, '{"fred_id": "BTCUSD"}'),
    
    -- EU
    ('ECB_TOTAL_ASSETS_MEUR', 'ECB Total Assets', 'Total Assets of the Eurosystem (EUR Millions)', fred_id, 'weekly', 'weekly', 'EUR mn', 'million EUR', 'core', 'liquidity', 8, '{"fred_id": "ECBASSETSNW"}'),
    ('EU_DEBT_GDP_PCT', 'Eurozone Debt to GDP', 'General government gross debt for Euro Area (% of GDP)', imf_id, 'annual', 'annual', '%', 'percent', 'core', 'sovereign', 400, '{"imf_indicator": "GGXWDG_NGDP", "imf_group": "EURO"}'),
    ('GLOBAL_EUR_SHARE_PCT', 'Global EUR Reserve Share', 'Euro share of global foreign exchange reserves', imf_id, 'quarterly', 'quarterly', '%', 'percent', 'secondary', 'de_dollarization', 100, '{"imf_indicator": "RARE_EUR", "imf_group": "WORLD"}'),
    
    -- China
    ('CN_DEBT_USD_TN', 'China Total Public Debt (USD)', 'Total Debt of China in USD Trillions', imf_id, 'annual', 'annual', 'USD tn', 'trillion USD', 'core', 'sovereign', 400, '{"imf_indicator": "GGXWDG_NGDP", "imf_group": "CHN"}'),
    
    -- Japan
    ('BOJ_TOTAL_ASSETS_TRJPY', 'BoJ Total Assets', 'Total Assets of the Bank of Japan (Trillion JPY)', fred_id, 'monthly', 'monthly', 'JPY tn', 'trillion JPY', 'core', 'liquidity', 35, '{"fred_id": "JPNASSETSNW"}'),
    ('JP_DEBT_GDP_PCT', 'Japan Debt to GDP', 'General government gross debt for Japan (% of GDP)', imf_id, 'annual', 'annual', '%', 'percent', 'core', 'sovereign', 400, '{"imf_indicator": "GGXWDG_NGDP", "imf_group": "JPN"}'),
    
    -- India
    ('IN_DEBT_USD_TN', 'India Total Public Debt (USD)', 'Total Public Debt of India in USD Trillions', imf_id, 'annual', 'annual', 'USD tn', 'trillion USD', 'core', 'sovereign', 400, '{"imf_indicator": "GGXWDG_NGDP", "imf_group": "IND"}'),
    ('IN_FX_RESERVES', 'India FX Reserves (Total)', 'Total Foreign Exchange Reserves for India (USD Millions)', fred_id, 'weekly', 'weekly', 'USD mn', 'million USD', 'core', 'liquidity', 8, '{"fred_id": "TRESEGIDA161NW"}'),
    
    -- Brazil
    ('BR_DEBT_GDP_PCT', 'Brazil Debt to GDP', 'General government gross debt for Brazil (% of GDP)', imf_id, 'annual', 'annual', '%', 'percent', 'core', 'sovereign', 400, '{"imf_indicator": "GGXWDG_NGDP", "imf_group": "BRA"}'),
    
    -- BRICS
    ('BRICS_USD_RESERVE_SHARE_PCT', 'BRICS USD Reserve Share', 'USD share of total foreign exchange reserves for BRICS nations', imf_id, 'annual', 'annual', '%', 'percent', 'secondary', 'de_dollarization', 400, '{"imf_indicator": "RARE_USD", "imf_group": "BRICS"}')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    metadata = EXCLUDED.metadata,
    source_id = EXCLUDED.source_id,
    expected_interval_days = EXCLUDED.expected_interval_days;
END $$;
