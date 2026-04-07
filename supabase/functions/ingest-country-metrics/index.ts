import { createClient } from '@supabase/supabase-js'
import { runIngestion, IngestionContext } from '@shared/logging.ts'
import { fetchWithRetry } from '@shared/ingest_utils.ts'

const COUNTRIES = [
  // G7
  'US','GB','DE','FR','IT','JP','CA',
  // G20 / Large EMs
  'AU','BR','AR','MX','CN','IN','KR','ID','SA','TR','RU','ZA',
  // Key Others (EMs & strategic)
  'SG','CH','TH','MY','AE','QA','IL','CL','NL','ES','VN','PH','EG','NG','KW','NO','SE','PL','GR','IE'
];

// IMF & World Bank metric configuration
interface MetricConfig {
  source: 'IMF' | 'WB';
  indicator: string;
  transform?: (val: number) => number;
}

// Only include metrics we want to fetch directly via these APIs
const METRIC_CONFIG: Record<string, MetricConfig> = {
  // IMF DataMapper indicators
  'gdp_yoy_pct': { source: 'IMF', indicator: 'NGDP_RPCH' },
  'cpi_yoy_pct': { source: 'IMF', indicator: 'PCPIPCH' },
  'unemployment_pct': { source: 'IMF', indicator: 'LUR' },
  'debt_gdp_pct': { source: 'IMF', indicator: 'GGXWDG_NGDP' },
  'ca_gdp_pct': { source: 'IMF', indicator: 'BCA_NGDPD' },
  'gdp_usd_bn': { source: 'IMF', indicator: 'NGDPD' },
  'fiscal_balance_gdp_pct': { source: 'IMF', indicator: 'GGXONL_NGDP' },

  // World Bank indicators
  'population_mn': { source: 'WB', indicator: 'SP.POP.TOTL', transform: v => v / 1_000_000 },
  'area_sq_km': { source: 'WB', indicator: 'AG.SRF.TOTL.K2' },
  'ext_debt_gdp_pct': { source: 'WB', indicator: 'DT.TDS.DECT.EX.ZS' },
  'energy_import_pct': { source: 'WB', indicator: 'EG.IMP.CONS.ZS' },
};

