import { createClient } from '@supabase/supabase-js';
import { serveIngest, type IngestResult } from '../_shared/handler.ts';
import { parseNsdlSectorHtml, validateSectorRows } from '../_shared/indiaInstitutionalSources.ts';

const NSDL_SELECTION = 'https://www.fpi.nsdl.co.in/web/Reports/FPI_Fortnightly_Selection.aspx';
const NSDL_BASE = 'https://www.fpi.nsdl.co.in/web/StaticReports/Fortnightly_Sector_wise_FII_Investment_Data';

function reportDate(code: string): string | null {
  const match = code.match(/^([A-Za-z]{3})(\d{1,2})(\d{4})$/);
  if (!match) return null;
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(match[1]);
  const day = Number(match[2]);
  if (month < 0 || day < 1 || day > 31) return null;
  const date = `${match[3]}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const parsed = new Date(`${date}T00:00:00Z`);
  return parsed.toISOString().slice(0, 10) === date ? date : null;
}

async function latestNsdlReport(): Promise<{ reportPeriodEnd: string; sourceUrl: string }> {
  const response = await fetch(NSDL_SELECTION, { headers: { Accept: 'text/html', 'User-Agent': 'Mozilla/5.0 GraphiQuestor/1.0' } });
  if (!response.ok) throw new Error(`NSDL selection HTTP ${response.status}`);
  const html = await response.text();
  const codes = [...html.matchAll(/FIIInvestSector_([A-Za-z0-9]+)\.html/gi)]
    .map((match) => match[1])
    .map((code) => ({ code, date: reportDate(code) }))
    .filter((entry): entry is { code: string; date: string } => entry.date !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
  const latest = codes.at(-1);
  if (!latest) throw new Error('NSDL selection page contained no dated sector reports');
  return { reportPeriodEnd: latest.date, sourceUrl: `${NSDL_BASE}/FIIInvestSector_${latest.code}.html` };
}

export async function ingestIndiaSectorPositioning(supabase: ReturnType<typeof createClient>, reportPeriodEnd: string, sourceUrl: string): Promise<IngestResult> {
  const response = await fetch(sourceUrl, { headers: { Accept: 'text/html', 'User-Agent': 'Mozilla/5.0 GraphiQuestor/1.0' } });
  if (!response.ok) throw new Error(`NSDL HTTP ${response.status}`);
  const rows = parseNsdlSectorHtml(await response.text(), sourceUrl, reportPeriodEnd);
  const validation = validateSectorRows(rows);
  if (!validation.valid) throw new Error(`Invalid NSDL sector report: ${validation.errors.join('; ')}`);
  const payload = rows.map((row) => ({ sector_key: row.sectorKey, source_sector_label: row.sourceSectorLabel, report_period_end: row.reportPeriodEnd, equity_flow_inr_crore: row.equityFlowInrCrore, total_flow_inr_crore: row.totalFlowInrCrore, equity_aum_inr_crore: row.equityAumInrCrore, total_aum_inr_crore: row.totalAumInrCrore, source_url: row.sourceUrl, source_hash: row.sourceHash, parser_version: row.parserVersion, provenance: 'api_live', is_provisional: false, source_name: 'NSDL', native_frequency: 'fortnightly' }));
  const { data: accepted, error: acceptedError } = await supabase.from('india_institutional_sector_observations').select('sector_key, report_period_end, equity_flow_inr_crore, equity_aum_inr_crore, source_url, source_hash').eq('report_period_end', reportPeriodEnd);
  if (acceptedError) throw acceptedError;
  const revisions = (accepted ?? []).flatMap((old) => {
    const incoming = payload.find((row) => row.sector_key === old.sector_key);
    return incoming && old.source_hash !== incoming.source_hash ? [{ sector_key: old.sector_key, report_period_end: old.report_period_end, equity_flow_inr_crore: old.equity_flow_inr_crore, equity_aum_inr_crore: old.equity_aum_inr_crore, source_url: old.source_url, source_hash: old.source_hash }] : [];
  });
  if (revisions.length) {
    const { error: revisionError } = await supabase.from('india_institutional_sector_revisions').insert(revisions);
    if (revisionError) throw revisionError;
  }
  const { error } = await supabase.from('india_institutional_sector_observations').upsert(payload, { onConflict: 'sector_key,report_period_end' });
  if (error) throw error;
  return { ok: true, counts: { upserted: payload.length }, meta: { report_period_end: reportPeriodEnd, source_url: sourceUrl } };
}

serveIngest('ingest-india-sector-positioning', async (req) => {
  const body = await req.json().catch(() => ({}));
  const requestedDate = String(body.report_period_end ?? '');
  const requestedUrl = String(body.source_url ?? '');
  const discovered = requestedDate || requestedUrl ? null : await latestNsdlReport();
  const reportPeriodEnd = requestedDate || discovered?.reportPeriodEnd || '';
  const sourceUrl = requestedUrl || discovered?.sourceUrl || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportPeriodEnd) || !sourceUrl) throw new Error('A valid NSDL report period and source URL are required');
  return ingestIndiaSectorPositioning(createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''), reportPeriodEnd, sourceUrl);
}, { timeoutMs: 20 * 60 * 1000, retries: 3 });
