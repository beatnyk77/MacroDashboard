import { createClient } from '@supabase/supabase-js'
import { runIngestion, IngestionContext } from '@shared/logging.ts'

const COUNTRIES = [
  'US','GB','DE','FR','IT','JP','CA','AU','BR','AR','MX','CN','IN','KR','ID','SA','TR','RU','ZA',
  'SG','CH','TH','MY','AE','QA','IL','CL','NL','ES','VN','PH','EG','NG','KW','NO','SE','PL','GR','IE'
];

// GMD data snapshot — embedded to avoid external fetch (Global-Macro-Database 2024)
const GMD_DATA: Record<string, Record<string, number>> = {
  "US":{"population_mn":336.8,"cpi_yoy_pct":2.99,"unemployment_pct":4.08,"central_bank_rate_pct":4.38,"ca_gdp_pct":-3.25,"exports_gdp_pct":10.75,"imports_gdp_pct":13.82,"gov_debt_gdp_pct":121,"budget_deficit_gdp_pct":-7.63,"gdp_usd_bn":29167.78,"gdp_per_capita_usd":67317,"gdp_yoy_pct":2.76},
  "GB":{"population_mn":68.43,"cpi_yoy_pct":2.62,"unemployment_pct":4.28,"central_bank_rate_pct":4.75,"ca_gdp_pct":-2.79,"exports_gdp_pct":30.46,"imports_gdp_pct":31.33,"gov_debt_gdp_pct":101.82,"budget_deficit_gdp_pct":-4.25,"gdp_usd_bn":3589.69,"gdp_per_capita_usd":47793,"gdp_yoy_pct":1.08},
  "DE":{"population_mn":84.83,"cpi_yoy_pct":2.37,"unemployment_pct":3.35,"central_bank_rate_pct":3.81,"ca_gdp_pct":6.62,"exports_gdp_pct":42,"imports_gdp_pct":37.73,"gov_debt_gdp_pct":62.68,"budget_deficit_gdp_pct":-2,"gdp_usd_bn":4677.32,"gdp_per_capita_usd":43496,"gdp_yoy_pct":0.01},
  "FR":{"population_mn":66.11,"cpi_yoy_pct":2.31,"unemployment_pct":7.36,"central_bank_rate_pct":3.81,"ca_gdp_pct":0.09,"exports_gdp_pct":33.88,"imports_gdp_pct":34.6,"gov_debt_gdp_pct":112.32,"budget_deficit_gdp_pct":-5.96,"gdp_usd_bn":3152.06,"gdp_per_capita_usd":40850,"gdp_yoy_pct":1.1},
  "IT":{"population_mn":58.99,"cpi_yoy_pct":1.27,"unemployment_pct":7,"central_bank_rate_pct":3.81,"ca_gdp_pct":1.08,"exports_gdp_pct":33.29,"imports_gdp_pct":31.68,"gov_debt_gdp_pct":136.89,"budget_deficit_gdp_pct":-3.99,"gdp_usd_bn":2360.01,"gdp_per_capita_usd":34296,"gdp_yoy_pct":0.67},
  "JP":{"population_mn":123.86,"cpi_yoy_pct":2.23,"unemployment_pct":2.5,"central_bank_rate_pct":0.25,"ca_gdp_pct":3.78,"exports_gdp_pct":21.36,"imports_gdp_pct":22.93,"gov_debt_gdp_pct":251.15,"budget_deficit_gdp_pct":-6.09,"gdp_usd_bn":4030.4,"gdp_per_capita_usd":37414,"gdp_yoy_pct":0.32},
  "CA":{"population_mn":41.14,"cpi_yoy_pct":2.44,"unemployment_pct":6.18,"central_bank_rate_pct":3.25,"ca_gdp_pct":-0.96,"exports_gdp_pct":32.35,"imports_gdp_pct":32.8,"gov_debt_gdp_pct":106.08,"budget_deficit_gdp_pct":-1.98,"gdp_usd_bn":2203.99,"gdp_per_capita_usd":43913,"gdp_yoy_pct":1.34},
  "AU":{"population_mn":27.32,"cpi_yoy_pct":3.31,"unemployment_pct":4.15,"central_bank_rate_pct":4.35,"ca_gdp_pct":-0.88,"exports_gdp_pct":25.78,"imports_gdp_pct":22.66,"gov_debt_gdp_pct":49.33,"budget_deficit_gdp_pct":-1.66,"gdp_usd_bn":1797.68,"gdp_per_capita_usd":54981,"gdp_yoy_pct":1.23},
  "BR":{"population_mn":212.54,"cpi_yoy_pct":4.27,"unemployment_pct":7.16,"central_bank_rate_pct":12.25,"ca_gdp_pct":-1.75,"exports_gdp_pct":17.41,"imports_gdp_pct":15.2,"gov_debt_gdp_pct":87.57,"budget_deficit_gdp_pct":-6.93,"gdp_usd_bn":2155.91,"gdp_per_capita_usd":9442,"gdp_yoy_pct":3.04},
  "AR":{"population_mn":47.16,"cpi_yoy_pct":229.82,"unemployment_pct":8.15,"central_bank_rate_pct":32,"ca_gdp_pct":0.59,"exports_gdp_pct":4.74,"imports_gdp_pct":3.55,"gov_debt_gdp_pct":91.47,"budget_deficit_gdp_pct":-0.09,"gdp_usd_bn":674.82,"gdp_per_capita_usd":13051,"gdp_yoy_pct":-3.48},
  "MX":{"population_mn":132.27,"cpi_yoy_pct":4.68,"unemployment_pct":2.96,"central_bank_rate_pct":10,"ca_gdp_pct":-0.74,"exports_gdp_pct":33.24,"imports_gdp_pct":34.91,"gov_debt_gdp_pct":57.75,"budget_deficit_gdp_pct":-5.9,"gdp_usd_bn":1866.25,"gdp_per_capita_usd":10169,"gdp_yoy_pct":1.45},
  "CN":{"population_mn":1409.05,"cpi_yoy_pct":0.42,"unemployment_pct":5.1,"central_bank_rate_pct":3.1,"ca_gdp_pct":1.44,"exports_gdp_pct":20.52,"imports_gdp_pct":17.98,"gov_debt_gdp_pct":90.12,"budget_deficit_gdp_pct":-7.43,"gdp_usd_bn":18273.4,"gdp_per_capita_usd":12720,"gdp_yoy_pct":4.82},
  "IN":{"population_mn":1441.72,"cpi_yoy_pct":4.37,"central_bank_rate_pct":6.5,"ca_gdp_pct":-1.15,"exports_gdp_pct":20.55,"imports_gdp_pct":22.84,"gov_debt_gdp_pct":83.06,"budget_deficit_gdp_pct":-7.78,"gdp_usd_bn":3885.14,"gdp_per_capita_usd":2435,"gdp_yoy_pct":7.02},
  "KR":{"population_mn":51.75,"cpi_yoy_pct":2.52,"unemployment_pct":2.9,"central_bank_rate_pct":3,"ca_gdp_pct":3.85,"exports_gdp_pct":41.5,"imports_gdp_pct":43.58,"gov_debt_gdp_pct":52.88,"budget_deficit_gdp_pct":-0.53,"gdp_usd_bn":1857.34,"gdp_per_capita_usd":37099,"gdp_yoy_pct":2.49},
  "ID":{"population_mn":281.6,"cpi_yoy_pct":2.48,"unemployment_pct":5.2,"central_bank_rate_pct":6,"ca_gdp_pct":-1.05,"exports_gdp_pct":20.49,"imports_gdp_pct":19.8,"gov_debt_gdp_pct":40.51,"budget_deficit_gdp_pct":-2.66,"gdp_usd_bn":1417.42,"gdp_per_capita_usd":4389,"gdp_yoy_pct":4.96},
  "SA":{"population_mn":33.47,"cpi_yoy_pct":1.74,"central_bank_rate_pct":5.25,"ca_gdp_pct":0.39,"exports_gdp_pct":33.98,"imports_gdp_pct":28.28,"gov_debt_gdp_pct":28.31,"budget_deficit_gdp_pct":-3.03,"gdp_usd_bn":1100.71,"gdp_per_capita_usd":23531,"gdp_yoy_pct":1.53},
  "TR":{"population_mn":85.81,"cpi_yoy_pct":60.92,"unemployment_pct":9.26,"central_bank_rate_pct":47.5,"ca_gdp_pct":-2.16,"exports_gdp_pct":20.09,"imports_gdp_pct":20.98,"gov_debt_gdp_pct":25.23,"budget_deficit_gdp_pct":-5.19,"gdp_usd_bn":1331.24,"gdp_per_capita_usd":15023,"gdp_yoy_pct":3.01},
  "RU":{"population_mn":146.08,"cpi_yoy_pct":7.86,"unemployment_pct":2.6,"central_bank_rate_pct":21,"ca_gdp_pct":2.66,"exports_gdp_pct":21.24,"imports_gdp_pct":16.69,"gov_debt_gdp_pct":19.87,"budget_deficit_gdp_pct":-1.87,"gdp_usd_bn":2116.09,"gdp_per_capita_usd":10865,"gdp_yoy_pct":3.63},
  "ZA":{"population_mn":63.2,"cpi_yoy_pct":4.7,"unemployment_pct":33.68,"central_bank_rate_pct":7.75,"ca_gdp_pct":-1.65,"exports_gdp_pct":32.08,"imports_gdp_pct":31.82,"gov_debt_gdp_pct":74.98,"budget_deficit_gdp_pct":-6.23,"gdp_usd_bn":405.14,"gdp_per_capita_usd":5794,"gdp_yoy_pct":1.05},
  "SG":{"population_mn":5.94,"cpi_yoy_pct":2.58,"unemployment_pct":1.9,"ca_gdp_pct":17.76,"exports_gdp_pct":178.26,"imports_gdp_pct":140.12,"gov_debt_gdp_pct":175.19,"budget_deficit_gdp_pct":4.49,"gdp_usd_bn":530.12,"gdp_per_capita_usd":66874,"gdp_yoy_pct":2.6},
  "CH":{"population_mn":8.88,"cpi_yoy_pct":1.25,"unemployment_pct":2.36,"central_bank_rate_pct":0.5,"ca_gdp_pct":8.21,"exports_gdp_pct":74.17,"imports_gdp_pct":61.27,"gov_debt_gdp_pct":31.87,"budget_deficit_gdp_pct":0.6,"gdp_usd_bn":937.18,"gdp_per_capita_usd":91378,"gdp_yoy_pct":1.34},
  "TH":{"population_mn":70.27,"cpi_yoy_pct":0.53,"unemployment_pct":1.1,"central_bank_rate_pct":2.25,"ca_gdp_pct":1.78,"exports_gdp_pct":66.91,"imports_gdp_pct":64.93,"gov_debt_gdp_pct":65.01,"budget_deficit_gdp_pct":-2.43,"gdp_usd_bn":519.06,"gdp_per_capita_usd":6702,"gdp_yoy_pct":2.8},
  "MY":{"population_mn":33.46,"cpi_yoy_pct":2.8,"unemployment_pct":3.53,"central_bank_rate_pct":3,"ca_gdp_pct":2.63,"exports_gdp_pct":65.26,"imports_gdp_pct":62.99,"gov_debt_gdp_pct":68.38,"budget_deficit_gdp_pct":-3.59,"gdp_usd_bn":437.4,"gdp_per_capita_usd":12557,"gdp_yoy_pct":4.8},
  "AE":{"population_mn":11,"cpi_yoy_pct":2.3,"ca_gdp_pct":8.79,"exports_gdp_pct":106.69,"imports_gdp_pct":91.64,"gov_debt_gdp_pct":31.42,"budget_deficit_gdp_pct":4.8,"gdp_usd_bn":545.05,"gdp_per_capita_usd":42139,"gdp_yoy_pct":4.01},
  "QA":{"population_mn":3.09,"cpi_yoy_pct":1,"ca_gdp_pct":13.43,"exports_gdp_pct":61.63,"imports_gdp_pct":34.58,"gov_debt_gdp_pct":41.19,"budget_deficit_gdp_pct":1.98,"gdp_usd_bn":221.41,"gdp_per_capita_usd":56756,"gdp_yoy_pct":1.54},
  "IL":{"population_mn":9.94,"cpi_yoy_pct":3.08,"unemployment_pct":3.1,"central_bank_rate_pct":4.5,"ca_gdp_pct":3.37,"exports_gdp_pct":27.59,"imports_gdp_pct":25.83,"gov_debt_gdp_pct":67.99,"budget_deficit_gdp_pct":-9.04,"gdp_usd_bn":529.79,"gdp_per_capita_usd":42348,"gdp_yoy_pct":0.71},
  "CL":{"population_mn":20.09,"cpi_yoy_pct":3.9,"unemployment_pct":8.48,"central_bank_rate_pct":5,"ca_gdp_pct":-2.27,"exports_gdp_pct":29.91,"imports_gdp_pct":27.88,"gov_debt_gdp_pct":41,"budget_deficit_gdp_pct":-2.32,"gdp_usd_bn":323.7,"gdp_per_capita_usd":14267,"gdp_yoy_pct":2.46},
  "NL":{"population_mn":17.92,"cpi_yoy_pct":3.17,"unemployment_pct":3.9,"central_bank_rate_pct":3.81,"ca_gdp_pct":10,"exports_gdp_pct":84.91,"imports_gdp_pct":74.24,"gov_debt_gdp_pct":44.26,"budget_deficit_gdp_pct":-1.55,"gdp_usd_bn":1209.94,"gdp_per_capita_usd":51461,"gdp_yoy_pct":0.63},
  "ES":{"population_mn":48.38,"cpi_yoy_pct":2.75,"unemployment_pct":11.62,"central_bank_rate_pct":3.81,"ca_gdp_pct":3.36,"exports_gdp_pct":37.22,"imports_gdp_pct":32.64,"gov_debt_gdp_pct":102.31,"budget_deficit_gdp_pct":-2.95,"gdp_usd_bn":1719.44,"gdp_per_capita_usd":29360,"gdp_yoy_pct":2.91},
  "VN":{"population_mn":100.77,"cpi_yoy_pct":4.14,"unemployment_pct":2.06,"ca_gdp_pct":2.99,"exports_gdp_pct":83.23,"imports_gdp_pct":77.84,"gov_debt_gdp_pct":33.81,"budget_deficit_gdp_pct":-2.58,"gdp_usd_bn":11283.14,"gdp_per_capita_usd":111969.26,"gdp_yoy_pct":6.06},
  "PH":{"population_mn":113.17,"cpi_yoy_pct":3.33,"unemployment_pct":4.37,"central_bank_rate_pct":5.75,"ca_gdp_pct":-2.21,"exports_gdp_pct":24.06,"imports_gdp_pct":39.6,"gov_debt_gdp_pct":57.6,"budget_deficit_gdp_pct":-3.87,"gdp_usd_bn":461.87,"gdp_per_capita_usd":4018,"gdp_yoy_pct":5.75},
  "EG":{"population_mn":107.3,"cpi_yoy_pct":33.3,"unemployment_pct":7.23,"ca_gdp_pct":-6.56,"exports_gdp_pct":13.11,"imports_gdp_pct":17.19,"gov_debt_gdp_pct":90.86,"budget_deficit_gdp_pct":-10.14,"gdp_usd_bn":13831.36,"gdp_per_capita_usd":128899,"gdp_yoy_pct":2.67},
  "NG":{"population_mn":227.71,"cpi_yoy_pct":32.46,"ca_gdp_pct":-0.54,"gov_debt_gdp_pct":51.28,"budget_deficit_gdp_pct":-4.55,"gdp_usd_bn":302180.62,"gdp_per_capita_usd":1327024,"gdp_yoy_pct":2.86},
  "KW":{"population_mn":5.01,"cpi_yoy_pct":3,"ca_gdp_pct":28.24,"gov_debt_gdp_pct":7.23,"budget_deficit_gdp_pct":25.56,"gdp_usd_bn":162.12,"gdp_per_capita_usd":22742,"gdp_yoy_pct":-2.72},
  "NO":{"population_mn":5.57,"cpi_yoy_pct":3.26,"unemployment_pct":4.28,"central_bank_rate_pct":4.5,"ca_gdp_pct":14.52,"exports_gdp_pct":46.58,"imports_gdp_pct":31.42,"gov_debt_gdp_pct":42.72,"budget_deficit_gdp_pct":11.98,"gdp_usd_bn":499.3,"gdp_per_capita_usd":79336,"gdp_yoy_pct":1.55},
  "SE":{"population_mn":10.65,"cpi_yoy_pct":2.05,"unemployment_pct":8.51,"central_bank_rate_pct":2.75,"ca_gdp_pct":6.63,"exports_gdp_pct":54.58,"imports_gdp_pct":49.86,"gov_debt_gdp_pct":36.41,"budget_deficit_gdp_pct":-1.17,"gdp_usd_bn":607.36,"gdp_per_capita_usd":54459,"gdp_yoy_pct":0.9},
  "PL":{"population_mn":36.62,"cpi_yoy_pct":3.86,"unemployment_pct":3.16,"central_bank_rate_pct":5.75,"ca_gdp_pct":0.85,"exports_gdp_pct":55.12,"imports_gdp_pct":50.8,"gov_debt_gdp_pct":55.53,"budget_deficit_gdp_pct":-5.66,"gdp_usd_bn":914.9,"gdp_per_capita_usd":17795,"gdp_yoy_pct":2.96},
  "GR":{"population_mn":10.38,"cpi_yoy_pct":2.91,"unemployment_pct":10.52,"central_bank_rate_pct":3.81,"ca_gdp_pct":-6.52,"exports_gdp_pct":43.15,"imports_gdp_pct":47.24,"gov_debt_gdp_pct":159.01,"budget_deficit_gdp_pct":-1.01,"gdp_usd_bn":250.98,"gdp_per_capita_usd":21243,"gdp_yoy_pct":2.28},
  "IE":{"population_mn":5.42,"cpi_yoy_pct":1.66,"unemployment_pct":4.41,"central_bank_rate_pct":3.81,"ca_gdp_pct":11.99,"exports_gdp_pct":147.27,"imports_gdp_pct":108.36,"gov_debt_gdp_pct":42.36,"budget_deficit_gdp_pct":3.76,"gdp_usd_bn":556.67,"gdp_per_capita_usd":89594,"gdp_yoy_pct":-0.18}
};
const GMD_SNAPSHOT_YEAR = 2024;

