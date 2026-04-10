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

    // Let's just fetch recent deals. Format is DD-MM-YYYY
    const today = new Date();
    const d = today.getDate().toString().padStart(2, '0');
    const m = (today.getMonth() + 1).toString().padStart(2, '0');
    const y = today.getFullYear();
    const dateStr = `${d}-${m}-${y}`;

    const { data: cieCompanies } = await supabase.from('cie_companies').select('id, symbol, name, ticker');
    const symbolMap = new Map();
    if (cieCompanies) {
        for (const c of cieCompanies) {
            symbolMap.set(c.symbol.replace('.NS', ''), { id: c.id, ticker: c.ticker });
        }
    }

    let dealsInserted = 0;
    try {
        // Bulk Deals
        const bulkRes = await fetch(`https://www.nseindia.com/api/historical/bulk-deals?symbol=&from=${dateStr}&to=${dateStr}`, {
            headers: { ...baseHeaders, 'Cookie': cookies }
        });

        if (bulkRes.ok) {
            const data = await bulkRes.json() as any;
            if (data && data.data) {
                for (const deal of data.data) {
                    const info = symbolMap.get(deal.symbol);
                    if (info) {
                        await supabase.from('cie_bulk_block_deals').upsert({
                            company_id: info.id,
                            date: today.toISOString().split('T')[0],
                            symbol: info.ticker,
                            client_name: deal.clientName,
                            type: deal.buySell === 'BUY' ? 'BUY' : 'SELL',
                            deal_type: 'BULK',
                            quantity: parseInt(deal.quantityTraded.replace(/,/g, '')),
                            price: parseFloat(deal.tradePrice.replace(/,/g, '')),
                            equity_pct: 0.0 // difficult to calc without exact shares_outstanding here, skip for now
                        }, { onConflict: 'company_id,date,client_name,quantity,price,type' })
                        dealsInserted++;
                    }
                }
            }
        }

        // Block Deals
        const blockRes = await fetch(`https://www.nseindia.com/api/historical/block-deals?symbol=&from=${dateStr}&to=${dateStr}`, {
            headers: { ...baseHeaders, 'Cookie': cookies }
        });

        if (blockRes.ok) {
            const data = await blockRes.json() as any;
            if (data && data.data) {
                for (const deal of data.data) {
                    const info = symbolMap.get(deal.symbol);
                    if (info) {
                        await supabase.from('cie_bulk_block_deals').upsert({
                            company_id: info.id,
                            date: today.toISOString().split('T')[0],
                            symbol: info.ticker,
                            client_name: deal.clientName,
                            type: deal.buySell === 'BUY' ? 'BUY' : 'SELL',
                            deal_type: 'BLOCK',
                            quantity: parseInt(deal.quantityTraded.replace(/,/g, '')),
                            price: parseFloat(deal.tradePrice.replace(/,/g, '')),
                            equity_pct: 0.0
                        }, { onConflict: 'company_id,date,client_name,quantity,price,type' })
                        dealsInserted++;
                    }
                }
            }
        }
    } catch (e) {
        console.error('Failed to fetch NSE deals', e);
    }

    return new Response(JSON.stringify({ success: true, dealsInserted }), {
        headers: { 'Content-Type': 'application/json' }
    });
})
