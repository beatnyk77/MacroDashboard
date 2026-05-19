#!/usr/bin/env node
// Quick test to validate EIA API key and oil spread data fetching
// Usage: VITE_EIA_API_KEY=your_key node scripts/test-oil-spread.mjs

const eiaApiKey = process.env.VITE_EIA_API_KEY || process.env.EIA_API_KEY;

if (!eiaApiKey) {
  console.error('❌ EIA_API_KEY not set. Run: EIA_API_KEY=your_key node scripts/test-oil-spread.mjs');
  process.exit(1);
}

async function fetchSeries(seriesId) {
  const url = `https://api.eia.gov/v2/petroleum/pri/fut/data/?api_key=${eiaApiKey}&facets[series][]=${seriesId}&frequency=daily&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&length=10`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} for ${seriesId}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  if (!json.response?.data?.length) throw new Error(`No data for ${seriesId}`);
  return json.response.data;
}

async function run() {
  console.log('Testing EIA API for WTI Calendar Spread (RCLC1 & RCLC2)...\n');
  
  const [cl1, cl2] = await Promise.all([fetchSeries('RCLC1'), fetchSeries('RCLC2')]);
  
  console.log(`CL1 (Front Month) — latest ${cl1.length} days:`);
  cl1.slice(0, 5).forEach(r => console.log(`  ${r.period}: $${Number(r.value).toFixed(2)}`));
  
  console.log(`\nCL2 (Second Month) — latest ${cl2.length} days:`);
  cl2.slice(0, 5).forEach(r => console.log(`  ${r.period}: $${Number(r.value).toFixed(2)}`));
  
  // Find aligned
  const cl2Map = new Map(cl2.map(r => [r.period, Number(r.value)]));
  const aligned = cl1
    .filter(r => cl2Map.has(r.period) && Number(r.value) > 0)
    .slice(0, 5)
    .map(r => ({
      date: r.period,
      cl1: Number(r.value),
      cl2: cl2Map.get(r.period),
      spread: Number(r.value) - cl2Map.get(r.period),
    }));

  console.log('\n✅ Aligned CL1-CL2 spreads:');
  aligned.forEach(r => console.log(`  ${r.date}: CL1=$${r.cl1.toFixed(2)}, CL2=$${r.cl2.toFixed(2)}, Spread=${r.spread >= 0 ? '+' : ''}${r.spread.toFixed(2)}`));
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
