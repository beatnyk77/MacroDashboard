/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@supabase/supabase-js';

import { serveIngest, IngestResult } from '../_shared/handler.ts';




// ISO 3166-1 alpha-3 → UN Comtrade M49 reporter codes

const REPORTER_MAP: Record<string, string> = {

  AUS: '36', BRA: '76',  CAN: '124', CHN: '156',

  DEU: '276', ESP: '724', FRA: '251', GBR: '826',

  IND: '699', ITA: '381', JPN: '392', KOR: '410',

  MEX: '484', NLD: '528', SAU: '682', TUR: '792',

  USA: '842',

};



const DEFAULT_YEARS = ['2023', '2024'];



export function buildReporterList(

  reporterISO: string | null,

  force: boolean,

  alreadyPopulated: Set<string>

): string[] {

  const all = Object.keys(REPORTER_MAP);

  const list = reporterISO ? [reporterISO.toUpperCase()] : all;

  return force ? list : list.filter((iso3) => !alreadyPopulated.has(iso3));

}



async function doIngest(supabase: any, req: Request): Promise<IngestResult> {

  const url = new URL(req.url);

  const reporterISO = url.searchParams.get('reporterISO');

  const force = url.searchParams.get('force') === 'true';

  const yearParam = url.searchParams.get('year');

  const years = yearParam ? [yearParam] : DEFAULT_YEARS;



  let alreadyPopulated = new Set<string>();

  if (!force) {

    const { data: existing, error: existErr } = await supabase

      .from('trade_global_aggregates')

      .select('reporter_iso3')

      .not('import_value_usd', 'is', null)

      .gt('import_value_usd', 0);

    if (existErr) {

      console.warn('[ingest-trade-imports] Could not check existing data:', existErr.message);

    }

    alreadyPopulated = new Set((existing ?? []).map((r: any) => r.reporter_iso3 as string));

  }



  const reporters = buildReporterList(reporterISO, force, alreadyPopulated);



  if (reporters.length === 0) {
    return {
      ok: true,
      counts: { upserted: 0 },
      meta: {
        message: 'All reporters already have import data. Use ?force=true to re-ingest.',
        countries_updated: 0,
      },
    };
  }



  console.log(`[ingest-trade-imports] Processing ${reporters.length} reporters from cache: ${reporters.join(', ')}`);

  const summary: any[] = [];
  let totalRowsUpdated = 0;

  // Read from comtrade_cache table instead of making external API calls
  const cacheTasks = [];
  for (const iso3 of reporters) {
    for (const year of years) {
      cacheTasks.push(
        (async () => {
          try {
            console.log(`[ingest-trade-imports] Reading ${iso3} ${year} from cache...`);

            const { data: cacheRecords, error: cacheErr } = await supabase
              .from('comtrade_cache')
              .select('hs_code, primary_value')
              .eq('reporter_iso3', iso3)
              .eq('period', year)
              .gt('primary_value', 0);

            if (cacheErr) throw cacheErr;

            if (!cacheRecords || cacheRecords.length === 0) {
              console.log(`[ingest-trade-imports] No cached data for ${iso3} ${year}`);
              return { iso3, year, status: 'no_data', rows: [], error: null };
            }

            const rows = cacheRecords.map((r: any) => ({
              reporter_iso3: iso3,
              hs_code: r.hs_code,
              year: parseInt(year, 10),
              import_value_usd: r.primary_value,
              fetched_at: new Date().toISOString(),
            }));

            return { iso3, year, status: 'success', rows, error: null };
          } catch (e: any) {
            console.error(`[ingest-trade-imports] ✗ ${iso3} ${year}:`, e.message);
            return { iso3, year, status: 'failed', rows: [], error: e.message };
          }
        })()
      );
    }
  }

  // Read from cache in parallel
  const results = await Promise.all(cacheTasks);

  // Process results sequentially for DB operations
  for (const result of results) {
    if (result.status === 'no_data') {
      summary.push({ reporter: result.iso3, year: result.year, status: 'no_data', rows_updated: 0 });
      continue;
    }

    if (result.status === 'failed') {
      summary.push({ reporter: result.iso3, year: result.year, status: 'failed', error: result.error });
      continue;
    }

    try {
      const { error: upsertErr } = await supabase
        .from('trade_global_aggregates')
        .upsert(result.rows, { onConflict: 'reporter_iso3,hs_code,year', ignoreDuplicates: false });

      if (upsertErr) throw upsertErr;

      totalRowsUpdated += result.rows.length;
      summary.push({ reporter: result.iso3, year: result.year, status: 'success', rows_updated: result.rows.length });
      console.log(`[ingest-trade-imports] ✓ ${result.iso3} ${result.year}: ${result.rows.length} rows upserted`);
    } catch (e: any) {
      console.error(`[ingest-trade-imports] DB upsert failed for ${result.iso3} ${result.year}:`, e.message);
      summary.push({ reporter: result.iso3, year: result.year, status: 'failed', error: e.message });
    }
  }

  return {
    ok: true,
    counts: { upserted: totalRowsUpdated },
    meta: { countries_updated: reporters.length, summary },
  };
}



serveIngest('ingest-trade-imports', async (req: Request): Promise<IngestResult> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  return doIngest(supabase, req);
}, { timeoutMs: 25 * 60 * 1000, retries: 2 });
