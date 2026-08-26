-- Budget composition metrics populated by ingest-us-macro?task=fiscal.

DO $$
DECLARE
  fred_id integer;
BEGIN
  SELECT id INTO fred_id FROM public.data_sources WHERE name = 'FRED';

  INSERT INTO public.metrics
    (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days, metadata)
  VALUES
    ('US_PERSONAL_TAX_RECEIPTS', 'Personal Tax Receipts', 'Federal personal current tax receipts', fred_id, 'quarterly', 'quarterly', 'USD bn', 'billion USD', 'core', 'sovereign', 'FRED A074RC1Q027SBEA', 40, '{"fred_id":"A074RC1Q027SBEA"}'::jsonb),
    ('US_PAYROLL_TAX_RECEIPTS', 'Payroll Tax Receipts', 'Federal payroll tax receipts', fred_id, 'quarterly', 'quarterly', 'USD bn', 'billion USD', 'core', 'sovereign', 'FRED W780RC1Q027SBEA', 40, '{"fred_id":"W780RC1Q027SBEA"}'::jsonb),
    ('US_FISCAL_ENTITLEMENTS_TO_RECEIPTS_PCT', 'Entitlements / Tax Receipts', 'Major entitlement benefits as a share of federal tax receipts', fred_id, 'quarterly', 'quarterly', '%', 'percent', 'core', 'sovereign', 'FRED W068RC1Q027SBEA divided by FGRECPT', 40, '{}'::jsonb),
    ('US_FISCAL_EMPLOYMENT_TAX_SHARE_PCT', 'Employment Tax Share', 'Personal plus payroll tax receipts as a share of federal tax receipts', fred_id, 'quarterly', 'quarterly', '%', 'percent', 'secondary', 'sovereign', 'FRED A074RC1Q027SBEA plus W780RC1Q027SBEA divided by FGRECPT', 40, '{}'::jsonb)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    source_id = EXCLUDED.source_id,
    methodology_note = EXCLUDED.methodology_note,
    expected_interval_days = EXCLUDED.expected_interval_days,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();
END $$;
