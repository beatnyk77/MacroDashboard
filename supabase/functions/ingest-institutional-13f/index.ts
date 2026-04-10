/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js'

const ALPHA_VANTAGE_DELAY_MS = parseInt(Deno.env.get('ALPHA_VANTAGE_DELAY_MS') || '12000');

Deno.serve(async (_req: Request) => {
    const start = new Date().toISOString();
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const client = createClient(supabaseUrl, supabaseKey);
    let result: any = { success: false };

    console.log(`[HARDENING_v2_ACTIVE] Starting 13-F Ingestion at ${start}`);
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
        console.error(`[CRITICAL] Function failed: ${e.message}`, e);
        await client.from('ingestion_logs').insert({
            function_name: 'ingest-institutional-13f',
            status: 'failed',
            error_message: e.message || 'Unknown error',
            start_time: start,
            completed_at: new Date().toISOString(),
            status_code: 500
        });
        return new Response(JSON.stringify({ error: e.message || 'Internal Server Error' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

const secHeaders = {
    'User-Agent': 'VibeCode KartikaySharma@macrodashboard.com',
    'Accept-Encoding': 'gzip, deflate'
};

const GOLD_ETFS = ['GLD', 'IAU', 'BAR', 'SGOL', 'OUNZ', 'BCM', 'GLDM'];
const BOND_ETFS = ['TLT', 'IEI', 'IEF', 'SHY', 'LQD', 'HYG', 'TIP', 'BND', 'AGG', 'EMB', 'MUB', 'SCHP', 'VTIP', 'BIL'];

function classifyAssetClass(ticker: string): 'equity' | 'bond' | 'gold' | 'other' {
    const t = ticker.toUpperCase();
    if (GOLD_ETFS.includes(t)) return 'gold';
    if (BOND_ETFS.includes(t)) return 'bond';
    return 'equity';
}

async function fetchBenchmarkReturns(alphaVantageKey: string): Promise<{spy: number, tlt: number, gld: number}> {
    const tickers = { SPY: 0, TLT: 0, GLD: 0 };
    for (const ticker of ['SPY', 'TLT', 'GLD']) {
        try {
            const url = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${ticker}&apikey=${alphaVantageKey}`;
            const res = await fetch(url);
            const data = (await res.json()) as any;
            const ts = data['Monthly Time Series'];
            if (!ts) continue;
            const dates = Object.keys(ts).sort().reverse();
            if (dates.length >= 3) {
                const latest = parseFloat(ts[dates[0]]['4. close']);
                const old = parseFloat(ts[dates[2]]['4. close']);
                tickers[ticker as keyof typeof tickers] = ((latest - old) / old) * 100;
            }
        } catch (e) {
            console.warn(`Failed to fetch ${ticker}: ${e}`);
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
    { name: 'Temasek Holdings', cik: '0001021944', type: 'Sovereign Wealth' },
    { name: 'BlackRock Inc.', cik: '0001364762', type: 'Asset Manager' },
    { name: 'Vanguard Group Inc.', cik: '0000102905', type: 'Asset Manager' },
    { name: 'State Street Corp', cik: '0000093751', type: 'Asset Manager' },
    { name: 'FMR LLC', cik: '0000315066', type: 'Asset Manager' },
    { name: 'Capital Research and Management Co', cik: '0000702011', type: 'Asset Manager' },
    { name: 'Blackstone Inc', cik: '0001342606', type: 'Asset Manager' },
    { name: 'Bridgewater Associates, LP', cik: '0001352464', type: 'Hedge Fund' },
    { name: 'CalPERS', cik: '0000919079', type: 'Pension Fund' },
    { name: 'CalSTRS', cik: '0000919844', type: 'Pension Fund' },
    { name: 'Ontario Teachers\' Pension Plan', cik: '0001563816', type: 'Pension Fund' }
];

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processInstitutional13F(client: any) {
    let processedCount = 0;
    const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    if (!alphaVantageKey) throw new Error('ALPHA_VANTAGE_API_KEY is not set');

    const benchmarks = await fetchBenchmarkReturns(alphaVantageKey);

    const results = await Promise.allSettled(INSTITUTIONS.map(async (inst) => {
        const cikStr = inst.cik.padStart(10, '0');
        const submissionUrl = `https://data.sec.gov/submissions/CIK${cikStr}.json`;

        const subRes = await fetch(submissionUrl, { headers: secHeaders });
        if (!subRes.ok) {
            console.error(`[SEC] Failed to fetch submissions for ${inst.name}: ${subRes.status}`);
            throw new Error(`Failed to fetch submissions for ${inst.name}`);
        }

        const subData = (await subRes.json()) as any;
        if (!subData) throw new Error(`Empty submission data for ${inst.name}`);
        
        const filings = subData.filings?.recent;
        if (!filings) {
            console.warn(`[${inst.name}] No recent filings found in SEC metadata.`);
            return { name: inst.name, status: 'No direct filings', cik: inst.cik };
        }

        const idx = filings.form.findIndex((f: string) => f === '13F-HR' || f === '13F-HR/A');
        if (idx === -1) {
            console.warn(`[${inst.name}] No 13F-HR filing found. Available: ${filings.form.join(', ')}`);
            return { name: inst.name, status: 'No 13F found', cik: inst.cik };
        }

        const accessionNum = filings.accessionNumber[idx].replace(/-/g, '');
        const reportDate = filings.reportDate[idx];

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

        const holdings: Array<{cusip: string, value: number, issuerName?: string}> = [];
        const entryRegex = /<nameOfIssuer>([^<]+)<\/nameOfIssuer>[\s\S]*?<cusip>([^<]+)<\/cusip>[\s\S]*?<value>([^<]+)<\/value>/gi;
        let match;
        let totalValue = 0;

        while ((match = entryRegex.exec(xmlText)) !== null) {
            const issuerName = match[1].trim();
            const cusip = match[2].trim();
            const value = parseInt(match[3].trim(), 10) * 1000;
            holdings.push({ cusip, value, issuerName });
            totalValue += value;
        }

        if (holdings.length === 0) {
            console.warn(`[${inst.name}] Comprehensive parsing failed, falling back to CUSIP-only`);
            const cusipRegex = /<cusip>([^<]+)<\/cusip>[\s\S]*?<value>([^<]+)<\/value>/gi;
            while ((match = cusipRegex.exec(xmlText)) !== null) {
                const cusip = match[1].trim();
                const value = parseInt(match[2].trim(), 10) * 1000;
                holdings.push({ cusip, value });
                totalValue += value;
            }
        }

        if (holdings.length === 0) throw new Error(`Failed to parse any holdings from XML for ${inst.name}`);

        console.log(`[${inst.name}] Parsed ${holdings.length} holdings from XML`);

        const topHoldings = holdings.slice(0, 20);
        const sectorMapping: Record<string, number> = {};
        const enrichedHoldings: Array<{cusip: string, value: number, ticker?: string, sector?: string, name?: string}> = [];

        async function getTickerInfo(cusip: string, issuerName?: string): Promise<{ticker: string | null, name: string | null, sector: string | null}> {
            const cacheRes = await client
                .from('cusip_ticker_cache')
                .select('ticker, company_name, sector, fetched_at')
                .eq('cusip', cusip)
                .maybeSingle();

            if (!cacheRes) {
                console.error(`[Hardening] Database fetch for cache returned undefined for ${cusip}`);
                return { ticker: null, name: null, sector: null };
            }

            const { data: cached, error: cacheErr } = cacheRes;
            if (cacheErr) console.warn(`[Hardening] Cache select error for ${cusip}: ${cacheErr.message}`);

            const cacheValid = cached && (new Date(cached.fetched_at) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
            if (cacheValid) {
                client.from('cusip_ticker_cache').update({ last_used_at: new Date().toISOString() }).eq('cusip', cusip).catch(() => {});
                return { ticker: cached.ticker, name: cached.company_name, sector: cached.sector };
            }

            try {
                let ticker: string | null = null;
                let name: string | null = null;
                let sector: string | null = null;

                if (issuerName) {
                    console.log(`[AV] Searching by issuer name: ${issuerName}`);
                    const searchUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(issuerName)}&apikey=${alphaVantageKey}`;
                    const searchRes = await fetch(searchUrl);
                    if (searchRes.ok) {
                        const searchData = (await searchRes.json()) as any;
                        if (searchData && !searchData.Note && !searchData['Error Message']) {
                            const matches = searchData.bestMatches || [];
                            if (matches.length > 0) {
                                ticker = matches[0]['1. symbol'];
                                console.log(`[AV] Found ticker ${ticker} for ${issuerName}`);
                            }
                        }
                    }
                    await sleep(ALPHA_VANTAGE_DELAY_MS);
                }

                if (!ticker) {
                    console.log(`[AV] Name search failed for ${issuerName || 'N/A'}, trying CUSIP: ${cusip}`);
                    const searchUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${cusip}&apikey=${alphaVantageKey}`;
                    const searchRes = await fetch(searchUrl);
                    if (searchRes.ok) {
                        const searchData = (await searchRes.json()) as any;
                        if (searchData && !searchData.Note && !searchData['Error Message'] && searchData.bestMatches?.length > 0) {
                            ticker = searchData.bestMatches[0]['1. symbol'];
                            console.log(`[AV] Found ticker ${ticker} from CUSIP search`);
                        }
                    }
                    await sleep(ALPHA_VANTAGE_DELAY_MS);
                }

                if (ticker) {
                    const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${alphaVantageKey}`;
                    const overviewRes = await fetch(overviewUrl);
                    if (overviewRes.ok) {
                        const overviewData = (await overviewRes.json()) as any;
                        if (overviewData && overviewData.Symbol) {
                            sector = overviewData.Sector || 'Other';
                            name = overviewData.Name || overviewData.description || issuerName || null;
                        }
                    }
                    await sleep(ALPHA_VANTAGE_DELAY_MS);
                }

                await client.from('cusip_ticker_cache').upsert({
                    cusip,
                    ticker,
                    company_name: name || issuerName || null,
                    sector,
                    fetched_at: new Date().toISOString(),
                    last_used_at: new Date().toISOString()
                }, { onConflict: 'cusip' });

                return { ticker, name, sector };
            } catch (e: any) {
                console.warn(`Alpha Vantage fetch failed for CUSIP ${cusip}: ${e.message}`);
                return { ticker: null, name: null, sector: null };
            }
        }

        for (const holding of topHoldings) {
            try {
                const info = await getTickerInfo(holding.cusip, holding.issuerName);
                const ticker = info.ticker;
                const sector = info.sector || 'Other';
                const name = info.name;

                if (ticker) {
                    sectorMapping[sector] = (sectorMapping[sector] || 0) + (holding.value / totalValue) * 100;
                    enrichedHoldings.push({
                        cusip: holding.cusip,
                        value: holding.value,
                        ticker,
                        sector,
                        name
                    });
                } else {
                    console.log(`[${inst.name}] No ticker for ${holding.issuerName || holding.cusip} → marked as Other`);
                    sectorMapping['Other'] = (sectorMapping['Other'] || 0) + (holding.value / totalValue) * 100;
                    enrichedHoldings.push(holding);
                }
            } catch (e: any) {
                console.warn(`Mapping failed for CUSIP ${holding.cusip}: ${e.message}`);
                sectorMapping['Other'] = (sectorMapping['Other'] || 0) + (holding.value / totalValue) * 100;
                enrichedHoldings.push(holding);
            }
        }

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

        const sortedForTop = [...enrichedHoldings].sort((a, b) => b.value - a.value);
        const top10 = sortedForTop.slice(0, 10).map(h => ({
            cusip: h.cusip,
            ticker: h.ticker || null,
            name: h.name || null,
            value: h.value,
            sector: h.sector || null,
            concentration_contribution: (h.value / totalValue) * 100
        }));

        const top5 = sortedForTop.slice(0, 5);
        const concentrationScore = top5.reduce((sum, h) => sum + (h.value / totalValue) * 100, 0);

        const prevAumRes = await client
            .from('institutional_13f_holdings')
            .select('total_aum, top_sectors, asset_class_allocation')
            .eq('cik', inst.cik)
            .lt('as_of_date', reportDate)
            .order('as_of_date', { ascending: false })
            .limit(1)
            .maybeSingle();

        const prevData = prevAumRes?.data || null;
        const qoqDelta = prevData?.total_aum ? ((totalValue - prevData.total_aum) / prevData.total_aum) * 100 : 0;

        const getTop3Sum = (sectors: Record<string, number> | null) => {
            if (!sectors) return 0;
            const values = Object.values(sectors).sort((a,b) => b - a);
            return values.slice(0,3).reduce((a,b) => a+b, 0);
        };
        const currTop3Sum = getTop3Sum(sectorMapping);
        const prevTop3Sum = prevData?.top_sectors ? getTop3Sum(prevData.top_sectors as Record<string, number>) : 0;
        const top3Delta = currTop3Sum - prevTop3Sum;
        const sectorRotationSignal = top3Delta > 1 ? 'ACCUMULATE' : top3Delta < -1 ? 'REDUCE' : 'NEUTRAL';

        const historyRes = await client
            .from('institutional_13f_holdings')
            .select('as_of_date, asset_class_allocation')
            .eq('cik', inst.cik)
            .lt('as_of_date', reportDate)
            .order('as_of_date', { ascending: false })
            .limit(7);

        const historyRows = historyRes?.data || [];
        const historicalAllocation = [];
        if (historyRows) {
            for (const row of historyRows.reverse()) {
                if (row.asset_class_allocation) {
                    historicalAllocation.push({
                        quarter: row.as_of_date,
                        ...row.asset_class_allocation
                    });
                }
            }
        }
        historicalAllocation.push({
            quarter: reportDate,
            equity_pct: assetClassAllocation.equity_pct,
            bond_pct: assetClassAllocation.bond_pct,
            gold_pct: assetClassAllocation.gold_pct,
            other_pct: assetClassAllocation.other_pct
        });
        if (historicalAllocation.length > 8) {
            historicalAllocation.splice(0, historicalAllocation.length - 8);
        }

        const equityPcts = historicalAllocation.map(h => Number(h.equity_pct) || 0);
        const meanEquity = equityPcts.reduce((a,b) => a+b, 0) / equityPcts.length;
        const variance = equityPcts.reduce((sum, val) => sum + Math.pow(val - meanEquity, 2), 0) / equityPcts.length;
        const stdDev = Math.sqrt(variance);
        const regimeZScore = stdDev === 0 ? 0 : (Number(assetClassAllocation.equity_pct) - meanEquity) / stdDev;

        const spyComparison = qoqDelta - benchmarks.spy;
        const tltComparison = qoqDelta - benchmarks.tlt;
        const gldComparison = qoqDelta - benchmarks.gld;

        const upsertResult = await client.from('institutional_13f_holdings').upsert({
            fund_name: inst.name,
            fund_type: inst.type,
            cik: inst.cik,
            total_aum: totalValue,
            top_sectors: sectorMapping,
            qoq_delta: qoqDelta,
            as_of_date: reportDate,
            last_updated: new Date().toISOString(),
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

        if (!upsertResult || upsertResult.error) throw new Error(`Upsert failed for ${inst.name}`);

        const prevHoldingRes = await client
            .from('institutional_13f_holdings')
            .select('top_holdings')
            .eq('cik', inst.cik)
            .lt('as_of_date', reportDate)
            .order('as_of_date', { ascending: false })
            .limit(1)
            .maybeSingle();

        const prevHoldingRow = prevHoldingRes?.data || null;
        const prevHoldingsList = (prevHoldingRow?.top_holdings as any[]) || [];

        const prevHoldingsMap = new Map<string, any>();
        prevHoldingsList.forEach(h => {
            const key = (h.ticker || h.cusip);
            if (key) prevHoldingsMap.set(key, h);
        });

        const tradesToInsert: any[] = [];

        for (const cur of enrichedHoldings) {
            const curUsd = cur.value;
            const key = cur.ticker || cur.cusip;
            const prev = prevHoldingsMap.get(key);
            const prevUsd = prev?.value || 0;

            const deltaUsd = curUsd - prevUsd;
            let deltaPct = 0;
            if (prevUsd > 0) deltaPct = (deltaUsd / prevUsd) * 100;
            else if (prevUsd === 0 && curUsd > 0) deltaPct = 100;

            const isNew = prevUsd === 0 && curUsd > 0;
            const isExit = curUsd === 0 && prevUsd > 0;
            const isSignificant = Math.abs(deltaPct) > 2;

            if (!isNew && !isExit && !isSignificant) continue;

            let trade_type: string;
            let direction: string;
            if (isNew) { trade_type = 'INITIATE'; direction = 'ACCUMULATE'; }
            else if (isExit) { trade_type = 'EXIT'; direction = 'DISTRIBUTE'; }
            else if (deltaPct > 0) { trade_type = 'INCREASE'; direction = 'ACCUMULATE'; }
            else { trade_type = 'DECREASE'; direction = 'DISTRIBUTE'; }

            let conviction = Math.min(10, Math.abs(deltaPct) * 2);

            tradesToInsert.push({
                cik: inst.cik,
                fund_name: inst.name,
                ticker: cur.ticker || null,
                cusip: cur.cusip,
                trade_type,
                direction,
                sector: cur.sector || null,
                prior_qty_usd: prevUsd,
                current_qty_usd: curUsd,
                delta_usd: deltaUsd,
                delta_pct: deltaPct,
                price_change_pct: null,
                conviction_score: conviction,
                as_of_date: reportDate
            });
        }

        if (tradesToInsert.length > 0 && alphaVantageKey) {
            for (const trade of tradesToInsert) {
                if (!trade.ticker) continue;
                try {
                    const priceUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${trade.ticker}&apikey=${alphaVantageKey}`;
                    const res = await fetch(priceUrl);
                    const data = (await res.json()) as any;
                    const ts = data['Monthly Time Series'];
                    if (ts) {
                        const dates = Object.keys(ts).sort().reverse();
                        if (dates.length >= 4) {
                            const latest = parseFloat(ts[dates[0]]['4. close']);
                            const threeMonthsAgo = dates[3];
                            const old = parseFloat(ts[threeMonthsAgo]['4. close']);
                            const priceChange = ((latest - old) / old) * 100;
                            trade.price_change_pct = priceChange;
                            if (Math.abs(priceChange) > 5) {
                                trade.conviction_score = Math.min(10, trade.conviction_score + 2);
                            }
                        }
                    }
                } catch (e) {
                    console.warn(`Failed to fetch price for ${trade.ticker}: ${e}`);
                }
                await sleep(ALPHA_VANTAGE_DELAY_MS);
            }
        }

        if (tradesToInsert.length > 0) {
            await client.from('institutional_trades_inferred').delete().eq('cik', inst.cik).eq('as_of_date', reportDate);
            const insertResult = await client.from('institutional_trades_inferred').insert(tradesToInsert);
            if (!insertResult || insertResult.error) throw new Error(`Trade insert failed for ${inst.name}`);
        }

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
