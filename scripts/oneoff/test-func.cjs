const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log("Invoking compute-daily-macro-signal...");
  const { data, error } = await supabase.functions.invoke('compute-daily-macro-signal');
  console.log("Data:", data);
  console.log("Error:", error);
}

run();
