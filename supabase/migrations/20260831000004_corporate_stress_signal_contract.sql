ALTER TABLE public.sec_corporate_signals
  ADD COLUMN IF NOT EXISTS calculation_inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS confidence_reason text,
  ADD COLUMN IF NOT EXISTS availability_status text NOT NULL DEFAULT 'available';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sec_corporate_signals_availability_status_check'
      AND conrelid = 'public.sec_corporate_signals'::regclass
  ) THEN
    ALTER TABLE public.sec_corporate_signals
      ADD CONSTRAINT sec_corporate_signals_availability_status_check CHECK (
        availability_status IN ('available', 'insufficient_evidence', 'unavailable')
      );
  END IF;
END
$$;

DROP VIEW IF EXISTS public.vw_latest_corporate_signals CASCADE;

CREATE OR REPLACE VIEW public.vw_latest_corporate_signals AS
WITH latest_signals AS (
  SELECT DISTINCT ON (issuer_id, signal_id)
    id,
    issuer_id,
    signal_id,
    signal_family,
    macro_theme,
    state,
    numeric_value,
    unit,
    baseline_value,
    comparison_window,
    severity,
    confidence,
    confidence_reason,
    availability_status,
    calculation_inputs,
    methodology_version,
    evidence_ids,
    observed_at,
    created_at
  FROM public.sec_corporate_signals
  ORDER BY issuer_id, signal_id, observed_at DESC, created_at DESC, id DESC
),
signal_evidence AS (
  SELECT
    ls.id AS signal_row_id,
    COALESCE(array_length(ls.evidence_ids, 1), 0) AS evidence_count,
    CASE
      WHEN COUNT(le.evidence_id) = 0 THEN '{}'::text[]
      ELSE array_agg(e.freshness_status ORDER BY le.ord)
    END AS evidence_freshness_statuses,
    CASE
      WHEN COUNT(le.evidence_id) = 0 THEN '{}'::text[]
      ELSE array_agg(e.accession_number ORDER BY le.ord)
    END AS evidence_accession_numbers,
    CASE
      WHEN COUNT(le.evidence_id) = 0 THEN '{}'::text[]
      ELSE array_agg(e.form_type ORDER BY le.ord)
    END AS evidence_form_types,
    CASE
      WHEN COUNT(le.evidence_id) = 0 THEN '{}'::date[]
      ELSE array_agg(e.filing_date ORDER BY le.ord)
    END AS evidence_filing_dates,
    CASE
      WHEN COUNT(le.evidence_id) = 0 THEN '{}'::timestamptz[]
      ELSE array_agg(e.acceptance_timestamp ORDER BY le.ord)
    END AS evidence_acceptance_timestamps,
    CASE
      WHEN COUNT(le.evidence_id) = 0 THEN '{}'::text[]
      ELSE array_agg(e.document_url ORDER BY le.ord)
    END AS evidence_document_urls,
    CASE
      WHEN COUNT(le.evidence_id) = 0 THEN '{}'::text[]
      ELSE array_agg(e.section_name ORDER BY le.ord)
    END AS evidence_section_names,
    CASE
      WHEN COUNT(le.evidence_id) = 0 THEN '{}'::text[]
      ELSE array_agg(e.evidence_kind ORDER BY le.ord)
    END AS evidence_kinds,
    CASE
      WHEN COUNT(le.evidence_id) = 0 THEN '{}'::text[]
      ELSE array_agg(e.evidence_text ORDER BY le.ord)
    END AS evidence_texts,
    CASE
      WHEN COUNT(le.evidence_id) = 0 THEN '{}'::text[]
      ELSE array_agg(e.parser_version ORDER BY le.ord)
    END AS evidence_parser_versions
  FROM latest_signals ls
  LEFT JOIN LATERAL unnest(ls.evidence_ids) WITH ORDINALITY AS le(evidence_id, ord)
    ON true
  LEFT JOIN public.sec_filing_evidence e
    ON e.id = le.evidence_id
  GROUP BY ls.id, ls.evidence_ids
)
SELECT
  ls.id,
  ls.issuer_id,
  i.cik,
  i.ticker,
  i.issuer_name,
  i.exchange,
  i.sic,
  i.sector,
  i.relevance_tags,
  i.relevance_rationale,
  i.is_active,
  ls.signal_id,
  ls.signal_family,
  ls.macro_theme,
  ls.state,
  ls.numeric_value,
  ls.unit,
  ls.baseline_value,
  ls.comparison_window,
  ls.severity,
  ls.confidence,
  ls.confidence_reason,
  ls.availability_status,
  ls.calculation_inputs,
  ls.methodology_version,
  ls.evidence_ids,
  se.evidence_count,
  se.evidence_freshness_statuses[1] AS freshness_status,
  se.evidence_accession_numbers[1] AS accession_number,
  se.evidence_form_types[1] AS form_type,
  se.evidence_filing_dates[1] AS filing_date,
  se.evidence_acceptance_timestamps[1] AS acceptance_timestamp,
  se.evidence_document_urls[1] AS document_url,
  se.evidence_section_names[1] AS section_name,
  se.evidence_kinds[1] AS evidence_kind,
  se.evidence_texts[1] AS evidence_text,
  se.evidence_freshness_statuses,
  se.evidence_accession_numbers,
  se.evidence_form_types,
  se.evidence_filing_dates,
  se.evidence_acceptance_timestamps,
  se.evidence_document_urls,
  se.evidence_section_names,
  se.evidence_kinds,
  se.evidence_texts,
  se.evidence_parser_versions,
  ls.observed_at,
  ls.created_at
FROM latest_signals ls
JOIN public.sec_corporate_issuers i
  ON i.id = ls.issuer_id
LEFT JOIN signal_evidence se
  ON se.signal_row_id = ls.id;

ALTER VIEW public.vw_latest_corporate_signals SET (security_invoker = true);
GRANT SELECT ON public.vw_latest_corporate_signals TO anon, authenticated;
