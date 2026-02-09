import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    const tables = [
        'public.oil_refining_capacity',
        'public.oil_imports_by_origin',
        'public.metrics',
        'public.metric_observations',
        'public.vw_net_liquidity',
        'public.vw_india_macro'
    ];

    console.log('--- TABLE DIAGNOSTIC ---');
    for (const table of tables) {
        const { error, data } = await supabase.from(table.replace('public.', '')).select('*').limit(1);
        if (error) {
            console.log(`[FAIL] ${table}: ${error.message} (${error.code})`);
        } else {
            console.log(`[OK]   ${table}: ${data.length > 0 ? 'Data exists' : 'Table empty'}`);
        }
    }
}

checkTables();
