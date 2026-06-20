-- China Debt Phase 3: Policy banks, SOE scenarios, BRI cross-border exposure

-- ── Policy bank balance sheet signals ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.china_policy_banks (
    as_of_date                  DATE NOT NULL,
    institution_code            TEXT NOT NULL,
    institution_name            TEXT NOT NULL,
    bonds_outstanding_cny_tn    NUMERIC,
    bonds_low_cny_tn            NUMERIC,
    bonds_high_cny_tn           NUMERIC,
    pct_total_bond_market       NUMERIC,
    spread_vs_cgb_bps           NUMERIC,
    yoy_growth_pct              NUMERIC,
    source                      TEXT NOT NULL,
    source_ref                  TEXT,
    is_provisional              BOOLEAN DEFAULT true,
    updated_at                  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (as_of_date, institution_code)
);

ALTER TABLE public.china_policy_banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.china_policy_banks FOR SELECT USING (true);

COMMENT ON TABLE public.china_policy_banks IS
    'China Development Bank, EXIM Bank, Agricultural Development Bank — quasi-fiscal balance sheet';

-- ── SOE contingent liability scenarios ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.china_soe_scenarios (
    as_of_date                      DATE NOT NULL,
    scenario_code                   TEXT NOT NULL,
    scenario_label                  TEXT NOT NULL,
    soe_debt_pct_gdp                NUMERIC,
    crystallization_rate_pct        NUMERIC,
    contingent_liability_pct_gdp    NUMERIC,
    consolidated_debt_outcome_pct   NUMERIC,
    probability_weight_pct          NUMERIC,
    assumptions                     TEXT,
    source                          TEXT NOT NULL,
    source_ref                      TEXT,
    updated_at                      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (as_of_date, scenario_code)
);

ALTER TABLE public.china_soe_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.china_soe_scenarios FOR SELECT USING (true);

COMMENT ON TABLE public.china_soe_scenarios IS
    'SOE contingent liability scenario matrix — conservative / base / stress IMF-style';

-- ── Cross-border BRI / sovereign lending exposure ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.china_bri_exposure (
    as_of_date              DATE NOT NULL,
    country_or_region       TEXT NOT NULL,
    iso3                    TEXT,
    lending_outstanding_bn  NUMERIC,
    lending_low_bn          NUMERIC,
    lending_high_bn         NUMERIC,
    distress_flag           BOOLEAN DEFAULT false,
    restructuring_status    TEXT,
    sector                  TEXT,
    source                  TEXT NOT NULL,
    source_ref              TEXT,
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (as_of_date, country_or_region)
);

ALTER TABLE public.china_bri_exposure ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.china_bri_exposure FOR SELECT USING (true);

COMMENT ON TABLE public.china_bri_exposure IS
    'Chinese overseas sovereign/BRI lending exposure by country — AidData / Boston University GDP Center estimates';

-- ── Policy bank seed (2024) ───────────────────────────────────────────────────
INSERT INTO public.china_policy_banks (as_of_date, institution_code, institution_name, bonds_outstanding_cny_tn, bonds_low_cny_tn, bonds_high_cny_tn, pct_total_bond_market, spread_vs_cgb_bps, yoy_growth_pct, source, source_ref) VALUES
  ('2024-12-31', 'CDB',  'China Development Bank',           18.5, 17.0, 20.0, 8.2,  12,  4.5, 'CDB Annual Report / BIS', 'https://www.cdb.com.cn'),
  ('2024-12-31', 'EXIM', 'Export-Import Bank of China',       5.8,  5.2,  6.5, 2.6,   8,  3.2, 'EXIM Annual Report / BIS',  'https://www.eximbank.gov.cn'),
  ('2024-12-31', 'ADBC', 'Agricultural Development Bank',     8.2,  7.5,  9.0, 3.7,  10,  5.1, 'ADBC Annual Report / BIS',  'https://www.adbc.com.cn'),
  ('2023-12-31', 'CDB',  'China Development Bank',           17.7, 16.5, 19.0, 8.5,  10,  5.8, 'CDB Annual Report / BIS', NULL),
  ('2023-12-31', 'EXIM', 'Export-Import Bank of China',       5.6,  5.0,  6.2, 2.7,   6,  4.0, 'EXIM Annual Report / BIS', NULL),
  ('2023-12-31', 'ADBC', 'Agricultural Development Bank',     7.8,  7.0,  8.5, 3.8,   8,  6.2, 'ADBC Annual Report / BIS', NULL),
  ('2022-12-31', 'CDB',  'China Development Bank',           16.7, 15.5, 18.0, 8.8,   8,  7.5, 'BIS Quarterly Review', NULL),
  ('2022-12-31', 'EXIM', 'Export-Import Bank of China',       5.4,  4.8,  6.0, 2.8,   5,  5.5, 'BIS Quarterly Review', NULL),
  ('2022-12-31', 'ADBC', 'Agricultural Development Bank',     7.3,  6.5,  8.0, 3.9,   7,  8.0, 'BIS Quarterly Review', NULL)
ON CONFLICT (as_of_date, institution_code) DO NOTHING;

-- Aggregate policy bank layer history in fiscal signals
INSERT INTO public.china_fiscal_signals (as_of_date, signal_key, value, value_low, value_high, unit, source, source_ref) VALUES
  ('2024-12-31', 'policy_bank_bonds_total', 32.5, 29.7, 35.5, 'CNY Tn', 'BIS / Annual Reports', 'CDB+EXIM+ADBC aggregate'),
  ('2023-12-31', 'policy_bank_bonds_total', 31.1, 28.5, 33.7, 'CNY Tn', 'BIS / Annual Reports', NULL),
  ('2022-12-31', 'policy_bank_bonds_total', 29.4, 26.8, 32.0, 'CNY Tn', 'BIS Quarterly Review', NULL)
