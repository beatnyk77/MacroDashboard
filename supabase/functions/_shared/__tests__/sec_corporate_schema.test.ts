import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationSql = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260830000000_sec_corporate_transmission.sql'),
  'utf8',
);

function expectContainsAll(snippets: string[]) {
  for (const snippet of snippets) {
    expect(migrationSql).toContain(snippet);
  }
}

describe('sec corporate transmission schema migration', () => {
  it('defines the issuer, evidence, and signal tables with the exact task 1 columns', () => {
    expectContainsAll([
      'CREATE TABLE IF NOT EXISTS public.sec_corporate_issuers (',
      'id uuid PRIMARY KEY DEFAULT gen_random_uuid(),',
      'cik text NOT NULL UNIQUE,',
      'ticker text,',
      'issuer_name text NOT NULL,',
      'exchange text,',
      'sic text,',
      'sector text,',
      "relevance_tags text[] NOT NULL DEFAULT '{}'::text[],",
      'relevance_rationale text,',
      'is_active boolean NOT NULL DEFAULT true,',
      'created_at timestamptz NOT NULL DEFAULT now(),',
      'updated_at timestamptz NOT NULL DEFAULT now()',
      'CREATE TABLE IF NOT EXISTS public.sec_filing_evidence (',
      'issuer_id uuid NOT NULL REFERENCES public.sec_corporate_issuers(id) ON DELETE CASCADE,',
      'accession_number text NOT NULL,',
      'form_type text NOT NULL,',
      'filing_date date NOT NULL,',
      'acceptance_timestamp timestamptz,',
      'document_url text NOT NULL,',
      'section_name text NOT NULL,',
      'evidence_kind text NOT NULL,',
      'evidence_text text,',
      "structured_payload jsonb NOT NULL DEFAULT '{}'::jsonb,",
      'source_hash text,',
      'parser_version text NOT NULL,',
      "freshness_status text NOT NULL DEFAULT 'fresh',",
      'created_at timestamptz NOT NULL DEFAULT now(),',
      'CREATE TABLE IF NOT EXISTS public.sec_corporate_signals (',
      'signal_id text NOT NULL,',
      'signal_family text NOT NULL,',
      'macro_theme text NOT NULL,',
      'state text NOT NULL,',
      'numeric_value numeric,',
      'unit text,',
      'baseline_value numeric,',
      'comparison_window text NOT NULL,',
      'severity text NOT NULL,',
      'confidence numeric NOT NULL,',
      'methodology_version text NOT NULL,',
      "evidence_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],",
      'observed_at timestamptz NOT NULL,',
      'CONSTRAINT sec_filing_evidence_unique_identity UNIQUE (cik, accession_number, section_name, evidence_kind)',
      'CONSTRAINT sec_corporate_signals_unique_observation UNIQUE (issuer_id, signal_id, observed_at)',
    ]);
  });

  it('defines the required indexes, RLS, and read grants', () => {
    expectContainsAll([
      'CREATE INDEX IF NOT EXISTS sec_corporate_issuers_ticker_idx',
      'CREATE INDEX IF NOT EXISTS sec_corporate_issuers_is_active_idx',
      'CREATE INDEX IF NOT EXISTS sec_filing_evidence_issuer_id_idx',
      'CREATE INDEX IF NOT EXISTS sec_filing_evidence_accession_number_idx',
      'CREATE INDEX IF NOT EXISTS sec_filing_evidence_form_type_idx',
      'CREATE INDEX IF NOT EXISTS sec_filing_evidence_freshness_status_idx',
      'CREATE INDEX IF NOT EXISTS sec_corporate_signals_signal_id_idx',
      'CREATE INDEX IF NOT EXISTS sec_corporate_signals_macro_theme_idx',
      'CREATE INDEX IF NOT EXISTS sec_corporate_signals_observed_at_idx',
      'ALTER TABLE public.sec_corporate_issuers ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.sec_filing_evidence ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.sec_corporate_signals ENABLE ROW LEVEL SECURITY;',
      'CREATE POLICY sec_corporate_issuers_read',
      'CREATE POLICY sec_filing_evidence_read',
      'CREATE POLICY sec_corporate_signals_read',
      'TO anon, authenticated',
      'REVOKE ALL ON public.sec_corporate_issuers FROM PUBLIC;',
      'REVOKE ALL ON public.sec_filing_evidence FROM PUBLIC;',
      'REVOKE ALL ON public.sec_corporate_signals FROM PUBLIC;',
      'GRANT SELECT ON public.sec_corporate_issuers TO anon, authenticated;',
      'GRANT SELECT ON public.sec_filing_evidence TO anon, authenticated;',
      'GRANT SELECT ON public.sec_corporate_signals TO anon, authenticated;',
      'GRANT SELECT ON public.vw_latest_corporate_signals TO anon, authenticated;',
      'GRANT SELECT ON public.vw_corporate_transmission_summary TO anon, authenticated;',
    ]);
  });

  it('guards freshness, state, and severity values from the plan', () => {
    expectContainsAll([
      "freshness_status IN ('fresh', 'lagged', 'very_lagged', 'unavailable')",
      "state IN ('observed', 'measured', 'changed', 'confirmed')",
      "severity IN ('info', 'watch', 'elevated', 'high')",
    ]);
  });

  it('publishes a latest-signals view with deterministic evidence-chain fields', () => {
    expectContainsAll([
      'CREATE OR REPLACE VIEW public.vw_latest_corporate_signals AS',
      'LEFT JOIN LATERAL unnest(ls.evidence_ids) WITH ORDINALITY AS le(evidence_id, ord)',
      'LEFT JOIN public.sec_filing_evidence e',
      'array_agg(e.document_url ORDER BY le.ord)',
      'array_agg(e.evidence_text ORDER BY le.ord)',
      'array_agg(e.freshness_status ORDER BY le.ord)',
      'se.evidence_count,',
      'se.evidence_freshness_statuses[1] AS freshness_status,',
      'se.evidence_accession_numbers[1] AS accession_number,',
      'se.evidence_form_types[1] AS form_type,',
      'se.evidence_filing_dates[1] AS filing_date,',
      'se.evidence_acceptance_timestamps[1] AS acceptance_timestamp,',
      'se.evidence_document_urls[1] AS document_url,',
      'se.evidence_section_names[1] AS section_name,',
      'se.evidence_kinds[1] AS evidence_kind,',
      'se.evidence_texts[1] AS evidence_text,',
      'se.evidence_freshness_statuses,',
      'se.evidence_accession_numbers,',
      'se.evidence_form_types,',
      'se.evidence_filing_dates,',
      'se.evidence_acceptance_timestamps,',
      'se.evidence_document_urls,',
      'se.evidence_section_names,',
      'se.evidence_kinds,',
      'se.evidence_texts,',
      'ALTER VIEW public.vw_latest_corporate_signals SET (security_invoker = true);',
    ]);
  });

  it('builds the transmission summary from latest-state signals rather than full history', () => {
    expectContainsAll([
      'CREATE OR REPLACE VIEW public.vw_corporate_transmission_summary AS',
      'latest_signals AS (',
      'SELECT DISTINCT ON (issuer_id, signal_id)',
      'FROM latest_signals',
      'SELECT signal_family, COUNT(*) AS signal_family_total',
      'SELECT macro_theme, COUNT(*) AS macro_theme_total',
      'ALTER VIEW public.vw_corporate_transmission_summary SET (security_invoker = true);',
    ]);
  });
});
