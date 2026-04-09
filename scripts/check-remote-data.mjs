import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS
const url = 'https://debdriyzfcwvgrhzzzre.supabase.co';
const serviceKey = 'fe95bc684b136a455cb3ae290e273510317e0404e07de14b17f818857faae38e';

const supabase = createClient(url, serviceKey);

async function check() {
  console.log('Checking country_metrics via service role...\n');

  const { count, error: countErr } = await supabase
    .from('country_metrics')
    .select('*', { count: 'exact', head: true });

  console.log(`Total rows: ${count || 0}`);

  if (countErr) {
    console.error('Error:', countErr.message);
    return;
  }

  // Show metric distribution
  const { data: metrics } = await supabase
    .from('country_metrics')
    .select('metric_key, iso');

  const byMetric = {};
  const byIso = {};
  metrics?.forEach(r => {
    byMetric[r.metric_key] = (byMetric[r.metric_key] || 0) + 1;
    if (!byIso[r.iso]) byIso[r.iso] = new Set();
    byIso[r.iso].add(r.metric_key);
  });

  console.log('\nMetric counts:');
  Object.entries(byMetric).sort((a,b) => b[1] - a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

  const isoList = Object.keys(byIso).sort();
  console.log(`\nCountries with data (${isoList.length}/40): ${isoList.join(', ')}`);

  // show countries with few metrics
  for (const [iso, set] of Object.entries(byIso)) {
    if (set.size < 5) {
      console.log(`  ${iso} has only ${set.size} metrics`);
    }
  }
}

check().catch(console.error);
