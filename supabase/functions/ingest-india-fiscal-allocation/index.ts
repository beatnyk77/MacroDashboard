import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'
import { runWithRetry } from '../_shared/job-runner.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CENTRAL_FISCAL_DATA = [
    { fy: '2024-25', date: '2025-03-31', capex: 1111111, revenue_exp: 3708870, total_exp: 4820881, subsidies: 381175, committed: 2000000, gdp: 32771808 },
    { fy: '2023-24', date: '2024-03-31', capex: 950246, revenue_exp: 3540239, total_exp: 4490485, subsidies: 413466, committed: 1850000, gdp: 29389666 },
    { fy: '2022-23', date: '2023-03-31', capex: 736339, revenue_exp: 3452513, total_exp: 4188852, subsidies: 530959, committed: 1700000, gdp: 27241226 },
    { fy: '2021-22', date: '2022-03-31', capex: 592874, revenue_exp: 3200926, total_exp: 3793801, subsidies: 504023, committed: 1550000, gdp: 23471012 },
    { fy: '2020-21', date: '2021-03-31', capex: 426317, revenue_exp: 3083519, total_exp: 3509836, subsidies: 706006, committed: 1400000, gdp: 19800914 },
    { fy: '2019-20', date: '2020-03-31', capex: 335892, revenue_exp: 2350604, total_exp: 2686496, subsidies: 262356, committed: 1250000, gdp: 20074856 },
    { fy: '2018-19', date: '2019-03-31', capex: 303038, revenue_exp: 2012028, total_exp: 2315066, subsidies: 220268, committed: 1150000, gdp: 18899668 },
    { fy: '2017-18', date: '2018-03-31', capex: 263140, revenue_exp: 1878833, total_exp: 2141973, subsidies: 218744, committed: 1050000, gdp: 17090042 },
    { fy: '2016-17', date: '2017-03-31', capex: 284368, revenue_exp: 1690584, total_exp: 1974952, subsidies: 232705, committed: 950000, gdp: 15391754 },
    { fy: '2015-16', date: '2016-03-31', capex: 253022, revenue_exp: 1537423, total_exp: 1790445, subsidies: 257777, committed: 850000, gdp: 13771874 },
    { fy: '2014-15', date: '2015-03-31', capex: 196681, revenue_exp: 1466973, total_exp: 1663654, subsidies: 258258, committed: 750000, gdp: 12467959 },
];

