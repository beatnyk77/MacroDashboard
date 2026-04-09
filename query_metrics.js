import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('metric_observations').select('metric_id').limit(100);
  if (error) console.error(error);
  // get unique keys
  const unique = [...new Set(data.map(d => d.metric_id))];
  console.log(unique);
}
check();