// FRED series mapping per metric and ISO
// Series values often in Millions USD or percent; unit conversions applied at insert.
const FRED_SERIES_MAP: Record<string, Record<string, string>> = {
  fx_reserves_bn: {
    // G7 (complete)
    US: 'TRESEGUSM052N',
    GB: 'TRESEGGBM052N',
    DE: 'TRESEGDEM052N',
    FR: 'TRESEGFRM052N',
    IT: 'TRESEGITM052N',
    JP: 'TRESEGJPM052N',
    CA: 'TRESEGCAM052N',
    // G20 / Large EMs (expanded)
    AU: 'TRESEGAUM052N',
    BR: 'TRESEGBRM052N',
    CN: 'TRESEGCNM052N',
    IN: 'TRESEGINM052N', // Verified in india-telemetry.ts
    KR: 'TRESEGKRM052N',
    RU: 'TRESEGRUM052N',
    MX: 'TRESEGMXM052N', // Mexico (exists per IFS)
    AR: 'TRESEGARM052N', // Argentina
    ZA: 'TRESEGZAM052N', // South Africa
    SA: 'TRESEGSAM052N', // Saudi Arabia
    TR: 'TRESEGTRM052N', // Turkey
    ID: 'TRESEGIDM052N', // Indonesia
    // Additional EMs & Strategic
    ES: 'TRESEGESM052N', // Spain (Eurozone but distinct IFS reporter)
    NL: 'TRESEGNLM052N', // Netherlands
    SE: 'TRESEGSEM052N', // Sweden
    NO: 'TRESEGNOM052N', // Norway
    PL: 'TRESEGPLM052N', // Poland
    CH: 'TRESEGCHM052N', // Switzerland
    TH: 'TRESEGTHM052N', // Thailand
    MY: 'TRESEGMYM052N', // Malaysia
    SG: 'TRESEGSGM052N', // Singapore
    IL: 'TRESEGILM052N', // Israel
    CL: 'TRESEGCLM052N', // Chile
    EG: 'TRESEGEGM052N', // Egypt
    PH: 'TRESEGPHM052N', // Philippines
    VN: 'TRESEGVNM052N', // Vietnam
    AE: 'TRESEGAEM052N', // UAE (reports as AE)
    QA: 'TRESEGQAM052N', // Qatar
    KW: 'TRESEGKWM052N', // Kuwait
    NG: 'TRESEGNGM052N', // Nigeria
    GR: 'TRESEGGRM052N', // Greece
    IE: 'TRESEGIEM052N', // Ireland
  },
  yield_2y_pct: {
    // US is complete
    US: 'DGS2',
    // China IFS 2Y
    CN: 'INTDSRCNM024N',
    // Euro area yields - use Germany as proxy for EA 2Y
    DE: 'IRLTLT02DEM156N',
    FR: 'IRLTLT02FRM156N',
    ES: 'IRLTLT02ESM156N',
    // UK 2Y Gilts
    GB: 'IRLTLT02GBM156N',
    // Japan 2Y
    JP: 'IRLTLT02JPM156N',
    // Canada 2Y
    CA: 'IRLTLT02CAM156N',
    // Australia 2Y
    AU: 'IRLTLT02AUM156N',
    // India 2Y (IFS)
    IN: 'INTDSRINM024N',
    // Korea 2Y
    KR: 'IRLTLT02KRM156N',
    // Brazil 2Y (if available in IFS)
    BR: 'IRLTLT02BRM156N',
    // Mexico 2Y
    MX: 'IRLTLT02MXM156N',
    // Russia 2Y (if available)
    RU: 'IRLTLT02RUM156N',
  },
  yield_10y_pct: {
    // US is complete
    US: 'DGS10',
    // China IFS 10Y
    CN: 'INTDSRCNM193N',
    // Euro area yields - use Germany as proxy for EA 10Y
    DE: 'IRLTLT03DEM156N',
    FR: 'IRLTLT03FRM156N',
    ES: 'IRLTLT03ESM156N',
    // UK 10Y Gilts
    GB: 'IRLTLT03GBM156N',
    // Japan 10Y
    JP: 'IRLTLT03JPM156N',
    // Canada 10Y
    CA: 'IRLTLT03CAM156N',
    // Australia 10Y
    AU: 'IRLTLT03AUM156N',
    // India 10Y (IFS)
    IN: 'INTDSRINM193N',
    // Korea 10Y
    KR: 'IRLTLT03KRM156N',
    // Brazil 10Y
    BR: 'IRLTLT03BRM156N',
    // Mexico 10Y
    MX: 'IRLTLT03MXM156N',
    // Russia 10Y
    RU: 'IRLTLT03RUM156N',
  },
};

// Derived metrics config (computed after direct fetch)
const DERIVED_METRICS = [
  {
    key: 'yield_slope_2s10s',
    compute: (values: Record<string, number>) => (values['yield_10y_pct'] - values['yield_2y_pct']) * 100, // bps
    requires: ['yield_2y_pct', 'yield_10y_pct']
  }
];

interface IMFResponse {
  values?: {
    [indicator: string]: {
      [iso: string]: {
        [year: string]: string | number;
      }
    }
  }
}

type WBResponse = [
  { page: number; pages: number; per_page: number; total: number },
  Array<{
    indicator: { id: string; value: string };
    country: { id: string; value: string };
    countryiso3code: string;
    date: string;
    value: number | null;
    unit: string;
    obs_status: string;
    decimal: number;
  }>
] | { message: any[] };

