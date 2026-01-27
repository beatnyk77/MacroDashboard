import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Fetch with exponential backoff retry logic
 */
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
    let lastError: Error | null = null;
    for (let i = 0; i <= maxRetries; i++) {
        try {
            if (i > 0) {
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                console.log(`Retry ${i}/${maxRetries} for ${url}...`);
            }
            const response = await fetch(url, options);
            if (response.ok) return response;
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error: any) {
            lastError = error;
            console.warn(`Attempt ${i + 1} failed: ${error.message}`);
        }
    }
    throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}

/**
 * Parse IMF COFER CSV data
 * Expected format: Date, USD_SHARE, EUR_SHARE, RMB_SHARE, OTHER_SHARE, GOLD_SHARE, GOLD_USD
 */
function parseCoferCSV(csvText: string): any[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) continue;

        const row: any = {};
        headers.forEach((header, idx) => {
            row[header] = values[idx];
        });
        data.push(row);
    }

    return data;
}

/**
 * Ingest IMF COFER data (Currency Composition of Official Foreign Exchange Reserves)
 * Quarterly data on global reserve currency composition
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('Starting IMF COFER ingestion...');

        // 1. Resolve IMF source_id
        const { data: source, error: sourceError } = await supabase
            .from('data_sources')
            .select('id')
            .eq('name', 'IMF')
            .single();

        if (sourceError || !source) throw new Error('IMF data source not found');
        const sourceId = source.id;

        // 2. Identify target metrics
        const { data: metrics, error: metricsError } = await supabase
            .from('metrics')
            .select('id, metadata')
            .eq('source_id', sourceId)
            .eq('category', 'de_dollarization')
            .eq('is_active', true);

        if (metricsError) throw metricsError;
        if (!metrics || metrics.length === 0) {
            return new Response(JSON.stringify({ message: 'No active de-dollarization metrics' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const summary: any = {
            total_attempted: metrics.length,
            success_count: 0,
            error_count: 0,
            details: []
        };

        // 3. Fetch IMF COFER data
        // Note: Using a static CSV endpoint for now. In production, use IMF Data API or download latest CSV
        // IMF COFER data: https://data.imf.org/?sk=E6A5F467-C14B-4AA8-9F6D-5A09EC4E62A4

        // For this implementation, we'll use mock data structure
        // In production, replace with actual IMF API call or CSV download
        const mockCoferData = [
            { quarter: '2024Q3', usd_share: 58.41, eur_share: 19.98, rmb_share: 2.76, other_share: 18.85, gold_share: 15.2, gold_usd: 1234.5 },
            { quarter: '2024Q2', usd_share: 58.88, eur_share: 19.71, rmb_share: 2.69, other_share: 18.72, gold_share: 14.8, gold_usd: 1198.3 },
            { quarter: '2024Q1', usd_share: 59.02, eur_share: 19.65, rmb_share: 2.58, other_share: 18.75, gold_share: 14.5, gold_usd: 1165.2 },
            { quarter: '2023Q4', usd_share: 59.17, eur_share: 19.56, rmb_share: 2.45, other_share: 18.82, gold_share: 14.2, gold_usd: 1142.8 },
        ];

        console.log(`Processing ${mockCoferData.length} quarters of COFER data...`);

        // 4. Map metrics to data fields
        const metricMapping: Record<string, string> = {
            'GLOBAL_USD_SHARE_PCT': 'usd_share',
            'GLOBAL_EUR_SHARE_PCT': 'eur_share',
            'GLOBAL_RMB_SHARE_PCT': 'rmb_share',
            'GLOBAL_OTHER_SHARE_PCT': 'other_share',
            'GLOBAL_GOLD_SHARE_PCT': 'gold_share',
            'GLOBAL_GOLD_HOLDINGS_USD': 'gold_usd',
        };

        // 5. Process each metric
        for (const metric of metrics) {
            const dataField = metricMapping[metric.id];
            if (!dataField) {
                console.warn(`No mapping for metric ${metric.id}, skipping`);
                continue;
            }

            try {
                // A. Get latest date in DB to skip if current
                const { data: latestObs } = await supabase
                    .from('metric_observations')
                    .select('as_of_date')
                    .eq('metric_id', metric.id)
                    .order('as_of_date', { ascending: false })
                    .limit(1)
                    .single();

                const lastDate = latestObs?.as_of_date;

                // B. Normalize and filter observations
                const observations = mockCoferData
                    .map((row: any) => {
                        // Convert quarter to date (use last day of quarter)
                        const [year, quarter] = row.quarter.split('Q');
                        const quarterEndMonth = parseInt(quarter) * 3;
                        const quarterEndDate = new Date(parseInt(year), quarterEndMonth, 0); // Last day of quarter
                        const asOfDate = quarterEndDate.toISOString().split('T')[0];

                        return {
                            metric_id: metric.id,
                            as_of_date: asOfDate,
                            value: parseFloat(row[dataField]),
                            last_updated_at: new Date().toISOString()
                        };
                    })
                    .filter((obs: any) => {
                        const isValid = !isNaN(obs.value);
                        const isNewer = !lastDate || obs.as_of_date > lastDate;
                        return isValid && isNewer;
                    });

                if (observations.length === 0) {
                    summary.details.push({ metric: metric.id, status: 'skipped', message: 'Already up to date' });
                    continue;
                }

                // C. Idempotent UPSERT
                const { error: upsertError } = await supabase
                    .from('metric_observations')
                    .upsert(observations, { onConflict: 'metric_id, as_of_date' });

                if (upsertError) throw upsertError;

                summary.success_count++;
                summary.details.push({
                    metric: metric.id,
                    status: 'success',
                    inserted: observations.length,
                    latest_date: observations[0]?.as_of_date
                });

                console.log(`✓ ${metric.id}: ${observations.length} observations inserted`);

            } catch (err: any) {
                summary.error_count++;
                summary.details.push({
                    metric: metric.id,
                    status: 'error',
                    error: err.message
                });
                console.error(`Error processing ${metric.id}:`, err);
            }
        }

        console.log(`COFER ingestion complete: ${summary.success_count}/${summary.total_attempted} successful`);

        return new Response(JSON.stringify(summary), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: summary.error_count === summary.total_attempted ? 500 : 200
        });

    } catch (error: any) {
        console.error('Master ingestion error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
