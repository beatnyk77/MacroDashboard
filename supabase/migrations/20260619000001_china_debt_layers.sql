-- China Public Sector Debt Layers
-- 5-layer iceberg framework + composite indices for Intel China Hub

-- ── Layer history table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.china_debt_layers (
    as_of_date          DATE NOT NULL,
    layer_code          TEXT NOT NULL,
    value_pct_gdp       NUMERIC,
    value_low_pct_gdp   NUMERIC,
    value_high_pct_gdp  NUMERIC,
    source              TEXT NOT NULL,
    source_ref          TEXT,
    is_provisional      BOOLEAN DEFAULT false,
    provenance          JSONB,
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (as_of_date, layer_code)
);

ALTER TABLE public.china_debt_layers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.china_debt_layers
    FOR SELECT USING (true);

COMMENT ON TABLE public.china_debt_layers IS
    'China 5-layer public sector debt stack (% GDP). Opaque layers carry IMF Article IV / BIS ranges with provenance.';

-- ── Composite indices table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.china_debt_composites (
    composite_id    TEXT NOT NULL,
    as_of_date      DATE NOT NULL,
    value           NUMERIC NOT NULL,
    components      JSONB,
    formula         TEXT,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (composite_id, as_of_date)
);

ALTER TABLE public.china_debt_composites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.china_debt_composites
    FOR SELECT USING (true);

COMMENT ON TABLE public.china_debt_composites IS
    'GraphiQuestor proprietary China debt stress composites (Iceberg Ratio, Monetization Pressure, etc.)';

-- ── Register metrics ──────────────────────────────────────────────────────────
INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days) VALUES
  ('CN_DEBT_GDP_PCT',           'China General Govt Debt',     'IMF WEO general government gross debt (% GDP)',           3, 'annual', 'annual', '%', 'percent', 'core', 'sovereign', 'IMF DataMapper GGXWDG_NGDP', 120),
  ('CN_DEBT_CENTRAL_GDP_PCT',   'China Central Govt Debt',     'World Bank central government debt (% GDP)',              3, 'annual', 'annual', '%', 'percent', 'core', 'sovereign', 'World Bank GC.DOD.TOTL.GD.ZS', 120),
  ('CN_FISCAL_BALANCE_GDP_PCT', 'China Fiscal Balance',        'IMF WEO general government net lending/borrowing (% GDP)', 3, 'annual', 'annual', '%', 'percent', 'core', 'sovereign', 'IMF DataMapper GGXONL_NGDP', 120),
  ('CN_CREDIT_GDP_PCT',         'China Private Credit',        'BIS total credit to private non-financial sector (% GDP)', 4, 'quarterly', 'quarterly', '%', 'percent', 'secondary', 'credit', 'BIS via FRED CRDQCNAPABIS', 100),
  ('CN_CGB_YIELD_2Y',           'China CGB 2Y Yield',          'China 2-year government bond yield',                      1, 'daily', 'daily', '%', 'percent', 'secondary', 'rates', 'FRED INTDSRCNM024N', 5),
  ('CN_CGB_YIELD_10Y',          'China CGB 10Y Yield',         'China 10-year government bond yield',                     1, 'daily', 'daily', '%', 'percent', 'core', 'rates', 'FRED INTDSRCNM193N', 5),
  ('CN_REAL_YIELD_10Y',           'China CGB Real 10Y Yield',    'CGB 10Y minus CPI inflation',                             16, 'monthly', 'monthly', '%', 'percent', 'secondary', 'rates', 'Derived: 10Y - CPI', 35),
  ('CN_ICEBERG_RATIO',            'China Iceberg Ratio',         'Consolidated debt (high) / official central debt',        16, 'quarterly', 'quarterly', 'x', 'ratio', 'core', 'sovereign', 'GraphiQuestor composite', 100),
  ('CN_LGFV_STRESS_INDEX',        'China LGFV Stress Index',     'LGFV layer trend + fiscal deterioration proxy (0-100)',   16, 'quarterly', 'quarterly', 'idx', 'index', 'core', 'sovereign', 'GraphiQuestor composite', 100),
  ('CN_MONETIZATION_PRESSURE',    'China Monetization Pressure',   'M2/GDP gap + credit acceleration composite (0-100)',        16, 'weekly', 'weekly', 'idx', 'index', 'core', 'liquidity', 'GraphiQuestor composite', 14),
  ('CN_DEBT_WALL_PROXIMITY',      'China Debt Wall Proximity',     'LGFV layer vs refinancing capacity proxy (0-100)',        16, 'quarterly', 'quarterly', 'idx', 'index', 'secondary', 'sovereign', 'GraphiQuestor composite', 100)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  methodology_note = EXCLUDED.methodology_note;

