import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkCategories() {
  const { data, error } = await supabase
    .from('metrics')
    .select('category');

  if (error) {
    console.error('Error fetching categories:', error.message);
    Deno.exit(1);
  }

  const categories = Array.from(new Set(data.map(d => d.category)));
  console.log('Current categories in metrics table:', JSON.stringify(categories));
}

checkCategories();
