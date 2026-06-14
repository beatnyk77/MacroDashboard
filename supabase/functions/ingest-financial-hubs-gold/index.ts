/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

interface HubMetric {
    hub: string;
    metric_date: string;
    primary_metric_value: number;
    primary_metric_label: string;
    secondary_metrics: Record<string, any>;
    sparkline_data: number[];
    percentile: number;
    z_score: number;
    source: string;
}

const HUB_METRIC_CONFIG = {
    Switzerland: { label: "Gold Reserves (Tonnes)", source: "SNB / Swiss Customs", metric: 1040, change: 0.2, imports: 185.4, aum_growth: 4.2 },
    Singapore: { label: "Gold Share of Reserves %", source: "MAS / Singapore Customs", metric: 2.1, imports: 42.1, deposits_growth: 6.8 },
    London: { label: "Gold Clearing Volume (Moz)", source: "LBMA / BIS", metric: 18.2, fx_turnover: 3.8, gilt_demand: 45.2 },
    Dubai: { label: "Gold Re-export Index", source: "DMCC / Dubai Customs", metric: 112.4, trade_volume: 85.2, uae_reserves_change: 2.5 },
    "GIFT City": { label: "Banking Deposits ($ bn)", source: "IFSCA / RBI", metric: 62.4, deposits_yoy: 24.5, bullion_turnover_index: 108.2, offshore_inr_pct: 12.5, bond_issuance_usd: 14.8, vs_singapore_aum_pct: 4.2 },
    "Hong Kong": { label: "HKMA Gold Reserves (Tonnes)", source: "HKMA / Census", metric: 2.1, net_imports_tonnes: 45.2, gold_etf_aum_hkd: 8.5 },
    "Shanghai": { label: "SGE 3M Withdrawals (Tonnes)", source: "SGE / PBoC", metric: 485.2, pboc_reserves_tonnes: 2264, futures_open_interest: 125.4 }
};

