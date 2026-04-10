/* eslint-disable @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req: Request) => {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response('Unauthorized', { status: 401 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const client = createClient(supabaseUrl, supabaseKey)

    let mode = 'companies'; // Default mode
    try {
        const body = await req.json() as any;
        if (body.mode) mode = body.mode;
    } catch (e) {
        // Fallback to URL params
        const url = new URL(req.url);
        mode = url.searchParams.get('mode') || mode;
    }

    const start = new Date().toISOString()
    let result: any = { success: false }

    try {
        if (mode === 'companies') {
            result = await syncCompanies(client);
        } else if (mode === 'fundamentals') {
            result = await syncFundamentals(client);
        } else if (mode === 'daily') {
            result = await syncDailyFilingsAndInsider(client);
        } else {
            throw new Error(`Unknown mode: ${mode}`);
        }

        await client.from('ingestion_logs').insert({
            function_name: `ingest-us-edgar-fundamentals-${mode}`,
            status: 'success',
            rows_inserted: result.processed || result.inserted || 0,
            start_time: start,
            completed_at: new Date().toISOString(),
            status_code: 200
        })

        // Register observation for health tracking
        await client.from('metric_observations').insert({
            metric_code: 'US_EDGAR_FUNDAMENTALS',
            observation_date: new Date().toISOString().split('T')[0],
            value: result.processed || result.inserted || 1
        });

        return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } })

    } catch (e: any) {
        await client.from('ingestion_logs').insert({
            function_name: `ingest-us-edgar-fundamentals-${mode}`,
            status: 'failed',
            error_message: e.message,
            start_time: start,
            completed_at: new Date().toISOString(),
            status_code: 500
        })
        return new Response(JSON.stringify({ error: e.message }), { status: 500 })
    }
})

// SEC requires a specific User-Agent format: CompanyName ContactEmail
const secHeaders = {
    'User-Agent': 'VibeCode KartikaySharma@example.com',
    'Accept-Encoding': 'gzip, deflate'
};

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncCompanies(client: any) {
    // 1. Fetch SEC Company Tickers
    const res = await fetch('https://www.sec.gov/files/company_tickers.json', { headers: secHeaders });
    if (!res.ok) throw new Error(`SEC API returned ${res.status}`);

    const data = await res.json() as any;
    const companies = Object.values(data) as any[];

    // We'll process in batches to avoid overwhelming the database
    let inserted = 0;
    const batchSize = 1000;

    for (let i = 0; i < companies.length; i += batchSize) {
        const batch = companies.slice(i, i + batchSize).map(c => ({
            cik: String(c.cik_str).padStart(10, '0'),
            ticker: c.ticker,
            name: c.title,
            exchange: 'US'
        }));

        const { error } = await client.from('us_companies').upsert(batch, { onConflict: 'cik' });
        if (error) console.error('Error upserting companies:', error);
        else inserted += batch.length;
    }

    return { success: true, processed: inserted, message: 'Companies synced' };
}

async function syncFundamentals(client: any) {
    // Get top 500 companies by market cap or a priority list to sync fundamentals
    // For this example, fetching 50 to stay within limits
    const { data: companies } = await client
        .from('us_companies')
        .select('id, cik, ticker')
        .limit(50); // In a real production environment, paginate through all.

    if (!companies) return { success: false, processed: 0 };

    let processed = 0;

    for (const company of companies) {
        try {
            const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${company.cik}.json`;
            const res = await fetch(url, { headers: secHeaders });

            if (res.status === 403) {
                await sleep(200); // Backoff
                continue;
            }
            if (!res.ok) continue;

            const facts = await res.json() as any;
            const usGaap = facts.facts['us-gaap'];

            if (!usGaap) continue; // No GAAP data available

            // Helper to get latest annual (10-K) value
            const getLatest10K = (concept: string) => {
                if (!usGaap[concept] || !usGaap[concept].units || !usGaap[concept].units.USD) return null;
                const reports = usGaap[concept].units.USD.filter((r: any) => r.form === '10-K');
                if (reports.length === 0) return null;
                reports.sort((a: any, b: any) => new Date(b.end).getTime() - new Date(a.end).getTime());
                return reports[0];
            };

            // Helper to get latest shares
            const getLatestShares = () => {
                if (facts.facts['dei'] && facts.facts['dei']['EntityCommonStockSharesOutstanding']) {
                    const sharesArr = (facts as any).facts['dei']['EntityCommonStockSharesOutstanding'].units.shares;
                    sharesArr.sort((a: any, b: any) => new Date(b.end).getTime() - new Date(a.end).getTime());
                    return sharesArr[0];
                }
                return null;
            }

            const rev = getLatest10K('Revenues') || getLatest10K('SalesRevenueNet');
            const netInc = getLatest10K('NetIncomeLoss');
            const opInc = getLatest10K('OperatingIncomeLoss');
            const assets = getLatest10K('Assets');
            const debt = getLatest10K('LongTermDebt');
            const equity = getLatest10K('StockholdersEquity');
            const cash = getLatest10K('CashAndCashEquivalentsAtCarryingValue');
            const sharesOut = getLatestShares();

            if (!rev || !netInc) continue; // Skip if missing core data

            const periodEnd = rev.end;

            const revenueVal = rev.val;
            const netIncomeVal = netInc.val;
            const opIncomeVal = opInc ? opInc.val : 0;
            const assetsVal = assets ? assets.val : 0;
            const debtVal = debt ? debt.val : 0;
            const equityVal = equity ? equity.val : 0;
            const cashVal = cash ? cash.val : 0;
            const sharesVal = sharesOut ? sharesOut.val : 0;

            // Derived
            const eps = sharesVal > 0 ? netIncomeVal / sharesVal : 0;
            const roe = equityVal > 0 ? netIncomeVal / equityVal : 0;
            const opMargin = revenueVal > 0 ? opIncomeVal / revenueVal : 0;
            const debtEquity = equityVal > 0 ? debtVal / equityVal : 0;
            
            // Placeholder for price-based metrics (to be updated by a separate price sync)
            const peRatio = 0;
            const pbRatio = 0;
            const evEbitda = 0;

            await client.from('us_fundamentals').upsert({
                company_id: company.id,
                cik: company.cik,
                period_end: periodEnd,
                period_type: 'annual', // mapping 10-K to annual
                revenue: revenueVal,
                operating_income: opIncomeVal,
                net_income: netIncomeVal,
                eps: eps,
                shares_outstanding: sharesVal,
                total_assets: assetsVal,
                debt: debtVal,
                equity: equityVal,
                pe_ratio: peRatio,
                pb_ratio: pbRatio,
                ev_ebitda: evEbitda,
                roe: roe,
                operating_margin: opMargin,
                debt_equity: debtEquity
            }, { onConflict: 'company_id, period_end' });

            processed++;
            await sleep(200); // Protect rate limits (10 req/s max)

        } catch (e) {
            console.error(`Failed fundamentals for ${company.ticker}`, e);
        }
    }

    // Update materialized view
    await client.rpc('refresh_us_sector_summary');

    return { success: true, processed };
}

async function syncDailyFilingsAndInsider(client: any) {
    // Scrape latest EDGAR RSS feed for 8-K and 4 (Insider) 
    // This avoids the heavily restricted EFTS search endpoint
    const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=&company=&dateb=&owner=include&start=0&count=100&output=atom`;
    const res = await fetch(url, { headers: secHeaders });
    if (!res.ok) throw new Error(`RSS feed returned ${res.status}`);

    const xml = await res.text();

    // Quick regex parsing for ATOM feed since Deno doesn't have native DOMParser without imports
    const entriesPattern = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    let processed = 0;

    while ((match = entriesPattern.exec(xml)) !== null) {
        const entry = match[1];

        const typeMatch = entry.match(/<category scheme="http:\/\/www\.sec\.gov\/" label="form type" term="([^"]+)"/);
        const formType = typeMatch ? typeMatch[1] : null;

        if (formType === '8-K' || formType === '4') {
            const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
            const linkMatch = entry.match(/<link rel="alternate" type="text\/html" href="([^"]+)"/);
            const urnMatch = entry.match(/<id>urn:tag:sec\.gov,2008:accession\.([0-9-]+)<\/id>/);
            const summaryMatch = entry.match(/<summary type="html">([\s\S]*?)<\/summary>/);

            const title = titleMatch ? titleMatch[1] : '';
            const link = linkMatch ? linkMatch[1] : '';
            const accession = urnMatch ? urnMatch[1] : '';
            const summary = summaryMatch ? summaryMatch[1] : '';

            // Extract CIK from summary (<b>CIK:</b> <a href="...">0001234567</a>)
            const cikMatch = summary.match(/<b>CIK:<\/b> <a[^>]*>([0-9]{10})<\/a>/);
            const cik = cikMatch ? cikMatch[1] : null;

            if (cik && accession) {
                // Check if company exists to get company_id
                const { data: company } = await client.from('us_companies').select('id').eq('cik', cik).single();

                const filingDate = new Date().toISOString().split('T')[0]; // Using today as proxy since feed is "current"

                await client.from('us_filings').upsert({
                    company_id: company ? company.id : null,
                    cik: cik,
                    form_type: formType,
                    filing_date: filingDate,
                    accession_no: accession,
                    description: title.replace(/&amp;/g, '&'),
                    url: link
                }, { onConflict: 'accession_no' });

                processed++;
            }
        }
    }

    return { success: true, processed, message: 'Daily filings synced via RSS' };
}
