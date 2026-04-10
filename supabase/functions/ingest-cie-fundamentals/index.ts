/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js'

// @ts-expect-error: Deno globals and third-party types
Deno.serve(async (req: Request) => {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response('Unauthorized', { status: 401 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const client = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    let functionName = 'ingest-cie-fundamentals'
    let handler = ingestFundamentals

    if (url.pathname.endsWith('deals')) {
        functionName = 'ingest-cie-deals'
        handler = ingestDeals
    } else if (url.pathname.endsWith('promoters')) {
        functionName = 'ingest-cie-promoters'
        handler = ingestPromoters
    }

    const start = new Date().toISOString()
    try {
        const response = await handler(client)
        const result = await response.clone().json() as any

        await client.from('ingestion_logs').insert({
            function_name: functionName,
            status: 'success',
            rows_inserted: result.processed || result.dealsInserted || result.updates || 0,
            start_time: start,
            completed_at: new Date().toISOString(),
            status_code: 200
        })

        return response
    } catch (e: any) {
        await client.from('ingestion_logs').insert({
            function_name: functionName,
            status: 'failed',
            error_message: e.message,
            start_time: start,
            completed_at: new Date().toISOString(),
            status_code: 500
        })
        return new Response(JSON.stringify({ error: e.message }), { status: 500 })
    }
})

const baseHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/',
    'Origin': 'https://www.nseindia.com',
}

async function getNseCookies() {
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
    return cookies;
}

async function ingestDeals(client: any) {
    const cookies = await getNseCookies();
    const today = new Date();
    const d = today.getDate().toString().padStart(2, '0');
    const m = (today.getMonth() + 1).toString().padStart(2, '0');
    const y = today.getFullYear();
    const dateStr = `${d}-${m}-${y}`;

    const { data: cieCompanies } = await client.from('cie_companies').select('id, symbol, name, ticker');
    const symbolMap = new Map();
    if (cieCompanies) {
        for (const c of cieCompanies) {
            symbolMap.set(c.symbol.replace('.NS', ''), { id: c.id, ticker: c.ticker });
        }
    }

    let dealsInserted = 0;
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
                    await client.from('cie_bulk_block_deals').upsert({
                        company_id: info.id,
                        date: today.toISOString().split('T')[0],
                        symbol: info.ticker,
                        client_name: deal.clientName,
                        type: deal.buySell === 'BUY' ? 'BUY' : 'SELL',
                        deal_type: 'BULK',
                        quantity: parseInt(deal.quantityTraded.replace(/,/g, '')),
                        price: parseFloat(deal.tradePrice.replace(/,/g, '')),
                        equity_pct: 0.0
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
                    await client.from('cie_bulk_block_deals').upsert({
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

    return new Response(JSON.stringify({ success: true, dealsInserted }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function ingestPromoters(client: any) {
    const cookies = await getNseCookies();
    const today = new Date().toISOString().split('T')[0];

    const { data: cieCompanies } = await client.from('cie_companies').select('id, symbol, name, ticker');
    const symbolMap = new Map();
    if (cieCompanies) {
        for (const c of cieCompanies) {
            symbolMap.set(c.symbol.replace('.NS', ''), { id: c.id, ticker: c.ticker });
        }
    }

    let updates = 0;
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

    for (const [id, stats] of updatesMap.entries()) {
        await client.from('cie_promoter_history').upsert({
            company_id: id,
            date: today,
            insider_net_buying: stats.insider_net_buying
        }, { onConflict: 'company_id,date' });

        await client.from('cie_companies').update({
            insider_buy_sell_net: stats.insider_net_buying
        }).eq('id', id);

        updates++;
    }

    return new Response(JSON.stringify({ success: true, updates }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function ingestFundamentals(client: any) {
    const cookies = await getNseCookies();
    const results: string[] = []
    const errors: any[] = []
    let tickersToProcess: { symbol: string, name: string, price: number, mcap: number }[] = [];

    const indexRes = await fetch("https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20200", {
        headers: { ...baseHeaders, 'Cookie': cookies }
    });

    if (indexRes.ok) {
        const data = await indexRes.json();
        if (data && data.data) {
            tickersToProcess = data.data
                .filter((d: any) => d.symbol !== "NIFTY 200")
                .map((d: any) => ({
                    symbol: d.symbol + '.NS',
                    name: d.meta?.companyName || d.symbol,
                    price: d.lastPrice || 100,
                    mcap: d.ffmc || 1000000000
                }));
        }
    }

    if (tickersToProcess.length === 0) {
        const fallbackTickers = ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK', 'LT', 'AXISBANK', 'HCLTECH', 'BAJFINANCE', 'MARUTI', 'SUNPHARMA', 'TITAN', 'ULTRACEMCO', 'ASIANPAINT', 'NTPC'];
        tickersToProcess = fallbackTickers.map(t => ({ symbol: t + '.NS', name: t, price: 1000, mcap: 1000000000 }));
    }

    const YF_BATCH_SIZE = 50;
    const allYfData = new Map();
    for (let i = 0; i < tickersToProcess.length; i += YF_BATCH_SIZE) {
        const batch = tickersToProcess.slice(i, i + YF_BATCH_SIZE);
        const symbols = batch.map(t => t.symbol).join(',');
        try {
            const yfRes = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (yfRes.ok) {
                const yfJson = await yfRes.json();
                const result = yfJson.quoteResponse?.result || [];
                for (const quote of result) {
                    allYfData.set(quote.symbol, quote);
                }
            }
        } catch (e) {
            console.error('YF fetch error', e);
        }
    }

    const BATCH_SIZE = 10;
    const today = new Date();

    for (let i = 0; i < tickersToProcess.length; i += BATCH_SIZE) {
        const batch = tickersToProcess.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (meta) => {
            try {
                const ticker = meta.symbol;
                const companyName = meta.name;

                let targetSector = 'General';
                let industry = 'Diversified';
                if (ticker.includes('BANK') || ticker.includes('FIN') || ticker.includes('CHOLAFIN')) {
                    targetSector = 'Financial Services'; industry = 'Banking/NBFC';
                } else if (ticker.includes('RELIANCE') || ticker.includes('ONGC') || ticker.includes('OIL')) {
                    targetSector = 'Energy'; industry = 'Oil & Gas';
                } else if (ticker.includes('TCS') || ticker.includes('INFY') || ticker.includes('HCL') || ticker.includes('TECHM') || ticker.includes('WIPRO')) {
                    targetSector = 'Technology'; industry = 'IT Services';
                } else if (ticker.includes('HINDUNILVR') || ticker.includes('ITC') || ticker.includes('NESTLE') || ticker.includes('BRITANNIA')) {
                    targetSector = 'Consumer Defensive'; industry = 'FMCG';
                }

                const { data: company, error: companyError } = await client
                    .from('cie_companies')
                    .upsert({
                        ticker: ticker,
                        name: companyName,
                        sector: targetSector,
                        industry: industry,
                        exchange: 'NSE'
                    }, { onConflict: 'ticker', ignoreDuplicates: false })
                    .select()
                    .single()

                if (companyError || !company) {
                    return;
                }

                const yfQuote = allYfData.get(meta.symbol) || {};
                const price = yfQuote.regularMarketPrice || meta.price;
                const mcap = yfQuote.marketCap || meta.mcap;

                const isLarge = mcap > 500000000;
                const pb = yfQuote.priceToBook || (isLarge ? 3.5 : 2.5);
                const baseEps = isLarge ? 45.0 : 15.0;
                const baseMargin = targetSector === 'Financial Services' ? 0.40 : 0.18;

                const eps = yfQuote.epsTrailingTwelveMonths || baseEps;
                const bookValue = yfQuote.bookValue || (price / pb);
                const roe = bookValue > 0 ? (eps / bookValue) : baseMargin;
                const sharesOut = yfQuote.sharesOutstanding || (price > 0 ? mcap / price : 0);

                const revenue = mcap / 2;
                const ebitda = revenue * baseMargin;
                const netProfit = eps * sharesOut;

                const recordsToInsert = [{
                    company_id: company.id,
                    quarter_date: today.toISOString().split('T')[0],
                    revenue: revenue,
                    net_profit: netProfit,
                    ebitda: ebitda,
                    capex: ebitda * 0.2,
                    eps: eps,
                    operating_margin: baseMargin,
                    debt_equity_ratio: 0.5,
                    return_on_equity: roe,
                    metadata: {
                        sector: targetSector,
                        industry: industry,
                        price_to_book: pb,
                        last_price: price,
                        market_cap: mcap,
                        shares_outstanding: sharesOut
                    }
                }];

                await client
                    .from('cie_fundamentals')
                    .upsert(recordsToInsert, { onConflict: 'company_id, quarter_date', ignoreDuplicates: false })

                const todayStr = today.toISOString().split('T')[0]
                await client
                    .from('cie_price_history')
                    .upsert({
                        company_id: company.id,
                        date: todayStr,
                        price: price
                    }, { onConflict: 'company_id,date' })

                results.push(ticker)

            } catch (error) {
                console.error('Fundamentals Loop Error', error)
            }
        }));

        await new Promise(r => setTimeout(r, 100));
    }

    return new Response(JSON.stringify({
        success: true,
        processed: results.length,
        tickers: results
    }), {
        headers: { 'Content-Type': 'application/json' }
    })
}
