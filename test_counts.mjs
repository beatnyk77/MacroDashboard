import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://debdriyzfcwvgrhzzzre.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ0NzM5MCwiZXhwIjoyMDg1MDIzMzkwfQ.xODd81IhdGOhR94OwU8JmUeIZzUU9FF81lFxHKa-pd4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const metricIds = [
    'FED_FUNDS_RATE',
    'IN_REPO_RATE',
    'USD_INR_RATE',
    'COMPOSITE_PRESSURE_INDEX',
    'EM_RELATIVE_PRESSURE'
  ];

  const results = {};
  for (const id of metricIds) {
    const { count, error } = await supabase
      .from('metric_observations')
      .select('*', { count: 'exact', head: true })
      .eq('metric_id', id);
    
    if (error) results[id] = error.message;
    else results[id] = count;
  }
  console.log(JSON.stringify(results, null, 2));
}

check();