// ---------------------------------------------------------------------------
// FRED + reserves ingest (existing daily path)
// ---------------------------------------------------------------------------
async function ingestFREDMetrics(ctx: IngestionContext) {
  const { supabase } = ctx;
  const timestamp = new Date().toISOString();
  const batchRows: any[] = [];

  console.log(`[ingest-country-metrics] FRED real-time ETL for ${COUNTRIES.length} countries`);

  // 1. FX/Gold from country_reserves
  const { data: reserves } = await supabase
    .from('country_reserves')
    .select('country_code, fx_reserves_usd, gold_tonnes, usd_share_pct, as_of_date')
    .in('country_code', COUNTRIES)
    .order('as_of_date', { ascending: false });

  if (reserves) {
    const latestByCountry: Record<string, any> = {};
    for (const row of reserves) {
      if (!latestByCountry[row.country_code]) latestByCountry[row.country_code] = row;
    }
    for (const iso of COUNTRIES) {
      const r = latestByCountry[iso];
      if (!r) continue;
      if (r.gold_tonnes) {
        batchRows.push({
          iso, metric_key: 'gold_reserves_tonnes', value: r.gold_tonnes,
          as_of: r.as_of_date, source: 'WGC/IMF', confidence: 0.9, last_cron: timestamp
        });
      }
      if (r.fx_reserves_usd) {
        batchRows.push({
          iso, metric_key: 'fx_reserves_bn', value: r.fx_reserves_usd / 1e9,
          as_of: r.as_of_date, source: 'IMF', confidence: 0.9, last_cron: timestamp
        });
      }
      if (r.usd_share_pct) {
        batchRows.push({
          iso, metric_key: 'usd_reserve_share_pct', value: r.usd_share_pct,
          as_of: r.as_of_date, source: 'IMF COFER', confidence: 0.9, last_cron: timestamp
        });
      }
    }
  }

  // 2. Policy rates from metric_observations
  const { data: policyRates } = await supabase
    .from('metric_observations')
    .select('metric_id, value, as_of_date')
    .like('metric_id', '%_POLICY_RATE')
    .order('as_of_date', { ascending: false })
    .limit(200);

  if (policyRates) {
    const latestPolicyByMetric: Record<string, any> = {};
    for (const row of policyRates) {
      if (!latestPolicyByMetric[row.metric_id]) latestPolicyByMetric[row.metric_id] = row;
    }
    for (const iso of COUNTRIES) {
      const metricId = `${iso}_POLICY_RATE`;
      const row = latestPolicyByMetric[metricId];
      if (row) {
        batchRows.push({
          iso, metric_key: 'central_bank_rate_pct', value: row.value,
          as_of: row.as_of_date, source: 'Central Bank', confidence: 0.9, last_cron: timestamp
        });
      }
    }
  }

  // 3. Yield data from metric_observations
  const yield2Map: Record<string, string> = {
    US: 'DGS2', CN: 'INTDSRCNM024N', DE: 'IRLTLT02DEM156N', FR: 'IRLTLT02FRM156N',
    GB: 'IRLTLT02GBM156N', JP: 'IRLTLT02JPM156N', CA: 'IRLTLT02CAM156N', AU: 'IRLTLT02AUM156N',
    IN: 'INTDSRINM024N', KR: 'IRLTLT02KRM156N', BR: 'IRLTLT02BRM156N', MX: 'IRLTLT02MXM156N',
    RU: 'IRLTLT02RUM156N',
  };
  const yield10Map: Record<string, string> = {
    US: 'DGS10', CN: 'INTDSRCNM193N', DE: 'IRLTLT03DEM156N', FR: 'IRLTLT03FRM156N',
    GB: 'IRLTLT03GBM156N', JP: 'IRLTLT03JPM156N', CA: 'IRLTLT03CAM156N', AU: 'IRLTLT03AUM156N',
    IN: 'INTDSRINM193N', KR: 'IRLTLT03KRM156N', BR: 'IRLTLT03BRM156N', MX: 'IRLTLT03MXM156N',
    RU: 'IRLTLT03RUM156N',
  };

  const { data: yieldData } = await supabase
    .from('metric_observations')
    .select('metric_id, value, as_of_date')
    .in('metric_id', [...Object.values(yield2Map), ...Object.values(yield10Map)])
    .order('as_of_date', { ascending: false });

  if (yieldData) {
    const latestByMetric: Record<string, any> = {};
    for (const row of yieldData) {
      if (!latestByMetric[row.metric_id]) latestByMetric[row.metric_id] = row;
    }
    for (const iso of COUNTRIES) {
      const y2id = yield2Map[iso];
      const y10id = yield10Map[iso];
      if (y2id && latestByMetric[y2id]) {
        batchRows.push({
          iso, metric_key: 'yield_2y_pct', value: latestByMetric[y2id].value,
          as_of: latestByMetric[y2id].as_of_date, source: 'FRED', confidence: 0.9, last_cron: timestamp
        });
      }
      if (y10id && latestByMetric[y10id]) {
        batchRows.push({
          iso, metric_key: 'yield_10y_pct', value: latestByMetric[y10id].value,
          as_of: latestByMetric[y10id].as_of_date, source: 'FRED', confidence: 0.9, last_cron: timestamp
        });
      }
    }
  }

  // 4. Derived: yield slope
  const valuesByIso: Record<string, Record<string, number>> = {};
  for (const row of batchRows) {
    if (!valuesByIso[row.iso]) valuesByIso[row.iso] = {};
    valuesByIso[row.iso][row.metric_key] = row.value;
  }
  for (const iso of COUNTRIES) {
    const vals = valuesByIso[iso] || {};
    if (typeof vals['yield_10y_pct'] === 'number' && typeof vals['yield_2y_pct'] === 'number') {
      const slope = (vals['yield_10y_pct'] - vals['yield_2y_pct']) * 100;
      if (!isNaN(slope)) {
        batchRows.push({
          iso, metric_key: 'yield_slope_2s10s', value: slope,
          as_of: timestamp.split('T')[0], source: 'Derived', confidence: 0.9, last_cron: timestamp
        });
      }
    }
  }

  if (batchRows.length > 0) {
    console.log(`[ingest-country-metrics] Upserting ${batchRows.length} rows`);
    const { error } = await supabase.from('country_metrics').upsert(batchRows, { onConflict: 'iso, metric_key' });
    if (error) throw error;
  } else {
    console.log('[ingest-country-metrics] No rows to upsert');
  }

  return { rows_inserted: batchRows.length, metadata: { timestamp } };
}

