import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req: Request) => {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response('Unauthorized', { status: 401 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const baseHeaders = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.nseindia.com/',
        'Origin': 'https://www.nseindia.com',
    }

    let cookies = '';
    try {
        const resp = await fetch('https://www.nseindia.com/', { headers: baseHeaders });
        const setCookie = resp.headers.get('set-cookie');
        if (setCookie) cookies = setCookie;
        // @ts-expect-error: Deno globals and third-party types
        if (!cookies && typeof resp.headers.getSetCookie === 'function') {
            // @ts-expect-error: Deno globals and third-party types
            cookies = resp.headers.getSetCookie().join('; ');
        }
    } catch (e) {
        console.warn('Failed to get NSE cookies:', e)
    }

    const today = new Date().toISOString().split('T')[0];

    const { data: cieCompanies } = await supabase.from('cie_companies').select('id, symbol, name, ticker');
    const symbolMap = new Map();
    if (cieCompanies) {
        for (const c of cieCompanies) {
            symbolMap.set(c.symbol.replace('.NS', ''), { id: c.id, ticker: c.ticker });
        }
    }

    let updates = 0;
    try {
        // We will fetch Insider Trading (PIT) via live endpoint
        const pitRes = await fetch(`https://www.nseindia.com/api/corporates-pit?index=equities`, {
            headers: { ...baseHeaders, 'Cookie': cookies }
        });

        const updatesMap = new Map();

        if (pitRes.ok) {
            const data = await pitRes.json() as any;
            if (data && data.data) {
                for (const trade of data.data) {
                    const info = symbolMap.get(trade.symbol);
                    if (info) {
                        const isBuy = trade.acqMode === 'Market Purchase' || trade.secAcq > 0;
                        const qty = parseInt(trade.secAcq) || 0;
                        const net = isBuy ? qty : -qty;

                        if (!updatesMap.has(info.id)) {
                            updatesMap.set(info.id, { insider_net_buying: net });
                        } else {
                            updatesMap.get(info.id).insider_net_buying += net;
                        }
                    }
                }
            }
        }

        // Just doing a simplified version: fetching SAST or manually keeping pledges constant
        // Pledges are usually static month over month.
        // We'll update the companies with insider_net_buying that we found
        for (const [id, stats] of updatesMap.entries()) {
            await supabase.from('cie_promoter_history').upsert({
                company_id: id,
                date: today,
                insider_net_buying: stats.insider_net_buying
            }, { onConflict: 'company_id,date' });

            await supabase.from('cie_companies').update({
                insider_buy_sell_net: stats.insider_net_buying
            }).eq('id', id);

            updates++;
        }
    } catch (e) {
        console.error('Failed to fetch NSE promoters', e);
    }

    return new Response(JSON.stringify({ success: true, updates }), {
        headers: { 'Content-Type': 'application/json' }
    });
})