async function ingestCountryMetrics(ctx: IngestionContext) {
  const { supabase } = ctx;
  const timestamp = new Date().toISOString();
  const batchRows: any[] = [];
  let totalFetched = 0;

  console.log(`[ingest-country-metrics] Starting for ${COUNTRIES.length} countries`);

  // --- 1. Fetch IMF & WB metrics ---
  for (const [key, config] of Object.entries(METRIC_CONFIG)) {
    if (config.source === 'WB') {
      for (const iso of COUNTRIES) {
        try {
          const url = `https://api.worldbank.org/v2/country/${iso}/indicator/${config.indicator}?format=json&per_page=1`;
          const res = await fetchWithRetry(url, { timeoutMs: 10000 });
          const rawData = await res.json() as WBResponse;

          if (Array.isArray(rawData) && rawData.length >= 2) {
            const observation = rawData[1]?.[0];
            if (observation && observation.value !== null) {
              let val = parseFloat(String(observation.value));
              if (!isNaN(val)) {
                if (config.transform) {
                  val = config.transform(val);
                }
                batchRows.push({
                  iso,
                  metric_key: key,
                  value: val,
                  as_of: `${observation.date}-12-31`,
                  source: 'World Bank',
                  confidence: 0.9,
                  last_cron: timestamp
                });
                totalFetched++;
              }
            }
          }
        } catch (e: any) {
          console.warn(`[WB] ${iso}/${key} failed: ${e.message}`);
        }
      }
    } else if (config.source === 'IMF') {
      for (const iso of COUNTRIES) {
        try {
          const url = `https://www.imf.org/external/datamapper/api/v1/${config.indicator}/${iso}`;
          const res = await fetchWithRetry(url, { timeoutMs: 10000 });
          const rawData = await res.json() as IMFResponse;

          const values = rawData?.values?.[config.indicator]?.[iso];
          if (values) {
            const years = Object.keys(values).sort((a, b) => parseInt(b) - parseInt(a));
            if (years.length > 0) {
              let val = parseFloat(String(values[years[0]]));
              if (!isNaN(val)) {
                if (config.transform) {
                  val = config.transform(val);
                }
                batchRows.push({
                  iso,
                  metric_key: key,
                  value: val,
                  as_of: `${years[0]}-12-31`,
                  source: 'IMF',
                  confidence: 0.9,
                  last_cron: timestamp
                });
                totalFetched++;
              }
            }
          }
        } catch (e: any) {
          console.warn(`[IMF] ${iso}/${key} failed: ${e.message}`);
        }
      }
    }
  }

  // --- 2. Fetch FRED-sourced metrics ---
  const fredApiKey = Deno.env.get('FRED_API_KEY');
  if (!fredApiKey) {
    console.warn('FRED_API_KEY not set; skipping FRED-sourced metrics');
  } else {
    const FRED_BATCH_SIZE = 10;
    let fredReqCount = 0;
    for (const [metricKey, seriesMap] of Object.entries(FRED_SERIES_MAP)) {
      for (const iso of COUNTRIES) {
        const seriesId = seriesMap[iso];
        if (!seriesId) continue; // No FRED coverage for this country
        try {
          const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=1`;
          const res = await fetchWithRetry(url, { timeoutMs: 10000 });
          const data = await res.json() as any;
          const obs = data.observations?.[0];
          if (obs && obs.value && !isNaN(parseFloat(obs.value))) {
            let val = parseFloat(obs.value);
            // Unit conversions
            if (metricKey === 'fx_reserves_bn') {
              // FRED series typically in Millions USD; convert to Billions
              val = val / 1000;
            }
            batchRows.push({
              iso,
              metric_key: metricKey,
              value: val,
              as_of: obs.date,
              source: 'FRED',
              confidence: 0.9,
              last_cron: timestamp
            });
            totalFetched++;
          }
        } catch (e: any) {
          console.warn(`[FRED] ${iso}/${metricKey} (${seriesId}) failed: ${e.message}`);
        }

        // Rate limiting: pause after every batch to respect ~50 req/min limit
        if (++fredReqCount % FRED_BATCH_SIZE === 0) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
  }

  // --- 3. Derived metrics (slope) ---
  // Group direct values by iso for slope computation
  const valuesByIso: Record<string, Record<string, number>> = {};
  for (const row of batchRows) {
    if (!valuesByIso[row.iso]) valuesByIso[row.iso] = {};
    valuesByIso[row.iso][row.metric_key] = row.value;
  }

  for (const iso of COUNTRIES) {
    const vals = valuesByIso[iso] || {};
    // Compute slope if both yields exist
    if (typeof vals['yield_2y_pct'] === 'number' && typeof vals['yield_10y_pct'] === 'number') {
      const slope = (vals['yield_10y_pct'] - vals['yield_2y_pct']) * 100; // to bps
      if (!isNaN(slope)) {
        batchRows.push({
          iso,
          metric_key: 'yield_slope_2s10s',
          value: slope,
          as_of: timestamp.split('T')[0],
          source: 'Derived',
          confidence: 0.9,
          last_cron: timestamp
        });
        totalFetched++;
      }
    }
  }

  // --- 4. Bulk upsert ---
  if (batchRows.length > 0) {
    console.log(`[ingest-country-metrics] Upserting ${batchRows.length} rows`);
    const { error } = await supabase
      .from('country_metrics')
      .upsert(batchRows, { onConflict: 'iso, metric_key' });

    if (error) throw error;
  } else {
    console.log('[ingest-country-metrics] No rows to upsert');
  }

  return {
    rows_upserted: batchRows.length,
    countries_covered: COUNTRIES.length,
    timestamp
  };
}

Deno.serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const client = createClient(supabaseUrl, supabaseKey);

  return await runIngestion(client, 'ingest-country-metrics', ingestCountryMetrics);
});
