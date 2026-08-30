import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://debdriyzfcwvgrhzzzre.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const [{ data: snapshots }, { data: sectors }, { data: marketRows }] = await Promise.all([
    supabase.from('india_institutional_positioning_snapshots').select('*').limit(1),
    supabase.from('india_institutional_sector_observations').select('*').limit(24),
    supabase.from('metric_observations').select('metric_id, as_of_date, value').in('metric_id', ['IN_FII_CASH_NET', 'IN_DII_CASH_NET', 'IN_NIFTY_RETURN', 'IN_USD_INR_RETURN', 'IN_INDIA_VIX']).order('as_of_date', { ascending: false }).limit(10),
  ]);
  
  console.log('Snapshots count:', snapshots?.length || 0);
  console.log('Sectors count:', sectors?.length || 0);
  if (sectors?.length) {
     console.log('Sample sector:', sectors[0]);
  }
  console.log('Market rows count:', marketRows?.length || 0);
  if (marketRows?.length) {
     console.log('Latest market rows:', marketRows.slice(0, 5));
  }
}

checkData();
