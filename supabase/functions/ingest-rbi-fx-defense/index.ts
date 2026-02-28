import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { INITIAL_RBI_FX_DATA } from './data.ts'

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

        if (!fredApiKey) {
            console.warn('FRED_API_KEY not found, falling back to static data')
            const results = INITIAL_RBI_FX_DATA.map(d => ({ ...d, updated_at: new Date().toISOString() }))
            await supabase.from('rbi_fx_defense').upsert(results, { onConflict: 'date' })
            return new Response(JSON.stringify({ success: true, message: 'Using fallback data', count: results.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Fetch from FRED
        // TRESEGIDA161NW: International Reserves (Gold and Foreign Exchange) for India (USD Millions)
        // RBIRREER01NAV: REER for India
        // RBIBNEER01NAV: NEER for India
        const [reservesRes, reerRes, neerRes] = await Promise.all([
            fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=TRESEGIDA161NW&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=50`),
            fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=RBIRREER01NAV&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=50`),
            fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=RBIBNEER01NAV&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=50`)
        ])

        const [reservesData, reerData, neerData] = await Promise.all([
            reservesRes.json() as Promise<any>,
            reerRes.json() as Promise<any>,
            neerRes.json() as Promise<any>
        ])

        // Map data by date
        const dataMap = new Map<string, any>()

        reservesData.observations?.forEach((obs: any) => {
            if (!dataMap.has(obs.date)) dataMap.set(obs.date, { date: obs.date })
            const val = parseFloat(obs.value)
            if (!isNaN(val)) dataMap.get(obs.date).fx_reserves_bn = val / 1000
        })

        reerData.observations?.forEach((obs: any) => {
            if (!dataMap.has(obs.date)) dataMap.set(obs.date, { date: obs.date })
            const val = parseFloat(obs.value)
            if (!isNaN(val)) dataMap.get(obs.date).reer_40 = val
        })

        neerData.observations?.forEach((obs: any) => {
            if (!dataMap.has(obs.date)) dataMap.set(obs.date, { date: obs.date })
            const val = parseFloat(obs.value)
            if (!isNaN(val)) dataMap.get(obs.date).neer_40 = val
        })

        const finalResults = Array.from(dataMap.values())
            .filter(d => d.fx_reserves_bn || d.reer_40 || d.neer_40)
            .map(d => ({ ...d, updated_at: new Date().toISOString() }))

        if (finalResults.length > 0) {
            const { error: upsertError } = await supabase
                .from('rbi_fx_defense')
                .upsert(finalResults, { onConflict: 'date' })

            if (upsertError) throw upsertError
        }

        return new Response(JSON.stringify({
            success: true,
            results_count: finalResults.length,
            latest: finalResults[0]
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('RBI FX Defense ingestion error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
