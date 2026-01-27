-- Insert US Proxy Metrics (FRED)
INSERT INTO metrics (id, name, source_id, category, tier, unit_label, native_frequency, display_frequency, expected_interval_days, metadata)
VALUES 
('US_DEBT_GDP', 'US Debt to GDP Ratio', 1, 'sovereign', 'core', '%', 'quarterly', 'quarterly', 95, '{"fred_id": "GFDEGDQ188S"}'),
('US_PCE_PI', 'US PCE Price Index', 1, 'macro_regime', 'core', 'index', 'monthly', 'monthly', 31, '{"fred_id": "PCEPI"}')
ON CONFLICT (id) DO UPDATE SET 
    metadata = EXCLUDED.metadata,
    source_id = EXCLUDED.source_id,
    category = EXCLUDED.category,
    display_frequency = EXCLUDED.display_frequency;

-- Insert G20 Aggregate Metrics (IMF)
INSERT INTO metrics (id, name, source_id, category, tier, unit_label, native_frequency, display_frequency, expected_interval_days, metadata)
VALUES 
('G20_DEBT_GDP_PCT', 'G20 Debt to GDP Ratio', 3, 'sovereign', 'core', '%', 'annual', 'annual', 400, '{"imf_indicator": "GGXWDG_NGDP", "imf_group": "FAD_G20"}'),
('G20_INFLATION_YOY', 'G20 Inflation YoY', 3, 'macro_regime', 'core', '%', 'annual', 'annual', 400, '{"imf_indicator": "PCPIPCH", "imf_group": "FAD_G20"}'),
('G20_INTEREST_BURDEN_PCT', 'G20 Interest Burden', 3, 'sovereign', 'core', '%', 'annual', 'annual', 400, '{"imf_indicator": "ie", "imf_group": "FAD_G20"}')
ON CONFLICT (id) DO UPDATE SET 
    metadata = EXCLUDED.metadata,
    source_id = EXCLUDED.source_id,
    category = EXCLUDED.category,
    display_frequency = EXCLUDED.display_frequency;
