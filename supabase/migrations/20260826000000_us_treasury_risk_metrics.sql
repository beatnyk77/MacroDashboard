-- Treasury refinancing and auction-risk metrics for the US Macro & Fiscal Lab.
-- Values are populated by the existing FiscalData maturity and auction ingestors.

DO $$
DECLARE
  fiscaldata_id integer;
BEGIN
  SELECT id INTO fiscaldata_id FROM public.data_sources WHERE name = 'FiscalData';

  INSERT INTO public.metrics
    (id, name, description, source_id, native_frequency, display_frequency, unit, unit_label, tier, category, methodology_note, expected_interval_days)
  VALUES
    ('US_DEBT_MATURING_3M_TN', 'Treasury Debt Maturing Within 3 Months', 'Marketable Treasury debt in the <1M and 1-3M maturity buckets', fiscaldata_id, 'monthly', 'monthly', 'USD tn', 'trillion USD', 'core', 'sovereign', 'Treasury MSPD marketable securities maturity buckets', 45),
    ('US_DEBT_MATURING_6M_TN', 'Treasury Debt Maturing Within 6 Months', 'Marketable Treasury debt in the <1M through 3-6M maturity buckets', fiscaldata_id, 'monthly', 'monthly', 'USD tn', 'trillion USD', 'core', 'sovereign', 'Treasury MSPD marketable securities maturity buckets', 45),
    ('US_DEBT_MATURING_12M_TN', 'Treasury Debt Maturing Within 12 Months', 'Marketable Treasury debt in the <1M through 6-12M maturity buckets', fiscaldata_id, 'monthly', 'monthly', 'USD tn', 'trillion USD', 'core', 'sovereign', 'Treasury MSPD marketable securities maturity buckets', 45),
    -- The metrics schema permits daily, weekly, monthly, quarterly, and
    -- annual display frequencies. Auction observations are event-driven, so
    -- daily is the supported display bucket with a 14-day expected interval.
    ('US_TREASURY_10Y_BID_TO_COVER', '10-Year Treasury Bid-to-Cover', 'Bid-to-cover ratio for the latest 10-Year Treasury auction', fiscaldata_id, 'daily', 'daily', 'ratio', 'times', 'core', 'sovereign', 'Treasury FiscalData auction results; latest event-driven observation', 14),
    ('US_TREASURY_10Y_INDIRECT_PCT', '10-Year Treasury Indirect Allotment', 'Indirect bidder share of the latest 10-Year Treasury auction', fiscaldata_id, 'daily', 'daily', '%', 'percent', 'core', 'sovereign', 'Indirect bidder accepted amount divided by total accepted amount; latest event-driven observation', 14),
    ('US_TREASURY_10Y_PRIMARY_DEALER_PCT', '10-Year Treasury Primary Dealer Allotment', 'Primary dealer share of the latest 10-Year Treasury auction', fiscaldata_id, 'daily', 'daily', '%', 'percent', 'core', 'sovereign', 'Primary dealer accepted amount divided by total accepted amount; latest event-driven observation', 14),
    ('US_TREASURY_10Y_DEMAND_SCORE', '10-Year Treasury Demand Score', 'Composite 10-Year auction demand score', fiscaldata_id, 'daily', 'daily', 'score', 'score', 'secondary', 'sovereign', 'Bid-to-cover multiplied by indirect bidder share; latest event-driven observation', 14)
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
