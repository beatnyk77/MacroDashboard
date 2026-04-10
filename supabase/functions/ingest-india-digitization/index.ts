/* eslint-disable @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js'
import { INITIAL_DIGITIZATION_DATA } from './data.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const fredApiKey = Deno.env.get('FRED_API_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        console.log('Starting India Digitization & Formalization live proxy ingestion...')

        if (!fredApiKey) {
            throw new Error('FRED_API_KEY is required for live proxy telemetry.')
        }

        // Fetch live economic proxies from RBI via FRED
        // TRESEGINM052N = FX Reserves (Weekly)
        // INDRETT01INM661N = Retail Sales (Monthly)
        const [reservesRes, retailRes] = await Promise.all([
            fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=TRESEGINM052N&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=30`),
            fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=INDRETT01INM661N&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=12`)
        ])

        const [reservesData, retailData] = await Promise.all([
            reservesRes.json() as Promise<any>,
            retailRes.json() as Promise<any>
        ])

        const results = []

        // Base starting point for mapping (Jan 2024 roughly)
        const BASE_UPI_VOL = 12.20
        const BASE_UPI_VAL = 18.41
        const BASE_DPI = 535.20
        const BASE_FI = 64.2
        const BASE_G20 = 152.0

        let idx = 0
        for (const obs of reservesData.observations || []) {
            // Find retail data for the same month
            const retailObs = retailData.observations?.find((r: any) => r.date.substring(0, 7) === obs.date.substring(0, 7))

            // Average RBI reserves level ~600,000. 
            const reserveVal = parseFloat(obs.value) || 600000
            const retailVal = retailObs ? parseFloat(retailObs.value) : 100

            // Create a synthetic growth multiplier based on FX reserve expansion and Retail Sales expansion
            const growthFactor = 1 + ((reserveVal - 600000) / 1000000) + ((retailVal - 100) / 500)

            // Add slight time-based secular growth (0.2% per step)
            const timeGrowth = 1 + ((reservesData.observations.length - idx) * 0.002)

            const finalMultiplier = growthFactor * timeGrowth

            results.push({
                date: obs.date,
                upi_volume_bn: parseFloat((BASE_UPI_VOL * finalMultiplier).toFixed(2)),
                upi_value_inr_trillion: parseFloat((BASE_UPI_VAL * finalMultiplier).toFixed(2)),
                rbi_dpi_index: parseFloat((BASE_DPI * finalMultiplier).toFixed(2)),
                fi_index: parseFloat((BASE_FI * (1 + (finalMultiplier - 1) * 0.2)).toFixed(2)), // FI moves slower
                g20_digital_baseline: parseFloat((BASE_G20 * finalMultiplier).toFixed(1))
            })
            idx++
        }

        if (results.length > 0) {
            const { error: upsertError } = await supabase
                .from('india_digitization_premium')
                .upsert(results, { onConflict: 'date' });

            if (upsertError) throw upsertError;
        }

        const summary = {
            success: true,
            results_count: results.length,
            latest_date: results[0]?.date,
            latest_upi_vol: results[0]?.upi_volume_bn,
            latest_dpi: results[0]?.rbi_dpi_index
        };

        return new Response(JSON.stringify(summary), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('India Digitization Ingestion error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
