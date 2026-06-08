/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'
import { runWithRetry } from '../_shared/job-runner.ts'
import { upsertObservations } from '../_shared/ingest_utils.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * FII Equity Flow Ingestion
 * Source: RBI DBIE Table 37 (Foreign Institutional Investor flows)
 * Alternative: SEBI/NSDL monthly release (https://www.sebi.gov.in/statistics/)
 *
 * metric_id: india_fii_equity_net_usd_mn
 * Frequency: Monthly, released T+15 days after month-end
 * Unit: USD millions, net (buy - sell)
 */

async function doIngestFIIFlows(supabase: any) {
    console.log('Fetching FII equity flows from RBI DBIE API...');

    // Try primary RBI DBIE endpoint
    let url = 'https://api.rbi.org.in/dbie/fii_flows';
    let response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
    }).catch(err => {
        console.warn(`Primary endpoint failed: ${err.message}`);
        return null;
    });

    // Fallback to alternate format/endpoint if primary fails
    if (!response || !response.ok) {
        console.log('Trying alternate DBIE endpoint...');
        url = 'https://dbie.rbi.org.in/api/data/fpi_flows';
        response = await fetch(url, {
            headers: { 'Accept': 'application/json' }
        }).catch(err => {
            console.warn(`Alternate endpoint failed: ${err.message}`);
            return null;
        });
    }

    if (!response || !response.ok) {
        throw new Error(`FII flows API unavailable (status: ${response?.status || 'no response'}). RBI DBIE endpoint may be down or changed.`);
    }

    let data: any;
    try {
        data = await response.json();
    } catch (parseErr: any) {
        throw new Error(`Failed to parse FII flows response: ${parseErr.message}`);
    }

    // Handle various response formats
    const dataArray = data.data || data.fii_flows || data.fpi_flows || [];
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
        throw new Error(`No FII flow data in response. Format: ${JSON.stringify(data).substring(0, 200)}`);
    }

    // Transform to metric_observations format (flexible field mapping)
    const observations = dataArray.map((item: any) => {
        const dateStr = item.date || item.as_of_date || item.period;
        const valueStr = item.net_flow_usd_mn || item.net_flow || item.value;
        return {
            metric_id: 'india_fii_equity_net_usd_mn',
            as_of_date: dateStr,
            value: parseFloat(valueStr),
            metadata: {
                source: 'RBI-DBIE',
                unit: 'USD millions',
                flow_type: 'equity_net'
            }
        };
    }).filter((obs: any) => !isNaN(obs.value) && obs.as_of_date);

    if (observations.length === 0) {
        throw new Error(`No valid FII flow observations extracted from ${dataArray.length} records`);
    }

    console.log(`Upserting ${observations.length} FII flow observations...`);
    const { count } = await upsertObservations(supabase, observations);

    return {
        rows_inserted: count,
        metadata: {
            latest_date: observations[observations.length - 1]?.as_of_date,
            latest_value: observations[observations.length - 1]?.value,
            data_points: observations.length,
            source_endpoint: url
        }
    };
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    return runIngestion(supabase, 'ingest-fii-flows', async (ctx) => {
        const result = await runWithRetry(
            'ingest-fii-flows',
            () => doIngestFIIFlows(ctx.supabase),
            { timeoutMs: 15 * 60 * 1000, maxRetries: 3, backoffMs: 20_000 }
        );

        if (!result.ok) throw new Error(`FII flows ingestion failed: ${result.error}`);
        return result.value!;
    })
})
