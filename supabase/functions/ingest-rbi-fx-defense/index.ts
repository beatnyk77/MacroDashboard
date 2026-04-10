import { createClient } from '@supabase/supabase-js'

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
        console.log('Starting RBI FX Defense data ingestion...')
        if (!fredApiKey) throw new Error('FRED_API_KEY is not set.')

        // Fetch live economic proxies from RBI via FRED
        const [reservesRes, inrRes] = await Promise.all([
            fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=TRESEGINM052N&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=30`),
            fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=DEXINUS&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=60`)
        ])

        if (!reservesRes.ok || !inrRes.ok) {
            throw new Error(`FRED API Error: Reserves ${reservesRes.status}, INR ${inrRes.status}`)
        }

        const reservesData = await reservesRes.json() as any
        const inrData = await inrRes.json() as any

        if (!reservesData.observations || !inrData.observations) {
            throw new Error('Incomplete data received from FRED')
        }

        console.log(`Fetched ${reservesData.observations.length} reserve records and ${inrData.observations.length} INR records`)

        const results = []

        // Iterate through weekly reserves and find concurrent daily INR rate
        for (const obs of reservesData.observations) {
            const date = obs.date
            const resVal = parseFloat(obs.value)
            if (isNaN(resVal)) continue

            // Find closest INR rate on or before this date
            const inrObs = inrData.observations.find((r: any) => r.date <= date)
            const inrVal = (inrObs && !isNaN(parseFloat(inrObs.value))) ? parseFloat(inrObs.value) : 83.5

            const fx_reserves_bn = resVal / 1000

            // Synthetic REER calculation for UI display
            const reer = 100 + (83.0 - inrVal) * 2 + (fx_reserves_bn - 600) / 10
            const neer = 100 + (83.0 - inrVal) * 1.5 + (fx_reserves_bn - 600) / 15

            results.push({
                date: date,
                fx_reserves_bn: parseFloat(fx_reserves_bn.toFixed(2)),
                reer_40: parseFloat(reer.toFixed(2)),
                neer_40: parseFloat(neer.toFixed(2)),
                updated_at: new Date().toISOString()
            })
        }

        if (results.length > 0) {
            const { error: upsertError } = await supabase
                .from('rbi_fx_defense')
                .upsert(results, { onConflict: 'date' })
            if (upsertError) throw upsertError
        }

        return new Response(JSON.stringify({ success: true, count: results.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('RBI FX Defense Injection Error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
