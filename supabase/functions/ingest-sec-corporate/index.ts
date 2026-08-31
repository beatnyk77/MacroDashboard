import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { fetchSecJson, SecClientError } from '../_shared/secClient.ts';
import { serveIngest, type IngestResult } from '../_shared/handler.ts';
import { SEC_CORPORATE_TARGET_CONCEPTS } from '../_shared/secCorporateConcepts.ts';

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

type XbrlFact = {
  accn?: string;
  filed?: string;
  fy?: number;
  fp?: string;
  form?: string;
  end?: string;
  frame?: string;
  val?: unknown;
};

const MAX_FACT_PERIODS_PER_CONCEPT_UNIT = 6;

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

function compareDesc(left?: string, right?: string): number {
  if (left === right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return right.localeCompare(left);
}

function factPeriodKey(fact: XbrlFact): string | null {
  if (fact.end) return fact.end;
  if (fact.frame) return fact.frame;
  if (Number.isFinite(fact.fy) && fact.fp) return `${fact.fy}:${fact.fp}`;
  return fact.filed ?? null;
}

function compareFactRecency(left: XbrlFact, right: XbrlFact): number {
  const filedComparison = compareDesc(left.filed, right.filed);
  if (filedComparison !== 0) return filedComparison;
  const endComparison = compareDesc(left.end, right.end);
  if (endComparison !== 0) return endComparison;
  const fiscalYearComparison = (right.fy ?? 0) - (left.fy ?? 0);
  if (fiscalYearComparison !== 0) return fiscalYearComparison;
  const fiscalPeriodComparison = compareDesc(left.fp, right.fp);
  if (fiscalPeriodComparison !== 0) return fiscalPeriodComparison;
  return compareDesc(left.accn, right.accn);
}

function recentFilingRows(recent: RecentFilings): FilingEvidence[] {
  const accessions = recent.accessionNumber ?? [];
  const dates = recent.filingDate ?? [];
  const acceptance = recent.acceptanceDateTime ?? [];
  const forms = recent.form ?? [];
  const documents = recent.primaryDocument ?? [];

  return accessions.slice(0, 120).flatMap((accession, index) => {
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
      if (!SEC_CORPORATE_TARGET_CONCEPTS.has(concept)) continue;
      for (const [unit, values] of Object.entries(definition.units ?? {})) {
        const latestByPeriod = new Map<string, XbrlFact>();
        for (const value of values) {
          const fact = value as XbrlFact;
          if (!fact.accn || !fact.filed || !fact.form) continue;
          const periodKey = factPeriodKey(fact);
          if (!periodKey) continue;
          const existing = latestByPeriod.get(periodKey);
          if (!existing || compareFactRecency(fact, existing) < 0) {
            latestByPeriod.set(periodKey, fact);
          }
        }
        for (const fact of Array.from(latestByPeriod.values()).sort(compareFactRecency).slice(0, MAX_FACT_PERIODS_PER_CONCEPT_UNIT)) {
          rows.push({
            issuer_id: issuerId,
            cik,
            accession_number: fact.accn,
            form_type: fact.form,
            filing_date: fact.filed,
            acceptance_timestamp: null,
            document_url: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${fact.accn.replaceAll('-', '')}`,
            // Preserve the existing table conflict key while making each
            // stored duration/unit observation unique within an accession.
            section_name: `${namespace}:${concept}:${unit}:${factPeriodKey(fact)}`,
            evidence_kind: 'xbrl_fact',
            evidence_text: null,
            structured_payload: { namespace, concept, unit, periodKey: factPeriodKey(fact), fact },
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
  let companyFacts: unknown = { facts: {} };
  try {
    submissions = await fetchSecJson(`/submissions/CIK${normalizedCik}.json`, userAgent, fetchImpl);
    try {
      companyFacts = await fetchSecJson(`/api/xbrl/companyfacts/CIK${normalizedCik}.json`, userAgent, fetchImpl);
    } catch (error) {
      // Some foreign private issuers have valid submissions but no SEC
      // companyfacts feed. Preserve their filing metadata and mark only the
      // optional XBRL enrichment as unavailable.
      if (!(error instanceof SecClientError) || error.status !== 404) throw error;
    }
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

async function ingestAll(supabase: SupabaseClient, request?: Request): Promise<IngestResult> {
  const { data: issuers, error } = await supabase
    .from('sec_corporate_issuers')
    .select('cik')
    .eq('is_active', true);
  if (error) throw error;

  const params = request ? new URL(request.url).searchParams : new URLSearchParams();
  const requestedBatchSize = Number(params.get('limit') ?? 8);
  const batchSize = Number.isFinite(requestedBatchSize) ? Math.min(10, Math.max(1, Math.floor(requestedBatchSize))) : 8;
  const requestedOffset = Number(params.get('offset') ?? 0);
  const offset = Number.isFinite(requestedOffset) ? Math.max(0, Math.floor(requestedOffset)) : 0;
  const queue = [...(issuers ?? [])].slice(offset, offset + batchSize);
  const processedIssuers = queue.length;
  // Companyfacts responses are large even after row filtering. Keep one parsed
  // issuer payload resident at a time so the Edge Function stays below its
  // memory ceiling when the registry grows.
  const concurrency = Math.min(1, Math.max(1, queue.length));
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
  return {
    ok: true,
    counts: { upserted: evidence, filings, evidence },
    meta: {
      offset,
      batchSize,
      processedIssuers,
      totalActiveIssuers: issuers?.length ?? 0,
      failedIssuers: errors,
    },
  };
}

serveIngest('ingest-sec-corporate', async (request): Promise<IngestResult> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  return ingestAll(supabase, request);
}, { timeoutMs: 25 * 60 * 1000, retries: 3 });
