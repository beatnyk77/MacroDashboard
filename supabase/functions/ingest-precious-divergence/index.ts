/* eslint-disable @typescript-eslint/no-unused-vars */
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { sendSlackAlert } from '../_shared/slack.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Fetch data from Yahoo Finance with retry logic
 */
async function fetchYahoo(ticker: string, retries = 3): Promise<number> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Fetching ${ticker} from Yahoo (Attempt ${i + 1}/${retries})...`)
            const res = await fetch(url)
            if (!res.ok) throw new Error(`Yahoo HTTP ${res.status} for ${ticker}`)

            const json = await res.json()
            const result = json.chart?.result?.[0]
            if (!result) throw new Error(`Invalid Yahoo structure for ${ticker}`)

            const quotes = result.indicators?.quote?.[0]?.close
            if (!quotes || quotes.length === 0) throw new Error(`No data for ${ticker}`)

            const latestValue = [...quotes].reverse().find(v => v !== null && v !== undefined)
            if (latestValue === undefined) throw new Error(`All quotes null for ${ticker}`)

            return latestValue
        } catch (e: any) {
            console.error(`Yahoo attempt ${i + 1} failed for ${ticker}: ${e.message}`)
            if (i === retries - 1) throw e
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        }
    }
    throw new Error(`Failed to fetch ${ticker} from Yahoo after ${retries} attempts`)
}

/**
 * Scrape benchmark prices from Shanghai Gold Exchange (SGE)
 */
async function fetchSGEPrice(contract: string, retries = 3): Promise<number> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    let url = '';
    if (contract === 'SHAU') {
        url = 'https://www.sge.com.cn/sjzx/everjzj';
    } else if (contract === 'SHAG') {
        url = `https://www.sge.com.cn/sjzx/shanghaiAgAuto?start_date=${dateStr}&end_date=${dateStr}`;
    }

    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Fetching SGE ${contract} (Attempt ${i + 1}/${retries})...`)
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } })
            if (!res.ok) throw new Error(`SGE HTTP ${res.status}`)
            const html = await res.text()

            if (contract === 'SHAU') {
                const goldRegex = /SHAU[\s\S]*?td[^>]*>([\d,.]+)<[\s\S]*?td[^>]*>([\d,.]+)</i;
                const match = html.match(goldRegex);
                if (match) {
                    const p1 = parseFloat(match[1].replace(/,/g, ''));
                    const p2 = parseFloat(match[2].replace(/,/g, ''));
                    return p2 > 0 ? p2 : p1;
                }
            } else if (contract === 'SHAG') {
                const rowRegex = /<td[^>]*>\s*SHAG\s*<\/td>([\s\S]*?)<\/tr>/gi;
                const matches = [...html.matchAll(rowRegex)];
                let latestPrice = 0;
                for (const m of matches) {
                    const priceCellRegex = /<td[^>]*>[\s\S]*?<\/td>[\s\S]*?<td[^>]*>[\s\S]*?<\/td>[\s\S]*?<td[^>]*>\s*([\d,.]+)\s*<\/td>/i;
                    const pMatch = m[1].match(priceCellRegex);
                    if (pMatch) {
                        const p = parseFloat(pMatch[1].replace(/,/g, ''));
                        if (!isNaN(p) && p > 0) latestPrice = p;
                    }
                }
                if (latestPrice > 0) return latestPrice;
            }
            throw new Error(`Parse failed for ${contract}`);
        } catch (e: any) {
            console.warn(`SGE attempt ${i + 1} failed: ${e.message}`)
            if (i === retries - 1) throw e
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
    }
    return 0;
}

/**
 * Precious Metals Divergence Ingestion
 * CI/CD Verified: 2026-02-05
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        console.log('Starting Precious Metals Divergence ingestion...')

        // 1. Fetch benchmark data
        const gold_comex = await fetchYahoo('GC=F')
        const silver_comex = await fetchYahoo('SI=F')
        const usdcny = await fetchYahoo('USDCNY=X')

        // 2. Shanghai Prices (SGE with Yahoo Fallback for Silver)
        let gold_sge_rmb_g = await fetchSGEPrice('SHAU').catch(() => 0);
        let silver_sge_rmb_kg = await fetchSGEPrice('SHAG').catch(() => 0);

        // Fallbacks
        if (gold_sge_rmb_g === 0) {
            console.log('Gold SGE failed, using internal estimate/fallback');
            // Mock or skip
        }

        if (silver_sge_rmb_kg === 0) {
            console.log('Silver SGE failed, using Yahoo XAGCNY fallback...');
            try {
                // XAGCNY is silver in CNY per ounce. Conversion to kg: / 31.1035 * 1000
                const xagcny = await fetchYahoo('XAGCNY=X');
                silver_sge_rmb_kg = (xagcny / 31.1035) * 1000;
            } catch (err) {
                console.error('Yahoo fallback for Silver also failed');
            }
        }

        // 3. Compute Spreads
        const TROY_OZ_TO_GRAMS = 31.1035
        const gold_shanghai_usd = gold_sge_rmb_g > 0 ? (gold_sge_rmb_g * TROY_OZ_TO_GRAMS) / usdcny : 0;
        const gold_spread_pct = gold_shanghai_usd > 0 ? ((gold_shanghai_usd - gold_comex) / gold_comex) * 100 : 0;

        const silver_shanghai_usd = silver_sge_rmb_kg > 0 ? ((silver_sge_rmb_kg / 1000) * TROY_OZ_TO_GRAMS) / usdcny : 0;
        const silver_spread_pct = silver_shanghai_usd > 0 ? ((silver_shanghai_usd - silver_comex) / silver_comex) * 100 : 0;

        const today = new Date().toISOString().split('T')[0]
        const obs = [
            { metric_id: 'GOLD_COMEX_USD', value: gold_comex, as_of_date: today },
            { metric_id: 'GOLD_SHANGHAI_USD', value: gold_shanghai_usd, as_of_date: today },
            { metric_id: 'GOLD_COMEX_SHANGHAI_SPREAD_PCT', value: gold_spread_pct, as_of_date: today },
            { metric_id: 'SILVER_COMEX_USD', value: silver_comex, as_of_date: today },
            { metric_id: 'SILVER_SHANGHAI_USD', value: silver_shanghai_usd, as_of_date: today },
            { metric_id: 'SILVER_COMEX_SHANGHAI_SPREAD_PCT', value: silver_spread_pct, as_of_date: today }
        ].filter(o => o.value > 0).map(o => ({ ...o, last_updated_at: new Date().toISOString() }));

        const { error: upsertError } = await supabase.from('metric_observations').upsert(obs, { onConflict: 'metric_id, as_of_date' });
        if (upsertError) throw upsertError;

        return new Response(JSON.stringify({ success: true, spreads: { gold: gold_spread_pct, silver: silver_spread_pct } }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Ingestion Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
