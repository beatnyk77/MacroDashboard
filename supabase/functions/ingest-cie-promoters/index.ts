/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

async function doIngest(supabase: ReturnType<typeof createClient>): Promise<IngestResult> {
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
        if (!cookies && typeof resp.headers.getSetCookie === 'function') {
            cookies = resp.headers.getSetCookie().join('; ');
        }
    } catch (e: any) {
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
    const pitRes = await fetch('https://www.nseindia.com/api/corporates-pit?index=equities', {
        headers: { ...baseHeaders, Cookie: cookies }
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
                    if (!updatesMap.has(info.id)) updatesMap.set(info.id, { insider_net_buying: net });
                    else updatesMap.get(info.id).insider_net_buying += net;
                }
            }
        }
    }

    for (const [id, stats] of updatesMap.entries()) {
        try {
            await supabase.from('cie_promoter_history').upsert({
                company_id: id, date: today, insider_net_buying: stats.insider_net_buying
            }, { onConflict: 'company_id,date' });
            await supabase.from('cie_companies').update({ insider_buy_sell_net: stats.insider_net_buying }).eq('id', id);
            updates++;
        } catch (rowErr: any) {
            console.warn('Failed to update promoter row:', rowErr.message);
        }
    }

    return { ok: true, counts: { upserted: updates, skipped: 0 }, meta: { date: today } }
}

serveIngest('ingest-cie-promoters', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    return doIngest(supabase)
}, { timeoutMs: 15 * 60 * 1000, retries: 3 })
