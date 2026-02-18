import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { mapFinnhubEvent } from './utils.ts'

// --- SHARED UTILS ---
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    taskName: string
): Promise<T> {
    let timeoutId: any;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`${taskName} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });
    try {
        const result = await Promise.race([promise, timeoutPromise]);
        return result;
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}

async function logIngestionStart(
    supabase: SupabaseClient,
    functionName: string,
    metadata: any = {}
): Promise<number | null> {
    try {
        const { data, error } = await supabase
            .from('ingestion_logs')
            .insert({
                function_name: functionName,
                status: 'started',
                metadata: metadata,
                start_time: new Date().toISOString()
            })
            .select('id')
            .single()

        if (error) {
            console.error('Failed to create ingestion log:', error)
            return null
        }
        return data.id
    } catch (err) {
        console.error('Error creating ingestion log:', err)
        return null
    }
}

async function logIngestionEnd(
    supabase: SupabaseClient,
    logId: number | null,
    status: 'success' | 'failed' | 'timeout',
    details: {
        error_message?: string,
        rows_inserted?: number,
        rows_updated?: number,
        metadata?: any
    }
) {
    if (!logId) return
    try {
        const updateData: any = {
            completed_at: new Date().toISOString(),
            status: status,
            ...details
        }
        const { error } = await supabase
            .from('ingestion_logs')
            .update(updateData)
            .eq('id', logId)
        if (error) {
            console.error('Failed to update ingestion log:', error)
        }
    } catch (err) {
        console.error('Error updating ingestion log:', err)
    }
}

async function handleMockFallback(supabase: SupabaseClient, logId: number | null) {
    const mockEvents = [
        {
            event_date: new Date().toISOString(),
            event_name: 'RBI Monetary Policy Meeting (Mock)',
            country: 'India',
            impact_level: 'High',
            forecast: '6.50%',
            previous: '6.50%',
            actual: null,
            surprise: null,
            source_url: 'Mock Fallback'
        },
        {
            event_date: new Date(Date.now() + 86400000).toISOString(),
            event_name: 'US CPI Inflation Data (Mock)',
            country: 'USA',
            impact_level: 'High',
            forecast: '3.1%',
            previous: '3.4%',
            actual: null,
            surprise: null,
            source_url: 'Mock Fallback'
        }
    ];
    const { error: mockError } = await supabase.from('upcoming_events').upsert(mockEvents, { onConflict: 'event_date, event_name, country' });
    if (mockError) throw mockError;

    await logIngestionEnd(supabase, logId, 'success', { rows_inserted: mockEvents.length, metadata: { status: 'mocked' } });
    return new Response(JSON.stringify({ count: mockEvents.length, status: 'mocked' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// --- MAIN FUNCTION ---
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const logId = await logIngestionStart(supabase, 'ingest-macro-events');

    try {
        const finnhubKey = Deno.env.get('FINNHUB_API_KEY') ?? ''
        if (!finnhubKey) throw new Error('FINNHUB_API_KEY is not set in environment variables');

        console.log('Ingesting Live Macro Events from Finnhub...')
        const today = new Date()
        const fromDate = new Date(today)
        fromDate.setDate(today.getDate() - 7)
        const toDate = new Date(today)
        toDate.setDate(today.getDate() + 30)

        const fromStr = fromDate.toISOString().split('T')[0]
        const toStr = toDate.toISOString().split('T')[0]

        const finnhubUrl = `https://finnhub.io/api/v1/calendar/economic?from=${fromStr}&to=${toStr}&token=${finnhubKey}`
        let response: Response;
        try {
            response = await withTimeout(fetch(finnhubUrl), 30000, 'Finnhub API Fetch');
        } catch (fetchErr: any) {
            console.warn(`Finnhub fetch error: ${fetchErr.message}. Falling back to mock data.`);
            return await handleMockFallback(supabase, logId);
        }

        if (!response.ok) {
            console.warn(`Finnhub API error: ${response.status} ${response.statusText}. Falling back to mock data.`);
            return await handleMockFallback(supabase, logId);
        }

        const rawData: any = await response.json()
        const events = rawData.economicCalendar || []
        const eventsToUpsert = events.map(mapFinnhubEvent)

        if (eventsToUpsert.length > 0) {
            const { error: upsertError } = await supabase
                .from('upcoming_events')
                .upsert(eventsToUpsert, { onConflict: 'event_date, event_name, country' });
            if (upsertError) throw upsertError;
        }

        const result = { count: eventsToUpsert.length, dateRange: { from: fromStr, to: toStr } };
        await logIngestionEnd(supabase, logId, 'success', { rows_inserted: eventsToUpsert.length, metadata: result });

        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error('Fatal ingestion error:', error);
        if (logId) await logIngestionEnd(supabase, logId, 'failed', { error_message: error.message });
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }
})
