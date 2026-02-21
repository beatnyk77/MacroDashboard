import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
    // Update Gold
    const { error: gError } = await supabase
        .from('metrics')
        .update({
            metadata: {
                fred_id: 'GC1',
                yahoo_ticker: 'GC=F' // Switching to COMEX futures as requested/implied by GC1
            }
        })
        .eq('id', 'GOLD_PRICE_USD');

    // Update Bitcoin
    const { error: bError } = await supabase
        .from('metrics')
        .update({
            metadata: {
                fred_id: 'BCHAIN/MKPRU',
                yahoo_ticker: 'BTC-USD'
            }
        })
        .eq('id', 'BITCOIN_PRICE_USD');

    console.log("Gold Update Error:", gError);
    console.log("BTC Update Error:", bError);
}

run();
