#!/usr/bin/env tsx

/**
 * Diagnostic: Check country_metrics table data
 * Run: npx tsx scripts/check-country-data.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  console.log('Checking country_metrics data...\n');

  // Check total rows
  const { count, error: countErr } = await supabase
    .from('country_metrics')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.error('Error counting rows:', countErr);
    return;
  }

  console.log(`Total rows in country_metrics: ${count || 0}\n`);

  if (!count || count === 0) {
    console.log('⚠️  No data exists. Ingestion needs to run.');
    console.log('Trigger manually from Supabase Dashboard or wait for cron (Sundays 02:00 UTC).');
    return;
  }

  // Check data by country
  const { data, error: dataErr } = await supabase
    .from('country_metrics')
    .select('iso, metric_key, value, as_of, source')
    .order('iso')
    .order('metric_key')
    .limit(50);

  if (dataErr) {
    console.error('Error fetching data:', dataErr);
    return;
  }

  console.log('Sample data (first 50 rows):');
  console.table(data);

  // Group by ISO
  const byCountry = new Map<string, number>();
  data?.forEach(row => {
    const current = byCountry.get(row.iso) || 0;
    byCountry.set(row.iso, current + 1);
  });

  console.log('\nMetrics per country (from sample):');
  console.table(Object.fromEntries(byCountry));

  // Check coverage for key metrics
  const keyMetrics = ['gdp_yoy_pct', 'cpi_yoy_pct', 'fx_reserves_bn', 'yield_10y_pct'];
  console.log('\nKey metrics coverage:');
  for (const metric of keyMetrics) {
    const rows = (data || []).filter(r => r.metric_key === metric);
    console.log(`  ${metric}: ${rows.length} countries`);
  }
}

await main();
