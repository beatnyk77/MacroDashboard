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
 * Sources:
 * - Gold (SHAU): https://www.sge.com.cn/sjzx/everjzj (Simple table)
 * - Silver (SHAG): https://www.sge.com.cn/sjzx/shanghaiAgAuto (Multi-row table with sessions)
 */
async function fetchSGEPrice(contract: string, retries = 3): Promise<number> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    let url = '';
    if (contract === 'SHAU') {
        url = 'https://www.sge.com.cn/sjzx/everjzj';
    } else if (contract === 'SHAG') {
        url = `https://www.sge.com.cn/sjzx/shanghaiAgAuto?start_date=${dateStr}&end_date=${dateStr}`;
    }

    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Fetching SGE ${contract} from ${url} (Attempt ${i + 1}/${retries})...`)
            // Note: Removed User-Agent to mimic curl behavior, as browser UA seemed to trigger JS-rendered page for Silver
            const res = await fetch(url)
            if (!res.ok) throw new Error(`SGE HTTP ${res.status}`)
            const html = await res.text()

            if (contract === 'SHAU') {
                // Gold Table: <tr><td>DATE</td>...<td>Price1</td><td>Price2</td></tr>
                // structure: <td align="center">1240.99</td>
                // We assume the first row with SHAU is the one we want.
                // Regex to find SHAU then the next number cells.

                // Example: <td align="center"><span class="colorRed">SHAU</span></td>...<td align="center">1240.99</td>
                const goldRegex = /SHAU[\s\S]*?td[^>]*>([\d,.]+)<[\s\S]*?td[^>]*>([\d,.]+)</i;
                const match = html.match(goldRegex);
                if (!match) {
                    throw new Error(`SHAU data not found in HTML (Len: ${html.length})`);
                }
                const p1 = parseFloat(match[1].replace(/,/g, ''));
                const p2 = parseFloat(match[2].replace(/,/g, ''));
                return p2 > 0 ? p2 : p1;

            } else if (contract === 'SHAG') {
                // Silver Table: Multiple rows.
                // We want to capture ALL price rows and pick the last one.
                // Structure: <td>INDEX</td><td>DATE</td><td>SHAG</td><td>SESSION</td><td>ROUND</td><td>PRICE</td>
                // We use matchAll to find all rows where <td>SHAG</td> appears.
                // Row ends with </tr>.
                // Allow whitespace around SHAG: <td...> \s* SHAG \s* </td>

                const rowRegex = /<td[^>]*>\s*SHAG\s*<\/td>([\s\S]*?)<\/tr>/gi;
                const matches = [...html.matchAll(rowRegex)];

                if (matches.length === 0) {
                    // Log snippet for debug if needed, but fail gracefully
                    const debugSnippet = html.substring(0, 500).replace(/\n/g, '\\n');
                    throw new Error(`SHAG row not found in HTML (No User-Agent). Snippet: ${debugSnippet}`);
                }

                let latestPrice = 0;

                for (const m of matches) {
                    const rowContent = m[1]; // Content after <td>SHAG</td>
                    // Expect 3 cells: Session, Round, Price
                    // regex: matches 3 distinct <td>...</td> blocks.
                    // <td...>...</td> ... <td...>...</td> ... <td...>(PRICE)</td>

                    const priceCellRegex = /<td[^>]*>[\s\S]*?<\/td>[\s\S]*?<td[^>]*>[\s\S]*?<\/td>[\s\S]*?<td[^>]*>\s*([\d,.]+)\s*<\/td>/i;
                    // Note: Price usually is an integer like 29980, but float safe.

                    const pMatch = rowContent.match(priceCellRegex);
                    if (pMatch) {
                        const p = parseFloat(pMatch[1].replace(/,/g, ''));
                        if (!isNaN(p) && p > 0) {
                            latestPrice = p; // Keep updating to capture last one (usually PM/latest)
                        }
                    }
                }

                if (latestPrice === 0) {
                    throw new Error(`Failed to parse any valid SHAG price from ${matches.length} rows`);
                }
                return latestPrice;
            }

            return 0; // Should not reach
        } catch (e: any) {
            console.error(`SGE attempt ${i + 1} failed for ${contract}: ${e.message}`)
            if (i === retries - 1) throw e
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        }
    }
    throw new Error(`Failed to fetch ${contract} from SGE after ${retries} attempts`)
}

/**
 * Precious Metals Divergence Ingestion
 * Sources: Yahoo Finance (COMEX & FX), SGE (Shanghai Benchmarks)
 * Calculates spread between COMEX and Shanghai benchmark prices.
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        console.log('Starting Precious Metals Divergence ingestion (SGE vs COMEX)...')

        // 1. Fetch required data
        const gold_comex = await fetchYahoo('GC=F')
        const silver_comex = await fetchYahoo('SI=F')
        const usdcny = await fetchYahoo('USDCNY=X')

        const gold_sge_rmb_g = await fetchSGEPrice('SHAU')

        // Attempt Silver fetch, but don't fail entire ingestion if it fails
        let silver_sge_rmb_kg = 0;
        try {
            silver_sge_rmb_kg = await fetchSGEPrice('SHAG');
        } catch (err: any) {
            console.error(`Silver SGE fetch failed: ${err.message}. Proceeding with Silver = 0.`);
            await sendSlackAlert(`Silver SGE fetch failed: ${err.message}. Divergence metric will be incomplete.`);
        }

        console.log('Data fetched:', { gold_comex, silver_comex, usdcny, gold_sge_rmb_g, silver_sge_rmb_kg })

        // 2. Compute Conversions and Spreads
        // Constants
        const TROY_OZ_TO_GRAMS = 31.1035

        // Gold: SHAU (RMB/g) * 31.1035 (g/oz) / USDCNY (RMB/USD) -> USD/oz
        const gold_shanghai_usd = (gold_sge_rmb_g * TROY_OZ_TO_GRAMS) / usdcny
        const gold_spread_pct = ((gold_shanghai_usd - gold_comex) / gold_comex) * 100

        // Silver: SHAG (RMB/kg) / 1000 (g/kg) * 31.1035 (g/oz) / USDCNY (RMB/USD) -> USD/oz
        // If silver_sge is 0, spread calculation will be invalid/negative large. We can set it to 0 or leave as is (garbage out).
        // Better to set to 0.
        let silver_shanghai_usd = 0;
        let silver_spread_pct = 0;

        if (silver_sge_rmb_kg > 0) {
            silver_shanghai_usd = ((silver_sge_rmb_kg / 1000) * TROY_OZ_TO_GRAMS) / usdcny
            silver_spread_pct = ((silver_shanghai_usd - silver_comex) / silver_comex) * 100
        }

        const today = new Date().toISOString().split('T')[0]
        const now = new Date().toISOString()

        // 3. Prepare metric observations
        const observations = [
            { metric_id: 'GOLD_COMEX_USD', value: gold_comex, as_of_date: today },
            { metric_id: 'GOLD_SHANGHAI_USD', value: gold_shanghai_usd, as_of_date: today },
            { metric_id: 'GOLD_COMEX_SHANGHAI_SPREAD_PCT', value: gold_spread_pct, as_of_date: today },
            { metric_id: 'SILVER_COMEX_USD', value: silver_comex, as_of_date: today },
        ];

        // Only add Silver SGE metrics if valid
        if (silver_sge_rmb_kg > 0) {
            observations.push({ metric_id: 'SILVER_SHANGHAI_USD', value: silver_shanghai_usd, as_of_date: today });
            observations.push({ metric_id: 'SILVER_COMEX_SHANGHAI_SPREAD_PCT', value: silver_spread_pct, as_of_date: today });
        }

        const observationsWithTime = observations.map(obs => ({
            ...obs,
            last_updated_at: now
        }))

        console.log('Upserting observations:', observationsWithTime)

        const { error: upsertError } = await supabase
            .from('metric_observations')
            .upsert(observationsWithTime, { onConflict: 'metric_id, as_of_date' })

        if (upsertError) throw upsertError

        console.log(`Ingestion successful. Spreads: Gold ${gold_spread_pct.toFixed(2)}%, Silver ${silver_spread_pct.toFixed(2)}%`)

        return new Response(JSON.stringify({
            message: 'Ingestion complete',
            data: {
                gold_spread_pct,
                silver_spread_pct,
                gold_comex,
                gold_shanghai_usd,
                silver_comex,
                silver_shanghai_usd,
                usdcny
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('Ingestion Error:', error.message)
        await sendSlackAlert(`Precious metals divergence ingestion failed: ${error.message}`);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
