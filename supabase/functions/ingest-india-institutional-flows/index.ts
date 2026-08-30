import { createClient } from '@supabase/supabase-js';
import { serveIngest, type IngestResult } from '../_shared/handler.ts';
import { parseNseCashPayload, parseParticipantOiCsv, validateCashFlow } from '../_shared/indiaInstitutionalSources.ts';

const NSE_HOME = 'https://www.nseindia.com/';
const NSE_CASH = 'https://www.nseindia.com/api/fiidiiTradeReact';
const NSE_OI_BASE = 'https://nsearchives.nseindia.com/content/nsccl';
const headers = { 'User-Agent': 'Mozilla/5.0 GraphiQuestor/1.0', Accept: '*/*', Referer: 'https://www.nseindia.com/' };

async function fetchText(url: string, cookie = ''): Promise<string> {
  const response = await fetch(url, { headers: { ...headers, ...(cookie ? { Cookie: cookie } : {}) } });
  if (!response.ok) throw new Error(`NSE HTTP ${response.status} for ${url}`);
  return await response.text();
}

function toIsoDate(value: string): string | null {
  const match = value.match(/^(\d{1,2})[- ]([A-Za-z]{3})[- ](\d{4})$/);
  if (!match) return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(match[2]);
  if (month < 0) return null;
  return `${match[3]}-${String(month + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`;
}

export async function ingestIndiaInstitutionalFlows(supabase: ReturnType<typeof createClient>): Promise<IngestResult> {
  const home = await fetch(NSE_HOME, { headers });
  const cookie = (home.headers.get('set-cookie') ?? '').split(',').map((part) => part.split(';')[0]).filter(Boolean).join('; ');
  const cashPayload = JSON.parse(await fetchText(NSE_CASH, cookie)) as unknown;
  const cashRows = parseNseCashPayload(cashPayload).map((row) => ({ ...row, date: toIsoDate(row.date) })).filter((row) => row.date && validateCashFlow(row).valid);
  if (!cashRows.length) throw new Error('NSE returned no validated FII/DII cash rows');
  const now = new Date().toISOString();
  const observations = cashRows.map((row) => ({ metric_id: row.participant === 'FII' ? 'IN_FII_CASH_NET' : 'IN_DII_CASH_NET', as_of_date: row.date!, value: row.netValue, last_updated_at: now, source_ref: row.sourceRef, provenance: 'api_live', is_provisional: false, metadata: { source_fields: row.sourceFields, source_hash: row.sourceHash, parser_version: row.parserVersion, coverage_state: 'observed' } }));
  const { error } = await supabase.from('metric_observations').upsert(observations, { onConflict: 'metric_id,as_of_date' });
  if (error) throw error;
  const latestDate = cashRows.map((row) => row.date!).sort().at(-1);
  let fno = 'unavailable';
  if (latestDate) {
    const [year, month, day] = latestDate.split('-');
    const datePart = `${day}${month}${year}`;
    for (const suffix of [`fao_participant_oi_${datePart}_b.csv`, `fao_participant_oi_${datePart}.csv`]) {
      try { const csv = await fetchText(`${NSE_OI_BASE}/${suffix}`, cookie); const parsed = parseParticipantOiCsv(csv, latestDate); if (parsed.fii) { fno = parsed.coverage; break; } } catch { /* F&O may publish later */ }
    }
  }
  return { ok: true, counts: { upserted: observations.length }, meta: { latest_date: latestDate, fno_coverage: fno } };
}

serveIngest('ingest-india-institutional-flows', async () => ingestIndiaInstitutionalFlows(createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')), { timeoutMs: 20 * 60 * 1000, retries: 3 });
