import { createClient } from '@supabase/supabase-js';
import { serveIngest, type IngestResult } from '../_shared/handler.ts';
import { parseNsdlSectorHtml, validateSectorRows } from '../_shared/indiaInstitutionalSources.ts';

export async function ingestIndiaSectorPositioning(supabase: ReturnType<typeof createClient>, reportPeriodEnd: string, sourceUrl: string): Promise<IngestResult> {
  const response = await fetch(sourceUrl, { headers: { Accept: 'text/html', 'User-Agent': 'Mozilla/5.0 GraphiQuestor/1.0' } });
  if (!response.ok) throw new Error(`NSDL HTTP ${response.status}`);
  const rows = parseNsdlSectorHtml(await response.text(), sourceUrl, reportPeriodEnd);
  const validation = validateSectorRows(rows);
  if (!validation.valid) throw new Error(`Invalid NSDL sector report: ${validation.errors.join('; ')}`);
  const payload = rows.map((row) => ({ sector_key: row.sectorKey, source_sector_label: row.sourceSectorLabel, report_period_end: row.reportPeriodEnd, equity_flow_inr_crore: row.equityFlowInrCrore, total_flow_inr_crore: row.totalFlowInrCrore, equity_aum_inr_crore: row.equityAumInrCrore, total_aum_inr_crore: row.totalAumInrCrore, source_url: row.sourceUrl, source_hash: row.sourceHash, parser_version: row.parserVersion, provenance: 'api_live', is_provisional: false }));
  const { error } = await supabase.from('india_institutional_sector_observations').upsert(payload, { onConflict: 'sector_key,report_period_end' });
  if (error) throw error;
  return { ok: true, counts: { upserted: payload.length }, meta: { report_period_end: reportPeriodEnd, source_url: sourceUrl } };
}

serveIngest('ingest-india-sector-positioning', async (req) => {
  const body = await req.json().catch(() => ({}));
  const reportPeriodEnd = String(body.report_period_end ?? new Date().toISOString().slice(0, 10));
  const sourceUrl = String(body.source_url ?? '');
  if (!sourceUrl) throw new Error('source_url is required for NSDL sector ingestion');
  return ingestIndiaSectorPositioning(createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''), reportPeriodEnd, sourceUrl);
}, { timeoutMs: 20 * 60 * 1000, retries: 3 });