-- ── Seed 2015–2024 layer history (IMF Article IV / WEO staff estimates) ───────
-- Sources: IMF Article IV 2023/2024, IMF WEO Oct 2024, BIS Quarterly Review
INSERT INTO public.china_debt_layers (as_of_date, layer_code, value_pct_gdp, value_low_pct_gdp, value_high_pct_gdp, source, source_ref, is_provisional, provenance) VALUES
  -- 2015
  ('2015-12-31', 'central_official',  15.2, 14.5, 16.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, '{"note":"MoF central government bonds outstanding"}'),
  ('2015-12-31', 'local_gov',         16.8, 15.5, 18.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, '{"note":"Explicit local government bonds"}'),
  ('2015-12-31', 'lgfv',              28.0, 24.0, 32.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, '{"note":"LGFV off-balance-sheet estimate"}'),
  ('2015-12-31', 'policy_bank',       12.5, 10.0, 15.0, 'BIS', 'https://www.bis.org/statistics', true, '{"note":"Policy bank quasi-fiscal lending"}'),
  ('2015-12-31', 'soe_contingent',    15.0, 10.0, 20.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, '{"note":"SOE contingent liability range"}'),
  ('2015-12-31', 'consolidated',      78.0, 72.0, 95.0, 'IMF WEO', 'GGXWDG_NGDP', false, '{"method":"Staff consolidated public sector estimate"}'),
  -- 2016
  ('2016-12-31', 'central_official',  16.1, 15.0, 17.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2016-12-31', 'local_gov',         18.5, 17.0, 20.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2016-12-31', 'lgfv',              30.0, 26.0, 35.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2016-12-31', 'policy_bank',       13.5, 11.0, 16.0, 'BIS', 'https://www.bis.org/statistics', true, NULL),
  ('2016-12-31', 'soe_contingent',    16.0, 11.0, 22.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2016-12-31', 'consolidated',      82.0, 75.0, 100.0, 'IMF WEO', 'GGXWDG_NGDP', false, NULL),
  -- 2017
  ('2017-12-31', 'central_official',  16.8, 16.0, 18.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2017-12-31', 'local_gov',         20.0, 18.5, 22.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2017-12-31', 'lgfv',              32.0, 28.0, 38.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2017-12-31', 'policy_bank',       14.5, 12.0, 17.0, 'BIS', 'https://www.bis.org/statistics', true, NULL),
  ('2017-12-31', 'soe_contingent',    17.0, 12.0, 24.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2017-12-31', 'consolidated',      86.0, 78.0, 105.0, 'IMF WEO', 'GGXWDG_NGDP', false, NULL),
  -- 2018
  ('2018-12-31', 'central_official',  17.5, 16.5, 18.5, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2018-12-31', 'local_gov',         21.5, 20.0, 23.5, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2018-12-31', 'lgfv',              35.0, 30.0, 42.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2018-12-31', 'policy_bank',       15.5, 13.0, 18.0, 'BIS', 'https://www.bis.org/statistics', true, NULL),
  ('2018-12-31', 'soe_contingent',    18.5, 13.0, 26.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2018-12-31', 'consolidated',      90.0, 82.0, 110.0, 'IMF WEO', 'GGXWDG_NGDP', false, NULL),
  -- 2019
  ('2019-12-31', 'central_official',  18.8, 17.5, 20.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2019-12-31', 'local_gov',         23.0, 21.5, 25.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2019-12-31', 'lgfv',              38.0, 33.0, 45.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2019-12-31', 'policy_bank',       16.5, 14.0, 19.0, 'BIS', 'https://www.bis.org/statistics', true, NULL),
  ('2019-12-31', 'soe_contingent',    20.0, 14.0, 28.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2019-12-31', 'consolidated',      93.0, 85.0, 115.0, 'IMF WEO', 'GGXWDG_NGDP', false, NULL),
  -- 2020
  ('2020-12-31', 'central_official',  20.5, 19.0, 22.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2020-12-31', 'local_gov',         25.5, 24.0, 27.5, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2020-12-31', 'lgfv',              42.0, 36.0, 50.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2020-12-31', 'policy_bank',       18.0, 15.0, 21.0, 'BIS', 'https://www.bis.org/statistics', true, NULL),
  ('2020-12-31', 'soe_contingent',    22.5, 16.0, 32.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2020-12-31', 'consolidated',      98.0, 88.0, 125.0, 'IMF WEO', 'GGXWDG_NGDP', false, NULL),
  -- 2021
  ('2021-12-31', 'central_official',  22.0, 20.5, 23.5, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2021-12-31', 'local_gov',         26.5, 25.0, 28.5, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2021-12-31', 'lgfv',              45.0, 38.0, 55.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2021-12-31', 'policy_bank',       19.5, 16.5, 22.5, 'BIS', 'https://www.bis.org/statistics', true, NULL),
  ('2021-12-31', 'soe_contingent',    24.0, 17.0, 34.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2021-12-31', 'consolidated',     102.0, 92.0, 130.0, 'IMF WEO', 'GGXWDG_NGDP', false, NULL),
  -- 2022
  ('2022-12-31', 'central_official',  23.5, 22.0, 25.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2022-12-31', 'local_gov',         27.5, 26.0, 29.5, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2022-12-31', 'lgfv',              48.0, 40.0, 58.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2022-12-31', 'policy_bank',       20.5, 17.5, 24.0, 'BIS', 'https://www.bis.org/statistics', true, NULL),
  ('2022-12-31', 'soe_contingent',    25.5, 18.0, 36.0, 'IMF Article IV', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2022-12-31', 'consolidated',     106.0, 95.0, 135.0, 'IMF WEO', 'GGXWDG_NGDP', false, NULL),
  -- 2023
  ('2023-12-31', 'central_official',  24.8, 23.0, 26.5, 'IMF Article IV 2024', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2023-12-31', 'local_gov',         28.5, 27.0, 30.5, 'IMF Article IV 2024', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2023-12-31', 'lgfv',              52.0, 44.0, 62.0, 'IMF Article IV 2024', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2023-12-31', 'policy_bank',       21.5, 18.5, 25.0, 'BIS', 'https://www.bis.org/statistics', true, NULL),
  ('2023-12-31', 'soe_contingent',    27.0, 19.0, 38.0, 'IMF Article IV 2024', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2023-12-31', 'consolidated',     110.0, 98.0, 140.0, 'IMF WEO', 'GGXWDG_NGDP', false, NULL),
  -- 2024
  ('2024-12-31', 'central_official',  25.5, 24.0, 27.0, 'IMF Article IV 2024', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2024-12-31', 'local_gov',         29.5, 28.0, 31.5, 'IMF Article IV 2024', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2024-12-31', 'lgfv',              55.0, 46.0, 66.0, 'IMF Article IV 2024', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2024-12-31', 'policy_bank',       22.5, 19.0, 26.0, 'BIS', 'https://www.bis.org/statistics', true, NULL),
  ('2024-12-31', 'soe_contingent',    28.5, 20.0, 40.0, 'IMF Article IV 2024', 'https://www.imf.org/en/Countries/CHN', true, NULL),
  ('2024-12-31', 'consolidated',     115.0, 102.0, 145.0, 'IMF WEO', 'GGXWDG_NGDP', false, NULL)
ON CONFLICT (as_of_date, layer_code) DO NOTHING;