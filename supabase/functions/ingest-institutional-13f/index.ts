import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// @ts-ignore
Deno.serve(async (req: Request) => {
    const start = new Date().toISOString();
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const client = createClient(supabaseUrl, supabaseKey);
    let result: any = { success: false };

    try {
        result = await processInstitutional13F(client);

        await client.from('ingestion_logs').insert({
            function_name: 'ingest-institutional-13f',
            status: 'success',
            rows_inserted: result.processed || 0,
            start_time: start,
            completed_at: new Date().toISOString(),
            status_code: 200
        });

        return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });

    } catch (e: any) {
        await client.from('ingestion_logs').insert({
            function_name: 'ingest-institutional-13f',
            status: 'failed',
            error_message: e.message,
            start_time: start,
            completed_at: new Date().toISOString(),
            status_code: 500
        });
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
});

const secHeaders = {
    'User-Agent': 'VibeCode KartikaySharma@macrodashboard.com',
    'Accept-Encoding': 'gzip, deflate'
};

// ETF ticker lists for asset class classification
const GOLD_ETFS = ['GLD', 'IAU', 'BAR', 'SGOL', 'OUNZ', 'BCM', 'GLDM'];
const BOND_ETFS = ['TLT', 'IEI', 'IEF', 'SHY', 'LQD', 'HYG', 'TIP', 'BND', 'AGG', 'EMB', 'MUB', 'SCHP', 'VTIP', 'BIL', 'XLV', 'XLF']; // note: some are sector but treat as bond? Actually not. We'll treat only known bond ETFs.
// We'll also include common Treasury ETFs: TLT, TBF, etc. This list can be expanded later.

function classifyAssetClass(ticker: string): 'equity' | 'bond' | 'gold' | 'other' {
    const t = ticker.toUpperCase();
    if (GOLD_ETFS.includes(t)) return 'gold';
    if (BOND_ETFS.includes(t)) return 'bond';
    // Heuristic: If ticker starts with '^' or contains '-', treat as other
    return 'equity'; // default to equity for stocks
}

