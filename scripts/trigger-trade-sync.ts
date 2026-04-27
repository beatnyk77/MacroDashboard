const HS_CODES = ['851713', '870380', '854143', '854231', '300490', '620342'];
const SUPABASE_URL = 'https://debdriyzfcwvgrhzzzre.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function sync() {
    for (const code of HS_CODES) {
        console.log(`Syncing HS ${code}...`);
        const res = await fetch(`${SUPABASE_URL}/functions/v1/fetch-hs-demand?hsCode=${code}`, {
            headers: {
                'Authorization': `Bearer ${ANON_KEY}`,
                'apikey': ANON_KEY
            }
        });
        const data = await res.json();
        console.log(`HS ${code} Result:`, data);
        await new Promise(r => setTimeout(r, 2000));
    }
}

sync();
