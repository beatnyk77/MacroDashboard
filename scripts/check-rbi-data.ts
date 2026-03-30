import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mxxxvqsozjnqhcogfppt.supabase.co';
const serviceKey = prompt('Enter your Supabase service role key:');

if (!serviceKey) {
  console.error('Service role key required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkData() {
  console.log('Checking RBI Money Market data...\n');

  // Check rbi_money_market_ops
  const opsCount = await supabase
    .from('rbi_money_market_ops')
    .select('*', { count: 'exact', head: true });

  console.log(`rbi_money_market_ops count: ${opsCount.count || 0}`);

  if (opsCount.count > 0) {
    const latestOps = await supabase
      .from('rbi_money_market_ops')
      .select('*')
      .order('date', { ascending: false })
      .limit(3);

    console.log('\nLatest rbi_money_market_ops records:');
    console.log(JSON.stringify(latestOps.data, null, 2));
  }

  // Check rbi_liquidity_ops
  const liqCount = await supabase
    .from('rbi_liquidity_ops')
    .select('*', { count: 'exact', head: true });

  console.log(`\nrbi_liquidity_ops count: ${liqCount.count || 0}`);

  if (liqCount.count > 0) {
    const latestLiq = await supabase
      .from('rbi_liquidity_ops')
      .select('*')
      .order('date', { ascending: false })
      .limit(3);

    console.log('\nLatest rbi_liquidity_ops records:');
    console.log(JSON.stringify(latestLiq.data, null, 2));
  }
}

checkData().then(() => {
  console.log('\nDone.');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