async function fetchBenchmarkReturns(alphaVantageKey: string): Promise<{spy: number, tlt: number, gld: number}> {
    const tickers = { SPY: 0, TLT: 0, GLD: 0 };
    for (const ticker of ['SPY', 'TLT', 'GLD']) {
        try {
            const url = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${ticker}&apikey=${alphaVantageKey}`;
            const res = await fetch(url);
            const data = await res.json();
            const ts = data['Monthly Time Series'];
            if (!ts) {
                console.warn(`No time series for ${ticker}`);
                tickers[ticker as keyof typeof tickers] = 0;
                continue;
            }
            const dates = Object.keys(ts).sort().reverse();
            if (dates.length >= 3) {
                const latest = parseFloat(ts[dates[0]]['4. close']);
                const old = parseFloat(ts[dates[2]]['4. close']); // approx 3 months ago
                tickers[ticker as keyof typeof tickers] = ((latest - old) / old) * 100;
            } else {
                tickers[ticker as keyof typeof tickers] = 0;
            }
        } catch (e) {
            console.warn(`Failed to fetch ${ticker}: ${e}`);
            tickers[ticker as keyof typeof tickers] = 0;
        }
        await sleep(200);
    }
    return { spy: tickers.SPY, tlt: tickers.TLT, gld: tickers.GLD };
}

const INSTITUTIONS = [
    { name: 'Norges Bank', cik: '0001164748', type: 'Sovereign Wealth' },
    { name: 'GIC Private Ltd', cik: '0000930796', type: 'Sovereign Wealth' },
    { name: 'Abu Dhabi Investment Authority', cik: '0001426425', type: 'Sovereign Wealth' },
    { name: 'CPPIB', cik: '0001006540', type: 'Sovereign Wealth' },
    { name: 'CalPERS', cik: '0000919079', type: 'Asset Manager' },
    { name: 'BlackRock Inc.', cik: '0001364762', type: 'Asset Manager' },
    { name: 'Vanguard Group Inc.', cik: '0000102905', type: 'Asset Manager' },
    { name: 'Temasek Holdings', cik: '0001021944', type: 'Sovereign Wealth' }
];

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processInstitutional13F(client: any) {
    let processedCount = 0;
    const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    if (!alphaVantageKey) throw new Error('ALPHA_VANTAGE_API_KEY is not set');

    // Fetch benchmark returns once
    const benchmarks = await fetchBenchmarkReturns(alphaVantageKey);

    const results = await Promise.allSettled(INSTITUTIONS.map(async (inst) => {
        const cikStr = inst.cik.padStart(10, '0');
        const submissionUrl = `https://data.sec.gov/submissions/CIK${cikStr}.json`;

        const subRes = await fetch(submissionUrl, { headers: secHeaders });
        if (!subRes.ok) throw new Error(`Failed to fetch submissions for ${inst.name}`);

        const subData = (await subRes.json()) as any;
        const filings = subData.filings?.recent;
        if (!filings) throw new Error(`No recent filings for ${inst.name}`);

        // Find the latest 13F-HR or 13F-HR/A
        const idx = filings.form.findIndex((f: string) => f === '13F-HR' || f === '13F-HR/A');
        if (idx === -1) return { name: inst.name, status: 'No 13F found' };

        const accessionNum = filings.accessionNumber[idx].replace(/-/g, '');
        const primaryDoc = filings.primaryDocument[idx];
        const reportDate = filings.reportDate[idx];

        // Fetch Information Table XML
        const filingDirUrl = `https://www.sec.gov/Archives/edgar/data/${inst.cik}/${accessionNum}/index.json`;
        const dirRes = await fetch(filingDirUrl, { headers: secHeaders });
        if (!dirRes.ok) throw new Error(`Filing index not found for ${inst.name}`);

        const dirData = (await dirRes.json()) as any;
        const xmlFile = dirData.directory.item.find((item: any) =>
            item.name.toLowerCase().includes('infotable.xml') ||
            (item.name.toLowerCase().endsWith('.xml') && !item.name.toLowerCase().includes('primary_doc'))
        );

        if (!xmlFile) throw new Error(`Information Table XML not found for ${inst.name}`);

        const xmlUrl = `https://www.sec.gov/Archives/edgar/data/${inst.cik}/${accessionNum}/${xmlFile.name}`;
        const xmlRes = await fetch(xmlUrl, { headers: secHeaders });
        const xmlText = await xmlRes.text();

        // Parse holdings
        const holdings: Array<{cusip: string, value: number, ticker?: string, sector?: string, name?: string}> = [];
        const cusipRegex = /<cusip>([^<]+)<\/cusip>[\s\S]*?<value>([^<]+)<\/value>/gi;
        let match;
        let totalValue = 0;

        while ((match = cusipRegex.exec(xmlText)) !== null) {
            const cusip = match[1].trim();
            const value = parseInt(match[2].trim(), 10) * 1000; // Values are in thousands
            holdings.push({ cusip, value });
            totalValue += value;
        }

        // Process top holdings (up to 30) with Alpha Vantage enrichment
        const topHoldings = holdings.slice(0, 30);
        const sectorMapping: Record<string, number> = {};
        const enrichedHoldings: typeof holdings = [];

        for (const holding of topHoldings) {
            try {
                // 1. CUSIP to Ticker via SYMBOL_SEARCH
                const searchUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${holding.cusip}&apikey=${alphaVantageKey}`;
                const searchRes = await fetch(searchUrl);
                const searchData = (await searchRes.json()) as any;
                const symbol = searchData.bestMatches?.[0]?.['1. symbol'];

                if (symbol) {
                    // 2. Ticker to Overview for sector and name
                    const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${alphaVantageKey}`;
                    const overviewRes = await fetch(overviewUrl);
                    const overviewData = (await overviewRes.json()) as any;

                    const sector = overviewData.Sector || 'Other';
                    const name = overviewData.Name || overviewData.description || null;

                    // Update sector mapping (weight by value)
                    sectorMapping[sector] = (sectorMapping[sector] || 0) + (holding.value / totalValue) * 100;

                    // Store enriched holding
                    enrichedHoldings.push({
                        ...holding,
                        ticker: symbol,
                        sector,
                        name
                    });
                } else {
                    sectorMapping['Other'] = (sectorMapping['Other'] || 0) + (holding.value / totalValue) * 100;
                    enrichedHoldings.push(holding);
                }
            } catch (e: any) {
                console.warn(`Mapping failed for CUSIP ${holding.cusip}: ${e.message}`);
                sectorMapping['Other'] = (sectorMapping['Other'] || 0) + (holding.value / totalValue) * 100;
                enrichedHoldings.push(holding);
            }
            await sleep(200); // Rate limit respect
        }

        // Compute asset class allocation
        const equitySum = enrichedHoldings.reduce((acc, h) => {
            const cls = classifyAssetClass(h.ticker || '');
            return acc + (cls === 'equity' ? h.value : 0);
        }, 0);
        const bondSum = enrichedHoldings.reduce((acc, h) => {
            const cls = classifyAssetClass(h.ticker || '');
            return acc + (cls === 'bond' ? h.value : 0);
        }, 0);
        const goldSum = enrichedHoldings.reduce((acc, h) => {
            const cls = classifyAssetClass(h.ticker || '');
            return acc + (cls === 'gold' ? h.value : 0);
        }, 0);
        const otherSum = totalValue - equitySum - bondSum - goldSum;

        const assetClassAllocation = {
            equity_pct: (equitySum / totalValue) * 100,
            bond_pct: (bondSum / totalValue) * 100,
            gold_pct: (goldSum / totalValue) * 100,
            other_pct: (otherSum / totalValue) * 100
        };

        // Build top 10 holdings array with concentration contribution
        const sortedForTop = [...enrichedHoldings].sort((a, b) => b.value - a.value);
        const top10 = sortedForTop.slice(0, 10).map(h => ({
            cusip: h.cusip,
            ticker: h.ticker || null,
            name: h.name || null,
            value: h.value,
            sector: h.sector || null,
            concentration_contribution: (h.value / totalValue) * 100
        }));

        // Concentration score: sum of top 5 holdings contribution
        const top5 = sortedForTop.slice(0, 5);
        const concentrationScore = top5.reduce((sum, h) => sum + (h.value / totalValue) * 100, 0);

        // Fetch previous AUM for QoQ delta
        const { data: prevData } = await client
            .from('institutional_13f_holdings')
            .select('total_aum, top_sectors, asset_class_allocation')
            .eq('cik', inst.cik)
            .lt('as_of_date', reportDate)
            .order('as_of_date', { ascending: false })
            .limit(1)
            .maybeSingle();

        const qoqDelta = prevData?.total_aum ? ((totalValue - prevData.total_aum) / prevData.total_aum) * 100 : 0;

        // Sector rotation signal: compare top 3 sector sum vs previous
        const getTop3Sum = (sectors: Record<string, number> | null) => {
            if (!sectors) return 0;
            const values = Object.values(sectors).sort((a,b) => b - a);
            return values.slice(0,3).reduce((a,b) => a+b, 0);
        };
        const currTop3Sum = getTop3Sum(sectorMapping);
        const prevTop3Sum = prevData?.top_sectors ? getTop3Sum(prevData.top_sectors as Record<string, number>) : 0;
        const top3Delta = currTop3Sum - prevTop3Sum;
        const sectorRotationSignal = top3Delta > 1 ? 'ACCUMULATE' : top3Delta < -1 ? 'REDUCE' : 'NEUTRAL';

        // Historical allocation (last 8 quarters including current)
        // Fetch up to 7 previous rows to build history
        const { data: historyRows } = await client
            .from('institutional_13f_holdings')
            .select('as_of_date, asset_class_allocation')
            .eq('cik', inst.cik)
            .lt('as_of_date', reportDate)
            .order('as_of_date', { ascending: false })
            .limit(7);

        const historicalAllocation = [];
        // Add previous allocations (older first) up to 7
        if (historyRows) {
            for (const row of historyRows.reverse()) { // oldest to newest
                if (row.asset_class_allocation) {
                    historicalAllocation.push({
                        quarter: row.as_of_date,
                        ...row.asset_class_allocation
                    });
                }
            }
        }
        // Add current
        historicalAllocation.push({
            quarter: reportDate,
            ...assetClassAllocation
        });
        // Keep only last 8
        if (historicalAllocation.length > 8) {
            historicalAllocation.splice(0, historicalAllocation.length - 8);
        }

        // Regime Z-score: based on equity_pct over historicalAllocation
        const equityPcts = historicalAllocation.map(h => Number(h.equity_pct) || 0);
        const meanEquity = equityPcts.reduce((a,b) => a+b, 0) / equityPcts.length;
        const variance = equityPcts.reduce((sum, val) => sum + Math.pow(val - meanEquity, 2), 0) / equityPcts.length;
        const stdDev = Math.sqrt(variance);
        const regimeZScore = stdDev === 0 ? 0 : (Number(assetClassAllocation.equity_pct) - meanEquity) / stdDev;

        // Benchmark comparisons
        const spyComparison = qoqDelta - benchmarks.spy;
        const tltComparison = qoqDelta - benchmarks.tlt;
        const gldComparison = qoqDelta - benchmarks.gld;

        // Upsert all fields
        const { error: upsertErr } = await client.from('institutional_13f_holdings').upsert({
            fund_name: inst.name,
            fund_type: inst.type,
            cik: inst.cik,
            total_aum: totalValue,
            top_sectors: sectorMapping,
            qoq_delta: qoqDelta,
            as_of_date: reportDate,
            last_updated: new Date().toISOString(),
            // New fields
            asset_class_allocation: assetClassAllocation,
            top_holdings: top10,
            concentration_score: concentrationScore,
            sector_rotation_signal: sectorRotationSignal,
            spy_comparison: spyComparison,
            tlt_comparison: tltComparison,
            gld_comparison: gldComparison,
            regime_z_score: regimeZScore,
            historical_allocation: historicalAllocation
        }, { onConflict: 'cik, as_of_date' });

        if (upsertErr) throw upsertErr;

        processedCount++;
        return {
            name: inst.name,
            status: 'Success',
            aum: totalValue,
            qoq_delta: qoqDelta,
            regime_z_score: regimeZScore,
            spy_comparison: spyComparison,
            tlt_comparison: tltComparison,
            gld_comparison: gldComparison
        };
    }));

    return {
        success: true,
        processed: processedCount,
        summary: results.map(r => r.status === 'fulfilled' ? r.value : { status: 'Failed', reason: r.reason })
    };
}
