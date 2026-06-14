/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'
import { mapFinnhubEvent } from './utils.ts'

// Circuit breaker state (in-memory, resets on cold start)
const circuitBreaker = {
    consecutiveFailures: 0,
    lastFailureTime: 0,
    isOpen: false,
    shouldAttempt(): boolean {
        if (!this.isOpen) return true;
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

function isAuthError(response: Response): boolean {
    return response.status === 401 || response.status === 403;
}

function isRateLimitError(response: Response): boolean {
    return response.status === 429 || response.status === 402;
}

async function fetchWithRetry(url: string, maxRetries: number = 2): Promise<Response> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url);

            if (response.ok) return response;

            if (isAuthError(response)) {
                throw new Error(`Finnhub API authentication failed (${response.status}). Check API key validity and plan subscription.`);
            }

            if (isRateLimitError(response)) {
                const waitMs = attempt * 5000;
                console.warn(`Finnhub rate limited (attempt ${attempt}). Retrying in ${waitMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitMs));
                continue;
            }

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

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, taskName: string): Promise<T> {
    let timeoutId: any;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${taskName} timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    try {
        const result = await Promise.race([promise, timeoutPromise]);
        return result;
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}

async function handleMockFallback(supabase: any): Promise<IngestResult> {
    console.log('Using mock fallback data...');
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

    return { ok: true, counts: { upserted: mockEvents.length, skipped: 0 }, meta: { source: 'fallback' } };
}

async function handleAlphaVantageFallback(supabase: any, apiKey: string): Promise<IngestResult> {
    console.log('Switching to Alpha Vantage for macro data...');
    const indicators = [
        { name: 'US GDP', function: 'REAL_GDP', country: 'USA' },
        { name: 'US CPI', function: 'CPI', country: 'USA' },
        { name: 'US Unemployment', function: 'UNEMPLOYMENT', country: 'USA' },
        { name: 'Fed Funds Rate', function: 'FEDERAL_FUNDS_RATE', country: 'USA' }
    ];

    const events = [];

    for (const indicator of indicators) {
        try {
            const url = `https://www.alphavantage.co/query?function=${indicator.function}&apikey=${apiKey}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data.data && data.data.length > 0) {
                    const latest = data.data[0];
                    events.push({
                        event_date: latest.date + 'T00:00:00Z',
                        event_name: `${indicator.name} (Latest Release)`,
                        country: indicator.country,
                        impact_level: 'High',
                        actual: latest.value,
                        forecast: null,
                        previous: data.data[1]?.value || null,
                        source_url: 'Alpha Vantage API'
                    });
                }
            }
        } catch (e: any) {
            console.error(`Alpha Vantage fetch failed for ${indicator.name}:`, e);
        }
    }

    if (events.length > 0) {
        const { error } = await supabase.from('upcoming_events').upsert(events, { onConflict: 'event_date, event_name, country' });
        if (error) console.error('Failed to upsert Alpha Vantage events:', error);
    }

    return { ok: true, counts: { upserted: events.length, skipped: 0 }, meta: { source: 'alpha_vantage_fallback' } };
}

async function doIngest(supabase: ReturnType<typeof createClient>, finnhubKey: string, avKey: string): Promise<IngestResult> {
    if (!circuitBreaker.shouldAttempt()) {
        console.warn('Circuit breaker is OPEN for Finnhub API. Skipping fetch, using fallback.');
        return handleMockFallback(supabase);
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
        return handleMockFallback(supabase);
    }

    if (!response.ok) {
        circuitBreaker.recordFailure();
        const errorText = await response.text();
        console.warn(`Finnhub API error ${response.status}: ${errorText}. Falling back.`);

        if (isAuthError(response) && avKey) {
            return handleAlphaVantageFallback(supabase, avKey);
        }

        return handleMockFallback(supabase);
    }

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

    return {
        ok: true,
        counts: { upserted: eventsToUpsert.length, skipped: 0 },
        meta: { dateRange: { from: fromStr, to: toStr } }
    };
}

serveIngest('ingest-macro-events', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const finnhubKey = Deno.env.get('FINNHUB_API_KEY') ?? ''
    if (!finnhubKey) throw new Error('FINNHUB_API_KEY is not set in environment variables')
    const avKey = Deno.env.get('ALPHA_VANTAGE_API_KEY') || ''
    return doIngest(supabase, finnhubKey, avKey)
}, { timeoutMs: 15 * 60 * 1000, retries: 3 })
