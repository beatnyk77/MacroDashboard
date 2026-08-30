-- SEC corporate transmission schema
-- Task 1: issuer registry, filing evidence, and corporate signals

CREATE TABLE IF NOT EXISTS public.sec_corporate_issuers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cik text NOT NULL UNIQUE,
  ticker text,
  issuer_name text NOT NULL,
  exchange text,
  sic text,
  sector text,
  relevance_tags text[] NOT NULL DEFAULT '{}'::text[],
  relevance_rationale text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sec_filing_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id uuid NOT NULL REFERENCES public.sec_corporate_issuers(id) ON DELETE CASCADE,
  cik text NOT NULL,
  accession_number text NOT NULL,
  form_type text NOT NULL,
  filing_date date NOT NULL,
  acceptance_timestamp timestamptz,
  document_url text NOT NULL,
  section_name text NOT NULL,
  evidence_kind text NOT NULL,
  evidence_text text,
  structured_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_hash text,
  parser_version text NOT NULL,
  freshness_status text NOT NULL DEFAULT 'fresh',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sec_filing_evidence_unique_identity UNIQUE (cik, accession_number, section_name, evidence_kind),
  CONSTRAINT sec_filing_evidence_freshness_status_check CHECK (
    freshness_status IN ('fresh', 'lagged', 'very_lagged', 'unavailable')
  )
);

CREATE TABLE IF NOT EXISTS public.sec_corporate_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id uuid NOT NULL REFERENCES public.sec_corporate_issuers(id) ON DELETE CASCADE,
  signal_id text NOT NULL,
  signal_family text NOT NULL,
  macro_theme text NOT NULL,
  state text NOT NULL,
  numeric_value numeric,
  unit text,
  baseline_value numeric,
  comparison_window text NOT NULL,
  severity text NOT NULL,
  confidence numeric NOT NULL,
  methodology_version text NOT NULL,
  evidence_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  observed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sec_corporate_signals_unique_observation UNIQUE (issuer_id, signal_id, observed_at),
  CONSTRAINT sec_corporate_signals_state_check CHECK (
    state IN ('observed', 'measured', 'changed', 'confirmed')
  ),
  CONSTRAINT sec_corporate_signals_severity_check CHECK (
    severity IN ('info', 'watch', 'elevated', 'high')
  )
);

CREATE INDEX IF NOT EXISTS sec_corporate_issuers_ticker_idx
  ON public.sec_corporate_issuers (ticker);

CREATE INDEX IF NOT EXISTS sec_corporate_issuers_is_active_idx
  ON public.sec_corporate_issuers (is_active);

CREATE INDEX IF NOT EXISTS sec_filing_evidence_issuer_id_idx
  ON public.sec_filing_evidence (issuer_id);

CREATE INDEX IF NOT EXISTS sec_filing_evidence_accession_number_idx
  ON public.sec_filing_evidence (accession_number);

CREATE INDEX IF NOT EXISTS sec_filing_evidence_form_type_idx
  ON public.sec_filing_evidence (form_type);

CREATE INDEX IF NOT EXISTS sec_filing_evidence_freshness_status_idx
  ON public.sec_filing_evidence (freshness_status);

CREATE INDEX IF NOT EXISTS sec_corporate_signals_signal_id_idx
  ON public.sec_corporate_signals (signal_id);

CREATE INDEX IF NOT EXISTS sec_corporate_signals_macro_theme_idx
  ON public.sec_corporate_signals (macro_theme);

CREATE INDEX IF NOT EXISTS sec_corporate_signals_observed_at_idx
  ON public.sec_corporate_signals (observed_at DESC);

ALTER TABLE public.sec_corporate_issuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sec_filing_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sec_corporate_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sec_corporate_issuers_read ON public.sec_corporate_issuers;
CREATE POLICY sec_corporate_issuers_read
  ON public.sec_corporate_issuers
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS sec_filing_evidence_read ON public.sec_filing_evidence;
CREATE POLICY sec_filing_evidence_read
  ON public.sec_filing_evidence
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS sec_corporate_signals_read ON public.sec_corporate_signals;
CREATE POLICY sec_corporate_signals_read
  ON public.sec_corporate_signals
  FOR SELECT
  TO anon, authenticated
  USING (true);

REVOKE ALL ON public.sec_corporate_issuers FROM PUBLIC;
REVOKE ALL ON public.sec_filing_evidence FROM PUBLIC;
REVOKE ALL ON public.sec_corporate_signals FROM PUBLIC;

