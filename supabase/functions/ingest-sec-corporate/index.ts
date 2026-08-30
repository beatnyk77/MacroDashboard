import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { fetchSecJson } from '../_shared/secClient.ts';
import { serveIngest, type IngestResult } from '../_shared/handler.ts';

type RecentFilings = {
  accessionNumber?: string[];
  filingDate?: string[];
  acceptanceDateTime?: string[];
  form?: string[];
  primaryDocument?: string[];
};

type FilingEvidence = {
  issuer_id: string;
  cik: string;
  accession_number: string;
  form_type: string;
  filing_date: string;
  acceptance_timestamp: string | null;
  document_url: string;
  section_name: string;
  evidence_kind: string;
  evidence_text: string | null;
  structured_payload: Record<string, unknown>;
  source_hash: string;
  parser_version: string;
  freshness_status: 'fresh' | 'unavailable';
};

function padCik(cik: string): string {
  return cik.replace(/\D/g, '').padStart(10, '0');
}

function accessionUrl(cik: string, accession: string, document: string): string {
  return `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accession.replaceAll('-', '')}/${document}`;
}

function stableHash(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function recentFilingRows(recent: RecentFilings): FilingEvidence[] {
  const accessions = recent.accessionNumber ?? [];
  const dates = recent.filingDate ?? [];
  const acceptance = recent.acceptanceDateTime ?? [];
  const forms = recent.form ?? [];
  const documents = recent.primaryDocument ?? [];

  return accessions.flatMap((accession, index) => {
    const form = forms[index];
    const filingDate = dates[index];
    const document = documents[index];
    if (!accession || !form || !filingDate || !document) return [];
    return [{
      issuer_id: '',
      cik: '',
      accession_number: accession,
      form_type: form,
      filing_date: filingDate,
      acceptance_timestamp: acceptance[index] ?? null,
      document_url: '',
      section_name: 'filing_metadata',
      evidence_kind: 'filing_metadata',
      evidence_text: null,
      structured_payload: { primaryDocument: document },
      source_hash: stableHash({ accession, form, filingDate, document }),
      parser_version: 'sec-native-v1',
      freshness_status: 'fresh' as const,
    }];
  });
}

function factRows(issuerId: string, cik: string, facts: Record<string, unknown>): FilingEvidence[] {
  const rows: FilingEvidence[] = [];
  const namespaces = ['us-gaap', 'dei', 'ifrs-full'];
  for (const namespace of namespaces) {
    const concepts = (facts[namespace] ?? {}) as Record<string, { units?: Record<string, unknown[]> }>;
    for (const [concept, definition] of Object.entries(concepts)) {
      for (const [unit, values] of Object.entries(definition.units ?? {})) {
        for (const value of values) {
          const fact = value as { accn?: string; filed?: string; fy?: number; fp?: string; form?: string; end?: string };
          if (!fact.accn || !fact.filed || !fact.form) continue;
          rows.push({
            issuer_id: issuerId,
            cik,
            accession_number: fact.accn,
            form_type: fact.form,
            filing_date: fact.filed,
            acceptance_timestamp: null,
            document_url: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${fact.accn.replaceAll('-', '')}`,
            section_name: `${namespace}:${concept}`,
            evidence_kind: 'xbrl_fact',
            evidence_text: null,
            structured_payload: { namespace, concept, unit, fact },
            source_hash: stableHash({ namespace, concept, unit, fact }),
            parser_version: 'sec-native-v1',
            freshness_status: 'fresh',
          });
        }
      }
    }
  }
  return rows;
}

async function recordUnavailable(
  supabase: SupabaseClient,
  issuerId: string,
  cik: string,
  sectionName: string,
  documentUrl: string,
  error: unknown,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const { error: upsertError } = await supabase.from('sec_filing_evidence').upsert([{
    issuer_id: issuerId,
    cik,
    accession_number: `unavailable-${sectionName}-${cik}`,
    form_type: 'UNAVAILABLE',
    filing_date: new Date().toISOString().slice(0, 10),
    acceptance_timestamp: null,
    document_url: documentUrl,
    section_name: sectionName,
    evidence_kind: 'ingestion_error',
    evidence_text: message,
    structured_payload: { error: message },
    source_hash: stableHash({ sectionName, message }),
    parser_version: 'sec-native-v1',
    freshness_status: 'unavailable',
  }], { onConflict: 'cik,accession_number,section_name,evidence_kind', ignoreDuplicates: false });
  if (upsertError) throw upsertError;
}

export async function ingestIssuer(
  cik: string,
  supabase: SupabaseClient,
  fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis),
): Promise<{ filings: number; evidence: number }> {
  const normalizedCik = padCik(cik);
  const { data: issuer, error: issuerError } = await supabase
    .from('sec_corporate_issuers')
    .select('id, cik')
    .eq('cik', normalizedCik)
    .eq('is_active', true)
    .maybeSingle();
  if (issuerError) throw issuerError;
  if (!issuer) throw new Error(`Active SEC issuer not found for CIK ${normalizedCik}`);

  const userAgent = Deno.env.get('SEC_USER_AGENT') ?? '';
  let submissions: unknown;
  let companyFacts: unknown;
  try {
    [submissions, companyFacts] = await Promise.all([
      fetchSecJson(`/submissions/CIK${normalizedCik}.json`, userAgent, fetchImpl),
      fetchSecJson(`/api/xbrl/companyfacts/CIK${normalizedCik}.json`, userAgent, fetchImpl),
    ]);
  } catch (error) {
    await recordUnavailable(
      supabase,
      issuer.id,
      normalizedCik,
      'sec_fetch',
      `https://data.sec.gov/submissions/CIK${normalizedCik}.json`,
      error,
    );
    throw error;
  }

  const submissionPayload = submissions as { filings?: { recent?: RecentFilings } };
  const recentRows = recentFilingRows(submissionPayload.filings?.recent ?? {}).map((row) => ({
    ...row,
    issuer_id: issuer.id,
    cik: normalizedCik,
    document_url: accessionUrl(normalizedCik, row.accession_number, String(row.structured_payload.primaryDocument)),
  }));
  const factPayload = companyFacts as { facts?: Record<string, unknown> };
  const rows = [...recentRows, ...factRows(issuer.id, normalizedCik, factPayload.facts ?? {})];
  if (rows.length === 0) return { filings: 0, evidence: 0 };

  const { error } = await supabase
    .from('sec_filing_evidence')
    .upsert(rows, { onConflict: 'cik,accession_number,section_name,evidence_kind', ignoreDuplicates: false });
  if (error) throw error;
  return { filings: recentRows.length, evidence: rows.length };
}

async function ingestAll(supabase: SupabaseClient): Promise<IngestResult> {
  const { data: issuers, error } = await supabase
    .from('sec_corporate_issuers')
    .select('cik')
    .eq('is_active', true);
  if (error) throw error;

  const queue = [...(issuers ?? [])];
  const concurrency = Math.min(4, Math.max(1, queue.length));
  let filings = 0;
  let evidence = 0;
  const errors: string[] = [];

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const issuer = queue.shift();
      if (!issuer?.cik) continue;
      try {
        const result = await ingestIssuer(issuer.cik, supabase);
        filings += result.filings;
        evidence += result.evidence;
      } catch (err) {
        errors.push(`${issuer.cik}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  if (errors.length > 0) throw new Error(`SEC ingestion failures: ${errors.join('; ')}`);
  return { ok: true, counts: { upserted: evidence, filings, evidence } };
}

serveIngest('ingest-sec-corporate', async (): Promise<IngestResult> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  return ingestAll(supabase);
}, { timeoutMs: 25 * 60 * 1000, retries: 3 });
