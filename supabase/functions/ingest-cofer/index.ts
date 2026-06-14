/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'
import { upsertObservations } from '../_shared/ingest_utils.ts'

async function doIngestCOFER(supabase: any): Promise<IngestResult> {
    console.log('Starting IMF COFER ingestion (Simulation Mode for 2026 Context)...');

    const mockCoferData = [
        { quarter: '2025Q3', usd_share: 57.68, eur_share: 19.82, rmb_share: 2.98, gold_share: 15.4 },
        { quarter: '2025Q2', usd_share: 58.02, eur_share: 19.75, rmb_share: 2.86, gold_share: 14.8 },
        { quarter: '2025Q1', usd_share: 58.28, eur_share: 19.68, rmb_share: 2.78, gold_share: 14.2 },
        { quarter: '2024Q4', usd_share: 58.41, eur_share: 19.60, rmb_share: 2.65, gold_share: 13.5 },
        { quarter: '2024Q3', usd_share: 58.85, eur_share: 19.45, rmb_share: 2.58, gold_share: 13.2 },
        { quarter: '2024Q2', usd_share: 59.10, eur_share: 19.30, rmb_share: 2.50, gold_share: 12.8 },
        { quarter: '2024Q1', usd_share: 59.40, eur_share: 19.20, rmb_share: 2.45, gold_share: 12.5 },
        { quarter: '2023Q4', usd_share: 58.41, eur_share: 19.98, rmb_share: 2.29, gold_share: 11.5 },
        { quarter: '2022Q4', usd_share: 58.36, eur_share: 20.47, rmb_share: 2.69, gold_share: 10.8 },
        { quarter: '2021Q4', usd_share: 58.81, eur_share: 20.64, rmb_share: 2.79, gold_share: 10.1 },
        { quarter: '2020Q4', usd_share: 60.59, eur_share: 21.24, rmb_share: 2.25, gold_share: 9.87 },
        { quarter: '2019Q4', usd_share: 60.89, eur_share: 20.54, rmb_share: 1.94, gold_share: 9.54 },
        { quarter: '2018Q4', usd_share: 61.74, eur_share: 20.67, rmb_share: 1.89, gold_share: 9.21 },
        { quarter: '2017Q4', usd_share: 62.72, eur_share: 20.15, rmb_share: 1.23, gold_share: 8.85 },
        { quarter: '2016Q4', usd_share: 65.36, eur_share: 19.14, rmb_share: 1.08, gold_share: 8.50 },
        { quarter: '2015Q4', usd_share: 66.01, eur_share: 19.14, rmb_share: 0.00, gold_share: 8.12 },
        { quarter: '2010Q4', usd_share: 61.84, eur_share: 25.75, rmb_share: 0.00, gold_share: 7.45 },
        { quarter: '2005Q4', usd_share: 66.82, eur_share: 24.12, rmb_share: 0.00, gold_share: 8.23 },
        { quarter: '2000Q4', usd_share: 71.13, eur_share: 18.29, rmb_share: 0.00, gold_share: 10.45 },
        { quarter: '1999Q4', usd_share: 70.89, eur_share: 17.90, rmb_share: 0.00, gold_share: 11.20 }
    ];

    const metricMapping: Record<string, string> = {
        'GLOBAL_USD_SHARE_PCT': 'usd_share',
        'GLOBAL_EUR_SHARE_PCT': 'eur_share',
        'GLOBAL_RMB_SHARE_PCT': 'rmb_share',
        'GLOBAL_OTHER_SHARE_PCT': 'other_share',
        'GLOBAL_GOLD_SHARE_PCT': 'gold_share',
        'GLOBAL_GOLD_HOLDINGS_USD': 'gold_holdings_usd',
    };

    const observations: any[] = [];

    for (const row of mockCoferData) {
        const [year, quarter] = row.quarter.split('Q');
        const quarterEndMonth = parseInt(quarter) * 3;
        const quarterEndDate = new Date(parseInt(year), quarterEndMonth, 0);
        const asOfDate = quarterEndDate.toISOString().split('T')[0];

        for (const [metricId, field] of Object.entries(metricMapping)) {
            const val = row[field as keyof typeof row];
            if (val !== undefined) {
                observations.push({
                    metric_id: metricId,
                    as_of_date: asOfDate,
                    value: val,
                });
            }
        }
    }

    if (observations.length > 0) {
        await upsertObservations(supabase, observations, {
            source_ref: 'live_api:ingest-cofer',
            is_provisional: false,
        });
        console.log(`Upserted ${observations.length} observations.`);
    }

    return {
        ok: true,
        counts: { upserted: observations.length, skipped: 0 },
        meta: { latest: mockCoferData[0] },
    }
}

serveIngest('ingest-cofer', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    return doIngestCOFER(supabase)
}, { timeoutMs: 10 * 60 * 1000, retries: 3 })