// ---------------------------------------------------------------------------
// GMD supplement ingest (quarterly path)
// ---------------------------------------------------------------------------
async function ingestGMDSupplement(ctx: IngestionContext) {
  const { supabase } = ctx;
  const timestamp = new Date().toISOString();
  const batchRows: any[] = [];
  const year = GMD_SNAPSHOT_YEAR;

  for (const iso of COUNTRIES) {
    const metrics = GMD_DATA[iso];
    if (!metrics) continue;

    for (const [metricKey, value] of Object.entries(metrics)) {
      if (value != null && typeof value === 'number') {
        batchRows.push({
          iso,
          metric_key: metricKey,
          value,
          as_of: `${year}-12-31`,
          source: 'GMD',
          confidence: 0.95,
          last_cron: timestamp,
          metadata: JSON.stringify({ gmd_release: '2026_03', gmd_year: year })
        });
      }
    }
  }

  if (batchRows.length > 0) {
    const { error } = await supabase
      .from('country_metrics')
      .upsert(batchRows, { onConflict: 'iso, metric_key' });
    if (error) throw error;
    console.log(`[ingest-country-gmd] Upserted ${batchRows.length} rows for ${year}`);
  } else {
    console.warn('[ingest-country-gmd] No rows to upsert');
  }

  return { rows_inserted: batchRows.length, metadata: { timestamp, year, source: 'GMD' } };
}

// ---------------------------------------------------------------------------
// Main entry: route by query param ?supplement=gmd
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  const url = new URL(req.url);
  let supplement = url.searchParams.get('supplement');

  // Also check body for supplement flag (helpful for CLI invocation)
  if (!supplement && req.method === 'POST') {
    try {
      const body = await req.clone().json();
      supplement = body.supplement;
    } catch {
      // Ignore if not JSON
    }
  }

  const isGMD = supplement === 'gmd';

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const client = createClient(supabaseUrl, supabaseKey);

  const functionName = isGMD ? 'ingest-country-gmd-supplement' : 'ingest-country-metrics';
  const ingestFn = isGMD ? ingestGMDSupplement : ingestFREDMetrics;

  return await runIngestion(client, functionName, ingestFn);
});
