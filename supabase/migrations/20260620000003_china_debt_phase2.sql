-- China Debt Phase 2: Provincial fiscal stress + national fiscal signals (LGFV / land / refinancing)

-- ── Provincial stress table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.china_provincial_fiscal_stress (
    province_code               TEXT NOT NULL,
    province_name               TEXT NOT NULL,
    as_of_date                  DATE NOT NULL,
    land_revenue_decline_pct    NUMERIC,
    debt_to_fiscal_revenue_pct  NUMERIC,
    gdp_growth_deviation_pp     NUMERIC,
    lgfv_concentration_score    NUMERIC,
    special_bond_accel_score    NUMERIC,
    composite_stress_score      NUMERIC,
    watchlist_flag              BOOLEAN DEFAULT false,
    risk_profile                TEXT,
    source                      TEXT NOT NULL,
    source_ref                  TEXT,
    updated_at                  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (province_code, as_of_date)
);

ALTER TABLE public.china_provincial_fiscal_stress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.china_provincial_fiscal_stress
    FOR SELECT USING (true);

COMMENT ON TABLE public.china_provincial_fiscal_stress IS
    'Provincial fiscal stress scores — curated from IMF Article IV, NBS, MoF provincial reports';

-- ── National fiscal signals (land, LGFV issuance, special refinancing) ────────
CREATE TABLE IF NOT EXISTS public.china_fiscal_signals (
    as_of_date      DATE NOT NULL,
    signal_key      TEXT NOT NULL,
    value           NUMERIC NOT NULL,
    value_low       NUMERIC,
    value_high      NUMERIC,
    unit            TEXT,
    source          TEXT NOT NULL,
    source_ref      TEXT,
    is_provisional  BOOLEAN DEFAULT true,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (as_of_date, signal_key)
);

ALTER TABLE public.china_fiscal_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.china_fiscal_signals
    FOR SELECT USING (true);

COMMENT ON TABLE public.china_fiscal_signals IS
    'National China fiscal vital signs: land revenue dependence, LGFV issuance, special refinancing bonds';

-- ── Additional metrics ────────────────────────────────────────────────────────
INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days) VALUES
  ('CN_LAND_FISCAL_DEPENDENCE', 'China Land Fiscal Dependence', 'Land sale revenue as % of total local government revenue', 2, 'annual', 'annual', '%', 'percent', 'core', 'sovereign', 'Curated MoF/NBS provincial aggregates via IMF Article IV', 120),
  ('CN_RG_DIFFERENTIAL',        'China r-g Differential',       'CGB 10Y yield minus nominal GDP growth (debt sustainability)', 2, 'monthly', 'monthly', 'pp', 'percentage points', 'core', 'sovereign', 'Derived: 10Y yield - GDP growth', 35)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  methodology_note = EXCLUDED.methodology_note;

-- ── Land revenue dependence history (% of LG total revenue) ───────────────────
INSERT INTO public.china_fiscal_signals (as_of_date, signal_key, value, value_low, value_high, unit, source, source_ref) VALUES
  ('2021-12-31', 'land_revenue_pct_lg',       42.0, 40.0, 44.0, '%', 'IMF Article IV / NBS', 'Staff estimates 2021 peak'),
  ('2022-12-31', 'land_revenue_pct_lg',       28.5, 26.0, 31.0, '%', 'IMF Article IV / NBS', 'Land market contraction'),
  ('2023-12-31', 'land_revenue_pct_lg',       22.0, 20.0, 24.0, '%', 'IMF Article IV 2024',  'Continued land fiscal cliff'),
  ('2024-12-31', 'land_revenue_pct_lg',       19.5, 17.0, 22.0, '%', 'IMF Article IV 2024',  'Latest staff estimate'),
  ('2021-12-31', 'land_revenue_collapse_idx', 100.0, NULL, NULL, 'idx', 'GraphiQuestor', '2021 peak = 100'),
  ('2022-12-31', 'land_revenue_collapse_idx',  68.0, NULL, NULL, 'idx', 'GraphiQuestor', 'vs 2021 peak'),
  ('2023-12-31', 'land_revenue_collapse_idx',  52.0, NULL, NULL, 'idx', 'GraphiQuestor', 'vs 2021 peak'),
  ('2024-12-31', 'land_revenue_collapse_idx',  46.0, NULL, NULL, 'idx', 'GraphiQuestor', 'vs 2021 peak')
ON CONFLICT (as_of_date, signal_key) DO NOTHING;

-- ── LGFV & special refinancing (CNY trillions) ────────────────────────────────
INSERT INTO public.china_fiscal_signals (as_of_date, signal_key, value, value_low, value_high, unit, source, source_ref) VALUES
  ('2020-12-31', 'lgfv_debt_outstanding',          42.0, 38.0, 48.0, 'CNY Tn', 'IMF Article IV', 'LGFV off-balance-sheet estimate'),
  ('2021-12-31', 'lgfv_debt_outstanding',          45.0, 40.0, 52.0, 'CNY Tn', 'IMF Article IV', NULL),
  ('2022-12-31', 'lgfv_debt_outstanding',          48.0, 42.0, 56.0, 'CNY Tn', 'IMF Article IV', NULL),
  ('2023-12-31', 'lgfv_debt_outstanding',          52.0, 44.0, 62.0, 'CNY Tn', 'IMF Article IV 2024', NULL),
  ('2024-12-31', 'lgfv_debt_outstanding',          55.0, 46.0, 66.0, 'CNY Tn', 'IMF Article IV 2024', NULL),
  ('2023-10-31', 'special_refinancing_issued',      1.38, 1.20, 1.50, 'CNY Tn', 'IMF Article IV / MoF', '2023 provincial swap wave'),
  ('2024-10-31', 'special_refinancing_issued',      1.82, 1.60, 2.00, 'CNY Tn', 'IMF Article IV 2024', 'Cumulative through Oct 2024'),
  ('2024-12-31', 'lgfv_bond_issuance_annual',       4.2,  3.5,  5.0,  'CNY Tn', 'IMF Article IV 2024', 'Gross LGFV bond issuance proxy'),
  ('2024-12-31', 'lgfv_net_issuance',              -0.3, -1.0,  0.5,  'CNY Tn', 'IMF Article IV 2024', 'Net issuance (gross - redemptions)')