GRANT SELECT ON public.sec_corporate_issuers TO anon, authenticated;
GRANT SELECT ON public.sec_filing_evidence TO anon, authenticated;
GRANT SELECT ON public.sec_corporate_signals TO anon, authenticated;

GRANT ALL ON public.sec_corporate_issuers TO service_role;
GRANT ALL ON public.sec_filing_evidence TO service_role;
GRANT ALL ON public.sec_corporate_signals TO service_role;

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
    END AS evidence_texts
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
  ls.observed_at,
  ls.created_at
FROM latest_signals ls
JOIN public.sec_corporate_issuers i
  ON i.id = ls.issuer_id
LEFT JOIN signal_evidence se
  ON se.signal_row_id = ls.id;

ALTER VIEW public.vw_latest_corporate_signals SET (security_invoker = true);
GRANT SELECT ON public.vw_latest_corporate_signals TO anon, authenticated;

CREATE OR REPLACE VIEW public.vw_corporate_transmission_summary AS
WITH issuer_counts AS (
  SELECT
    COUNT(*) AS total_issuers,
    COUNT(*) FILTER (WHERE is_active) AS active_issuers
  FROM public.sec_corporate_issuers
),
latest_signals AS (
  SELECT DISTINCT ON (issuer_id, signal_id)
    issuer_id,
    signal_id,
    signal_family,
    macro_theme,
    state,
    severity,
    observed_at
  FROM public.sec_corporate_signals
  ORDER BY issuer_id, signal_id, observed_at DESC, created_at DESC, id DESC
),
signal_counts AS (
  SELECT
    COUNT(*) AS total_signals,
    COUNT(DISTINCT issuer_id) AS covered_issuers,
    COUNT(DISTINCT signal_family) AS signal_family_count,
    COUNT(*) FILTER (WHERE state = 'observed') AS observed_signals,
    COUNT(*) FILTER (WHERE state = 'measured') AS measured_signals,
    COUNT(*) FILTER (WHERE state = 'changed') AS changed_signals,
    COUNT(*) FILTER (WHERE state = 'confirmed') AS confirmed_signals,
    COUNT(*) FILTER (WHERE severity = 'info') AS info_signals,
    COUNT(*) FILTER (WHERE severity = 'watch') AS watch_signals,
    COUNT(*) FILTER (WHERE severity = 'elevated') AS elevated_signals,
    COUNT(*) FILTER (WHERE severity = 'high') AS high_signals,
    MAX(observed_at) AS latest_observed_at
  FROM latest_signals
),
signal_family_counts AS (
  SELECT COALESCE(
    jsonb_object_agg(signal_family, signal_family_total ORDER BY signal_family),
    '{}'::jsonb
  ) AS signal_family_counts
  FROM (
    SELECT signal_family, COUNT(*) AS signal_family_total
    FROM latest_signals
    GROUP BY signal_family
  ) grouped_signal_families
),
macro_theme_counts AS (
  SELECT COALESCE(
    jsonb_object_agg(macro_theme, macro_theme_total ORDER BY macro_theme),
    '{}'::jsonb
  ) AS macro_theme_counts
  FROM (
    SELECT macro_theme, COUNT(*) AS macro_theme_total
    FROM latest_signals
    GROUP BY macro_theme
  ) grouped_macro_themes
),
freshness_counts AS (
  SELECT COALESCE(
    jsonb_object_agg(freshness_status, freshness_total ORDER BY freshness_status),
    '{}'::jsonb
  ) AS freshness_counts
  FROM (
    SELECT freshness_status, COUNT(*) AS freshness_total
    FROM public.sec_filing_evidence
    GROUP BY freshness_status
  ) grouped_freshness
)
SELECT
  issuer_counts.total_issuers,
  issuer_counts.active_issuers,
  signal_counts.total_signals,
  signal_counts.covered_issuers,
  signal_counts.signal_family_count,
  signal_counts.observed_signals,
  signal_counts.measured_signals,
  signal_counts.changed_signals,
  signal_counts.confirmed_signals,
  signal_counts.info_signals,
  signal_counts.watch_signals,
  signal_counts.elevated_signals,
  signal_counts.high_signals,
  signal_counts.latest_observed_at,
  signal_family_counts.signal_family_counts,
  macro_theme_counts.macro_theme_counts,
  freshness_counts.freshness_counts
FROM issuer_counts
CROSS JOIN signal_counts
CROSS JOIN signal_family_counts
CROSS JOIN macro_theme_counts
CROSS JOIN freshness_counts;

ALTER VIEW public.vw_corporate_transmission_summary SET (security_invoker = true);
GRANT SELECT ON public.vw_corporate_transmission_summary TO anon, authenticated;
