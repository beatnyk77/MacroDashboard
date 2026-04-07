import { createClient } from '@supabase/supabase-js';

// Known project URL and anon key from earlier secrets
const url = 'https://ohefbbvldkoflrcjixow.supabase.co';
const anonKey = 'b290df1926bd4fe6280d82239a9e95d703cff39c34b7e48d492aa336bc5e3185';

const supabase = createClient(url, anonKey);

async function checkData() {
  console.log('Checking country_metrics data...\n');

  // Count total rows
  const { count, error: countErr } = await supabase
    .from('country_metrics')
    .select('*', { count: 'exact', head: true });

  console.log(`Total rows in country_metrics: ${count || 0}`);

  if (countErr) {
    console.error('Error counting:', countErr);
    return;
  }

  // Check distinct countries
  const { data: countriesData, error: countriesErr } = await supabase
    .from('country_metrics')
    .select('iso')
    .order('iso');

  const distinctIsos = new Set(countriesData?.map(r => r.iso));
  console.log(`Distinct countries with data: ${distinctIsos.size}`);
  console.log('Countries:', Array.from(distinctIsos).sort().join(', '));

  // Check metric coverage
  const { data: metricsData, error: metricsErr } = await supabase
    .from('country_metrics')
    .select('metric_key, iso, value');

  const metricCounts = {};
  const byCountry = {};

  metricsData?.forEach(row => {
    metricCounts[row.metric_key] = (metricCounts[row.metric_key] || 0) + 1;
    if (!byCountry[row.iso]) byCountry[row.iso] = new Set();
    byCountry[row.iso].add(row.metric_key);
  });

  console.log('\nMetric coverage (number of countries with each metric):');
  Object.entries(metricCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([key, cnt]) => {
      console.log(`  ${key}: ${cnt} countries`);
    });

  // Show example for US
  console.log('\nSample data for US:');
  const { data: usData } = await supabase
    .from('country_metrics')
    .select('metric_key, value, as_of')
    .eq('iso', 'US')
    .order('metric_key');

  usData?.forEach(row => {
    console.log(`  ${row.metric_key}: ${row.value} (as of ${row.as_of})`);
  });

  // Check if any has 0 metrics
  for (const iso of distinctIsos) {
    const count = byCountry[iso]?.size || 0;
    if (count < 10) {
      console.log(`\n⚠️  ${iso} only has ${count} metrics`);
    }
  }
}

checkData().catch(console.error);
