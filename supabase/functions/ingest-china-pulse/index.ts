// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js';
import { serveIngest, IngestResult } from '../_shared/handler.ts';

async function fetchFRED(seriesId: string, fredKey: string, limit = 3): Promise<{ date: string; value: number } | null> {
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${fredKey}&file_type=json&sort_order=desc&limit=${limit}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, any>;
    const obs = (data.observations ?? []).find((o: any) => o.value !== '.' && !isNaN(parseFloat(o.value)));
    if (!obs) return null;
    return { date: obs.date, value: parseFloat(obs.value) };
  } catch {
    return null;
  }
}

async function fetchWorldBank(indicator: string, countryCode = 'CN', mrv = 5): Promise<{ year: string; value: number } | null> {
  try {
    const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&mrv=${mrv}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const data = (await res.json()) as any[];
    const rows: any[] = data?.[1] ?? [];
    const latest = rows.find((r) => r.value !== null && r.value !== undefined);
    if (!latest) return null;
    return { year: String(latest.date), value: Number(latest.value) };
  } catch {
    return null;
  }
}

async function fetchIMFWEO(conceptCode: string, countryCode = 'CHN'): Promise<{ year: string; value: number } | null> {
  try {
    const url = `https://www.imf.org/external/datamapper/api/v1/${conceptCode}/${countryCode}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, any>;
    const values: Record<string, number> = data?.values?.[conceptCode]?.[countryCode] ?? {};
    const currentYear = new Date().getFullYear();
    for (let yr = currentYear; yr >= currentYear - 3; yr--) {
      if (values[String(yr)] !== undefined && values[String(yr)] !== null) {
        return { year: String(yr), value: values[String(yr)] };
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function ingestMacro(supabase: any, fredApiKey: string): Promise<number> {
  const now = new Date().toISOString();
  const upserts: any[] = [];
  const push = (metric_id: string, date: string, value: number, source_ref: string) => {
    const as_of_date = date.length === 4 ? `${date}-01-01` : date;
    upserts.push({ metric_id, as_of_date, value: Math.round(value * 10000) / 10000, last_updated_at: now, source_ref });
  };

  const gdp = await fetchIMFWEO('NGDP_RPCH');
  if (gdp) push('CN_GDP_GROWTH_YOY', gdp.year, gdp.value, 'live_api:imf_weo');

  const cpi = await fetchIMFWEO('PCPIPCH');
  if (cpi) push('CN_CPI_YOY', cpi.year, cpi.value, 'live_api:imf_weo');

  if (fredApiKey) {
    const cpiMonthly = await fetchFRED('CPALTT01CNM657N', fredApiKey, 6);
    if (cpiMonthly) push('CN_CPI_YOY', cpiMonthly.date, cpiMonthly.value, 'live_api:fred');

    const fxReserves = await fetchFRED('TRESEGCNM052N', fredApiKey, 3);
    if (fxReserves) {
      push('CN_FX_RESERVES', fxReserves.date, fxReserves.value, 'live_api:fred');
      push('CN_FX_RESERVES_TN', fxReserves.date, Math.round((fxReserves.value / 1_000_000) * 100) / 100, 'live_api:fred');
    }

    const lpr = await fetchFRED('IRSTCB01CNM156N', fredApiKey, 6);
    if (lpr) push('CN_POLICY_RATE', lpr.date, lpr.value, 'live_api:fred');
  }

  const ppi = await fetchWorldBank('FP.PPI.TOTL.ZG');
  if (ppi) push('CN_PPI_YOY', ppi.year, ppi.value, 'live_api:worldbank');

  const ip = await fetchWorldBank('NV.IND.MANF.KD.ZG');
  if (ip) push('CN_IP_YOY', ip.year, ip.value, 'live_api:worldbank');

  const retail = await fetchWorldBank('NE.CON.PRVT.KD.ZG');
  if (retail) push('CN_RETAIL_SALES_YOY', retail.year, retail.value, 'live_api:worldbank');

  if (upserts.length > 0) {
    const { error } = await supabase.from('metric_observations').upsert(upserts, { onConflict: 'metric_id, as_of_date' });
    if (error) throw error;
  }
  return upserts.length;
}

serveIngest('ingest-china-pulse', async (req: Request): Promise<IngestResult> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const fredApiKey = Deno.env.get('FRED_API_KEY') ?? '';

  const url = new URL(req.url);
  const section = (url.searchParams.get('section') ?? 'all').toLowerCase();

  let totalUpserted = 0;
  const processed: string[] = [];

  if (section === 'macro' || section === 'all') {
    totalUpserted += await ingestMacro(supabase, fredApiKey);
    processed.push('china_macro');
  }

  return {
    ok: true,
    counts: { upserted: totalUpserted },
    meta: { section, processed },
  };
});
