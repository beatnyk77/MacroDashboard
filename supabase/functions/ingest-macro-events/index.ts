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

// Circuit breaker state (in-memory, resets on cold start)
const circuitBreaker = {
    consecutiveFailures: 0,
    lastFailureTime: 0,
    isOpen: false,
    shouldAttempt(): boolean {
        if (!this.isOpen) return true;
        // If circuit is open, allow retry after 10 minutes
        if (Date.now() - this.lastFailureTime > 10 * 60 * 1000) {
            this.isOpen = false;
            this.consecutiveFailures = 0;
            return true;
        }
        return false;
    },
    recordSuccess(): void {
        this.consecutiveFailures = 0;
        this.isOpen = false;
    },
    recordFailure(): void {
        this.consecutiveFailures++;
        this.lastFailureTime = Date.now();
        if (this.consecutiveFailures >= 3) {
            this.isOpen = true;
            console.error('Circuit breaker OPENED for Finnhub API due to repeated failures');
        }
    }
};

// Check if API key is likely valid based on response
function isAuthError(response: Response): boolean {
    return response.status === 401 || response.status === 403;
}

function isRateLimitError(response: Response): boolean {
    return response.status === 429 || response.status === 402; // 402 = Payment Required
}

async function fetchWithRetry(url: string, maxRetries: number = 2): Promise<Response> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url);

            if (response.ok) {
                return response;
            }

            if (isAuthError(response)) {
                throw new Error(`Finnhub API authentication failed (${response.status}). Check API key validity and plan subscription.`);
            }

            if (isRateLimitError(response)) {
                const waitMs = attempt * 5000; // 5s, 10s backoff
                console.warn(`Finnhub rate limited (attempt ${attempt}). Retrying in ${waitMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitMs));
                continue;
            }

            // Other HTTP errors - retry once
            if (attempt < maxRetries) {
                console.warn(`Finnhub HTTP ${response.status} (attempt ${attempt}). Retrying...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }

            throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`);

        } catch (error: any) {
            if (attempt === maxRetries) throw error;
            console.warn(`Fetch attempt ${attempt} failed: ${error.message}. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    throw new Error('Max retries exceeded');
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

async function handleMockFallback(supabase: SupabaseClient, logId: number | null, reason: string = 'api_failure') {
    console.log(`Using fallback data (reason: ${reason})...`);
    const mockEvents = [
        {
            event_date: new Date().toISOString(),
            event_name: 'RBI Monetary Policy Meeting (Mock - Data Unavailable)',
            country: 'India',
            impact_level: 'High',
            forecast: '6.50%',
            previous: '6.50%',
            actual: null,
            surprise: null,
            source_url: 'Fallback - API Unavailable'
        },
        {
            event_date: new Date(Date.now() + 86400000).toISOString(),
            event_name: 'US CPI Inflation Data (Mock - Data Unavailable)',
            country: 'USA',
            impact_level: 'High',
            forecast: '3.1%',
            previous: '3.4%',
            actual: null,
            surprise: null,
            source_url: 'Fallback - API Unavailable'
        }
    ];
    const { error: mockError } = await supabase.from('upcoming_events').upsert(mockEvents, { onConflict: 'event_date, event_name, country' });
    if (mockError) throw mockError;

    await logIngestionEnd(supabase, logId, 'success', { rows_inserted: mockEvents.length, metadata: { status: 'mocked', reason } });
    return new Response(JSON.stringify({ count: mockEvents.length, status: 'mocked', reason }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// Send alert to admin (via Supabase Edge Function or webhook)
async function sendAlert(message: string, severity: 'critical' | 'warning' = 'warning') {
    // TODO: Integrate with Slack/Discord/Email webhook when available
    console.error(`[ALERT ${severity.toUpperCase()}] ${message}`);
    // Future: await fetch(Deno.env.get('ALERT_WEBHOOK_URL') || '', { method: 'POST', body: JSON.stringify({ message, severity }) });
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
        if (!finnhubKey) {
            const errMsg = 'FINNHUB_API_KEY is not set in environment variables';
            console.error(errMsg);
            await sendAlert(errMsg, 'critical');
            throw new Error(errMsg);
        }

        // Check circuit breaker
        if (!circuitBreaker.shouldAttempt()) {
            const errMsg = 'Circuit breaker is OPEN for Finnhub API. Skipping fetch, using fallback.';
            console.warn(errMsg);
            await sendAlert(errMsg, 'warning');
            return await handleMockFallback(supabase, logId, 'circuit_open');
        }

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
            response = await withTimeout(fetchWithRetry(finnhubUrl), 30000, 'Finnhub API Fetch');
        } catch (fetchErr: any) {
            circuitBreaker.recordFailure();
            console.warn(`Finnhub fetch error: ${fetchErr.message}. Falling back to mock data.`);
            await sendAlert(`Finnhub fetch failed: ${fetchErr.message}`, 'warning');
            return await handleMockFallback(supabase, logId, 'fetch_error');
        }

        if (!response.ok) {
            circuitBreaker.recordFailure();
            const errorText = await response.text();
            console.warn(`Finnhub API error ${response.status}: ${errorText}. Falling back to mock data.`);

            if (isAuthError(response)) {
                await sendAlert('Finnhub API authentication failed (401/403). Check API key and plan subscription.', 'critical');
            } else if (isRateLimitError(response)) {
                await sendAlert('Finnhub API rate limit exceeded (429/402). Consider upgrading plan or implementing caching.', 'warning');
            }

            return await handleMockFallback(supabase, logId, `http_${response.status}`);
        }

        // Success path
        circuitBreaker.recordSuccess();
        console.log('Finnhub API call successful');

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
