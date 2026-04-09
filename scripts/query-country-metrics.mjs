import { createClient } from '@supabase/supabase-js';

// Use the actual project URL and anon key from secrets
const url = 'https://ohefbbvldkoflrcjixow.supabase.co';
const anonKey = 'b290df1926bd4fe6280d82239a9e95d703cff39c34b7e48d492aa336bc5e3185';

const supabase = createClient(url, anonKey);

async function diagnose() {
  console.log('Diagnosing country_metrics data...\n');

  // 1. Check total count
  const { count, error: countErr } = await supabase
    .from('country_metrics')
    .select('*', { count: 'exact', head: true });

  console.log(`Total rows in country_metrics: ${count || 0}`);

  if (countErr) {
    console.error('Error counting:', countErr.message);
    return;
  }

  if (count === 0) {
    console.log('\n⚠️  WARNING: country_metrics table is EMPTY. Ingestion has not populated data yet.');
    console.log('Next steps:');
    console.log('  1. Check function logs: npx supabase functions logs ingest-country-metrics');
    console.log('  2. Manually invoke: curl -X POST https://debdriyzfcwvgrhzzzre.functions.supabase.co/ingest-country-metrics -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"');
    console.log('  3. Check if country_reserves table has data (needed for gold/fx):');
    const { count: reservesCount } = await supabase.from('country_reserves').select('*', { count: 'exact', head: true });
    console.log(`     country_reserves rows: ${reservesCount || 0}`);
    console.log('  4. Check if metric_observations has *_POLICY_RATE data:');
    const { count: policyCount } = await supabase.from('metric_observations').select('*', { count: 'exact', head: true }).ilike('metric_id', '%_POLICY_RATE');
    console.log(`     policy rate observations: ${policyCount || 0}`);
    return;
  }

  // 2. Check distinct countries
  const { data: isoData } = await supabase.from('country_metrics').select('iso').order('iso');
  const distinctIsos = new Set(isoData?.map(r => r.iso));
  console.log(`\nCountries with data: ${distinctIsos.size}/${40} (expected 40)`);
  const missing = ['US','GB','DE','FR','IT','JP','CA','AU','BR','AR','MX','CN','IN','KR','ID','SA','TR','RU','ZA','SG','CH','TH','MY','AE','QA','IL','CL','NL','ES','VN','PH','EG','NG','KW','NO','SE','PL','GR','IE'].filter(c => !distinctIsos.has(c));
  if (missing.length > 0) {
    console.log(`  Missing: ${missing.join(', ')}`);
  }

  // 3. Check metric coverage
  const { data: metricsData } = await supabase.from('country_metrics').select('metric_key, iso');
  const metricCounts = {};
  const byCountry = {};
  metricsData?.forEach(row => {
    metricCounts[row.metric_key] = (metricCounts[row.metric_key] || 0) + 1;
    if (!byCountry[row.iso]) byCountry[row.iso] = new Set();
    byCountry[row.iso].add(row.metric_key);
  });

  console.log('\nMetric coverage (countries with each metric):');
  Object.entries(metricCounts).sort((a,b) => b[1] - a[1]).forEach(([key, cnt]) => {
    const expected = ['central_bank_rate_pct','fx_reserves_bn','gold_reserves_tonnes','hh_debt_gdp_pct','military_exp_gdp_pct','usd_reserve_share_pct'].includes(key) ? '(new)' : '';
    console.log(`  ${key}: ${cnt} ${expected}`);
  });

  // 4. Check per-country completeness (should aim for 15+ metrics)
  console.log('\nCountries with < 10 metrics:');
  for (const [iso, metrics] of Object.entries(byCountry)) {
    if (metrics.size < 10) {
      console.log(`  ${iso}: ${metrics.size} metrics`);
    }
  }

  // 5. Sample US data
  console.log('\nSample US data (first 10 metrics):');
  const { data: usData } = await supabase.from('country_metrics').select('metric_key, value').eq('iso', 'US').limit(10);
  usData?.forEach(row => {
    console.log(`  ${row.metric_key}: ${row.value}`);
  });

  console.log('\n✅ Diagnostic complete.');
}

diagnose().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