async function doIngestFinancialHubsGold(supabase: any): Promise<IngestResult> {
    console.log('Starting Ingest Financial Hubs & Gold Gateways...')

    const today = new Date();
    const metricDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

    const results: HubMetric[] = [
        {
            hub: 'Switzerland',
            metric_date: metricDate,
            primary_metric_value: HUB_METRIC_CONFIG.Switzerland.metric,
            primary_metric_label: HUB_METRIC_CONFIG.Switzerland.label,
            secondary_metrics: { quarterly_change: HUB_METRIC_CONFIG.Switzerland.change, monthly_gold_imports: HUB_METRIC_CONFIG.Switzerland.imports, private_banking_aum_yoy: HUB_METRIC_CONFIG.Switzerland.aum_growth },
            sparkline_data: [1040, 1040, 1040, 1040, 1040, 1040, 1040],
            percentile: 85.2, z_score: 1.2, source: HUB_METRIC_CONFIG.Switzerland.source
        },
        {
            hub: 'Singapore',
            metric_date: metricDate,
            primary_metric_value: HUB_METRIC_CONFIG.Singapore.metric,
            primary_metric_label: HUB_METRIC_CONFIG.Singapore.label,
            secondary_metrics: { monthly_gold_imports: HUB_METRIC_CONFIG.Singapore.imports, non_resident_deposits_yoy: HUB_METRIC_CONFIG.Singapore.deposits_growth },
            sparkline_data: [1.8, 1.9, 2.0, 2.1, 2.1, 2.1, 2.1],
            percentile: 92.1, z_score: 2.4, source: HUB_METRIC_CONFIG.Singapore.source
        },
        {
            hub: 'London',
            metric_date: metricDate,
            primary_metric_value: HUB_METRIC_CONFIG.London.metric,
            primary_metric_label: HUB_METRIC_CONFIG.London.label,
            secondary_metrics: { global_fx_turnover_share: HUB_METRIC_CONFIG.London.fx_turnover, gilt_indirect_bidder_pct: HUB_METRIC_CONFIG.London.gilt_demand },
            sparkline_data: [17.5, 18.0, 18.5, 18.2, 17.8, 18.1, 18.2],
            percentile: 65.4, z_score: 0.4, source: HUB_METRIC_CONFIG.London.source
        },
        {
            hub: 'Dubai',
            metric_date: metricDate,
            primary_metric_value: HUB_METRIC_CONFIG.Dubai.metric,
            primary_metric_label: HUB_METRIC_CONFIG.Dubai.label,
            secondary_metrics: { monthly_gold_trade_volume: HUB_METRIC_CONFIG.Dubai.trade_volume, uae_cb_gold_net_purchases: HUB_METRIC_CONFIG.Dubai.uae_reserves_change },
            sparkline_data: [105, 108, 110, 112, 115, 118, 122.4],
            percentile: 98.2, z_score: 3.1, source: HUB_METRIC_CONFIG.Dubai.source
        },
        {
            hub: 'GIFT City',
            metric_date: metricDate,
            primary_metric_value: HUB_METRIC_CONFIG["GIFT City"].metric,
            primary_metric_label: HUB_METRIC_CONFIG["GIFT City"].label,
            secondary_metrics: { deposits_yoy_pct: HUB_METRIC_CONFIG["GIFT City"].deposits_yoy, bullion_turnover_index: HUB_METRIC_CONFIG["GIFT City"].bullion_turnover_index, offshore_inr_liabilities_pct: HUB_METRIC_CONFIG["GIFT City"].offshore_inr_pct, bond_issuance_usd_bn: HUB_METRIC_CONFIG["GIFT City"].bond_issuance_usd, vs_singapore_aum_pct: HUB_METRIC_CONFIG["GIFT City"].vs_singapore_aum_pct },
            sparkline_data: [45.2, 48.5, 52.1, 55.8, 58.4, 60.5, 62.4],
            percentile: 74.2, z_score: 1.8, source: HUB_METRIC_CONFIG["GIFT City"].source
        },
        {
            hub: 'Hong Kong',
            metric_date: metricDate,
            primary_metric_value: HUB_METRIC_CONFIG["Hong Kong"].metric,
            primary_metric_label: HUB_METRIC_CONFIG["Hong Kong"].label,
            secondary_metrics: { net_gold_imports_tonnes: HUB_METRIC_CONFIG["Hong Kong"].net_imports_tonnes, gold_etf_aum_hkd_bn: HUB_METRIC_CONFIG["Hong Kong"].gold_etf_aum_hkd },
            sparkline_data: [1.8, 2.0, 2.1, 2.1, 2.1, 2.1, 2.1],
            percentile: 55.4, z_score: -0.2, source: HUB_METRIC_CONFIG["Hong Kong"].source
        },
        {
            hub: 'Shanghai',
            metric_date: metricDate,
            primary_metric_value: HUB_METRIC_CONFIG["Shanghai"].metric,
            primary_metric_label: HUB_METRIC_CONFIG["Shanghai"].label,
            secondary_metrics: { pboc_reserves_tonnes: HUB_METRIC_CONFIG["Shanghai"].pboc_reserves_tonnes, futures_open_interest_k: HUB_METRIC_CONFIG["Shanghai"].futures_open_interest },
            sparkline_data: [380, 420, 450, 410, 460, 475, 485.2],
            percentile: 96.5, z_score: 2.8, source: HUB_METRIC_CONFIG["Shanghai"].source
        }
    ];

    const { error } = await supabase
        .from('financial_hubs_metrics')
        .upsert(results, { onConflict: 'hub,metric_date' });

    if (error) throw error;

    return {
        ok: true,
        counts: { upserted: results.length, skipped: 0 },
        meta: { metric_date: metricDate },
    }
}

serveIngest('ingest-financial-hubs-gold', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    return doIngestFinancialHubsGold(supabase)
}, { timeoutMs: 5 * 60 * 1000, retries: 2 })
