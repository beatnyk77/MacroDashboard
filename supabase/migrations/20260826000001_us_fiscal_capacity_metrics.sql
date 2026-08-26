-- Derived fiscal-capacity metrics populated by ingest-us-macro?task=fiscal.

DO $$
DECLARE
  fred_id integer;
BEGIN
  SELECT id INTO fred_id FROM public.data_sources WHERE name = 'FRED';

  INSERT INTO public.metrics
    (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days)
  VALUES
    ('US_FISCAL_INTEREST_TO_RECEIPTS_PCT', 'Federal Interest Payments / Tax Receipts', 'Federal current interest payments as a share of federal current tax receipts', fred_id, 'quarterly', 'quarterly', '%', 'percent', 'core', 'sovereign', 'FRED A091RC1Q027SBEA divided by FGRECPT', 40),
    ('US_FISCAL_INTEREST_TO_GDP_PCT', 'Federal Interest Payments / GDP', 'Federal current interest payments as a share of nominal GDP', fred_id, 'quarterly', 'quarterly', '%', 'percent', 'core', 'sovereign', 'FRED A091RC1Q027SBEA divided by GDP', 40),
    ('US_FISCAL_MANDATORY_TO_RECEIPTS_PCT', 'Mandatory Spending / Tax Receipts', 'Federal interest payments plus major entitlement benefits as a share of tax receipts', fred_id, 'quarterly', 'quarterly', '%', 'percent', 'core', 'sovereign', 'FRED A091RC1Q027SBEA plus W068RC1Q027SBEA divided by FGRECPT', 40)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    source_id = EXCLUDED.source_id,
    native_frequency = EXCLUDED.native_frequency,
    display_frequency = EXCLUDED.display_frequency,
    unit = EXCLUDED.unit,
    unit_label = EXCLUDED.unit_label,
    methodology_note = EXCLUDED.methodology_note,
    expected_interval_days = EXCLUDED.expected_interval_days,
    updated_at = NOW();
END $$;
