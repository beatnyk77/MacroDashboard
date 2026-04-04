import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://debdriyzfcwvgrhzzzre.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ0NzM5MCwiZXhwIjoyMDg1MDIzMzkwfQ.xODd81IhdGOhR94OwU8JmUeIZzUU9FF81lFxHKa-pd4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('metric_observations')
    .select('*')
    .eq('metric_id', 'COMPOSITE_PRESSURE_INDEX')
    .order('as_of_date', { ascending: false })
    .limit(5);
  
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

check();
