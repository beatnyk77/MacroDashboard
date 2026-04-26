import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env files");
  process.exit(1);
}

const hsCode = process.argv[2] || '620342';

console.log(`Triggering fetch-hs-demand for HS Code: ${hsCode}`);

const functionUrl = `${supabaseUrl}/functions/v1/fetch-hs-demand?hsCode=${hsCode}`;

try {
  const res = await fetch(functionUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
    }
  });

  console.log(`\nHTTP Status: ${res.status} ${res.statusText}`);
  const text = await res.text();
  console.log('\nResponse Body:');
  console.log(text);
  
} catch (e) {
  console.error('Fetch error:', e);
}
