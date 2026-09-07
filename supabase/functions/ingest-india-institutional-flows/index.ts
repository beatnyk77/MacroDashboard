import { createClient } from '@supabase/supabase-js';
import { read, utils } from 'xlsx';
import { serveIngest, type IngestResult } from '../_shared/handler.ts';
import {
  buildIndiaCashObservations,
  findCashObservationRevisions,
  nseCategoryWorkbookUrl,
  planNseCategoryBackfillDates,
  type AcceptedCashObservation,
  type IndiaCashObservation,
} from '../_shared/indiaInstitutionalBackfill.ts';
import {
  parseNseCashPayload,
  parseNseCategoryTurnoverRows,
  parseParticipantOiCsv,
  validateCashFlow,
} from '../_shared/indiaInstitutionalSources.ts';
import { MIN_ACCEPTED_DAILY_OBSERVATIONS } from '../_shared/indiaInstitutionalSignals.ts';

const NSE_HOME = 'https://www.nseindia.com/';
const NSE_CASH = 'https://www.nseindia.com/api/fiidiiTradeReact';
const NSE_OI_BASE = 'https://nsearchives.nseindia.com/content/nsccl';
const CASH_METRIC_IDS = ['IN_FII_CASH_NET', 'IN_DII_CASH_NET'];
const BACKFILL_BATCH_SIZE = 2;
const MAX_BACKFILL_WEEKDAYS = 60;
const headers = { 'User-Agent': 'Mozilla/5.0 GraphiQuestor/1.0', Accept: '*/*', Referer: 'https://www.nseindia.com/' };

async function fetchText(url: string, cookie = ''): Promise<string> {
  const response = await fetch(url, { headers: { ...headers, ...(cookie ? { Cookie: cookie } : {}) } });
  if (!response.ok) throw new Error(`NSE HTTP ${response.status} for ${url}`);
  return await response.text();
}

