/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

async function fetchWithRetry(url: string, maxRetries: number = 2): Promise<Response> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url);
            if (response.ok) return response;
            if (attempt < maxRetries) {
                const delay = attempt * 2000;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error: any) {
            if (attempt === maxRetries) throw error;
            console.warn(`Attempt ${attempt} failed: ${error.message}. Retrying...`);
        }
    }
    throw new Error('Max retries exceeded');
}

serveIngest('ingest-eurostat-debt', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Eurostat API v1.0 — Government Finance Statistics (GOV)
    // EA20 government debt as % of GDP
    const baseUrl = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/GOV';
    const params = new URLSearchParams({
        geo: 'EA20',
        unit: 'PC_GDP',
        currency: 'EUR',
        debt: 'GD',
        time: '2000:2025',
    });
    const url = `${baseUrl}?${params.toString()}`;

    console.log('Fetching Eurostat debt-to-GDP data for Euro Area...');
    const response = await fetchWithRetry(url, 3);
    if (!response.ok) {
        throw new Error(`Eurostat API returned ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    const observations = data.data;
    const timeLabels = data.dimension.TIME.category.label;
    const observationsArray: { time: string; value: number }[] = [];

    for (const [timePos, value] of Object.entries(observations)) {
        if (value !== null && value !== '' && value !== undefined) {
            const year = timeLabels[timePos];
            observationsArray.push({
                time: year,
                value: parseFloat(String(value))
            });
        }
    }

    observationsArray.sort((a, b) => a.time.localeCompare(b.time));

    const rows = observationsArray.map(obs => ({
        metric_id: 'EU_DEBT_GDP_PCT',
        as_of_date: `${obs.time}-12-31`,
        value: obs.value,
        last_updated_at: new Date().toISOString()
    }));

    if (rows.length > 0) {
        const { error: upsertError } = await supabase
            .from('metric_observations')
            .upsert(rows, { onConflict: 'metric_id, as_of_date' });
        if (upsertError) throw upsertError;
    }

    await supabase
        .from('metrics')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', 'EU_DEBT_GDP_PCT');

    console.log(`Successfully ingested ${rows.length} observations for EU_DEBT_GDP_PCT`);

    return {
        ok: true,
        counts: { upserted: rows.length, skipped: 0 },
    };
})
