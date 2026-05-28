import { createClient } from '@supabase/supabase-js';

const url = 'https://debdriyzfcwvgrhzzzre.supabase.co';
const serviceKey = 'fe95bc684b136a455cb3ae290e273510317e0404e07de14b17f818857faae38e';

const supabase = createClient(url, serviceKey);

async function check() {
  console.log('--- Checking daily_signal ---');
  const { data: signals, error: err1 } = await supabase
    .from('daily_signal')
    .select('*')
    .order('signal_date', { ascending: false })
    .limit(5);
  
  if (err1) {
    console.error('Error fetching daily_signal:', err1.message);
  } else {
    console.log('Last 5 daily signals:', JSON.stringify(signals, null, 2));
  }

  console.log('--- Checking vw_latest_daily_signal ---');
  const { data: latestSignal, error: err2 } = await supabase
    .from('vw_latest_daily_signal')
    .select('*')
    .single();

  if (err2) {
    console.error('Error fetching vw_latest_daily_signal:', err2.message);
  } else {
    console.log('Latest daily signal view:', JSON.stringify(latestSignal, null, 2));
  }

  console.log('--- Checking ingestion_runs for compute-daily-macro-signal ---');
  const { data: ingestionRuns, error: err3 } = await supabase
    .from('ingestion_runs')
    .select('*')
    .eq('job_name', 'compute-daily-macro-signal')
    .order('finished_at', { ascending: false })
    .limit(5);

  if (err3) {
    console.error('Error fetching ingestion_runs:', err3.message);
  } else {
    console.log('Last 5 ingestion runs:', JSON.stringify(ingestionRuns, null, 2));
  }
}

check().catch(console.error);
