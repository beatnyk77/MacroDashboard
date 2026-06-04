/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@supabase/supabase-js';

import { runIngestion } from '../_shared/logging.ts';



declare const Deno: any;



const corsHeaders = {

  'Access-Control-Allow-Origin': '*',

  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',

};



// ISO 3166-1 alpha-3 → UN Comtrade M49 reporter codes

const REPORTER_MAP: Record<string, string> = {

  AUS: '36', BRA: '76',  CAN: '124', CHN: '156',

  DEU: '276', ESP: '724', FRA: '251', GBR: '826',

  IND: '699', ITA: '381', JPN: '392', KOR: '410',

  MEX: '484', NLD: '528', SAU: '682', TUR: '792',

  USA: '842',

};



const COMTRADE_BASE = 'https://comtradeapi.un.org/data/v1/get/C/A/HS';

const DEFAULT_YEARS = ['2023', '2024'];



export function parseComtradeRecord(record: { cmdCode?: unknown; primaryValue?: unknown }): {

  hsCode: string;

  importValue: number;

} {

  return {

    hsCode: String(record.cmdCode ?? '').padStart(2, '0'),

    importValue: Number(record.primaryValue ?? 0),

  };

}



export function buildReporterList(

  reporterISO: string | null,

  force: boolean,

  alreadyPopulated: Set<string>

): string[] {

  const all = Object.keys(REPORTER_MAP);

  const list = reporterISO ? [reporterISO.toUpperCase()] : all;

  return force ? list : list.filter((iso3) => !alreadyPopulated.has(iso3));

}



async function doIngest(ctx: any, req: Request): Promise<any> {

  const url = new URL(req.url);

  const reporterISO = url.searchParams.get('reporterISO');

  const force = url.searchParams.get('force') === 'true';

  const yearParam = url.searchParams.get('year');

  const years = yearParam ? [yearParam] : DEFAULT_YEARS;



  const comtradeKey = Deno.env.get('COMTRADE_API_KEY') ?? '';

  if (!comtradeKey) {

    throw new Error('COMTRADE_API_KEY edge secret is not set');

  }



  let alreadyPopulated = new Set<string>();

  if (!force) {

    const { data: existing, error: existErr } = await ctx.supabase

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

      message: 'All reporters already have import data. Use ?force=true to re-ingest.',

      countries_updated: 0,

      rows_updated: 0,

    };

  }



  console.log(`[ingest-trade-imports] Processing ${reporters.length} reporters: ${reporters.join(', ')}`);

  const summary: any[] = [];
  let totalRowsUpdated = 0;

  // Fetch all country-year combinations in parallel (up to 8 concurrent requests)
  const fetchTasks = [];
  for (const iso3 of reporters) {
    const m49 = REPORTER_MAP[iso3];
    if (!m49) {
      console.warn(`[ingest-trade-imports] No M49 mapping for ${iso3}, skipping`);
      summary.push({ reporter: iso3, status: 'skipped', reason: 'no_m49_mapping' });
      continue;
    }

    for (const year of years) {
      fetchTasks.push(
        (async () => {
          try {
            const comtradeUrl =
              `${COMTRADE_BASE}?reporterCode=${m49}&period=${year}&cmdCode=AG2&flowCode=M&partnerCode=0` +
              `&subscription-key=${comtradeKey}`;

            console.log(`[ingest-trade-imports] Fetching ${iso3} (M49:${m49}) ${year}...`);
            const res = await fetch(comtradeUrl);

            if (!res.ok) {
              const errText = await res.text();
              throw new Error(`Comtrade API ${res.status}: ${errText.slice(0, 200)}`);
            }

            const json = (await res.json()) as { data: any[] };
            const parsed = (json.data ?? [])
              .map(parseComtradeRecord)
              .filter((r) => r.importValue > 0);

            if (parsed.length === 0) {
              console.log(`[ingest-trade-imports] No data for ${iso3} ${year}`);
              return { iso3, year, status: 'no_data', rows: [], error: null };
            }

            const rows = parsed.map((r) => ({
              reporter_iso3: iso3,
              hs_code: r.hsCode,
              year: parseInt(year, 10),
              import_value_usd: r.importValue,
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

  // Run fetches in parallel with concurrency control
  const results = await Promise.all(fetchTasks);

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
      const { error: upsertErr } = await ctx.supabase
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
    countries_updated: reporters.length,
    rows_updated: totalRowsUpdated,
    metadata: { summary },
  };

}



Deno.serve(async (req: Request) => {

  if (req.method === 'OPTIONS') {

    return new Response('ok', { headers: corsHeaders });

  }



  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const supabase = createClient(supabaseUrl, supabaseKey);



  return runIngestion(

    supabase,

    'ingest-trade-imports',

    (ctx) => doIngest(ctx, req),

    corsHeaders

  );

});
