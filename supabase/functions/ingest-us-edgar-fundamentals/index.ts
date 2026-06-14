/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

// SEC requires a specific User-Agent format: CompanyName ContactEmail
const secHeaders = {
    'User-Agent': 'VibeCode KartikaySharma@example.com',
    'Accept-Encoding': 'gzip, deflate'
};

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function syncCompanies(client: any) {
    const res = await fetch('https://www.sec.gov/files/company_tickers.json', { headers: secHeaders });
    if (!res.ok) throw new Error(`SEC API returned ${res.status}`);

    const data = await res.json() as any;
    const companies = Object.values(data) as any[];

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

    return { processed: inserted, message: 'Companies synced' };
}

async function syncFundamentals(client: any) {
    const { data: companies } = await client
        .from('us_companies')
        .select('id, cik, ticker')
        .limit(50);

    if (!companies) return { processed: 0 };

    let processed = 0;

    for (const company of companies) {
        try {
            const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${company.cik}.json`;
            const res = await fetch(url, { headers: secHeaders });

            if (res.status === 403) {
                await sleep(200);
                continue;
            }
            if (!res.ok) continue;

            const facts = await res.json() as any;
            const usGaap = facts.facts['us-gaap'];

            if (!usGaap) continue;

            const getLatest10K = (concept: string) => {
                if (!usGaap[concept] || !usGaap[concept].units || !usGaap[concept].units.USD) return null;
                const reports = usGaap[concept].units.USD.filter((r: any) => r.form === '10-K');
                if (reports.length === 0) return null;
                reports.sort((a: any, b: any) => new Date(b.end).getTime() - new Date(a.end).getTime());
                return reports[0];
            };

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

            if (!rev || !netInc) continue;

            const periodEnd = rev.end;
            const revenueVal = rev.val;
            const netIncomeVal = netInc.val;
            const opIncomeVal = opInc ? opInc.val : 0;
            const assetsVal = assets ? assets.val : 0;
            const debtVal = debt ? debt.val : 0;
            const equityVal = equity ? equity.val : 0;
            const sharesVal = sharesOut ? sharesOut.val : 0;

            const eps = sharesVal > 0 ? netIncomeVal / sharesVal : 0;
            const roe = equityVal > 0 ? netIncomeVal / equityVal : 0;
            const opMargin = revenueVal > 0 ? opIncomeVal / revenueVal : 0;
            const debtEquity = equityVal > 0 ? debtVal / equityVal : 0;
            const peRatio = 0;
            const pbRatio = 0;
            const evEbitda = 0;

            await client.from('us_fundamentals').upsert({
                company_id: company.id,
                cik: company.cik,
                period_end: periodEnd,
                period_type: 'annual',
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
            await sleep(200);

        } catch (e: any) {
            console.error(`Failed fundamentals for ${company.ticker}`, e);
        }
    }

    await client.rpc('refresh_us_sector_summary');

    return { processed };
}

async function syncDailyFilingsAndInsider(client: any) {
    const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=&company=&dateb=&owner=include&start=0&count=100&output=atom`;
    const res = await fetch(url, { headers: secHeaders });
    if (!res.ok) throw new Error(`RSS feed returned ${res.status}`);

    const xml = await res.text();
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

            const cikMatch = summary.match(/<b>CIK:<\/b> <a[^>]*>([0-9]{10})<\/a>/);
            const cik = cikMatch ? cikMatch[1] : null;

            if (cik && accession) {
                const { data: company } = await client.from('us_companies').select('id').eq('cik', cik).single();
                const filingDate = new Date().toISOString().split('T')[0];

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

    return { processed, message: 'Daily filings synced via RSS' };
}

async function doIngest(supabase: ReturnType<typeof createClient>, mode: string): Promise<IngestResult> {
    let result: any;
    if (mode === 'companies') {
        result = await syncCompanies(supabase);
    } else if (mode === 'fundamentals') {
        result = await syncFundamentals(supabase);
    } else if (mode === 'daily') {
        result = await syncDailyFilingsAndInsider(supabase);
    } else {
        throw new Error(`Unknown mode: ${mode}`);
    }

    return {
        ok: true,
        counts: { upserted: result.processed || 0, skipped: 0 },
        meta: { mode, message: result.message }
    };
}

serveIngest('ingest-us-edgar-fundamentals', async (req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let mode = 'companies';
    try {
        const body = await req.json() as any;
        if (body.mode) mode = body.mode;
    } catch (_e: any) {
        const url = new URL(req.url);
        mode = url.searchParams.get('mode') || mode;
    }

    return doIngest(supabase, mode)
}, { timeoutMs: 15 * 60 * 1000, retries: 3 })
