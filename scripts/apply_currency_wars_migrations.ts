import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyMigrations() {
  const migrations = [
    'supabase/migrations/20260404000002_expand_metric_categories.sql',
    'supabase/migrations/20260404000001_add_currency_wars_metrics.sql'
  ];

  for (const path of migrations) {
    console.log(`📂 Applying migration: ${path}`);
    const sql = await Deno.readTextFile(path);
    
    // We use RPC if exec_sql is available, otherwise we might have to use pg-meta or similar.
    // However, on many Supabase instances, we can't directly run raw SQL via the client unless there's an RPC.
    // Let's try to use a simpler approach: many users have an 'exec_sql' RPC for this purpose.
    // If not, I'll provide instructions for the CLI.
    
    // Actually, I'll use the Supabase Management API if I had a token.
    // Since I don't, I'll try to run the backfill with a modified script that handles registration.
    
    console.log('⚠️ Running raw SQL via Supabase client is restricted. Please use the Supabase CLI.');
    console.log('👉 Command: supabase db push');
    Deno.exit(0);
  }
}

applyMigrations();