const STATE_FISCAL_DATA = [
    { code: 'MH', name: 'Maharashtra', fy: '2023-24', capex_pct_gsdp: 2.1, rev_exp_pct_gsdp: 11.2, comm_pct_receipts: 48, subsidies_pct_gsdp: 0.8 },
    { code: 'UP', name: 'Uttar Pradesh', fy: '2023-24', capex_pct_gsdp: 3.8, rev_exp_pct_gsdp: 18.5, comm_pct_receipts: 52, subsidies_pct_gsdp: 1.2 },
    { code: 'TN', name: 'Tamil Nadu', fy: '2023-24', capex_pct_gsdp: 1.6, rev_exp_pct_gsdp: 12.8, comm_pct_receipts: 55, subsidies_pct_gsdp: 3.8 },
    { code: 'KA', name: 'Karnataka', fy: '2023-24', capex_pct_gsdp: 2.3, rev_exp_pct_gsdp: 13.5, comm_pct_receipts: 42, subsidies_pct_gsdp: 4.2 },
    { code: 'GJ', name: 'Gujarat', fy: '2023-24', capex_pct_gsdp: 3.1, rev_exp_pct_gsdp: 10.8, comm_pct_receipts: 38, subsidies_pct_gsdp: 0.9 },
    { code: 'WB', name: 'West Bengal', fy: '2023-24', capex_pct_gsdp: 1.2, rev_exp_pct_gsdp: 14.5, comm_pct_receipts: 62, subsidies_pct_gsdp: 1.5 },
    { code: 'TS', name: 'Telangana', fy: '2023-24', capex_pct_gsdp: 2.0, rev_exp_pct_gsdp: 15.2, comm_pct_receipts: 45, subsidies_pct_gsdp: 4.5 },
    { code: 'RJ', name: 'Rajasthan', fy: '2023-24', capex_pct_gsdp: 1.5, rev_exp_pct_gsdp: 16.8, comm_pct_receipts: 58, subsidies_pct_gsdp: 3.2 },
    { code: 'AP', name: 'Andhra Pradesh', fy: '2023-24', capex_pct_gsdp: 1.0, rev_exp_pct_gsdp: 17.5, comm_pct_receipts: 65, subsidies_pct_gsdp: 5.5 },
    { code: 'MP', name: 'Madhya Pradesh', fy: '2023-24', capex_pct_gsdp: 3.5, rev_exp_pct_gsdp: 16.2, comm_pct_receipts: 48, subsidies_pct_gsdp: 1.8 },
    { code: 'BR', name: 'Bihar', fy: '2023-24', capex_pct_gsdp: 4.5, rev_exp_pct_gsdp: 22.5, comm_pct_receipts: 55, subsidies_pct_gsdp: 1.0 },
    { code: 'PB', name: 'Punjab', fy: '2023-24', capex_pct_gsdp: 1.1, rev_exp_pct_gsdp: 15.8, comm_pct_receipts: 72, subsidies_pct_gsdp: 4.2 },
    { code: 'KL', name: 'Kerala', fy: '2023-24', capex_pct_gsdp: 1.3, rev_exp_pct_gsdp: 14.2, comm_pct_receipts: 68, subsidies_pct_gsdp: 0.8 },
    { code: 'OD', name: 'Odisha', fy: '2023-24', capex_pct_gsdp: 5.2, rev_exp_pct_gsdp: 15.5, comm_pct_receipts: 35, subsidies_pct_gsdp: 1.2 },
    { code: 'HR', name: 'Haryana', fy: '2023-24', capex_pct_gsdp: 1.8, rev_exp_pct_gsdp: 12.4, comm_pct_receipts: 35, subsidies_pct_gsdp: 1.1 },
];

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    return runIngestion(supabase, 'ingest-india-fiscal-allocation', async (ctx) => {
        const result = await runWithRetry(
            'ingest-india-fiscal-allocation',
            () => doIngestIndiaFiscalAllocation(supabase),
            { timeoutMs: 20 * 60 * 1000, maxRetries: 3, backoffMs: 20_000 }
        )
        if (!result.ok) throw new Error(`All attempts failed: ${result.error}`)
        return result.value!
    })
})

async function doIngestIndiaFiscalAllocation(supabase: any) {
    console.log('Starting India Fiscal Allocation Ingestion...');
    const upsertData: any[] = [];

    CENTRAL_FISCAL_DATA.forEach(d => {
        const capex_pct_total = (d.capex / d.total_exp) * 100;
        const capex_pct_gdp = (d.capex / d.gdp) * 100;
        const revenue_pct_gdp = (d.revenue_exp / d.gdp) * 100;
        const approx_receipts = d.gdp * 0.095;
        const freebies_pct_receipts = ((d.subsidies + (d.committed * 0.5)) / approx_receipts) * 100;
        upsertData.push({
            entity_type: 'central', fy: d.fy, date: d.date,
            capex_lakh_cr: d.capex / 100000, revenue_exp_lakh_cr: d.revenue_exp / 100000,
            total_exp_lakh_cr: d.total_exp / 100000, subsidies_lakh_cr: d.subsidies / 100000,
            committed_lakh_cr: d.committed / 100000, gdp_lakh_cr: d.gdp / 100000,
            capex_pct_total, capex_pct_gdp, revenue_pct_gdp, freebies_pct_receipts,
            updated_at: new Date().toISOString()
        });
    });

    STATE_FISCAL_DATA.forEach(s => {
        upsertData.push({
            entity_type: 'state', state_code: s.code, state_name: s.name, fy: s.fy,
            date: '2024-03-31', capex_pct_gdp: s.capex_pct_gsdp, revenue_pct_gdp: s.rev_exp_pct_gsdp,
            freebies_pct_receipts: s.comm_pct_receipts, updated_at: new Date().toISOString()
        });
    });

    console.log(`Upserting ${upsertData.length} records...`);
    if (upsertData.length > 0) {
        const { error } = await supabase
            .from('india_fiscal_allocation')
            .upsert(upsertData, { onConflict: 'entity_type,state_code,fy' });
        if (error) throw error;
    }
    return { rows_inserted: upsertData.length, metadata: {} };
}
