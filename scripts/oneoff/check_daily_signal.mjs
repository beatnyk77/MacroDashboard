import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDailySignal() {
  console.log("--- DAILY SIGNAL DIAGNOSTICS ---");
  const today = new Date().toISOString().slice(0, 10);
  console.log(`Today's Date: ${today}`);

  const { data: signal, error: sigErr } = await supabase
    .from('daily_signal')
    .select('*')
    .order('signal_date', { ascending: false })
    .limit(5);
  
  if (sigErr) {
    console.error("Error fetching daily_signal:", sigErr.message);
  } else {
    console.log("Latest daily signals:");
    console.table(signal.map(s => ({
      date: s.signal_date,
      regime: s.regime,
      score: s.score,
      computed_at: s.computed_at
    })));
  }

  const { data: vw, error: vwErr } = await supabase
    .from('vw_latest_daily_signal')
    .select('*')
    .limit(1);

  if (vwErr) {
    console.error("Error fetching vw_latest_daily_signal:", vwErr.message);
  } else {
    console.log("vw_latest_daily_signal:");
    console.table(vw.map(v => ({
      date: v.signal_date,
      regime: v.regime,
      computed_at: v.computed_at
    })));
  }
}

checkDailySignal();
