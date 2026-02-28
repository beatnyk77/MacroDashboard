-- Seed Capital Flow Metrics for Radar
INSERT INTO metric_observations (metric_id, as_of_date, value, z_score, last_updated_at) VALUES 
('CAPITAL_FROM_EQUITY_ETF_BN', CURRENT_DATE, 45.2, 1.2, NOW()),
('CAPITAL_FROM_TREASURIES_BN', CURRENT_DATE, 120.5, 0.4, NOW()),
('BITCOIN_PRICE_USD', CURRENT_DATE, 62000.0, 2.1, NOW()),
('ECB_TOTAL_ASSETS_MEUR', CURRENT_DATE, 6500000.0, -0.8, NOW()),
('EU_DEBT_GDP_PCT', CURRENT_DATE, 89.4, 0.5, NOW()),
('GLOBAL_EUR_SHARE_PCT', CURRENT_DATE, 19.5, -0.2, NOW()),
('CN_CREDIT_TOTAL', CURRENT_DATE, 48000.0, 1.8, NOW()),
('CN_DEBT_USD_TN', CURRENT_DATE, 52.0, 1.5, NOW()),
('REER_INDEX_CN', CURRENT_DATE, 98.4, -1.1, NOW()),
('JP_CREDIT_TOTAL', CURRENT_DATE, 18000.0, -0.3, NOW()),
('JP_DEBT_GDP_PCT', CURRENT_DATE, 255.0, 2.5, NOW()),
('BOJ_TOTAL_ASSETS_TRJPY', CURRENT_DATE, 750.0, 1.1, NOW()),
('IN_CREDIT_TOTAL', CURRENT_DATE, 3500.0, 2.2, NOW()),
('IN_DEBT_USD_TN', CURRENT_DATE, 3.2, 0.8, NOW()),
('IN_FX_RESERVES', CURRENT_DATE, 620.5, 1.4, NOW()),
('REER_INDEX_BR', CURRENT_DATE, 102.1, 0.6, NOW()),
('BR_DEBT_GDP_PCT', CURRENT_DATE, 78.5, 0.9, NOW()),
('BRICS_USD_RESERVE_SHARE_PCT', CURRENT_DATE, 12.4, 1.6, NOW())
ON CONFLICT (metric_id, as_of_date) DO UPDATE SET value = EXCLUDED.value, z_score = EXCLUDED.z_score;

-- Seed some Macro News
INSERT INTO macro_news_headlines (title, link, source, published_at, category, ingested_at, keywords) VALUES
('RBI holds repo rate steady at 6.5%, signals growth confidence', 'https://www.livemint.com/rbi-repo-rate-28feb', 'Mint', NOW() - INTERVAL '2 hours', 'India', NOW(), '{"RBI", "repo rate", "growth"}'),
('Global liquidity ticks up as ECB hints at early summer cuts', 'https://www.ft.com/ecb-liquidity-cuts', 'Financial Times', NOW() - INTERVAL '5 hours', 'Global', NOW(), '{"liquidity", "ECB", "cut"}'),
('India Capex cycle accelerates in Q4 FY24 despite election curbs', 'https://economictimes.indiatimes.com/india-capex', 'Economic Times', NOW() - INTERVAL '12 hours', 'India', NOW(), '{"India", "capex"}'),
('PBoC injects heavy liquidity via MLF to stabilize property sector', 'https://www.bloomberg.com/pboc-mlf', 'Bloomberg', NOW() - INTERVAL '1 day', 'Global', NOW(), '{"PBoC", "liquidity", "China"}'),
('Gold surges past $2100 as BRICS central banks accelerate accumulation', 'https://www.reuters.com/gold-brics', 'Reuters', NOW() - INTERVAL '1.5 days', 'Global', NOW(), '{"gold", "BRICS", "reserves"}')
ON CONFLICT (link) DO NOTHING;
