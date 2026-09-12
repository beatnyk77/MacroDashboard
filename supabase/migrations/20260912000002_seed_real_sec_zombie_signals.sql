-- Migration: 20260912000002_seed_real_sec_zombie_signals.sql
-- Description: Seed verified SEC EDGAR XBRL company facts and computed solvency signals for active institutional issuers

-- 1. Insert official SEC filing XBRL facts
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c7f83546-63fd-4d73-9051-8402164f5f8e',
    '0000320193',
    '0000320193-26-000020',
    '10-Q',
    '2026-07-31',
    'https://www.sec.gov/Archives/edgar/data/320193/000032019326000020',
    'us-gaap:OperatingIncomeLoss:USD:2026-06-27',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 122432000000.0, "form": "10-Q", "filed": "2026-07-31", "end": "2026-06-27", "accn": "0000320193-26-000020"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c7f83546-63fd-4d73-9051-8402164f5f8e',
    '0000320193',
    '0000320193-23-000106',
    '10-K',
    '2023-11-03',
    'https://www.sec.gov/Archives/edgar/data/320193/000032019323000106',
    'us-gaap:InterestExpense:USD:2023-09-30',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 3933000000.0, "form": "10-K", "filed": "2023-11-03", "end": "2023-09-30", "accn": "0000320193-23-000106"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c7f83546-63fd-4d73-9051-8402164f5f8e',
    '0000320193',
    '0000320193-26-000020',
    '10-Q',
    '2026-07-31',
    'https://www.sec.gov/Archives/edgar/data/320193/000032019326000020',
    'us-gaap:LongTermDebtNoncurrent:USD:2026-06-27',
    'xbrl_fact',
    '{"concept": "LongTermDebtNoncurrent", "unit": "USD", "fact": {"val": 71340000000.0, "form": "10-Q", "filed": "2026-07-31", "end": "2026-06-27", "accn": "0000320193-26-000020"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c7f83546-63fd-4d73-9051-8402164f5f8e',
    '0000320193',
    '0000320193-26-000020',
    '10-Q',
    '2026-07-31',
    'https://www.sec.gov/Archives/edgar/data/320193/000032019326000020',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-06-27',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 39544000000.0, "form": "10-Q", "filed": "2026-07-31", "end": "2026-06-27", "accn": "0000320193-26-000020"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c7f83546-63fd-4d73-9051-8402164f5f8e',
    '0000320193',
    '0000320193-26-000020',
    '10-Q',
    '2026-07-31',
    'https://www.sec.gov/Archives/edgar/data/320193/000032019326000020',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-27',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 116996000000.0, "form": "10-Q", "filed": "2026-07-31", "end": "2026-06-27", "accn": "0000320193-26-000020"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '0dbb3af9-136e-4c1d-8b9b-f352350b8a02',
    '0000789019',
    '0001193125-26-323660',
    '10-K',
    '2026-07-29',
    'https://www.sec.gov/Archives/edgar/data/789019/000119312526323660',
    'us-gaap:OperatingIncomeLoss:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 155237000000.0, "form": "10-K", "filed": "2026-07-29", "end": "2026-06-30", "accn": "0001193125-26-323660"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '0dbb3af9-136e-4c1d-8b9b-f352350b8a02',
    '0000789019',
    '0000950170-24-087843',
    '10-K',
    '2024-07-30',
    'https://www.sec.gov/Archives/edgar/data/789019/000095017024087843',
    'us-gaap:InterestExpense:USD:2024-06-30',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 2935000000.0, "form": "10-K", "filed": "2024-07-30", "end": "2024-06-30", "accn": "0000950170-24-087843"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '0dbb3af9-136e-4c1d-8b9b-f352350b8a02',
    '0000789019',
    '0001193125-26-323660',
    '10-K',
    '2026-07-29',
    'https://www.sec.gov/Archives/edgar/data/789019/000119312526323660',
    'us-gaap:LongTermDebtNoncurrent:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "LongTermDebtNoncurrent", "unit": "USD", "fact": {"val": 31067000000.0, "form": "10-K", "filed": "2026-07-29", "end": "2026-06-30", "accn": "0001193125-26-323660"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '0dbb3af9-136e-4c1d-8b9b-f352350b8a02',
    '0000789019',
    '0001193125-26-323660',
    '10-K',
    '2026-07-29',
    'https://www.sec.gov/Archives/edgar/data/789019/000119312526323660',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 20935000000.0, "form": "10-K", "filed": "2026-07-29", "end": "2026-06-30", "accn": "0001193125-26-323660"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '0dbb3af9-136e-4c1d-8b9b-f352350b8a02',
    '0000789019',
    '0001193125-26-323660',
    '10-K',
    '2026-07-29',
    'https://www.sec.gov/Archives/edgar/data/789019/000119312526323660',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 182935000000.0, "form": "10-K", "filed": "2026-07-29", "end": "2026-06-30", "accn": "0001193125-26-323660"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'bf3148bd-f07d-45a7-8f5a-dc86c27a1c8a',
    '0001018724',
    '0001018724-26-000026',
    '10-Q',
    '2026-07-31',
    'https://www.sec.gov/Archives/edgar/data/1018724/000101872426000026',
    'us-gaap:OperatingIncomeLoss:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 51313000000.0, "form": "10-Q", "filed": "2026-07-31", "end": "2026-06-30", "accn": "0001018724-26-000026"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'bf3148bd-f07d-45a7-8f5a-dc86c27a1c8a',
    '0001018724',
    '0001018724-24-000083',
    '10-Q',
    '2024-05-01',
    'https://www.sec.gov/Archives/edgar/data/1018724/000101872424000083',
    'us-gaap:InterestExpense:USD:2024-03-31',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 644000000.0, "form": "10-Q", "filed": "2024-05-01", "end": "2024-03-31", "accn": "0001018724-24-000083"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'bf3148bd-f07d-45a7-8f5a-dc86c27a1c8a',
    '0001018724',
    '0001018724-26-000026',
    '10-Q',
    '2026-07-31',
    'https://www.sec.gov/Archives/edgar/data/1018724/000101872426000026',
    'us-gaap:LongTermDebtNoncurrent:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "LongTermDebtNoncurrent", "unit": "USD", "fact": {"val": 128894000000.0, "form": "10-Q", "filed": "2026-07-31", "end": "2026-06-30", "accn": "0001018724-26-000026"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'bf3148bd-f07d-45a7-8f5a-dc86c27a1c8a',
    '0001018724',
    '0001018724-26-000026',
    '10-Q',
    '2026-07-31',
    'https://www.sec.gov/Archives/edgar/data/1018724/000101872426000026',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 78213000000.0, "form": "10-Q", "filed": "2026-07-31", "end": "2026-06-30", "accn": "0001018724-26-000026"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'bf3148bd-f07d-45a7-8f5a-dc86c27a1c8a',
    '0001018724',
    '0001018724-26-000026',
    '10-Q',
    '2026-07-31',
    'https://www.sec.gov/Archives/edgar/data/1018724/000101872426000026',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 161403000000.0, "form": "10-Q", "filed": "2026-07-31", "end": "2026-06-30", "accn": "0001018724-26-000026"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'f3f6324a-d81c-4b4f-ab11-29f3e17220d0',
    '0000018230',
    '0000018230-26-000046',
    '10-Q',
    '2026-08-05',
    'https://www.sec.gov/Archives/edgar/data/18230/000001823026000046',
    'us-gaap:OperatingIncomeLoss:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 7380000000.0, "form": "10-Q", "filed": "2026-08-05", "end": "2026-06-30", "accn": "0000018230-26-000046"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'f3f6324a-d81c-4b4f-ab11-29f3e17220d0',
    '0000018230',
    '0000018230-26-000008',
    '10-K',
    '2026-02-13',
    'https://www.sec.gov/Archives/edgar/data/18230/000001823026000008',
    'us-gaap:LongTermDebtNoncurrent:USD:2025-12-31',
    'xbrl_fact',
    '{"concept": "LongTermDebtNoncurrent", "unit": "USD", "fact": {"val": 30696000000.0, "form": "10-K", "filed": "2026-02-13", "end": "2025-12-31", "accn": "0000018230-26-000008"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'f3f6324a-d81c-4b4f-ab11-29f3e17220d0',
    '0000018230',
    '0000018230-26-000046',
    '10-Q',
    '2026-08-05',
    'https://www.sec.gov/Archives/edgar/data/18230/000001823026000046',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 6713000000.0, "form": "10-Q", "filed": "2026-08-05", "end": "2026-06-30", "accn": "0000018230-26-000046"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'f3f6324a-d81c-4b4f-ab11-29f3e17220d0',
    '0000018230',
    '0000018230-26-000046',
    '10-Q',
    '2026-08-05',
    'https://www.sec.gov/Archives/edgar/data/18230/000001823026000046',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 6241000000.0, "form": "10-Q", "filed": "2026-08-05", "end": "2026-06-30", "accn": "0000018230-26-000046"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '5c531c93-4c78-4f70-b45a-15e39db9b62e',
    '0000034088',
    '0000034088-26-000067',
    '10-Q',
    '2026-05-04',
    'https://www.sec.gov/Archives/edgar/data/34088/000003408826000067',
    'us-gaap:InterestExpense:USD:2026-03-31',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 295000000.0, "form": "10-Q", "filed": "2026-05-04", "end": "2026-03-31", "accn": "0000034088-26-000067"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '5c531c93-4c78-4f70-b45a-15e39db9b62e',
    '0000034088',
    '0000034088-26-000067',
    '10-Q',
    '2026-05-04',
    'https://www.sec.gov/Archives/edgar/data/34088/000003408826000067',
    'us-gaap:LongTermDebtAndCapitalLeaseObligations:USD:2026-03-31',
    'xbrl_fact',
    '{"concept": "LongTermDebtAndCapitalLeaseObligations", "unit": "USD", "fact": {"val": 33130000000.0, "form": "10-Q", "filed": "2026-05-04", "end": "2026-03-31", "accn": "0000034088-26-000067"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '5c531c93-4c78-4f70-b45a-15e39db9b62e',
    '0000034088',
    '0000034088-26-000067',
    '10-Q',
    '2026-05-04',
    'https://www.sec.gov/Archives/edgar/data/34088/000003408826000067',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-03-31',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 8435000000.0, "form": "10-Q", "filed": "2026-05-04", "end": "2026-03-31", "accn": "0000034088-26-000067"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '5c531c93-4c78-4f70-b45a-15e39db9b62e',
    '0000034088',
    '0000034088-26-000067',
    '10-Q',
    '2026-05-04',
    'https://www.sec.gov/Archives/edgar/data/34088/000003408826000067',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-03-31',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 8705000000.0, "form": "10-Q", "filed": "2026-05-04", "end": "2026-03-31", "accn": "0000034088-26-000067"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '739715af-62e3-430e-bb16-bd39db1ffae3',
    '0000037996',
    '0000037996-26-000086',
    '10-Q',
    '2026-04-30',
    'https://www.sec.gov/Archives/edgar/data/37996/000003799626000086',
    'us-gaap:OperatingIncomeLoss:USD:2026-03-31',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 2329000000.0, "form": "10-Q", "filed": "2026-04-30", "end": "2026-03-31", "accn": "0000037996-26-000086"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '739715af-62e3-430e-bb16-bd39db1ffae3',
    '0000037996',
    '0000037996-24-000009',
    '10-K',
    '2024-02-07',
    'https://www.sec.gov/Archives/edgar/data/37996/000003799624000009',
    'us-gaap:InterestExpense:USD:2023-12-31',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 7613000000.0, "form": "10-K", "filed": "2024-02-07", "end": "2023-12-31", "accn": "0000037996-24-000009"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '739715af-62e3-430e-bb16-bd39db1ffae3',
    '0000037996',
    '0000037996-21-000012',
    '10-K',
    '2021-02-05',
    'https://www.sec.gov/Archives/edgar/data/37996/000003799621000012',
    'us-gaap:LongTermDebtNoncurrent:USD:2020-12-31',
    'xbrl_fact',
    '{"concept": "LongTermDebtNoncurrent", "unit": "USD", "fact": {"val": 291000000.0, "form": "10-K", "filed": "2021-02-05", "end": "2020-12-31", "accn": "0000037996-21-000012"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '739715af-62e3-430e-bb16-bd39db1ffae3',
    '0000037996',
    '0000037996-26-000086',
    '10-Q',
    '2026-04-30',
    'https://www.sec.gov/Archives/edgar/data/37996/000003799626000086',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-03-31',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 17649000000.0, "form": "10-Q", "filed": "2026-04-30", "end": "2026-03-31", "accn": "0000037996-26-000086"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '739715af-62e3-430e-bb16-bd39db1ffae3',
    '0000037996',
    '0000037996-26-000086',
    '10-Q',
    '2026-04-30',
    'https://www.sec.gov/Archives/edgar/data/37996/000003799626000086',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-03-31',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 1316000000.0, "form": "10-Q", "filed": "2026-04-30", "end": "2026-03-31", "accn": "0000037996-26-000086"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'f807f3d5-571e-4325-9200-7c1485f29cdf',
    '0000012927',
    '0001628280-26-050038',
    '10-Q',
    '2026-07-28',
    'https://www.sec.gov/Archives/edgar/data/12927/000162828026050038',
    'us-gaap:OperatingIncomeLoss:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 604000000.0, "form": "10-Q", "filed": "2026-07-28", "end": "2026-06-30", "accn": "0001628280-26-050038"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'f807f3d5-571e-4325-9200-7c1485f29cdf',
    '0000012927',
    '0001628280-26-050038',
    '10-Q',
    '2026-07-28',
    'https://www.sec.gov/Archives/edgar/data/12927/000162828026050038',
    'us-gaap:InterestAndDebtExpense:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "InterestAndDebtExpense", "unit": "USD", "fact": {"val": 1216000000.0, "form": "10-Q", "filed": "2026-07-28", "end": "2026-06-30", "accn": "0001628280-26-050038"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'f807f3d5-571e-4325-9200-7c1485f29cdf',
    '0000012927',
    '0001628280-26-050038',
    '10-Q',
    '2026-07-28',
    'https://www.sec.gov/Archives/edgar/data/12927/000162828026050038',
    'us-gaap:LongTermDebt:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "LongTermDebt", "unit": "USD", "fact": {"val": 45596000000.0, "form": "10-Q", "filed": "2026-07-28", "end": "2026-06-30", "accn": "0001628280-26-050038"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'f807f3d5-571e-4325-9200-7c1485f29cdf',
    '0000012927',
    '0001628280-26-050038',
    '10-Q',
    '2026-07-28',
    'https://www.sec.gov/Archives/edgar/data/12927/000162828026050038',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 7239000000.0, "form": "10-Q", "filed": "2026-07-28", "end": "2026-06-30", "accn": "0001628280-26-050038"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'f807f3d5-571e-4325-9200-7c1485f29cdf',
    '0000012927',
    '0001628280-26-050038',
    '10-Q',
    '2026-07-28',
    'https://www.sec.gov/Archives/edgar/data/12927/000162828026050038',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 1185000000.0, "form": "10-Q", "filed": "2026-07-28", "end": "2026-06-30", "accn": "0001628280-26-050038"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '278d8357-00d6-4029-be83-8418ce30e184',
    '0001045810',
    '0001045810-26-000075',
    '10-Q',
    '2026-08-26',
    'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000075',
    'us-gaap:OperatingIncomeLoss:USD:2026-07-26',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 117270000000.0, "form": "10-Q", "filed": "2026-08-26", "end": "2026-07-26", "accn": "0001045810-26-000075"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '278d8357-00d6-4029-be83-8418ce30e184',
    '0001045810',
    '0001045810-24-000124',
    '10-Q',
    '2024-05-29',
    'https://www.sec.gov/Archives/edgar/data/1045810/000104581024000124',
    'us-gaap:InterestExpense:USD:2024-04-28',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 64000000.0, "form": "10-Q", "filed": "2024-05-29", "end": "2024-04-28", "accn": "0001045810-24-000124"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '278d8357-00d6-4029-be83-8418ce30e184',
    '0001045810',
    '0001045810-26-000075',
    '10-Q',
    '2026-08-26',
    'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000075',
    'us-gaap:LongTermDebtNoncurrent:USD:2026-07-26',
    'xbrl_fact',
    '{"concept": "LongTermDebtNoncurrent", "unit": "USD", "fact": {"val": 32366000000.0, "form": "10-Q", "filed": "2026-08-26", "end": "2026-07-26", "accn": "0001045810-26-000075"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '278d8357-00d6-4029-be83-8418ce30e184',
    '0001045810',
    '0001045810-26-000075',
    '10-Q',
    '2026-08-26',
    'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000075',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-07-26',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 22443000000.0, "form": "10-Q", "filed": "2026-08-26", "end": "2026-07-26", "accn": "0001045810-26-000075"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '278d8357-00d6-4029-be83-8418ce30e184',
    '0001045810',
    '0001045810-26-000075',
    '10-Q',
    '2026-08-26',
    'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000075',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-07-26',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 74421000000.0, "form": "10-Q", "filed": "2026-08-26", "end": "2026-07-26", "accn": "0001045810-26-000075"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '78442e61-2e01-4546-8b97-f0555271bb8f',
    '0000002488',
    '0000002488-26-000123',
    '10-Q',
    '2026-08-05',
    'https://www.sec.gov/Archives/edgar/data/2488/000000248826000123',
    'us-gaap:OperatingIncomeLoss:USD:2026-06-27',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 3466000000.0, "form": "10-Q", "filed": "2026-08-05", "end": "2026-06-27", "accn": "0000002488-26-000123"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '78442e61-2e01-4546-8b97-f0555271bb8f',
    '0000002488',
    '0000002488-26-000123',
    '10-Q',
    '2026-08-05',
    'https://www.sec.gov/Archives/edgar/data/2488/000000248826000123',
    'us-gaap:InterestExpense:USD:2026-06-27',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 74000000.0, "form": "10-Q", "filed": "2026-08-05", "end": "2026-06-27", "accn": "0000002488-26-000123"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '78442e61-2e01-4546-8b97-f0555271bb8f',
    '0000002488',
    '0000002488-26-000123',
    '10-Q',
    '2026-08-05',
    'https://www.sec.gov/Archives/edgar/data/2488/000000248826000123',
    'us-gaap:LongTermDebtNoncurrent:USD:2026-06-27',
    'xbrl_fact',
    '{"concept": "LongTermDebtNoncurrent", "unit": "USD", "fact": {"val": 2351000000.0, "form": "10-Q", "filed": "2026-08-05", "end": "2026-06-27", "accn": "0000002488-26-000123"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '78442e61-2e01-4546-8b97-f0555271bb8f',
    '0000002488',
    '0000002488-26-000123',
    '10-Q',
    '2026-08-05',
    'https://www.sec.gov/Archives/edgar/data/2488/000000248826000123',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-06-27',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 5086000000.0, "form": "10-Q", "filed": "2026-08-05", "end": "2026-06-27", "accn": "0000002488-26-000123"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '78442e61-2e01-4546-8b97-f0555271bb8f',
    '0000002488',
    '0000002488-26-000123',
    '10-Q',
    '2026-08-05',
    'https://www.sec.gov/Archives/edgar/data/2488/000000248826000123',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-27',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 5321000000.0, "form": "10-Q", "filed": "2026-08-05", "end": "2026-06-27", "accn": "0000002488-26-000123"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '68d5e449-3521-4613-8e8a-92252c6b3a89',
    '0000804328',
    '0000804328-26-000086',
    '10-Q',
    '2026-07-29',
    'https://www.sec.gov/Archives/edgar/data/804328/000080432826000086',
    'us-gaap:OperatingIncomeLoss:USD:2026-06-28',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 7302000000.0, "form": "10-Q", "filed": "2026-07-29", "end": "2026-06-28", "accn": "0000804328-26-000086"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '68d5e449-3521-4613-8e8a-92252c6b3a89',
    '0000804328',
    '0000804328-26-000086',
    '10-Q',
    '2026-07-29',
    'https://www.sec.gov/Archives/edgar/data/804328/000080432826000086',
    'us-gaap:InterestExpense:USD:2026-06-28',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 519000000.0, "form": "10-Q", "filed": "2026-07-29", "end": "2026-06-28", "accn": "0000804328-26-000086"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '68d5e449-3521-4613-8e8a-92252c6b3a89',
    '0000804328',
    '0000804328-26-000086',
    '10-Q',
    '2026-07-29',
    'https://www.sec.gov/Archives/edgar/data/804328/000080432826000086',
    'us-gaap:LongTermDebt:USD:2026-06-28',
    'xbrl_fact',
    '{"concept": "LongTermDebt", "unit": "USD", "fact": {"val": 12781000000.0, "form": "10-Q", "filed": "2026-07-29", "end": "2026-06-28", "accn": "0000804328-26-000086"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '68d5e449-3521-4613-8e8a-92252c6b3a89',
    '0000804328',
    '0000804328-26-000086',
    '10-Q',
    '2026-07-29',
    'https://www.sec.gov/Archives/edgar/data/804328/000080432826000086',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-06-28',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 4533000000.0, "form": "10-Q", "filed": "2026-07-29", "end": "2026-06-28", "accn": "0000804328-26-000086"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '68d5e449-3521-4613-8e8a-92252c6b3a89',
    '0000804328',
    '0000804328-26-000086',
    '10-Q',
    '2026-07-29',
    'https://www.sec.gov/Archives/edgar/data/804328/000080432826000086',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-28',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 8405000000.0, "form": "10-Q", "filed": "2026-07-29", "end": "2026-06-28", "accn": "0000804328-26-000086"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '037e0771-d9fc-4938-a521-a76ee70c3363',
    '0000723125',
    '0000723125-26-000015',
    '10-Q',
    '2026-06-25',
    'https://www.sec.gov/Archives/edgar/data/723125/000072312526000015',
    'us-gaap:OperatingIncomeLoss:USD:2026-05-28',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 55589000000.0, "form": "10-Q", "filed": "2026-06-25", "end": "2026-05-28", "accn": "0000723125-26-000015"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '037e0771-d9fc-4938-a521-a76ee70c3363',
    '0000723125',
    '0000723125-24-000019',
    '10-Q',
    '2024-06-27',
    'https://www.sec.gov/Archives/edgar/data/723125/000072312524000019',
    'us-gaap:InterestExpense:USD:2024-05-30',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 426000000.0, "form": "10-Q", "filed": "2024-06-27", "end": "2024-05-30", "accn": "0000723125-24-000019"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '037e0771-d9fc-4938-a521-a76ee70c3363',
    '0000723125',
    '0000723125-26-000015',
    '10-Q',
    '2026-06-25',
    'https://www.sec.gov/Archives/edgar/data/723125/000072312526000015',
    'us-gaap:LongTermDebtAndCapitalLeaseObligations:USD:2026-05-28',
    'xbrl_fact',
    '{"concept": "LongTermDebtAndCapitalLeaseObligations", "unit": "USD", "fact": {"val": 5140000000.0, "form": "10-Q", "filed": "2026-06-25", "end": "2026-05-28", "accn": "0000723125-26-000015"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '037e0771-d9fc-4938-a521-a76ee70c3363',
    '0000723125',
    '0000723125-26-000015',
    '10-Q',
    '2026-06-25',
    'https://www.sec.gov/Archives/edgar/data/723125/000072312526000015',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-05-28',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 24995000000.0, "form": "10-Q", "filed": "2026-06-25", "end": "2026-05-28", "accn": "0000723125-26-000015"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '037e0771-d9fc-4938-a521-a76ee70c3363',
    '0000723125',
    '0000723125-26-000015',
    '10-Q',
    '2026-06-25',
    'https://www.sec.gov/Archives/edgar/data/723125/000072312526000015',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-05-28',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 45702000000.0, "form": "10-Q", "filed": "2026-06-25", "end": "2026-05-28", "accn": "0000723125-26-000015"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'a531042f-59c0-47c7-8086-03b54cc2ed93',
    '0001046179',
    '0001193125-25-083423',
    '20-F',
    '2025-04-17',
    'https://www.sec.gov/Archives/edgar/data/1046179/000119312525083423',
    'us-gaap:FinanceCosts:TWD:2024-12-31',
    'xbrl_fact',
    '{"concept": "FinanceCosts", "unit": "TWD", "fact": {"val": 10495400000.0, "form": "20-F", "filed": "2025-04-17", "end": "2024-12-31", "accn": "0001193125-25-083423"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'cc4d4879-4b94-4ecb-bd98-f84ad0f548cd',
    '0000050863',
    '0000050863-26-000157',
    '10-Q',
    '2026-07-24',
    'https://www.sec.gov/Archives/edgar/data/50863/000005086326000157',
    'us-gaap:OperatingIncomeLoss:USD:2026-06-27',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": -1340000000.0, "form": "10-Q", "filed": "2026-07-24", "end": "2026-06-27", "accn": "0000050863-26-000157"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'cc4d4879-4b94-4ecb-bd98-f84ad0f548cd',
    '0000050863',
    '0000050863-24-000076',
    '10-Q',
    '2024-04-26',
    'https://www.sec.gov/Archives/edgar/data/50863/000005086324000076',
    'us-gaap:InterestExpense:USD:2024-03-30',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 258000000.0, "form": "10-Q", "filed": "2024-04-26", "end": "2024-03-30", "accn": "0000050863-24-000076"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'cc4d4879-4b94-4ecb-bd98-f84ad0f548cd',
    '0000050863',
    '0000050863-26-000157',
    '10-Q',
    '2026-07-24',
    'https://www.sec.gov/Archives/edgar/data/50863/000005086326000157',
    'us-gaap:LongTermDebtNoncurrent:USD:2026-06-27',
    'xbrl_fact',
    '{"concept": "LongTermDebtNoncurrent", "unit": "USD", "fact": {"val": 48549000000.0, "form": "10-Q", "filed": "2026-07-24", "end": "2026-06-27", "accn": "0000050863-26-000157"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'cc4d4879-4b94-4ecb-bd98-f84ad0f548cd',
    '0000050863',
    '0000050863-26-000157',
    '10-Q',
    '2026-07-24',
    'https://www.sec.gov/Archives/edgar/data/50863/000005086326000157',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-06-27',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 12874000000.0, "form": "10-Q", "filed": "2026-07-24", "end": "2026-06-27", "accn": "0000050863-26-000157"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'cc4d4879-4b94-4ecb-bd98-f84ad0f548cd',
    '0000050863',
    '0000050863-26-000157',
    '10-Q',
    '2026-07-24',
    'https://www.sec.gov/Archives/edgar/data/50863/000005086326000157',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-27',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 8102000000.0, "form": "10-Q", "filed": "2026-07-24", "end": "2026-06-27", "accn": "0000050863-26-000157"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '17130cd1-f581-4e75-b68f-898adad259b1',
    '0000101829',
    '0000101829-26-000027',
    '10-Q',
    '2026-07-23',
    'https://www.sec.gov/Archives/edgar/data/101829/000010182926000027',
    'us-gaap:OperatingIncomeLoss:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 5366000000.0, "form": "10-Q", "filed": "2026-07-23", "end": "2026-06-30", "accn": "0000101829-26-000027"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '17130cd1-f581-4e75-b68f-898adad259b1',
    '0000101829',
    '0000101829-25-000005',
    '10-K',
    '2025-02-03',
    'https://www.sec.gov/Archives/edgar/data/101829/000010182925000005',
    'us-gaap:InterestExpense:USD:2024-12-31',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 1862000000.0, "form": "10-K", "filed": "2025-02-03", "end": "2024-12-31", "accn": "0000101829-25-000005"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '17130cd1-f581-4e75-b68f-898adad259b1',
    '0000101829',
    '0000101829-26-000027',
    '10-Q',
    '2026-07-23',
    'https://www.sec.gov/Archives/edgar/data/101829/000010182926000027',
    'us-gaap:LongTermDebtAndCapitalLeaseObligations:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "LongTermDebtAndCapitalLeaseObligations", "unit": "USD", "fact": {"val": 31858000000.0, "form": "10-Q", "filed": "2026-07-23", "end": "2026-06-30", "accn": "0000101829-26-000027"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '17130cd1-f581-4e75-b68f-898adad259b1',
    '0000101829',
    '0000101829-26-000027',
    '10-Q',
    '2026-07-23',
    'https://www.sec.gov/Archives/edgar/data/101829/000010182926000027',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 8305000000.0, "form": "10-Q", "filed": "2026-07-23", "end": "2026-06-30", "accn": "0000101829-26-000027"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '17130cd1-f581-4e75-b68f-898adad259b1',
    '0000101829',
    '0000101829-26-000027',
    '10-Q',
    '2026-07-23',
    'https://www.sec.gov/Archives/edgar/data/101829/000010182926000027',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 5402000000.0, "form": "10-Q", "filed": "2026-07-23", "end": "2026-06-30", "accn": "0000101829-26-000027"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'e8963ec7-293c-40b4-9b18-72c062faf8d8',
    '0000936468',
    '0001628280-26-049411',
    '10-Q',
    '2026-07-23',
    'https://www.sec.gov/Archives/edgar/data/936468/000162828026049411',
    'us-gaap:OperatingIncomeLoss:USD:2026-06-28',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 4542000000.0, "form": "10-Q", "filed": "2026-07-23", "end": "2026-06-28", "accn": "0001628280-26-049411"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'e8963ec7-293c-40b4-9b18-72c062faf8d8',
    '0000936468',
    '0000936468-24-000052',
    '10-Q',
    '2024-04-23',
    'https://www.sec.gov/Archives/edgar/data/936468/000093646824000052',
    'us-gaap:InterestExpense:USD:2024-03-31',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 255000000.0, "form": "10-Q", "filed": "2024-04-23", "end": "2024-03-31", "accn": "0000936468-24-000052"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'e8963ec7-293c-40b4-9b18-72c062faf8d8',
    '0000936468',
    '0001628280-26-049411',
    '10-Q',
    '2026-07-23',
    'https://www.sec.gov/Archives/edgar/data/936468/000162828026049411',
    'us-gaap:LongTermDebtNoncurrent:USD:2026-06-28',
    'xbrl_fact',
    '{"concept": "LongTermDebtNoncurrent", "unit": "USD", "fact": {"val": 20538000000.0, "form": "10-Q", "filed": "2026-07-23", "end": "2026-06-28", "accn": "0001628280-26-049411"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'e8963ec7-293c-40b4-9b18-72c062faf8d8',
    '0000936468',
    '0001628280-26-049411',
    '10-Q',
    '2026-07-23',
    'https://www.sec.gov/Archives/edgar/data/936468/000162828026049411',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-06-28',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 3791000000.0, "form": "10-Q", "filed": "2026-07-23", "end": "2026-06-28", "accn": "0001628280-26-049411"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'e8963ec7-293c-40b4-9b18-72c062faf8d8',
    '0000936468',
    '0001628280-26-049411',
    '10-Q',
    '2026-07-23',
    'https://www.sec.gov/Archives/edgar/data/936468/000162828026049411',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-28',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 3455000000.0, "form": "10-Q", "filed": "2026-07-23", "end": "2026-06-28", "accn": "0001628280-26-049411"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c3c7289d-e836-4751-b4ab-4b75f9733477',
    '0001133421',
    '0001133421-26-000034',
    '10-Q',
    '2026-07-21',
    'https://www.sec.gov/Archives/edgar/data/1133421/000113342126000034',
    'us-gaap:OperatingIncomeLoss:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 2085000000.0, "form": "10-Q", "filed": "2026-07-21", "end": "2026-06-30", "accn": "0001133421-26-000034"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c3c7289d-e836-4751-b4ab-4b75f9733477',
    '0001133421',
    '0001133421-26-000034',
    '10-Q',
    '2026-07-21',
    'https://www.sec.gov/Archives/edgar/data/1133421/000113342126000034',
    'us-gaap:InterestAndDebtExpense:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "InterestAndDebtExpense", "unit": "USD", "fact": {"val": 323000000.0, "form": "10-Q", "filed": "2026-07-21", "end": "2026-06-30", "accn": "0001133421-26-000034"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c3c7289d-e836-4751-b4ab-4b75f9733477',
    '0001133421',
    '0001133421-26-000034',
    '10-Q',
    '2026-07-21',
    'https://www.sec.gov/Archives/edgar/data/1133421/000113342126000034',
    'us-gaap:LongTermDebtNoncurrent:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "LongTermDebtNoncurrent", "unit": "USD", "fact": {"val": 14428000000.0, "form": "10-Q", "filed": "2026-07-21", "end": "2026-06-30", "accn": "0001133421-26-000034"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c3c7289d-e836-4751-b4ab-4b75f9733477',
    '0001133421',
    '0001133421-26-000034',
    '10-Q',
    '2026-07-21',
    'https://www.sec.gov/Archives/edgar/data/1133421/000113342126000034',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 2307000000.0, "form": "10-Q", "filed": "2026-07-21", "end": "2026-06-30", "accn": "0001133421-26-000034"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c3c7289d-e836-4751-b4ab-4b75f9733477',
    '0001133421',
    '0001133421-26-000034',
    '10-Q',
    '2026-07-21',
    'https://www.sec.gov/Archives/edgar/data/1133421/000113342126000034',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": -376000000.0, "form": "10-Q", "filed": "2026-07-21", "end": "2026-06-30", "accn": "0001133421-26-000034"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'd48fc5a1-cf24-4a8a-b28e-aa4ec529b411',
    '0000040533',
    '0000040533-26-000012',
    '10-Q',
    '2026-04-29',
    'https://www.sec.gov/Archives/edgar/data/40533/000004053326000012',
    'us-gaap:OperatingIncomeLoss:USD:2026-04-05',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 1420000000.0, "form": "10-Q", "filed": "2026-04-29", "end": "2026-04-05", "accn": "0000040533-26-000012"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'd48fc5a1-cf24-4a8a-b28e-aa4ec529b411',
    '0000040533',
    '0000040533-24-000007',
    '10-K',
    '2024-02-08',
    'https://www.sec.gov/Archives/edgar/data/40533/000004053324000007',
    'us-gaap:InterestExpense:USD:2023-12-31',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 399000000.0, "form": "10-K", "filed": "2024-02-08", "end": "2023-12-31", "accn": "0000040533-24-000007"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'd48fc5a1-cf24-4a8a-b28e-aa4ec529b411',
    '0000040533',
    '0000040533-26-000012',
    '10-Q',
    '2026-04-29',
    'https://www.sec.gov/Archives/edgar/data/40533/000004053326000012',
    'us-gaap:LongTermDebtNoncurrent:USD:2026-04-05',
    'xbrl_fact',
    '{"concept": "LongTermDebtNoncurrent", "unit": "USD", "fact": {"val": 6259000000.0, "form": "10-Q", "filed": "2026-04-29", "end": "2026-04-05", "accn": "0000040533-26-000012"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'd48fc5a1-cf24-4a8a-b28e-aa4ec529b411',
    '0000040533',
    '0000040533-26-000012',
    '10-Q',
    '2026-04-29',
    'https://www.sec.gov/Archives/edgar/data/40533/000004053326000012',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-04-05',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 3654000000.0, "form": "10-Q", "filed": "2026-04-29", "end": "2026-04-05", "accn": "0000040533-26-000012"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'd48fc5a1-cf24-4a8a-b28e-aa4ec529b411',
    '0000040533',
    '0000040533-26-000012',
    '10-Q',
    '2026-04-29',
    'https://www.sec.gov/Archives/edgar/data/40533/000004053326000012',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-04-05',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 2155000000.0, "form": "10-Q", "filed": "2026-04-29", "end": "2026-04-05", "accn": "0000040533-26-000012"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '22638458-6d2a-474e-853b-b5951992018d',
    '0000093410',
    '0000093410-26-000167',
    '10-Q',
    '2026-08-06',
    'https://www.sec.gov/Archives/edgar/data/93410/000009341026000167',
    'us-gaap:InterestExpenseDebt:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "InterestExpenseDebt", "unit": "USD", "fact": {"val": 697000000.0, "form": "10-Q", "filed": "2026-08-06", "end": "2026-06-30", "accn": "0000093410-26-000167"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '22638458-6d2a-474e-853b-b5951992018d',
    '0000093410',
    '0000093410-26-000078',
    '10-K',
    '2026-02-24',
    'https://www.sec.gov/Archives/edgar/data/93410/000009341026000078',
    'us-gaap:LongTermDebtAndCapitalLeaseObligations:USD:2025-12-31',
    'xbrl_fact',
    '{"concept": "LongTermDebtAndCapitalLeaseObligations", "unit": "USD", "fact": {"val": 39781000000.0, "form": "10-K", "filed": "2026-02-24", "end": "2025-12-31", "accn": "0000093410-26-000078"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '22638458-6d2a-474e-853b-b5951992018d',
    '0000093410',
    '0000093410-26-000167',
    '10-Q',
    '2026-08-06',
    'https://www.sec.gov/Archives/edgar/data/93410/000009341026000167',
    'us-gaap:CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents", "unit": "USD", "fact": {"val": 9582000000.0, "form": "10-Q", "filed": "2026-08-06", "end": "2026-06-30", "accn": "0000093410-26-000167"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '22638458-6d2a-474e-853b-b5951992018d',
    '0000093410',
    '0000093410-26-000167',
    '10-Q',
    '2026-08-06',
    'https://www.sec.gov/Archives/edgar/data/93410/000009341026000167',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 25147000000.0, "form": "10-Q", "filed": "2026-08-06", "end": "2026-06-30", "accn": "0000093410-26-000167"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'e0d3c77c-efcc-4d04-9104-480842f61454',
    '0001163165',
    '0001163165-26-000032',
    '10-Q',
    '2026-08-06',
    'https://www.sec.gov/Archives/edgar/data/1163165/000116316526000032',
    'us-gaap:InterestAndDebtExpense:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "InterestAndDebtExpense", "unit": "USD", "fact": {"val": 380000000.0, "form": "10-Q", "filed": "2026-08-06", "end": "2026-06-30", "accn": "0001163165-26-000032"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'e0d3c77c-efcc-4d04-9104-480842f61454',
    '0001163165',
    '0001163165-26-000032',
    '10-Q',
    '2026-08-06',
    'https://www.sec.gov/Archives/edgar/data/1163165/000116316526000032',
    'us-gaap:LongTermDebtAndCapitalLeaseObligations:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "LongTermDebtAndCapitalLeaseObligations", "unit": "USD", "fact": {"val": 22828000000.0, "form": "10-Q", "filed": "2026-08-06", "end": "2026-06-30", "accn": "0001163165-26-000032"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'e0d3c77c-efcc-4d04-9104-480842f61454',
    '0001163165',
    '0001163165-26-000032',
    '10-Q',
    '2026-08-06',
    'https://www.sec.gov/Archives/edgar/data/1163165/000116316526000032',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 6574000000.0, "form": "10-Q", "filed": "2026-08-06", "end": "2026-06-30", "accn": "0001163165-26-000032"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'e0d3c77c-efcc-4d04-9104-480842f61454',
    '0001163165',
    '0001163165-26-000032',
    '10-Q',
    '2026-08-06',
    'https://www.sec.gov/Archives/edgar/data/1163165/000116316526000032',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 11729000000.0, "form": "10-Q", "filed": "2026-08-06", "end": "2026-06-30", "accn": "0001163165-26-000032"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '4f8f98ce-7d46-4a38-b5a9-e65d60c3e6d5',
    '0000087347',
    '0000950170-24-047250',
    '10-Q',
    '2024-04-24',
    'https://www.sec.gov/Archives/edgar/data/87347/000095017024047250',
    'us-gaap:OperatingIncomeLoss:USD:2024-03-31',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 1649000000.0, "form": "10-Q", "filed": "2024-04-24", "end": "2024-03-31", "accn": "0000950170-24-047250"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '4f8f98ce-7d46-4a38-b5a9-e65d60c3e6d5',
    '0000087347',
    '0001193125-26-322595',
    '10-Q',
    '2026-07-29',
    'https://www.sec.gov/Archives/edgar/data/87347/000119312526322595',
    'us-gaap:InterestExpense:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 244000000.0, "form": "10-Q", "filed": "2026-07-29", "end": "2026-06-30", "accn": "0001193125-26-322595"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '4f8f98ce-7d46-4a38-b5a9-e65d60c3e6d5',
    '0000087347',
    '0001193125-26-322595',
    '10-Q',
    '2026-07-29',
    'https://www.sec.gov/Archives/edgar/data/87347/000119312526322595',
    'us-gaap:LongTermDebtNoncurrent:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "LongTermDebtNoncurrent", "unit": "USD", "fact": {"val": 11140000000.0, "form": "10-Q", "filed": "2026-07-29", "end": "2026-06-30", "accn": "0001193125-26-322595"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '4f8f98ce-7d46-4a38-b5a9-e65d60c3e6d5',
    '0000087347',
    '0001564590-15-008511',
    '10-Q',
    '2015-10-21',
    'https://www.sec.gov/Archives/edgar/data/87347/000156459015008511',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2015-09-30',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 3172000000.0, "form": "10-Q", "filed": "2015-10-21", "end": "2015-09-30", "accn": "0001564590-15-008511"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '4f8f98ce-7d46-4a38-b5a9-e65d60c3e6d5',
    '0000087347',
    '0001193125-26-322595',
    '10-Q',
    '2026-07-29',
    'https://www.sec.gov/Archives/edgar/data/87347/000119312526322595',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 1846000000.0, "form": "10-Q", "filed": "2026-07-29", "end": "2026-06-30", "accn": "0001193125-26-322595"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'f929f6da-9cbb-491a-b53b-5e05ea18b33c',
    '0000045012',
    '0000045012-26-000061',
    '10-Q',
    '2026-07-24',
    'https://www.sec.gov/Archives/edgar/data/45012/000004501226000061',
    'us-gaap:OperatingIncomeLoss:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 1457000000.0, "form": "10-Q", "filed": "2026-07-24", "end": "2026-06-30", "accn": "0000045012-26-000061"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'f929f6da-9cbb-491a-b53b-5e05ea18b33c',
    '0000045012',
    '0000045012-16-000298',
    '10-Q',
    '2016-05-06',
    'https://www.sec.gov/Archives/edgar/data/45012/000004501216000298',
    'us-gaap:InterestExpenseDebt:USD:2016-03-31',
    'xbrl_fact',
    '{"concept": "InterestExpenseDebt", "unit": "USD", "fact": {"val": 71000000.0, "form": "10-Q", "filed": "2016-05-06", "end": "2016-03-31", "accn": "0000045012-16-000298"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'f929f6da-9cbb-491a-b53b-5e05ea18b33c',
    '0000045012',
    '0000045012-26-000061',
    '10-Q',
    '2026-07-24',
    'https://www.sec.gov/Archives/edgar/data/45012/000004501226000061',
    'us-gaap:LongTermDebt:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "LongTermDebt", "unit": "USD", "fact": {"val": 7071000000.0, "form": "10-Q", "filed": "2026-07-24", "end": "2026-06-30", "accn": "0000045012-26-000061"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'f929f6da-9cbb-491a-b53b-5e05ea18b33c',
    '0000045012',
    '0000045012-26-000061',
    '10-Q',
    '2026-07-24',
    'https://www.sec.gov/Archives/edgar/data/45012/000004501226000061',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 2048000000.0, "form": "10-Q", "filed": "2026-07-24", "end": "2026-06-30", "accn": "0000045012-26-000061"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'f929f6da-9cbb-491a-b53b-5e05ea18b33c',
    '0000045012',
    '0000045012-26-000061',
    '10-Q',
    '2026-07-24',
    'https://www.sec.gov/Archives/edgar/data/45012/000004501226000061',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 1097000000.0, "form": "10-Q", "filed": "2026-07-24", "end": "2026-06-30", "accn": "0000045012-26-000061"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'cf123c5b-f5b1-46de-9944-a43e796b2cce',
    '0000315189',
    '0001558370-24-016169',
    '10-K',
    '2024-12-12',
    'https://www.sec.gov/Archives/edgar/data/315189/000155837024016169',
    'us-gaap:OperatingIncomeLoss:USD:2024-10-27',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 9039000000.0, "form": "10-K", "filed": "2024-12-12", "end": "2024-10-27", "accn": "0001558370-24-016169"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'cf123c5b-f5b1-46de-9944-a43e796b2cce',
    '0000315189',
    '0001104659-26-102213',
    '10-Q',
    '2026-08-27',
    'https://www.sec.gov/Archives/edgar/data/315189/000110465926102213',
    'us-gaap:InterestExpense:USD:2026-08-02',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 2141000000.0, "form": "10-Q", "filed": "2026-08-27", "end": "2026-08-02", "accn": "0001104659-26-102213"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'cf123c5b-f5b1-46de-9944-a43e796b2cce',
    '0000315189',
    '0001104659-26-102213',
    '10-Q',
    '2026-08-27',
    'https://www.sec.gov/Archives/edgar/data/315189/000110465926102213',
    'us-gaap:DebtCurrent:USD:2026-08-02',
    'xbrl_fact',
    '{"concept": "DebtCurrent", "unit": "USD", "fact": {"val": 17115000000.0, "form": "10-Q", "filed": "2026-08-27", "end": "2026-08-02", "accn": "0001104659-26-102213"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'cf123c5b-f5b1-46de-9944-a43e796b2cce',
    '0000315189',
    '0001104659-26-102213',
    '10-Q',
    '2026-08-27',
    'https://www.sec.gov/Archives/edgar/data/315189/000110465926102213',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-08-02',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 8928000000.0, "form": "10-Q", "filed": "2026-08-27", "end": "2026-08-02", "accn": "0001104659-26-102213"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'cf123c5b-f5b1-46de-9944-a43e796b2cce',
    '0000315189',
    '0001104659-26-102213',
    '10-Q',
    '2026-08-27',
    'https://www.sec.gov/Archives/edgar/data/315189/000110465926102213',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-08-02',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 3250000000.0, "form": "10-Q", "filed": "2026-08-27", "end": "2026-08-02", "accn": "0001104659-26-102213"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'b161e1a2-75bb-4526-a385-78c55a4d1991',
    '0000779152',
    '0000779152-26-000067',
    '10-K',
    '2026-08-28',
    'https://www.sec.gov/Archives/edgar/data/779152/000077915226000067',
    'us-gaap:OperatingIncomeLoss:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 635033000.0, "form": "10-K", "filed": "2026-08-28", "end": "2026-06-30", "accn": "0000779152-26-000067"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'b161e1a2-75bb-4526-a385-78c55a4d1991',
    '0000779152',
    '0000779152-24-000018',
    '10-Q',
    '2024-02-08',
    'https://www.sec.gov/Archives/edgar/data/779152/000077915224000018',
    'us-gaap:InterestExpense:USD:2023-12-31',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 8062000.0, "form": "10-Q", "filed": "2024-02-08", "end": "2023-12-31", "accn": "0000779152-24-000018"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'b161e1a2-75bb-4526-a385-78c55a4d1991',
    '0000779152',
    '0000779152-26-000067',
    '10-K',
    '2026-08-28',
    'https://www.sec.gov/Archives/edgar/data/779152/000077915226000067',
    'us-gaap:LongTermDebt:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "LongTermDebt", "unit": "USD", "fact": {"val": 40000000.0, "form": "10-K", "filed": "2026-08-28", "end": "2026-06-30", "accn": "0000779152-26-000067"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'b161e1a2-75bb-4526-a385-78c55a4d1991',
    '0000779152',
    '0000779152-26-000067',
    '10-K',
    '2026-08-28',
    'https://www.sec.gov/Archives/edgar/data/779152/000077915226000067',
    'us-gaap:CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents", "unit": "USD", "fact": {"val": 12056000.0, "form": "10-K", "filed": "2026-08-28", "end": "2026-06-30", "accn": "0000779152-26-000067"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'b161e1a2-75bb-4526-a385-78c55a4d1991',
    '0000779152',
    '0000779152-26-000067',
    '10-K',
    '2026-08-28',
    'https://www.sec.gov/Archives/edgar/data/779152/000077915226000067',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 761960000.0, "form": "10-K", "filed": "2026-08-28", "end": "2026-06-30", "accn": "0000779152-26-000067"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c13fe3c4-1b86-42f4-aac7-93c6f4136d6f',
    '0000040545',
    '0000040545-14-000034',
    '10-Q',
    '2014-07-31',
    'https://www.sec.gov/Archives/edgar/data/40545/000004054514000034',
    'us-gaap:OperatingIncomeLoss:USD:2014-06-30',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 11081000000.0, "form": "10-Q", "filed": "2014-07-31", "end": "2014-06-30", "accn": "0000040545-14-000034"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c13fe3c4-1b86-42f4-aac7-93c6f4136d6f',
    '0000040545',
    '0000040545-21-000064',
    '10-Q',
    '2021-10-26',
    'https://www.sec.gov/Archives/edgar/data/40545/000004054521000064',
    'us-gaap:InterestAndDebtExpense:USD:2021-09-30',
    'xbrl_fact',
    '{"concept": "InterestAndDebtExpense", "unit": "USD", "fact": {"val": 2866000000.0, "form": "10-Q", "filed": "2021-10-26", "end": "2021-09-30", "accn": "0000040545-21-000064"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c13fe3c4-1b86-42f4-aac7-93c6f4136d6f',
    '0000040545',
    '0000040545-26-000049',
    '10-Q',
    '2026-07-16',
    'https://www.sec.gov/Archives/edgar/data/40545/000004054526000049',
    'us-gaap:LongTermDebtAndCapitalLeaseObligations:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "LongTermDebtAndCapitalLeaseObligations", "unit": "USD", "fact": {"val": 17157000000.0, "form": "10-Q", "filed": "2026-07-16", "end": "2026-06-30", "accn": "0000040545-26-000049"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c13fe3c4-1b86-42f4-aac7-93c6f4136d6f',
    '0000040545',
    '0000040545-26-000049',
    '10-Q',
    '2026-07-16',
    'https://www.sec.gov/Archives/edgar/data/40545/000004054526000049',
    'us-gaap:CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents", "unit": "USD", "fact": {"val": 9345000000.0, "form": "10-Q", "filed": "2026-07-16", "end": "2026-06-30", "accn": "0000040545-26-000049"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c13fe3c4-1b86-42f4-aac7-93c6f4136d6f',
    '0000040545',
    '0000040545-26-000049',
    '10-Q',
    '2026-07-16',
    'https://www.sec.gov/Archives/edgar/data/40545/000004054526000049',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 5018000000.0, "form": "10-Q", "filed": "2026-07-16", "end": "2026-06-30", "accn": "0000040545-26-000049"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c3eb7fc0-ed37-449f-81d2-f69c73eaecc8',
    '0001090727',
    '0001628280-26-053249',
    '10-Q',
    '2026-08-05',
    'https://www.sec.gov/Archives/edgar/data/1090727/000162828026053249',
    'us-gaap:OperatingIncomeLoss:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 2197000000.0, "form": "10-Q", "filed": "2026-08-05", "end": "2026-06-30", "accn": "0001628280-26-053249"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c3eb7fc0-ed37-449f-81d2-f69c73eaecc8',
    '0001090727',
    '0001090727-24-000028',
    '10-Q',
    '2024-05-03',
    'https://www.sec.gov/Archives/edgar/data/1090727/000109072724000028',
    'us-gaap:InterestExpense:USD:2024-03-31',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 195000000.0, "form": "10-Q", "filed": "2024-05-03", "end": "2024-03-31", "accn": "0001090727-24-000028"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c3eb7fc0-ed37-449f-81d2-f69c73eaecc8',
    '0001090727',
    '0001628280-26-053249',
    '10-Q',
    '2026-08-05',
    'https://www.sec.gov/Archives/edgar/data/1090727/000162828026053249',
    'us-gaap:LongTermDebtAndCapitalLeaseObligations:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "LongTermDebtAndCapitalLeaseObligations", "unit": "USD", "fact": {"val": 23850000000.0, "form": "10-Q", "filed": "2026-08-05", "end": "2026-06-30", "accn": "0001628280-26-053249"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c3eb7fc0-ed37-449f-81d2-f69c73eaecc8',
    '0001090727',
    '0001628280-26-053249',
    '10-Q',
    '2026-08-05',
    'https://www.sec.gov/Archives/edgar/data/1090727/000162828026053249',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 4653000000.0, "form": "10-Q", "filed": "2026-08-05", "end": "2026-06-30", "accn": "0001628280-26-053249"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c3eb7fc0-ed37-449f-81d2-f69c73eaecc8',
    '0001090727',
    '0001628280-26-053249',
    '10-Q',
    '2026-08-05',
    'https://www.sec.gov/Archives/edgar/data/1090727/000162828026053249',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 3083000000.0, "form": "10-Q", "filed": "2026-08-05", "end": "2026-06-30", "accn": "0001628280-26-053249"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '6141675a-c91e-425c-96a8-b2a13084c064',
    '0001048911',
    '0001048911-26-000105',
    '10-K',
    '2026-07-20',
    'https://www.sec.gov/Archives/edgar/data/1048911/000104891126000105',
    'us-gaap:OperatingIncomeLoss:USD:2026-05-31',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 5463000000.0, "form": "10-K", "filed": "2026-07-20", "end": "2026-05-31", "accn": "0001048911-26-000105"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '6141675a-c91e-425c-96a8-b2a13084c064',
    '0001048911',
    '0000950170-24-083577',
    '10-K',
    '2024-07-15',
    'https://www.sec.gov/Archives/edgar/data/1048911/000095017024083577',
    'us-gaap:InterestExpense:USD:2024-05-31',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 745000000.0, "form": "10-K", "filed": "2024-07-15", "end": "2024-05-31", "accn": "0000950170-24-083577"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '6141675a-c91e-425c-96a8-b2a13084c064',
    '0001048911',
    '0001048911-26-000105',
    '10-K',
    '2026-07-20',
    'https://www.sec.gov/Archives/edgar/data/1048911/000104891126000105',
    'us-gaap:LongTermDebtNoncurrent:USD:2026-05-31',
    'xbrl_fact',
    '{"concept": "LongTermDebtNoncurrent", "unit": "USD", "fact": {"val": 23293000000.0, "form": "10-K", "filed": "2026-07-20", "end": "2026-05-31", "accn": "0001048911-26-000105"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '6141675a-c91e-425c-96a8-b2a13084c064',
    '0001048911',
    '0001048911-26-000105',
    '10-K',
    '2026-07-20',
    'https://www.sec.gov/Archives/edgar/data/1048911/000104891126000105',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-05-31',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 13311000000.0, "form": "10-K", "filed": "2026-07-20", "end": "2026-05-31", "accn": "0001048911-26-000105"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '6141675a-c91e-425c-96a8-b2a13084c064',
    '0001048911',
    '0001048911-26-000105',
    '10-K',
    '2026-07-20',
    'https://www.sec.gov/Archives/edgar/data/1048911/000104891126000105',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-05-31',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 8925000000.0, "form": "10-K", "filed": "2026-07-20", "end": "2026-05-31", "accn": "0001048911-26-000105"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '6e8e78b4-b3fe-44d0-846d-48f7c5773eed',
    '0000104169',
    '0000104169-26-000154',
    '10-Q',
    '2026-08-28',
    'https://www.sec.gov/Archives/edgar/data/104169/000010416926000154',
    'us-gaap:OperatingIncomeLoss:USD:2026-07-31',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": 16876000000.0, "form": "10-Q", "filed": "2026-08-28", "end": "2026-07-31", "accn": "0000104169-26-000154"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '6e8e78b4-b3fe-44d0-846d-48f7c5773eed',
    '0000104169',
    '0000104169-26-000154',
    '10-Q',
    '2026-08-28',
    'https://www.sec.gov/Archives/edgar/data/104169/000010416926000154',
    'us-gaap:InterestExpenseDebt:USD:2026-07-31',
    'xbrl_fact',
    '{"concept": "InterestExpenseDebt", "unit": "USD", "fact": {"val": 711000000.0, "form": "10-Q", "filed": "2026-08-28", "end": "2026-07-31", "accn": "0000104169-26-000154"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '6e8e78b4-b3fe-44d0-846d-48f7c5773eed',
    '0000104169',
    '0000104169-26-000154',
    '10-Q',
    '2026-08-28',
    'https://www.sec.gov/Archives/edgar/data/104169/000010416926000154',
    'us-gaap:LongTermDebtNoncurrent:USD:2026-07-31',
    'xbrl_fact',
    '{"concept": "LongTermDebtNoncurrent", "unit": "USD", "fact": {"val": 36462000000.0, "form": "10-Q", "filed": "2026-08-28", "end": "2026-07-31", "accn": "0000104169-26-000154"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '6e8e78b4-b3fe-44d0-846d-48f7c5773eed',
    '0000104169',
    '0000104169-26-000154',
    '10-Q',
    '2026-08-28',
    'https://www.sec.gov/Archives/edgar/data/104169/000010416926000154',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-07-31',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 11529000000.0, "form": "10-Q", "filed": "2026-08-28", "end": "2026-07-31", "accn": "0000104169-26-000154"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '6e8e78b4-b3fe-44d0-846d-48f7c5773eed',
    '0000104169',
    '0000104169-26-000154',
    '10-Q',
    '2026-08-28',
    'https://www.sec.gov/Archives/edgar/data/104169/000010416926000154',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-07-31',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 19710000000.0, "form": "10-Q", "filed": "2026-08-28", "end": "2026-07-31", "accn": "0000104169-26-000154"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'ba80cb78-553f-4a9b-b275-827a0226622f',
    '0001577552',
    '0001193125-26-231755',
    '20-F',
    '2026-05-20',
    'https://www.sec.gov/Archives/edgar/data/1577552/000119312526231755',
    'us-gaap:OperatingIncomeLoss:CNY:2026-03-31',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "CNY", "fact": {"val": 50150000000.0, "form": "20-F", "filed": "2026-05-20", "end": "2026-03-31", "accn": "0001193125-26-231755"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'ba80cb78-553f-4a9b-b275-827a0226622f',
    '0001577552',
    '0001193125-26-231755',
    '20-F',
    '2026-05-20',
    'https://www.sec.gov/Archives/edgar/data/1577552/000119312526231755',
    'us-gaap:InterestExpense:CNY:2026-03-31',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "CNY", "fact": {"val": 9793000000.0, "form": "20-F", "filed": "2026-05-20", "end": "2026-03-31", "accn": "0001193125-26-231755"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'ba80cb78-553f-4a9b-b275-827a0226622f',
    '0001577552',
    '0001047469-18-005257',
    '20-F',
    '2018-07-27',
    'https://www.sec.gov/Archives/edgar/data/1577552/000104746918005257',
    'us-gaap:DebtCurrent:CNY:2018-03-31',
    'xbrl_fact',
    '{"concept": "DebtCurrent", "unit": "CNY", "fact": {"val": 6028000000.0, "form": "20-F", "filed": "2018-07-27", "end": "2018-03-31", "accn": "0001047469-18-005257"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'ba80cb78-553f-4a9b-b275-827a0226622f',
    '0001577552',
    '0001193125-26-231755',
    '20-F',
    '2026-05-20',
    'https://www.sec.gov/Archives/edgar/data/1577552/000119312526231755',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:CNY:2026-03-31',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "CNY", "fact": {"val": 131530000000.0, "form": "20-F", "filed": "2026-05-20", "end": "2026-03-31", "accn": "0001193125-26-231755"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'ba80cb78-553f-4a9b-b275-827a0226622f',
    '0001577552',
    '0001193125-26-231755',
    '20-F',
    '2026-05-20',
    'https://www.sec.gov/Archives/edgar/data/1577552/000119312526231755',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:CNY:2026-03-31',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "CNY", "fact": {"val": 76213000000.0, "form": "20-F", "filed": "2026-05-20", "end": "2026-03-31", "accn": "0001193125-26-231755"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'd24a9384-ac18-43bd-9425-a4fc8dac1f68',
    '0001549802',
    '0001193125-26-157870',
    '20-F',
    '2026-04-16',
    'https://www.sec.gov/Archives/edgar/data/1549802/000119312526157870',
    'us-gaap:OperatingIncomeLoss:CNY:2025-12-31',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "CNY", "fact": {"val": 2774000000.0, "form": "20-F", "filed": "2026-04-16", "end": "2025-12-31", "accn": "0001193125-26-157870"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'd24a9384-ac18-43bd-9425-a4fc8dac1f68',
    '0001549802',
    '0001193125-26-157870',
    '20-F',
    '2026-04-16',
    'https://www.sec.gov/Archives/edgar/data/1549802/000119312526157870',
    'us-gaap:InterestExpense:CNY:2025-12-31',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "CNY", "fact": {"val": 2803000000.0, "form": "20-F", "filed": "2026-04-16", "end": "2025-12-31", "accn": "0001193125-26-157870"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'd24a9384-ac18-43bd-9425-a4fc8dac1f68',
    '0001549802',
    '0001193125-26-157870',
    '20-F',
    '2026-04-16',
    'https://www.sec.gov/Archives/edgar/data/1549802/000119312526157870',
    'us-gaap:LongTermDebt:CNY:2025-12-31',
    'xbrl_fact',
    '{"concept": "LongTermDebt", "unit": "CNY", "fact": {"val": 41675000000.0, "form": "20-F", "filed": "2026-04-16", "end": "2025-12-31", "accn": "0001193125-26-157870"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'd24a9384-ac18-43bd-9425-a4fc8dac1f68',
    '0001549802',
    '0001193125-26-157870',
    '20-F',
    '2026-04-16',
    'https://www.sec.gov/Archives/edgar/data/1549802/000119312526157870',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:CNY:2025-12-31',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "CNY", "fact": {"val": 137488000000.0, "form": "20-F", "filed": "2026-04-16", "end": "2025-12-31", "accn": "0001193125-26-157870"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'd24a9384-ac18-43bd-9425-a4fc8dac1f68',
    '0001549802',
    '0001193125-26-157870',
    '20-F',
    '2026-04-16',
    'https://www.sec.gov/Archives/edgar/data/1549802/000119312526157870',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:CNY:2025-12-31',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "CNY", "fact": {"val": 18991000000.0, "form": "20-F", "filed": "2026-04-16", "end": "2025-12-31", "accn": "0001193125-26-157870"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c35c84f8-a8ee-4b94-95c0-6203d2816f93',
    '0001737806',
    '0001104659-26-050727',
    '20-F',
    '2026-04-29',
    'https://www.sec.gov/Archives/edgar/data/1737806/000110465926050727',
    'us-gaap:OperatingIncomeLoss:CNY:2025-12-31',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "CNY", "fact": {"val": 93102131000.0, "form": "20-F", "filed": "2026-04-29", "end": "2025-12-31", "accn": "0001104659-26-050727"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c35c84f8-a8ee-4b94-95c0-6203d2816f93',
    '0001737806',
    '0001410578-25-000951',
    '20-F',
    '2025-04-28',
    'https://www.sec.gov/Archives/edgar/data/1737806/000141057825000951',
    'us-gaap:InterestAndDebtExpense:CNY:2023-12-31',
    'xbrl_fact',
    '{"concept": "InterestAndDebtExpense", "unit": "CNY", "fact": {"val": 1268792000.0, "form": "20-F", "filed": "2025-04-28", "end": "2023-12-31", "accn": "0001410578-25-000951"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c35c84f8-a8ee-4b94-95c0-6203d2816f93',
    '0001737806',
    '0001104659-26-050727',
    '20-F',
    '2026-04-29',
    'https://www.sec.gov/Archives/edgar/data/1737806/000110465926050727',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:CNY:2025-12-31',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "CNY", "fact": {"val": 108900587000.0, "form": "20-F", "filed": "2026-04-29", "end": "2025-12-31", "accn": "0001104659-26-050727"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'c35c84f8-a8ee-4b94-95c0-6203d2816f93',
    '0001737806',
    '0001104659-26-050727',
    '20-F',
    '2026-04-29',
    'https://www.sec.gov/Archives/edgar/data/1737806/000110465926050727',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:CNY:2025-12-31',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "CNY", "fact": {"val": 106938690000.0, "form": "20-F", "filed": "2026-04-29", "end": "2025-12-31", "accn": "0001104659-26-050727"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '04511c72-8995-43d6-83fe-586c099770a3',
    '0001736541',
    '0001104659-26-041765',
    '20-F',
    '2026-04-10',
    'https://www.sec.gov/Archives/edgar/data/1736541/000110465926041765',
    'us-gaap:OperatingIncomeLoss:CNY:2025-12-31',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "CNY", "fact": {"val": -14041238000.0, "form": "20-F", "filed": "2026-04-10", "end": "2025-12-31", "accn": "0001104659-26-041765"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '04511c72-8995-43d6-83fe-586c099770a3',
    '0001736541',
    '0001104659-26-041765',
    '20-F',
    '2026-04-10',
    'https://www.sec.gov/Archives/edgar/data/1736541/000110465926041765',
    'us-gaap:InterestExpense:CNY:2025-12-31',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "CNY", "fact": {"val": 885248000.0, "form": "20-F", "filed": "2026-04-10", "end": "2025-12-31", "accn": "0001104659-26-041765"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '04511c72-8995-43d6-83fe-586c099770a3',
    '0001736541',
    '0001104659-26-041765',
    '20-F',
    '2026-04-10',
    'https://www.sec.gov/Archives/edgar/data/1736541/000110465926041765',
    'us-gaap:LongTermDebtNoncurrent:CNY:2025-12-31',
    'xbrl_fact',
    '{"concept": "LongTermDebtNoncurrent", "unit": "CNY", "fact": {"val": 8626272000.0, "form": "20-F", "filed": "2026-04-10", "end": "2025-12-31", "accn": "0001104659-26-041765"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '04511c72-8995-43d6-83fe-586c099770a3',
    '0001736541',
    '0001104659-26-041765',
    '20-F',
    '2026-04-10',
    'https://www.sec.gov/Archives/edgar/data/1736541/000110465926041765',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:CNY:2025-12-31',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "CNY", "fact": {"val": 11274094000.0, "form": "20-F", "filed": "2026-04-10", "end": "2025-12-31", "accn": "0001104659-26-041765"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '04511c72-8995-43d6-83fe-586c099770a3',
    '0001736541',
    '0001104659-26-041765',
    '20-F',
    '2026-04-10',
    'https://www.sec.gov/Archives/edgar/data/1736541/000110465926041765',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:CNY:2025-12-31',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "CNY", "fact": {"val": 2992612000.0, "form": "20-F", "filed": "2026-04-10", "end": "2025-12-31", "accn": "0001104659-26-041765"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'db53e71b-66d9-4f3b-abb5-4967bebf5df7',
    '0001067491',
    '0000950170-25-091925',
    '20-F',
    '2025-07-01',
    'https://www.sec.gov/Archives/edgar/data/1067491/000095017025091925',
    'us-gaap:FinanceCosts:USD:2025-03-31',
    'xbrl_fact',
    '{"concept": "FinanceCosts", "unit": "USD", "fact": {"val": 49000000.0, "form": "20-F", "filed": "2025-07-01", "end": "2025-03-31", "accn": "0000950170-25-091925"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'ef141322-47e1-47f9-b759-56fee601bfc4',
    '0001135361',
    '0001135361-16-000028',
    '10-Q',
    '2016-11-10',
    'https://www.sec.gov/Archives/edgar/data/1135361/000113536116000028',
    'us-gaap:OperatingIncomeLoss:USD:2016-09-30',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "USD", "fact": {"val": -744000000.0, "form": "10-Q", "filed": "2016-11-10", "end": "2016-09-30", "accn": "0001135361-16-000028"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'ef141322-47e1-47f9-b759-56fee601bfc4',
    '0001135361',
    '0001135361-16-000028',
    '10-Q',
    '2016-11-10',
    'https://www.sec.gov/Archives/edgar/data/1135361/000113536116000028',
    'us-gaap:InterestExpense:USD:2016-09-30',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 32000000.0, "form": "10-Q", "filed": "2016-11-10", "end": "2016-09-30", "accn": "0001135361-16-000028"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'ef141322-47e1-47f9-b759-56fee601bfc4',
    '0001135361',
    '0001135361-16-000028',
    '10-Q',
    '2016-11-10',
    'https://www.sec.gov/Archives/edgar/data/1135361/000113536116000028',
    'us-gaap:LongTermDebtNoncurrent:USD:2016-09-30',
    'xbrl_fact',
    '{"concept": "LongTermDebtNoncurrent", "unit": "USD", "fact": {"val": 821000000.0, "form": "10-Q", "filed": "2016-11-10", "end": "2016-09-30", "accn": "0001135361-16-000028"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'ef141322-47e1-47f9-b759-56fee601bfc4',
    '0001135361',
    '0001135361-16-000028',
    '10-Q',
    '2016-11-10',
    'https://www.sec.gov/Archives/edgar/data/1135361/000113536116000028',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2016-09-30',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 84000000.0, "form": "10-Q", "filed": "2016-11-10", "end": "2016-09-30", "accn": "0001135361-16-000028"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    'ef141322-47e1-47f9-b759-56fee601bfc4',
    '0001135361',
    '0001135361-16-000028',
    '10-Q',
    '2016-11-10',
    'https://www.sec.gov/Archives/edgar/data/1135361/000113536116000028',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2016-09-30',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": 42000000.0, "form": "10-Q", "filed": "2016-11-10", "end": "2016-09-30", "accn": "0001135361-16-000028"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '38276a0d-a029-4e95-97aa-e1bcc9534f98',
    '0001290109',
    '0001193125-10-136028',
    '20-F',
    '2010-06-09',
    'https://www.sec.gov/Archives/edgar/data/1290109/000119312510136028',
    'us-gaap:OperatingIncomeLoss:KRW:2009-12-31',
    'xbrl_fact',
    '{"concept": "OperatingIncomeLoss", "unit": "KRW", "fact": {"val": 695080000000.0, "form": "20-F", "filed": "2010-06-09", "end": "2009-12-31", "accn": "0001193125-10-136028"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '38276a0d-a029-4e95-97aa-e1bcc9534f98',
    '0001290109',
    '0000950170-25-058944',
    '20-F',
    '2025-04-28',
    'https://www.sec.gov/Archives/edgar/data/1290109/000095017025058944',
    'us-gaap:FinanceCosts:KRW:2024-12-31',
    'xbrl_fact',
    '{"concept": "FinanceCosts", "unit": "KRW", "fact": {"val": 1821912000000.0, "form": "20-F", "filed": "2025-04-28", "end": "2024-12-31", "accn": "0000950170-25-058944"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '38276a0d-a029-4e95-97aa-e1bcc9534f98',
    '0001290109',
    '0001193125-10-136028',
    '20-F',
    '2010-06-09',
    'https://www.sec.gov/Archives/edgar/data/1290109/000119312510136028',
    'us-gaap:LongTermDebtNoncurrent:KRW:2009-12-31',
    'xbrl_fact',
    '{"concept": "LongTermDebtNoncurrent", "unit": "KRW", "fact": {"val": 2078102000000.0, "form": "20-F", "filed": "2010-06-09", "end": "2009-12-31", "accn": "0001193125-10-136028"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '38276a0d-a029-4e95-97aa-e1bcc9534f98',
    '0001290109',
    '0001193125-10-136028',
    '20-F',
    '2010-06-09',
    'https://www.sec.gov/Archives/edgar/data/1290109/000119312510136028',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:KRW:2009-12-31',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "KRW", "fact": {"val": 817982000000.0, "form": "20-F", "filed": "2010-06-09", "end": "2009-12-31", "accn": "0001193125-10-136028"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '38276a0d-a029-4e95-97aa-e1bcc9534f98',
    '0001290109',
    '0001193125-10-136028',
    '20-F',
    '2010-06-09',
    'https://www.sec.gov/Archives/edgar/data/1290109/000119312510136028',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:KRW:2009-12-31',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "KRW", "fact": {"val": 4151399000000.0, "form": "20-F", "filed": "2010-06-09", "end": "2009-12-31", "accn": "0001193125-10-136028"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '17a01170-8444-4c74-80a9-a0644462238e',
    '0000019617',
    '0000019617-24-000326',
    '10-Q',
    '2024-05-01',
    'https://www.sec.gov/Archives/edgar/data/19617/000001961724000326',
    'us-gaap:InterestExpense:USD:2024-03-31',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 24356000000.0, "form": "10-Q", "filed": "2024-05-01", "end": "2024-03-31", "accn": "0000019617-24-000326"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '17a01170-8444-4c74-80a9-a0644462238e',
    '0000019617',
    '0000019617-14-000409',
    '10-Q',
    '2014-08-04',
    'https://www.sec.gov/Archives/edgar/data/19617/000001961714000409',
    'us-gaap:LongTermDebt:USD:2014-06-30',
    'xbrl_fact',
    '{"concept": "LongTermDebt", "unit": "USD", "fact": {"val": 269929000000.0, "form": "10-Q", "filed": "2014-08-04", "end": "2014-06-30", "accn": "0000019617-14-000409"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '17a01170-8444-4c74-80a9-a0644462238e',
    '0000019617',
    '0001628280-26-054343',
    '10-Q',
    '2026-08-06',
    'https://www.sec.gov/Archives/edgar/data/19617/000162828026054343',
    'us-gaap:CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents", "unit": "USD", "fact": {"val": 309811000000.0, "form": "10-Q", "filed": "2026-08-06", "end": "2026-06-30", "accn": "0001628280-26-054343"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '17a01170-8444-4c74-80a9-a0644462238e',
    '0000019617',
    '0001628280-26-054343',
    '10-Q',
    '2026-08-06',
    'https://www.sec.gov/Archives/edgar/data/19617/000162828026054343',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": -237044000000.0, "form": "10-Q", "filed": "2026-08-06", "end": "2026-06-30", "accn": "0001628280-26-054343"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '39169482-588a-4682-9b47-261c1f23f260',
    '0000886982',
    '0000886982-26-000091',
    '10-K',
    '2026-02-25',
    'https://www.sec.gov/Archives/edgar/data/886982/000088698226000091',
    'us-gaap:InterestExpense:USD:2025-12-31',
    'xbrl_fact',
    '{"concept": "InterestExpense", "unit": "USD", "fact": {"val": 66814000000.0, "form": "10-K", "filed": "2026-02-25", "end": "2025-12-31", "accn": "0000886982-26-000091"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '39169482-588a-4682-9b47-261c1f23f260',
    '0000886982',
    '0001193125-19-280752',
    '10-Q',
    '2019-11-01',
    'https://www.sec.gov/Archives/edgar/data/886982/000119312519280752',
    'us-gaap:LongTermDebtNoncurrent:USD:2019-09-30',
    'xbrl_fact',
    '{"concept": "LongTermDebtNoncurrent", "unit": "USD", "fact": {"val": 228723000000.0, "form": "10-Q", "filed": "2019-11-01", "end": "2019-09-30", "accn": "0001193125-19-280752"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '39169482-588a-4682-9b47-261c1f23f260',
    '0000886982',
    '0000886982-26-000297',
    '10-Q',
    '2026-08-03',
    'https://www.sec.gov/Archives/edgar/data/886982/000088698226000297',
    'us-gaap:CashAndCashEquivalentsAtCarryingValue:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "CashAndCashEquivalentsAtCarryingValue", "unit": "USD", "fact": {"val": 187266000000.0, "form": "10-Q", "filed": "2026-08-03", "end": "2026-06-30", "accn": "0000886982-26-000297"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;
INSERT INTO public.sec_filing_evidence (
    issuer_id, cik, accession_number, form_type, filing_date, document_url, section_name, evidence_kind, structured_payload, parser_version, freshness_status
) VALUES (
    '39169482-588a-4682-9b47-261c1f23f260',
    '0000886982',
    '0000886982-26-000297',
    '10-Q',
    '2026-08-03',
    'https://www.sec.gov/Archives/edgar/data/886982/000088698226000297',
    'us-gaap:NetCashProvidedByUsedInOperatingActivities:USD:2026-06-30',
    'xbrl_fact',
    '{"concept": "NetCashProvidedByUsedInOperatingActivities", "unit": "USD", "fact": {"val": -25763000000.0, "form": "10-Q", "filed": "2026-08-03", "end": "2026-06-30", "accn": "0000886982-26-000297"}}'::jsonb,
    'sec-native-v1',
    'fresh'
) ON CONFLICT (cik, accession_number, section_name, evidence_kind) DO UPDATE SET
    structured_payload = EXCLUDED.structured_payload,
    filing_date = EXCLUDED.filing_date;


-- 2. Insert verified corporate solvency signals
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'c7f83546-63fd-4d73-9051-8402164f5f8e',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    31.1294,
    'ratio',
    1.0,
    '2026-06-27',
    'info',
    0.95,
    'v1.0.0',
    '2026-07-31 00:00:00+00',
    '{"ebit": 122432.0, "interestExpense": 3933.0, "totalDebt": 71340.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'c7f83546-63fd-4d73-9051-8402164f5f8e',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    28.4442,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-07-31 00:00:00+00',
    '{"ebit": 122432.0, "totalDebt": 71340.0, "existingCouponPct": 5.51, "refiRate": 0.07, "proFormaIcr": 28.4442}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'c7f83546-63fd-4d73-9051-8402164f5f8e',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-07-31 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 31.1294, "proFormaIcr": 28.4442, "totalDebt": 71340.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '0dbb3af9-136e-4c1d-8b9b-f352350b8a02',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    52.8917,
    'ratio',
    1.0,
    '2026-06-30',
    'info',
    0.95,
    'v1.0.0',
    '2026-07-29 00:00:00+00',
    '{"ebit": 155237.0, "interestExpense": 2935.0, "totalDebt": 31067.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '0dbb3af9-136e-4c1d-8b9b-f352350b8a02',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    52.8917,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-07-29 00:00:00+00',
    '{"ebit": 155237.0, "totalDebt": 31067.0, "existingCouponPct": 9.45, "refiRate": 0.07, "proFormaIcr": 52.8917}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '0dbb3af9-136e-4c1d-8b9b-f352350b8a02',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-07-29 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 52.8917, "proFormaIcr": 52.8917, "totalDebt": 31067.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'bf3148bd-f07d-45a7-8f5a-dc86c27a1c8a',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    79.6786,
    'ratio',
    1.0,
    '2026-06-30',
    'info',
    0.95,
    'v1.0.0',
    '2026-07-31 00:00:00+00',
    '{"ebit": 51313.0, "interestExpense": 644.0, "totalDebt": 128894.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'bf3148bd-f07d-45a7-8f5a-dc86c27a1c8a',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    14.3473,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-07-31 00:00:00+00',
    '{"ebit": 51313.0, "totalDebt": 128894.0, "existingCouponPct": 0.5, "refiRate": 0.07, "proFormaIcr": 14.3473}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'bf3148bd-f07d-45a7-8f5a-dc86c27a1c8a',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-07-31 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 79.6786, "proFormaIcr": 14.3473, "totalDebt": 128894.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '739715af-62e3-430e-bb16-bd39db1ffae3',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    0.3059,
    'ratio',
    1.0,
    '2026-03-31',
    'high',
    0.95,
    'v1.0.0',
    '2026-04-30 00:00:00+00',
    '{"ebit": 2329.0, "interestExpense": 7613.0, "totalDebt": 291.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '739715af-62e3-430e-bb16-bd39db1ffae3',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    0.3059,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'high',
    0.85,
    'v1.0.0',
    '2026-04-30 00:00:00+00',
    '{"ebit": 2329.0, "totalDebt": 291.0, "existingCouponPct": 2616.15, "refiRate": 0.07, "proFormaIcr": 0.3059}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '739715af-62e3-430e-bb16-bd39db1ffae3',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    1,
    'confirmed_zombie',
    4,
    'trailing + pro-forma',
    'high',
    0.9,
    'v1.0.0',
    '2026-04-30 00:00:00+00',
    '{"tier": "confirmed_zombie", "currentIcr": 0.3059, "proFormaIcr": 0.3059, "totalDebt": 291.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'f807f3d5-571e-4325-9200-7c1485f29cdf',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    0.4967,
    'ratio',
    1.0,
    '2026-06-30',
    'high',
    0.95,
    'v1.0.0',
    '2026-07-28 00:00:00+00',
    '{"ebit": 604.0, "interestExpense": 1216.0, "totalDebt": 45596.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'f807f3d5-571e-4325-9200-7c1485f29cdf',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    0.3166,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'high',
    0.85,
    'v1.0.0',
    '2026-07-28 00:00:00+00',
    '{"ebit": 604.0, "totalDebt": 45596.0, "existingCouponPct": 2.67, "refiRate": 0.07, "proFormaIcr": 0.3166}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'f807f3d5-571e-4325-9200-7c1485f29cdf',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    1,
    'confirmed_zombie',
    4,
    'trailing + pro-forma',
    'high',
    0.9,
    'v1.0.0',
    '2026-07-28 00:00:00+00',
    '{"tier": "confirmed_zombie", "currentIcr": 0.4967, "proFormaIcr": 0.3166, "totalDebt": 45596.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '278d8357-00d6-4029-be83-8418ce30e184',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    1832.3438,
    'ratio',
    1.0,
    '2026-07-26',
    'info',
    0.95,
    'v1.0.0',
    '2026-08-26 00:00:00+00',
    '{"ebit": 117270.0, "interestExpense": 64.0, "totalDebt": 32366.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '278d8357-00d6-4029-be83-8418ce30e184',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    140.516,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-08-26 00:00:00+00',
    '{"ebit": 117270.0, "totalDebt": 32366.0, "existingCouponPct": 0.2, "refiRate": 0.07, "proFormaIcr": 140.516}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '278d8357-00d6-4029-be83-8418ce30e184',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-08-26 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 1832.3438, "proFormaIcr": 140.516, "totalDebt": 32366.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '78442e61-2e01-4546-8b97-f0555271bb8f',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    46.8378,
    'ratio',
    1.0,
    '2026-06-27',
    'info',
    0.95,
    'v1.0.0',
    '2026-08-05 00:00:00+00',
    '{"ebit": 3466.0, "interestExpense": 74.0, "totalDebt": 2351.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '78442e61-2e01-4546-8b97-f0555271bb8f',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    32.7911,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-08-05 00:00:00+00',
    '{"ebit": 3466.0, "totalDebt": 2351.0, "existingCouponPct": 3.15, "refiRate": 0.07, "proFormaIcr": 32.7911}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '78442e61-2e01-4546-8b97-f0555271bb8f',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-08-05 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 46.8378, "proFormaIcr": 32.7911, "totalDebt": 2351.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '68d5e449-3521-4613-8e8a-92252c6b3a89',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    14.0694,
    'ratio',
    1.0,
    '2026-06-28',
    'info',
    0.95,
    'v1.0.0',
    '2026-07-29 00:00:00+00',
    '{"ebit": 7302.0, "interestExpense": 519.0, "totalDebt": 12781.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '68d5e449-3521-4613-8e8a-92252c6b3a89',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    11.2255,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-07-29 00:00:00+00',
    '{"ebit": 7302.0, "totalDebt": 12781.0, "existingCouponPct": 4.06, "refiRate": 0.07, "proFormaIcr": 11.2255}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '68d5e449-3521-4613-8e8a-92252c6b3a89',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-07-29 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 14.0694, "proFormaIcr": 11.2255, "totalDebt": 12781.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '037e0771-d9fc-4938-a521-a76ee70c3363',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    130.4906,
    'ratio',
    1.0,
    '2026-05-28',
    'info',
    0.95,
    'v1.0.0',
    '2026-06-25 00:00:00+00',
    '{"ebit": 55589.0, "interestExpense": 426.0, "totalDebt": 5140.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '037e0771-d9fc-4938-a521-a76ee70c3363',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    130.4906,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-06-25 00:00:00+00',
    '{"ebit": 55589.0, "totalDebt": 5140.0, "existingCouponPct": 8.29, "refiRate": 0.07, "proFormaIcr": 130.4906}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '037e0771-d9fc-4938-a521-a76ee70c3363',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-06-25 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 130.4906, "proFormaIcr": 130.4906, "totalDebt": 5140.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'cc4d4879-4b94-4ecb-bd98-f84ad0f548cd',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    -5.1938,
    'ratio',
    1.0,
    '2026-06-27',
    'high',
    0.95,
    'v1.0.0',
    '2026-07-24 00:00:00+00',
    '{"ebit": -1340.0, "interestExpense": 258.0, "totalDebt": 48549.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'cc4d4879-4b94-4ecb-bd98-f84ad0f548cd',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    -0.9874,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'high',
    0.85,
    'v1.0.0',
    '2026-07-24 00:00:00+00',
    '{"ebit": -1340.0, "totalDebt": 48549.0, "existingCouponPct": 0.53, "refiRate": 0.07, "proFormaIcr": -0.9874}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'cc4d4879-4b94-4ecb-bd98-f84ad0f548cd',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    1,
    'confirmed_zombie',
    4,
    'trailing + pro-forma',
    'high',
    0.9,
    'v1.0.0',
    '2026-07-24 00:00:00+00',
    '{"tier": "confirmed_zombie", "currentIcr": -5.1938, "proFormaIcr": -0.9874, "totalDebt": 48549.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '17130cd1-f581-4e75-b68f-898adad259b1',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    2.8818,
    'ratio',
    1.0,
    '2026-06-30',
    'info',
    0.95,
    'v1.0.0',
    '2026-07-23 00:00:00+00',
    '{"ebit": 5366.0, "interestExpense": 1862.0, "totalDebt": 31858.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '17130cd1-f581-4e75-b68f-898adad259b1',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    2.6954,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-07-23 00:00:00+00',
    '{"ebit": 5366.0, "totalDebt": 31858.0, "existingCouponPct": 5.84, "refiRate": 0.07, "proFormaIcr": 2.6954}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '17130cd1-f581-4e75-b68f-898adad259b1',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-07-23 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 2.8818, "proFormaIcr": 2.6954, "totalDebt": 31858.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'e8963ec7-293c-40b4-9b18-72c062faf8d8',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    17.8118,
    'ratio',
    1.0,
    '2026-06-28',
    'info',
    0.95,
    'v1.0.0',
    '2026-07-23 00:00:00+00',
    '{"ebit": 4542.0, "interestExpense": 255.0, "totalDebt": 20538.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'e8963ec7-293c-40b4-9b18-72c062faf8d8',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    6.7899,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-07-23 00:00:00+00',
    '{"ebit": 4542.0, "totalDebt": 20538.0, "existingCouponPct": 1.24, "refiRate": 0.07, "proFormaIcr": 6.7899}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'e8963ec7-293c-40b4-9b18-72c062faf8d8',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-07-23 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 17.8118, "proFormaIcr": 6.7899, "totalDebt": 20538.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'c3c7289d-e836-4751-b4ab-4b75f9733477',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    6.4551,
    'ratio',
    1.0,
    '2026-06-30',
    'info',
    0.95,
    'v1.0.0',
    '2026-07-21 00:00:00+00',
    '{"ebit": 2085.0, "interestExpense": 323.0, "totalDebt": 14428.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'c3c7289d-e836-4751-b4ab-4b75f9733477',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    3.7005,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-07-21 00:00:00+00',
    '{"ebit": 2085.0, "totalDebt": 14428.0, "existingCouponPct": 2.24, "refiRate": 0.07, "proFormaIcr": 3.7005}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'c3c7289d-e836-4751-b4ab-4b75f9733477',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-07-21 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 6.4551, "proFormaIcr": 3.7005, "totalDebt": 14428.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'c3c7289d-e836-4751-b4ab-4b75f9733477',
    'cash_runway_quarters',
    'liquidity',
    'corporate_stress',
    'measured',
    6.14,
    'quarters',
    NULL,
    'latest reported quarter',
    'elevated',
    0.9,
    'v1.0.0',
    '2026-07-21 00:00:00+00',
    '{"cash": 2307.0, "operatingCashBurn": 376.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'd48fc5a1-cf24-4a8a-b28e-aa4ec529b411',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    3.5589,
    'ratio',
    1.0,
    '2026-04-05',
    'info',
    0.95,
    'v1.0.0',
    '2026-04-29 00:00:00+00',
    '{"ebit": 1420.0, "interestExpense": 399.0, "totalDebt": 6259.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'd48fc5a1-cf24-4a8a-b28e-aa4ec529b411',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    3.4408,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-04-29 00:00:00+00',
    '{"ebit": 1420.0, "totalDebt": 6259.0, "existingCouponPct": 6.37, "refiRate": 0.07, "proFormaIcr": 3.4408}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'd48fc5a1-cf24-4a8a-b28e-aa4ec529b411',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-04-29 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 3.5589, "proFormaIcr": 3.4408, "totalDebt": 6259.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '4f8f98ce-7d46-4a38-b5a9-e65d60c3e6d5',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    6.7582,
    'ratio',
    1.0,
    '2024-03-31',
    'info',
    0.95,
    'v1.0.0',
    '2026-07-29 00:00:00+00',
    '{"ebit": 1649.0, "interestExpense": 244.0, "totalDebt": 11140.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '4f8f98ce-7d46-4a38-b5a9-e65d60c3e6d5',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    3.8213,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-07-29 00:00:00+00',
    '{"ebit": 1649.0, "totalDebt": 11140.0, "existingCouponPct": 2.19, "refiRate": 0.07, "proFormaIcr": 3.8213}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '4f8f98ce-7d46-4a38-b5a9-e65d60c3e6d5',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-07-29 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 6.7582, "proFormaIcr": 3.8213, "totalDebt": 11140.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'f929f6da-9cbb-491a-b53b-5e05ea18b33c',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    20.5211,
    'ratio',
    1.0,
    '2026-06-30',
    'info',
    0.95,
    'v1.0.0',
    '2026-07-24 00:00:00+00',
    '{"ebit": 1457.0, "interestExpense": 71.0, "totalDebt": 7071.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'f929f6da-9cbb-491a-b53b-5e05ea18b33c',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    6.6412,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-07-24 00:00:00+00',
    '{"ebit": 1457.0, "totalDebt": 7071.0, "existingCouponPct": 1.0, "refiRate": 0.07, "proFormaIcr": 6.6412}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'f929f6da-9cbb-491a-b53b-5e05ea18b33c',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-07-24 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 20.5211, "proFormaIcr": 6.6412, "totalDebt": 7071.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'cf123c5b-f5b1-46de-9944-a43e796b2cce',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    4.2219,
    'ratio',
    1.0,
    '2024-10-27',
    'info',
    0.95,
    'v1.0.0',
    '2026-08-27 00:00:00+00',
    '{"ebit": 9039.0, "interestExpense": 2141.0, "totalDebt": 17115.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'cf123c5b-f5b1-46de-9944-a43e796b2cce',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    4.2219,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-08-27 00:00:00+00',
    '{"ebit": 9039.0, "totalDebt": 17115.0, "existingCouponPct": 12.51, "refiRate": 0.07, "proFormaIcr": 4.2219}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'cf123c5b-f5b1-46de-9944-a43e796b2cce',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-08-27 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 4.2219, "proFormaIcr": 4.2219, "totalDebt": 17115.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'b161e1a2-75bb-4526-a385-78c55a4d1991',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    78.7687,
    'ratio',
    1.0,
    '2026-06-30',
    'info',
    0.95,
    'v1.0.0',
    '2026-08-28 00:00:00+00',
    '{"ebit": 635.03, "interestExpense": 8.06, "totalDebt": 40.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'b161e1a2-75bb-4526-a385-78c55a4d1991',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    78.7687,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-08-28 00:00:00+00',
    '{"ebit": 635.03, "totalDebt": 40.0, "existingCouponPct": 20.16, "refiRate": 0.07, "proFormaIcr": 78.7687}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'b161e1a2-75bb-4526-a385-78c55a4d1991',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-08-28 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 78.7687, "proFormaIcr": 78.7687, "totalDebt": 40.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'c13fe3c4-1b86-42f4-aac7-93c6f4136d6f',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    3.8664,
    'ratio',
    1.0,
    '2014-06-30',
    'info',
    0.95,
    'v1.0.0',
    '2021-10-26 00:00:00+00',
    '{"ebit": 11081.0, "interestExpense": 2866.0, "totalDebt": 17157.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'c13fe3c4-1b86-42f4-aac7-93c6f4136d6f',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    3.8664,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2021-10-26 00:00:00+00',
    '{"ebit": 11081.0, "totalDebt": 17157.0, "existingCouponPct": 16.7, "refiRate": 0.07, "proFormaIcr": 3.8664}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'c13fe3c4-1b86-42f4-aac7-93c6f4136d6f',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2021-10-26 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 3.8664, "proFormaIcr": 3.8664, "totalDebt": 17157.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'c3eb7fc0-ed37-449f-81d2-f69c73eaecc8',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    11.2667,
    'ratio',
    1.0,
    '2026-06-30',
    'info',
    0.95,
    'v1.0.0',
    '2026-08-05 00:00:00+00',
    '{"ebit": 2197.0, "interestExpense": 195.0, "totalDebt": 23850.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'c3eb7fc0-ed37-449f-81d2-f69c73eaecc8',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    3.0897,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-08-05 00:00:00+00',
    '{"ebit": 2197.0, "totalDebt": 23850.0, "existingCouponPct": 0.82, "refiRate": 0.07, "proFormaIcr": 3.0897}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'c3eb7fc0-ed37-449f-81d2-f69c73eaecc8',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-08-05 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 11.2667, "proFormaIcr": 3.0897, "totalDebt": 23850.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '6141675a-c91e-425c-96a8-b2a13084c064',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    7.3329,
    'ratio',
    1.0,
    '2026-05-31',
    'info',
    0.95,
    'v1.0.0',
    '2026-07-20 00:00:00+00',
    '{"ebit": 5463.0, "interestExpense": 745.0, "totalDebt": 23293.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '6141675a-c91e-425c-96a8-b2a13084c064',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    5.1786,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-07-20 00:00:00+00',
    '{"ebit": 5463.0, "totalDebt": 23293.0, "existingCouponPct": 3.2, "refiRate": 0.07, "proFormaIcr": 5.1786}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '6141675a-c91e-425c-96a8-b2a13084c064',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-07-20 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 7.3329, "proFormaIcr": 5.1786, "totalDebt": 23293.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '6e8e78b4-b3fe-44d0-846d-48f7c5773eed',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    23.7356,
    'ratio',
    1.0,
    '2026-07-31',
    'info',
    0.95,
    'v1.0.0',
    '2026-08-28 00:00:00+00',
    '{"ebit": 16876.0, "interestExpense": 711.0, "totalDebt": 36462.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '6e8e78b4-b3fe-44d0-846d-48f7c5773eed',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    12.4503,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-08-28 00:00:00+00',
    '{"ebit": 16876.0, "totalDebt": 36462.0, "existingCouponPct": 1.95, "refiRate": 0.07, "proFormaIcr": 12.4503}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '6e8e78b4-b3fe-44d0-846d-48f7c5773eed',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-08-28 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 23.7356, "proFormaIcr": 12.4503, "totalDebt": 36462.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'ba80cb78-553f-4a9b-b275-827a0226622f',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    5.121,
    'ratio',
    1.0,
    '2026-03-31',
    'info',
    0.95,
    'v1.0.0',
    '2026-05-20 00:00:00+00',
    '{"ebit": 50150.0, "interestExpense": 9793.0, "totalDebt": 6028.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'ba80cb78-553f-4a9b-b275-827a0226622f',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    5.121,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'info',
    0.85,
    'v1.0.0',
    '2026-05-20 00:00:00+00',
    '{"ebit": 50150.0, "totalDebt": 6028.0, "existingCouponPct": 162.46, "refiRate": 0.07, "proFormaIcr": 5.121}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'ba80cb78-553f-4a9b-b275-827a0226622f',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-05-20 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 5.121, "proFormaIcr": 5.121, "totalDebt": 6028.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'd24a9384-ac18-43bd-9425-a4fc8dac1f68',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    0.9897,
    'ratio',
    1.0,
    '2025-12-31',
    'high',
    0.95,
    'v1.0.0',
    '2026-04-16 00:00:00+00',
    '{"ebit": 2774.0, "interestExpense": 2803.0, "totalDebt": 41675.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'd24a9384-ac18-43bd-9425-a4fc8dac1f68',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    0.9757,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'high',
    0.85,
    'v1.0.0',
    '2026-04-16 00:00:00+00',
    '{"ebit": 2774.0, "totalDebt": 41675.0, "existingCouponPct": 6.73, "refiRate": 0.07, "proFormaIcr": 0.9757}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'd24a9384-ac18-43bd-9425-a4fc8dac1f68',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    1,
    'confirmed_zombie',
    4,
    'trailing + pro-forma',
    'high',
    0.9,
    'v1.0.0',
    '2026-04-16 00:00:00+00',
    '{"tier": "confirmed_zombie", "currentIcr": 0.9897, "proFormaIcr": 0.9757, "totalDebt": 41675.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'c35c84f8-a8ee-4b94-95c0-6203d2816f93',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    73.3786,
    'ratio',
    1.0,
    '2025-12-31',
    'info',
    0.95,
    'v1.0.0',
    '2026-04-29 00:00:00+00',
    '{"ebit": 93102.13, "interestExpense": 1268.79, "totalDebt": 0.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'c35c84f8-a8ee-4b94-95c0-6203d2816f93',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    4,
    'solvent',
    4,
    'trailing + pro-forma',
    'info',
    0.9,
    'v1.0.0',
    '2026-04-29 00:00:00+00',
    '{"tier": "solvent", "currentIcr": 73.3786, "proFormaIcr": null, "totalDebt": 0.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '04511c72-8995-43d6-83fe-586c099770a3',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    -15.8614,
    'ratio',
    1.0,
    '2025-12-31',
    'high',
    0.95,
    'v1.0.0',
    '2026-04-10 00:00:00+00',
    '{"ebit": -14041.24, "interestExpense": 885.25, "totalDebt": 8626.27}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '04511c72-8995-43d6-83fe-586c099770a3',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    -15.8614,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'high',
    0.85,
    'v1.0.0',
    '2026-04-10 00:00:00+00',
    '{"ebit": -14041.24, "totalDebt": 8626.27, "existingCouponPct": 10.26, "refiRate": 0.07, "proFormaIcr": -15.8614}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '04511c72-8995-43d6-83fe-586c099770a3',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    1,
    'confirmed_zombie',
    4,
    'trailing + pro-forma',
    'high',
    0.9,
    'v1.0.0',
    '2026-04-10 00:00:00+00',
    '{"tier": "confirmed_zombie", "currentIcr": -15.8614, "proFormaIcr": -15.8614, "totalDebt": 8626.27}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'ef141322-47e1-47f9-b759-56fee601bfc4',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    -23.25,
    'ratio',
    1.0,
    '2016-09-30',
    'high',
    0.95,
    'v1.0.0',
    '2016-11-10 00:00:00+00',
    '{"ebit": -744.0, "interestExpense": 32.0, "totalDebt": 821.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'ef141322-47e1-47f9-b759-56fee601bfc4',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    -18.1843,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'high',
    0.85,
    'v1.0.0',
    '2016-11-10 00:00:00+00',
    '{"ebit": -744.0, "totalDebt": 821.0, "existingCouponPct": 3.9, "refiRate": 0.07, "proFormaIcr": -18.1843}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    'ef141322-47e1-47f9-b759-56fee601bfc4',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    1,
    'confirmed_zombie',
    4,
    'trailing + pro-forma',
    'high',
    0.9,
    'v1.0.0',
    '2016-11-10 00:00:00+00',
    '{"tier": "confirmed_zombie", "currentIcr": -23.25, "proFormaIcr": -18.1843, "totalDebt": 821.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '38276a0d-a029-4e95-97aa-e1bcc9534f98',
    'interest_coverage_ratio',
    'solvency',
    'corporate_stress',
    'measured',
    0.3815,
    'ratio',
    1.0,
    '2009-12-31',
    'high',
    0.95,
    'v1.0.0',
    '2025-04-28 00:00:00+00',
    '{"ebit": 695080.0, "interestExpense": 1821912.0, "totalDebt": 2078102.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '38276a0d-a029-4e95-97aa-e1bcc9534f98',
    'pro_forma_refi_icr',
    'refinancing_shock',
    'corporate_stress',
    'measured',
    0.3815,
    'ratio',
    1.0,
    'simulated 7.00% refi',
    'high',
    0.85,
    'v1.0.0',
    '2025-04-28 00:00:00+00',
    '{"ebit": 695080.0, "totalDebt": 2078102.0, "existingCouponPct": 87.67, "refiRate": 0.07, "proFormaIcr": 0.3815}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '38276a0d-a029-4e95-97aa-e1bcc9534f98',
    'zombie_tier',
    'classification',
    'corporate_stress',
    'confirmed',
    1,
    'confirmed_zombie',
    4,
    'trailing + pro-forma',
    'high',
    0.9,
    'v1.0.0',
    '2025-04-28 00:00:00+00',
    '{"tier": "confirmed_zombie", "currentIcr": 0.3815, "proFormaIcr": 0.3815, "totalDebt": 2078102.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '17a01170-8444-4c74-80a9-a0644462238e',
    'cash_runway_quarters',
    'liquidity',
    'corporate_stress',
    'measured',
    1.31,
    'quarters',
    NULL,
    'latest reported quarter',
    'high',
    0.9,
    'v1.0.0',
    '2026-08-06 00:00:00+00',
    '{"cash": 309811.0, "operatingCashBurn": 237044.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
INSERT INTO public.sec_corporate_signals (
    issuer_id, signal_id, signal_family, macro_theme, state, numeric_value, unit, baseline_value, comparison_window, severity, confidence, methodology_version, observed_at, calculation_inputs, availability_status
) VALUES (
    '39169482-588a-4682-9b47-261c1f23f260',
    'cash_runway_quarters',
    'liquidity',
    'corporate_stress',
    'measured',
    7.27,
    'quarters',
    NULL,
    'latest reported quarter',
    'elevated',
    0.9,
    'v1.0.0',
    '2026-08-03 00:00:00+00',
    '{"cash": 187266.0, "operatingCashBurn": 25763.0}'::jsonb,
    'available'
) ON CONFLICT (issuer_id, signal_id, observed_at) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    unit = EXCLUDED.unit,
    calculation_inputs = EXCLUDED.calculation_inputs,
    severity = EXCLUDED.severity;
