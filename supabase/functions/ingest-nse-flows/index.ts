/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'
import { upsertObservations } from '../_shared/ingest_utils.ts'

/**
 * FII Equity Flow Ingestion
 * Source: RBI DBIE Table 37 (Foreign Institutional Investor flows)
 * Alternative: SEBI/NSDL monthly release (https://www.sebi.gov.in/statistics/)
 *
 * metric_id: india_fii_equity_net_usd_mn
 * Frequency: Monthly, released T+15 days after month-end
 * Unit: USD millions, net (buy - sell)
 */

async function doIngestFIIFlows(supabase: any): Promise<IngestResult> {
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
    const { count } = await upsertObservations(supabase, observations, { source_ref: 'live_api:ingest-fii-flows', is_provisional: false });

    return {
        ok: true,
        counts: { upserted: count, skipped: 0 },
        meta: {
            latest_date: observations[observations.length - 1]?.as_of_date,
            latest_value: observations[observations.length - 1]?.value,
            data_points: observations.length,
            source_endpoint: url
        }
    };
}

serveIngest('ingest-fii-flows', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    return doIngestFIIFlows(supabase)
}, { timeoutMs: 15 * 60 * 1000, retries: 3 })