ON CONFLICT (as_of_date, signal_key) DO NOTHING;

-- ── SOE scenario matrix (2024) ────────────────────────────────────────────────
INSERT INTO public.china_soe_scenarios (as_of_date, scenario_code, scenario_label, soe_debt_pct_gdp, crystallization_rate_pct, contingent_liability_pct_gdp, consolidated_debt_outcome_pct, probability_weight_pct, assumptions, source, source_ref) VALUES
  ('2024-12-31', 'conservative', 'Conservative',  85.0, 10.0,  8.5,  123.5, 25.0,
   'Only central SOEs face implicit guarantee call; low crystallization probability',
   'IMF Article IV / NBS SOE Survey', 'https://www.imf.org/en/Countries/CHN'),
  ('2024-12-31', 'base',         'Base Case',     85.0, 30.0, 25.5, 140.5, 50.0,
   '30% of SOE debt becomes contingent sovereign liability — IMF staff baseline',
   'IMF Article IV / NBS SOE Survey', NULL),
  ('2024-12-31', 'stress',       'Stress',        85.0, 60.0, 51.0, 166.0, 25.0,
   '60% crystallizes — 2008-style credit event, local SOE defaults cascade',
   'IMF Article IV / S&P China SOE Research', NULL)
ON CONFLICT (as_of_date, scenario_code) DO NOTHING;

-- SOE balance sheet inputs
INSERT INTO public.china_fiscal_signals (as_of_date, signal_key, value, value_low, value_high, unit, source, source_ref) VALUES
  ('2024-12-31', 'soe_total_assets_pct_gdp',  280.0, 260.0, 300.0, '%', 'NBS SOE Survey', 'Annual state-owned enterprise survey'),
  ('2024-12-31', 'soe_debt_to_asset_ratio',    62.5,  58.0,  68.0,  '%', 'NBS SOE Survey', NULL),
  ('2024-12-31', 'soe_roa_pct',                 2.1,   1.5,   2.8,  '%', 'NBS SOE Survey', 'Declining ROA = growing implicit subsidy'),
  ('2024-12-31', 'soe_zombie_proxy_pct',       18.0,  14.0,  24.0,  '%', 'IMF Selected Issues', 'Interest coverage < 1x estimate')
ON CONFLICT (as_of_date, signal_key) DO NOTHING;

-- ── BRI / cross-border exposure (2024) ────────────────────────────────────────
INSERT INTO public.china_bri_exposure (as_of_date, country_or_region, iso3, lending_outstanding_bn, lending_low_bn, lending_high_bn, distress_flag, restructuring_status, sector, source, source_ref) VALUES
  ('2024-12-31', 'Sub-Saharan Africa',  NULL,  180.0, 150.0, 220.0, false, NULL,                'Regional aggregate', 'AidData', 'https://www.aiddata.org'),
  ('2024-12-31', 'South Asia',          NULL,  120.0,  95.0, 150.0, false, NULL,                'Regional aggregate', 'AidData', NULL),
  ('2024-12-31', 'Southeast Asia',      NULL,   95.0,  80.0, 115.0, false, NULL,                'Regional aggregate', 'AidData', NULL),
  ('2024-12-31', 'Latin America',       NULL,   72.0,  55.0,  90.0, false, NULL,                'Regional aggregate', 'AidData', NULL),
  ('2024-12-31', 'Pakistan',            'PAK',  28.5,  25.0,  32.0, true,  'IMF program linked',  'Infrastructure / energy', 'AidData / World Bank IDS', NULL),
  ('2024-12-31', 'Sri Lanka',           'LKA',  8.2,   7.0,  10.0, true,  'Completed restructuring', 'Port / highways', 'AidData', NULL),
  ('2024-12-31', 'Zambia',              'ZMB',  6.8,   5.5,   8.5, true,  'Paris Club process',  'Mining / power', 'AidData', NULL),
  ('2024-12-31', 'Ethiopia',            'ETH',  5.5,   4.5,   7.0, true,  'Debt service suspension', 'Rail / industrial parks', 'AidData', NULL),
  ('2024-12-31', 'Angola',              'AGO',  22.0,  18.0,  26.0, false, 'Oil-backed collateral', 'Oil-for-infrastructure', 'Boston University GDP Center', NULL),
  ('2024-12-31', 'Laos',                'LAO',  5.8,   4.8,   7.2, true,  'Rail debt overhang',  'Railway (Boten-Vientiane)', 'AidData', NULL)
ON CONFLICT (as_of_date, country_or_region) DO NOTHING;

-- Total BRI outstanding signal
INSERT INTO public.china_fiscal_signals (as_of_date, signal_key, value, value_low, value_high, unit, source, source_ref) VALUES
  ('2024-12-31', 'bri_lending_total_usd_bn', 1040.0, 900.0, 1200.0, 'USD Bn', 'AidData Global Chinese Development Finance', 'https://www.aiddata.org'),
  ('2024-12-31', 'bri_distressed_share_pct',   12.5,  10.0,  16.0,  '%', 'AidData / World Bank', 'Share of BRI portfolio in distress/restructuring')
ON CONFLICT (as_of_date, signal_key) DO NOTHING;