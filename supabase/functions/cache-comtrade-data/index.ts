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
  AUS: '36', BRA: '76', CAN: '124', CHN: '156',
  DEU: '276', ESP: '724', FRA: '251', GBR: '826',
  IND: '699', ITA: '381', JPN: '392', KOR: '410',
  MEX: '484', NLD: '528', SAU: '682', TUR: '792',
  USA: '842',
};

const COMTRADE_BASE = 'https://comtradeapi.un.org/data/v1/get/C/A/HS';
const DEFAULT_YEARS = ['2023', '2024'];

async function doIngest(ctx: any, req: Request): Promise<any> {
  const url = new URL(req.url);
  const reporterISO = url.searchParams.get('reporterISO')?.toUpperCase() || null;
  const yearParam = url.searchParams.get('year');
  const years = yearParam ? [yearParam] : DEFAULT_YEARS;

  const comtradeKey = Deno.env.get('COMTRADE_API_KEY') ?? '';
  if (!comtradeKey) {
    throw new Error('COMTRADE_API_KEY edge secret is not set');
  }

  // Determine which reporters to cache
  const reporters = reporterISO ? [reporterISO] : Object.keys(REPORTER_MAP);
  const summary: any[] = [];
  let totalRowsCached = 0;

  console.log(`[cache-comtrade-data] Caching ${reporters.length} reporters: ${reporters.join(', ')}`);

  // Fetch all in parallel
  const fetchTasks = [];
  for (const iso3 of reporters) {
    const m49 = REPORTER_MAP[iso3];
    if (!m49) {
      console.warn(`[cache-comtrade-data] No M49 mapping for ${iso3}, skipping`);
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

            console.log(`[cache-comtrade-data] Fetching ${iso3} (M49:${m49}) ${year}...`);
            const res = await fetch(comtradeUrl);

            if (!res.ok) {
              const errText = await res.text();
              throw new Error(`Comtrade API ${res.status}: ${errText.slice(0, 200)}`);
            }

            const json = (await res.json()) as { data: any[] };
            const records = (json.data ?? []).filter((r: any) => r.primaryValue > 0);

            if (records.length === 0) {
              console.log(`[cache-comtrade-data] No data for ${iso3} ${year}`);
              return { iso3, year, status: 'no_data', rows: [], error: null };
            }

            const rows = records.map((r: any) => ({
              reporter_code: m49,
              reporter_iso3: iso3,
              period: parseInt(year, 10),
              cmd_code: 'AG2',
              flow_code: 'M',
              partner_code: '0',
              hs_code: String(r.cmdCode ?? '').padStart(2, '0'),
              primary_value: r.primaryValue,
            }));

            return { iso3, year, status: 'success', rows, error: null };
          } catch (e: any) {
            console.error(`[cache-comtrade-data] ✗ ${iso3} ${year}:`, e.message);
            return { iso3, year, status: 'failed', rows: [], error: e.message };
          }
        })()
      );
    }
  }

  // Run fetches in parallel
  const results = await Promise.all(fetchTasks);

  // Cache results sequentially
  for (const result of results) {
    if (result.status === 'no_data') {
      summary.push({ reporter: result.iso3, year: result.year, status: 'no_data', rows_cached: 0 });
      continue;
    }

    if (result.status === 'failed') {
      summary.push({ reporter: result.iso3, year: result.year, status: 'failed', error: result.error });
      continue;
    }

    try {
      const { error: upsertErr } = await ctx.supabase
        .from('comtrade_cache')
        .upsert(result.rows, { onConflict: 'reporter_code,period,cmd_code,flow_code,partner_code,hs_code', ignoreDuplicates: true });

      if (upsertErr) throw upsertErr;

      totalRowsCached += result.rows.length;
      summary.push({ reporter: result.iso3, year: result.year, status: 'success', rows_cached: result.rows.length });
      console.log(`[cache-comtrade-data] ✓ ${result.iso3} ${result.year}: ${result.rows.length} rows cached`);
    } catch (e: any) {
      console.error(`[cache-comtrade-data] Cache insert failed for ${result.iso3} ${result.year}:`, e.message);
      summary.push({ reporter: result.iso3, year: result.year, status: 'failed', error: e.message });
    }
  }

  return {
    reporters_cached: reporters.length,
    rows_cached: totalRowsCached,
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
    'cache-comtrade-data',
    (ctx) => doIngest(ctx, req),
    corsHeaders
  );
});
