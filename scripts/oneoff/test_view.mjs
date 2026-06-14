import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment");
  process.exit(1);
}

const supabase = createClient(url, key);

async function testQuery() {
    const { data, error } = await supabase
        .from('vw_latest_daily_signal')
        .select('*')
        .single();

    console.log("Error:", error);
    console.log("Data:", data);
}

testQuery();
