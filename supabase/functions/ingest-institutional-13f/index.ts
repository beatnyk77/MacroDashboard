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

        // Fetch Information Table XML (usually ends in _infotable.xml or similar)
        // For 13-F, the XML file is often listed in the filing directory
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

        // Lightweight XML extraction via Regex for high performance on Edge Function
        // We look for <ns1:cusip>...<ns1:value>... patterns
        const holdings: any[] = [];
        const cusipRegex = /<cusip>([^<]+)<\/cusip>[\s\S]*?<value>([^<]+)<\/value>/gi;
        let match;
        let totalValue = 0;

        while ((match = cusipRegex.exec(xmlText)) !== null) {
            const cusip = match[1].trim();
            const value = parseInt(match[2].trim(), 10) * 1000; // Values are in thousands
            holdings.push({ cusip, value });
            totalValue += value;
        }

        // Mapping: CUSIP -> Ticker -> Sector using Alpha Vantage
        // We'll prioritize the top 30 holdings to stay within performance limits
        const topHoldings = holdings.slice(0, 30);
        const sectorMapping: Record<string, number> = {};
        
        for (const holding of topHoldings) {
            try {
                if (!alphaVantageKey) {
                    console.warn("ALPHA_VANTAGE_API_KEY not found in environment");
                    break;
                }

                // 1. CUSIP to Ticker
                const searchUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${holding.cusip}&apikey=${alphaVantageKey}`;
                const searchRes = await fetch(searchUrl);
                const searchData = (await searchRes.json()) as any;
                const symbol = searchData.bestMatches?.[0]?.['1. symbol'];

                if (symbol) {
                    // 2. Ticker to Overview (Sector)
                    const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${alphaVantageKey}`;
                    const overviewRes = await fetch(overviewUrl);
                    const overviewData = (await overviewRes.json()) as any;
                    
                    const sector = overviewData.Sector || 'Other';
                    sectorMapping[sector] = (sectorMapping[sector] || 0) + (holding.value / totalValue) * 100;
                } else {
                    sectorMapping['Other'] = (sectorMapping['Other'] || 0) + (holding.value / totalValue) * 100;
                }
                
                // Rate limit respect
                await sleep(200); 

            } catch (e: any) {
                console.warn(`Mapping failed for CUSIP ${holding.cusip}: ${e.message}`);
                sectorMapping['Other'] = (sectorMapping['Other'] || 0) + (holding.value / totalValue) * 100;
            }
        }

        // Fetch previous AUM to calculate QoQ Delta
        const { data: prevData } = await client
            .from('institutional_13f_holdings')
            .select('total_aum')
            .eq('cik', inst.cik)
            .lt('as_of_date', reportDate)
            .order('as_of_date', { ascending: false })
            .limit(1)
            .maybeSingle();

        const qoqDelta = prevData?.total_aum ? ((totalValue - prevData.total_aum) / prevData.total_aum) * 100 : 0;

        // Upsert
        const { error: upsertErr } = await client.from('institutional_13f_holdings').upsert({
            fund_name: inst.name,
            fund_type: inst.type,
            cik: inst.cik,
            total_aum: totalValue,
            top_sectors: sectorMapping,
            qoq_delta: qoqDelta,
            as_of_date: reportDate,
            last_updated: new Date().toISOString()
        }, { onConflict: 'cik, as_of_date' });

        if (upsertErr) throw upsertErr;

        processedCount++;
        return { name: inst.name, status: 'Success', aum: totalValue };
    }));

    return { 
        success: true, 
        processed: processedCount,
        summary: results.map(r => r.status === 'fulfilled' ? r.value : { status: 'Failed', reason: r.reason })
    };
}
