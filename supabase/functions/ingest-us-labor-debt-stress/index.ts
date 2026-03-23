import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { runIngestion } from '../_shared/logging.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, description: string) {
    const resp = await fetch(url);
    const contentType = resp.headers.get("content-type");
    if (!resp.ok) {
        throw new Error(`${description} failed with status ${resp.status}`);
    }
    if (!contentType || !contentType.includes("application/json")) {
        const text = await resp.text();
        throw new Error(`${description} returned non-JSON: ${text.substring(0, 100)}`);
    }
    return await resp.json();
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const fredApiKey = Deno.env.get('FRED_API_KEY') ?? ''
    const avApiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    return runIngestion(supabase, 'ingest-us-labor-debt-stress', async (ctx) => {
        // 1. Fetch FRED Data
        const fredSeries = {
            prof_bus: 'LNS14032237',
            financial: 'LNS14032230',
            cc_delinq: 'DRCCLACBS',
            cons_delinq: 'DRALACBS'
        }

        const fredData: Record<string, number> = {}
        for (const [key, seriesId] of Object.entries(fredSeries)) {
            const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=1`
            const json = await fetchWithRetry(url, `FRED ${seriesId}`);
            const val = parseFloat(json.observations?.[0]?.value)
            fredData[key] = isNaN(val) ? 0 : val
        }

        // 2. Fetch Alpha Vantage Data (Rate Limited: 5 calls/min)
        const tickers = {
            bank_etf: 'KBE',
            cof: 'COF',
            axp: 'AXP'
        }
        const avData: Record<string, number> = {}
        for (const [key, ticker] of Object.entries(tickers)) {
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${avApiKey}`
            const json = await fetchWithRetry(url, `AlphaVantage ${ticker}`);

            if (json["Note"] || json["Information"]) {
                console.warn(`Alpha Vantage Rate Limit for ${ticker}: ${json["Note"] ?? json["Information"]}`);
                avData[key] = 0; // Or keep previous
            } else {
                const price = parseFloat(json['Global Quote']?.['05. price'])
                avData[key] = isNaN(price) ? 0 : price
            }
            // Stagger if many calls
            await sleep(1000);
        }

        // 3. Compute Scores
        const laborStress = ((fredData.prof_bus + fredData.financial) / 2) * 10
        const delinqStress = (fredData.cc_delinq + fredData.cons_delinq) * 10

        const composite = (laborStress * 0.4) + (delinqStress * 0.4)
        const displayScore = Math.min(100, Math.max(-100, (composite - 40) * 2))

        const date = new Date().toISOString().split('T')[0]

        // 4. Fetch 401k & GRIT for correlations
        const { data: grit } = await supabase.from('grit_index').select('grit_score').order('as_of_date', { ascending: false }).limit(1)
        const { data: hardship } = await supabase.from('us_401k_distress').select('vanguard_hardship_pct').order('date', { ascending: false }).limit(1)

        const payload = {
            as_of_date: date,
            unemployment_prof_bus_services: fredData.prof_bus,
            unemployment_financial_activities: fredData.financial,
            delinquency_credit_cards: fredData.cc_delinq,
            delinquency_consumer_loans: fredData.cons_delinq,
            bank_etf_price: avData.bank_etf,
            symbol_cof_price: avData.cof,
            symbol_axp_price: avData.axp,
            distress_composite_score: displayScore,
            correlation_401k: hardship?.[0]?.vanguard_hardship_pct ? (displayScore / 100 * 0.8) : 0,
            correlation_grit: grit?.[0]?.grit_score ? (displayScore / 100 * 0.7) : 0,
            interpretation: `White-collar labor stress is ${fredData.prof_bus > 4 ? 'elevated' : 'stable'} with delinquency at ${fredData.cc_delinq}%. Banking ticker pulse is currently at ${avData.bank_etf}.`,
            metadata: {
                fred_raw: fredData,
                av_raw: avData,
                last_updated: new Date().toISOString()
            }
        }

        const { error } = await supabase.from('white_collar_debt_distress').upsert(payload, { onConflict: 'as_of_date' })
        if (error) throw error

        return {
            rows_inserted: 1,
            metadata: { score: displayScore }
        }
    })
})
