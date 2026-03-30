import { createClient } from '@supabase/supabase-js';

// Your Supabase project details
const supabaseUrl = 'https://mxxxvqsozjnqhcogfppt.supabase.co';
const serviceKey = 'your-service-role-key-here'; // REPLACE WITH ACTUAL KEY

const supabase = createClient(supabaseUrl, serviceKey);

async function diagnoseRBIData() {
  console.log('=== RBI Money Market Data Diagnosis ===\n');

  // 1. Check table counts
  const opsCount = await supabase
    .from('rbi_money_market_ops')
    .select('*', { count: 'exact', head: true });

  const liqCount = await supabase
    .from('rbi_liquidity_ops')
    .select('*', { count: 'exact', head: true });

  console.log(`rbi_money_market_ops: ${opsCount.count || 0} records`);
  console.log(`rbi_liquidity_ops: ${liqCount || 0} records\n`);

  if (opsCount.count === 0 && liqCount.count === 0) {
    console.log('❌ No data found in either table. Ingestion may have never run or failed.');
    return;
  }

  // 2. Get latest entries
  const [opsRes, liqRes] = await Promise.all([
    supabase.from('rbi_money_market_ops').select('*').order('date', { ascending: false }).limit(5),
    supabase.from('rbi_liquidity_ops').select('*').order('date', { ascending: false }).limit(5)
  ]);

  if (opsRes.data) {
    console.log('Latest rbi_money_market_ops:');
    opsRes.data.forEach((row: any) => {
      console.log(`  ${row.date}: call_money=${row.call_money_vol}/${row.call_money_rate}%, triparty=${row.triparty_repo_vol}/${row.triparty_repo_rate}%, market=${row.market_repo_vol}/${row.market_repo_rate}%`);
    });
    console.log('');
  }

  if (liqRes.data) {
    console.log('Latest rbi_liquidity_ops:');
    liqRes.data.forEach((row: any) => {
      console.log(`  ${row.date}: msf=${row.msf_amount}, sdf=${row.sdf_amount}, slf=${row.slf_amount}, net_total=${row.net_liquidity_total}`);
    });
  }

  // 3. Check for recent date coverage
  const today = new Date();
  const recentOps = await supabase
    .from('rbi_money_market_ops')
    .select('date')
    .gte('date', new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).toISOString().split('T')[0]);

  console.log(`\nRecords in last 7 days: ${recentOps.data?.length || 0}`);
}

diagnoseRBIData().then(() => process.exit(0)).catch(console.error);