async function fetchWorkbookRows(url: string): Promise<unknown[][]> {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`NSE HTTP ${response.status} for ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > 1_000_000) throw new Error(`NSE workbook exceeds the 1 MB safety limit for ${url}`);
  const oleHeader = [0xd0, 0xcf, 0x11, 0xe0];
  if (bytes.length < 8 || oleHeader.some((value, index) => bytes[index] !== value)) {
    throw new Error(`NSE returned a non-workbook response for ${url}`);
  }
  const workbook = read(bytes, { type: 'array', cellDates: false });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) throw new Error(`NSE workbook has no sheets for ${url}`);
  return utils.sheet_to_json(firstSheet, { header: 1, raw: false, defval: null }) as unknown[][];
}

function toIsoDate(value: string): string | null {
  const match = value.match(/^(\d{1,2})[- ]([A-Za-z]{3})[- ](\d{4})$/);
  if (!match) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const parsed = new Date(`${value}T00:00:00Z`);
    return parsed.toISOString().slice(0, 10) === value ? value : null;
  }
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(match[2]);
  if (month < 0) return null;
  const iso = `${match[3]}-${String(month + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  return parsed.toISOString().slice(0, 10) === iso ? iso : null;
}

async function acceptedCashRows(supabase: ReturnType<typeof createClient>): Promise<AcceptedCashObservation[]> {
  const { data, error } = await supabase
    .from('metric_observations')
    .select('metric_id, as_of_date, value, source_ref, metadata')
    .in('metric_id', CASH_METRIC_IDS)
    .order('as_of_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as AcceptedCashObservation[];
}

function pairedSessionDates(rows: AcceptedCashObservation[]): string[] {
  const participants = new Map<string, Set<string>>();
  for (const row of rows) {
    const metrics = participants.get(row.as_of_date) ?? new Set<string>();
    metrics.add(row.metric_id);
    participants.set(row.as_of_date, metrics);
  }
  return [...participants.entries()]
    .filter(([, metrics]) => CASH_METRIC_IDS.every((metricId) => metrics.has(metricId)))
    .map(([date]) => date)
    .sort();
}

async function persistCashObservations(
  supabase: ReturnType<typeof createClient>,
  observations: IndiaCashObservation[],
): Promise<void> {
  if (!observations.length) return;
  const dates = [...new Set(observations.map((row) => row.as_of_date))];
  const { data: accepted, error: acceptedError } = await supabase
    .from('metric_observations')
    .select('metric_id, as_of_date, value, source_ref, metadata')
    .in('metric_id', CASH_METRIC_IDS)
    .in('as_of_date', dates);
  if (acceptedError) throw acceptedError;
  const revisions = findCashObservationRevisions((accepted ?? []) as AcceptedCashObservation[], observations);
  if (revisions.length) {
    const { error: revisionError } = await supabase.from('india_institutional_observation_revisions').insert(revisions);
    if (revisionError) throw revisionError;
  }
  const { error } = await supabase
    .from('metric_observations')
    .upsert(observations as unknown as Record<string, unknown>[], { onConflict: 'metric_id,as_of_date' });
  if (error) throw error;
}

async function backfillOfficialNseHistory(
  supabase: ReturnType<typeof createClient>,
  accepted: AcceptedCashObservation[],
  maxSessions = 10,
): Promise<{ observations: number; sessions: number; attempted: number; skipped: number }> {
  const sessions = pairedSessionDates(accepted);
  if (sessions.length >= MIN_ACCEPTED_DAILY_OBSERVATIONS) return { observations: 0, sessions: 0, attempted: 0, skipped: 0 };
  const anchor = sessions[0] ?? new Date().toISOString().slice(0, 10);
  const required = Math.min(MIN_ACCEPTED_DAILY_OBSERVATIONS - sessions.length, maxSessions);
  const candidates = planNseCategoryBackfillDates(anchor, 0, Math.min(MAX_BACKFILL_WEEKDAYS, required * 3));
  const collected: IndiaCashObservation[] = [];
  let attempted = 0;
  let skipped = 0;

  for (let offset = 0; offset < candidates.length && collected.length / 2 < required; offset += BACKFILL_BATCH_SIZE) {
    const batch = candidates.slice(offset, offset + BACKFILL_BATCH_SIZE);
    const results = await Promise.all(batch.map(async (date) => {
      const sourceUrl = nseCategoryWorkbookUrl(date);
      const parsed = parseNseCategoryTurnoverRows(await fetchWorkbookRows(sourceUrl), sourceUrl);
      if (parsed.length !== 2 || parsed.some((row) => !validateCashFlow(row).valid)) {
        throw new Error(`NSE workbook did not contain complete validated FII/DII rows for ${date}`);
      }
      return buildIndiaCashObservations(parsed, new Date().toISOString());
    }).map((promise) => promise.then((value) => ({ value })).catch(() => ({ value: [] as IndiaCashObservation[] }))));
    attempted += batch.length;
    for (const result of results) {
      if (result.value.length === 2) collected.push(...result.value);
      else skipped += 1;
      if (collected.length / 2 >= required) break;
    }
  }

  if (collected.length > 0) {
    await persistCashObservations(supabase, collected);
  }
  return { observations: collected.length, sessions: collected.length / 2, attempted, skipped };
}

export async function ingestIndiaInstitutionalFlows(
  supabase: ReturnType<typeof createClient>,
  options: { backfill?: boolean; limit?: number } = {},
): Promise<IngestResult> {
  const home = await fetch(NSE_HOME, { headers });
  const cookie = (home.headers.get('set-cookie') ?? '').split(',').map((part) => part.split(';')[0]).filter(Boolean).join('; ');
  const cashPayload = JSON.parse(await fetchText(NSE_CASH, cookie)) as unknown;
  const cashRows = parseNseCashPayload(cashPayload).flatMap((row) => {
    const date = toIsoDate(row.date);
    if (!date) return [];
    const datedRow = { ...row, date };
    return validateCashFlow(datedRow).valid ? [datedRow] : [];
  });
  const participants = new Set(cashRows.map((row) => row.participant));
  if (!cashRows.length || !participants.has('FII') || !participants.has('DII')) {
    throw new Error('NSE returned incomplete validated FII/DII cash rows');
  }
  const liveObservations = buildIndiaCashObservations(cashRows, new Date().toISOString());
  await persistCashObservations(supabase, liveObservations);

  const accepted = await acceptedCashRows(supabase);
  const beforeSessions = pairedSessionDates(accepted).length;
  const backfill = options.backfill
    ? await backfillOfficialNseHistory(supabase, accepted, options.limit ?? 10)
    : { observations: 0, sessions: 0, attempted: 0, skipped: 0 };
  const acceptedSessions = beforeSessions + backfill.sessions;
  const latestDate = cashRows.map((row) => row.date!).sort().at(-1);
  let fno = 'unavailable';
  if (latestDate) {
    const [year, month, day] = latestDate.split('-');
    const datePart = `${day}${month}${year}`;
    for (const suffix of [`fao_participant_oi_${datePart}_b.csv`, `fao_participant_oi_${datePart}.csv`]) {
      try {
        const parsed = parseParticipantOiCsv(await fetchText(`${NSE_OI_BASE}/${suffix}`, cookie), latestDate);
        if (parsed.fii) { fno = parsed.coverage; break; }
      } catch { /* F&O may publish later */ }
    }
  }
  return {
    ok: true,
    counts: { upserted: liveObservations.length + backfill.observations, backfilled: backfill.observations },
    meta: {
      latest_date: latestDate,
      fno_coverage: fno,
      accepted_daily_observations: acceptedSessions,
      required_daily_observations: MIN_ACCEPTED_DAILY_OBSERVATIONS,
      publication_threshold_met: acceptedSessions >= MIN_ACCEPTED_DAILY_OBSERVATIONS,
      backfill_attempted_weekdays: backfill.attempted,
      backfill_skipped_dates: backfill.skipped,
    },
  };
}

serveIngest('ingest-india-institutional-flows', async (req) => {
  const url = new URL(req.url);
  const limitParam = url.searchParams.get('limit');
  return await ingestIndiaInstitutionalFlows(
    createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''),
    {
      backfill: url.searchParams.get('backfill') === 'true',
      limit: limitParam ? parseInt(limitParam, 10) : 10,
    },
  );
}, { timeoutMs: 20 * 60 * 1000, retries: 3 });
