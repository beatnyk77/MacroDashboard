import { createClient } from '@supabase/supabase-js'
import { runIngestion, IngestionContext } from '@shared/logging.ts'
import { fetchWithRetry } from '@shared/ingest_utils.ts'

const COUNTRIES = [
  // G7
  'US','GB','DE','FR','IT','JP','CA',
  // G20 / Large EMs
  'AU','BR','AR','MX','CN','IN','KR','ID','SA','TR','RU','ZA',
  // Key Others
  'SG','CH','TH','MY','AE','QA','IL','CL','NL','ES','VN','PH','EG','NG','KW','NO','SE','PL','GR','IE'
];

interface MetricConfig {
  source: 'IMF' | 'WB';
  indicator: string;
}

const METRIC_CONFIG: Record<string, MetricConfig> = {
  'gdp_yoy_pct': { source: 'IMF', indicator: 'NGDP_RPCH' },
  'cpi_yoy_pct': { source: 'IMF', indicator: 'PCPIPCH' },
  'unemployment_pct': { source: 'IMF', indicator: 'LUR' },
  'debt_gdp_pct': { source: 'IMF', indicator: 'GGXWDG_NGDP' },
  'ca_gdp_pct': { source: 'IMF', indicator: 'BCA_NGDPD' },
  'population_mn': { source: 'WB', indicator: 'SP.POP.TOTL' },
  'military_exp_gdp_pct': { source: 'WB', indicator: 'MS.MIL.XPND.GD.ZS' },
  'energy_import_pct': { source: 'WB', indicator: 'EG.IMP.CONS.ZS' },
};

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
  const batchResults: any[] = [];
  let processed = 0;

  console.log(`[HARDENING_v3] Processing ${COUNTRIES.length} countries...`);

  // World Bank Loop
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
              const val = parseFloat(String(observation.value));
              if (!isNaN(val)) {
                batchResults.push({
                  iso,
                  metric_key: key,
                  value: key === 'population_mn' ? (val / 1_000_000) : val,
                  as_of: `${observation.date}-12-31`,
                  source: 'World Bank',
                  confidence: 0.9,
                  last_cron: timestamp
                });
                processed++;
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
            const years = Object.keys(values).sort().reverse();
            if (years.length > 0) {
              const val = parseFloat(String(values[years[0]]));
              if (!isNaN(val)) {
                batchResults.push({
                  iso,
                  metric_key: key,
                  value: val,
                  as_of: `${years[0]}-12-31`,
                  source: 'IMF',
                  confidence: 0.85,
                  last_cron: timestamp
                });
                processed++;
              }
            }
          }
        } catch (e: any) {
          console.warn(`[IMF] ${iso}/${key} failed: ${e.message}`);
        }
      }
    }
  }

  if (batchResults.length > 0) {
    console.log(`[HARDENING_v3] Finalizing upsert for ${batchResults.length} records...`);
    const { error } = await supabase
      .from('country_metrics')
      .upsert(batchResults, { onConflict: 'iso, metric_key' });
    
    if (error) throw error;
  }

  return {
    rows_inserted: batchResults.length,
    status_code: 200,
    metadata: {
      countries_covered: COUNTRIES.length,
      metrics_covered: Object.keys(METRIC_CONFIG).length,
      timestamp
    }
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
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const client = createClient(supabaseUrl, supabaseKey);

  return await runIngestion(client, 'ingest-country-metrics', ingestCountryMetrics);
});