ON CONFLICT (as_of_date, signal_key) DO NOTHING;

-- ── Provincial stress snapshot (2024) — curated Article IV watchlist ───────────
INSERT INTO public.china_provincial_fiscal_stress (
    province_code, province_name, as_of_date,
    land_revenue_decline_pct, debt_to_fiscal_revenue_pct, gdp_growth_deviation_pp,
    lgfv_concentration_score, special_bond_accel_score, composite_stress_score,
    watchlist_flag, risk_profile, source, source_ref
) VALUES
  ('GZ', 'Guizhou',         '2024-12-31', -72.0, 385.0, -2.8, 92.0, 88.0, 94.0, true,  'Highest LGFV/GDP ratio nationally',           'IMF Article IV 2024', 'https://www.imf.org/en/Countries/CHN'),
  ('TJ', 'Tianjin',         '2024-12-31', -65.0, 310.0, -1.9, 85.0, 82.0, 88.0, true,  'Legacy industrial debt overhang',               'IMF Article IV 2024', NULL),
  ('YN', 'Yunnan',          '2024-12-31', -68.0, 295.0, -2.2, 82.0, 79.0, 86.0, true,  'Tourism-dependent, post-COVID fiscal hole',     'IMF Article IV 2024', NULL),
  ('HL', 'Heilongjiang',    '2024-12-31', -58.0, 245.0, -3.1, 74.0, 65.0, 78.0, true,  'Population decline, shrinking tax base',        'IMF Article IV 2024', NULL),
  ('HN', 'Hunan',           '2024-12-31', -62.0, 268.0, -1.5, 80.0, 76.0, 84.0, true,  'LGFV-heavy infrastructure binge',               'IMF Article IV 2024', NULL),
  ('GS', 'Gansu',           '2024-12-31', -60.0, 255.0, -2.5, 78.0, 72.0, 80.0, false, 'Western province, high infrastructure spend',   'IMF Article IV 2024', NULL),
  ('LN', 'Liaoning',        '2024-12-31', -55.0, 230.0, -1.8, 72.0, 68.0, 75.0, false, 'Rust belt restructuring',                       'IMF Article IV 2024', NULL),
  ('CQ', 'Chongqing',       '2024-12-31', -52.0, 210.0, -0.8, 68.0, 62.0, 70.0, false, 'Municipality, elevated LGFV exposure',          'IMF Article IV 2024', NULL),
  ('SC', 'Sichuan',         '2024-12-31', -48.0, 185.0, -0.5, 62.0, 55.0, 64.0, false, 'Large province, moderate LGFV load',            'IMF Article IV 2024', NULL),
  ('SD', 'Shandong',        '2024-12-31', -45.0, 165.0,  0.2, 58.0, 48.0, 58.0, false, 'Coastal manufacturing hub',                     'IMF Article IV 2024', NULL),
  ('JS', 'Jiangsu',         '2024-12-31', -38.0, 142.0,  0.8, 45.0, 35.0, 42.0, false, 'Fiscal fortress, strong revenue base',          'IMF Article IV 2024', NULL),
  ('ZJ', 'Zhejiang',        '2024-12-31', -35.0, 128.0,  1.0, 40.0, 30.0, 38.0, false, 'Private sector dynamism, low LGFV stress',      'IMF Article IV 2024', NULL),
  ('GD', 'Guangdong',       '2024-12-31', -40.0, 138.0,  0.5, 48.0, 38.0, 45.0, false, 'Export hub, diversified revenue',               'IMF Article IV 2024', NULL),
  ('BJ', 'Beijing',         '2024-12-31', -30.0, 115.0,  0.3, 35.0, 28.0, 32.0, false, 'Central government hub, low provincial risk',   'IMF Article IV 2024', NULL),
  ('SH', 'Shanghai',        '2024-12-31', -32.0, 120.0,  0.6, 38.0, 32.0, 35.0, false, 'Financial center, strong fiscal position',      'IMF Article IV 2024', NULL),
  ('HB', 'Hubei',           '2024-12-31', -50.0, 195.0, -0.3, 65.0, 58.0, 66.0, false, 'Post-pandemic recovery, elevated spend',        'IMF Article IV 2024', NULL),
  ('GX', 'Guangxi',         '2024-12-31', -63.0, 275.0, -2.0, 79.0, 74.0, 82.0, false, 'Western development, high LGFV reliance',       'IMF Article IV 2024', NULL),
  ('IM', 'Inner Mongolia',  '2024-12-31', -57.0, 240.0, -1.2, 71.0, 66.0, 74.0, false, 'Resource-dependent, mining revenue decline',    'IMF Article IV 2024', NULL)
ON CONFLICT (province_code, as_of_date) DO NOTHING;