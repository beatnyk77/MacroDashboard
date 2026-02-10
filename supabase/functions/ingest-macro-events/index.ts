import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { mapFinnhubEvent } from './utils.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const finnhubKey = Deno.env.get('FINNHUB_API_KEY') ?? ''

        if (!finnhubKey) {
            throw new Error('FINNHUB_API_KEY is not set in environment variables')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        console.log('Ingesting Live Macro Events from Finnhub...')

        // Calculate date range: Last 7 days to next 30 days
        const today = new Date()
        const fromDate = new Date(today)
        fromDate.setDate(today.getDate() - 7)
        const toDate = new Date(today)
        toDate.setDate(today.getDate() + 30)

        const fromStr = fromDate.toISOString().split('T')[0]
        const toStr = toDate.toISOString().split('T')[0]

        console.log(`Fetching events from ${fromStr} to ${toStr}`)

        const finnhubUrl = `https://finnhub.io/api/v1/calendar/economic?from=${fromStr}&to=${toStr}&token=${finnhubKey}`
        const response = await fetch(finnhubUrl)

        if (!response.ok) {
            throw new Error(`Finnhub API error: ${response.statusText}`)
        }

        const data = await response.json()
        const events = data.economicCalendar || []

        console.log(`Received ${events.length} events from Finnhub`)

        const eventsToUpsert = events.map(mapFinnhubEvent)

        // Deduplication: Finnhub sometimes has slight variations
        // The unique constraint in DB is (event_date, event_name, country)

        if (eventsToUpsert.length > 0) {
            console.log(`Upserting ${eventsToUpsert.length} live events...`)
            const { error: upsertError } = await supabase
                .from('upcoming_events')
                .upsert(eventsToUpsert, { onConflict: 'event_date, event_name, country' });

            if (upsertError) throw upsertError;
        }

        return new Response(JSON.stringify({
            message: 'Macro events updated with live Finnhub data',
            count: eventsToUpsert.length,
            dateRange: { from: fromStr, to: toStr }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Error in ingest-macro-events:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
})
