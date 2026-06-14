/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

async function doIngestTradeGravity(supabase: ReturnType<typeof createClient>): Promise<IngestResult> {
    const comtradeKey = Deno.env.get('COMTRADE_API_KEY');

    // Define swing states and their bloc partners
    const swingStates = [
        { code: '699', name: 'India', bricsPartners: ['356', '76', '682', '360', '710'], g7Partners: ['124', '250', '276', '392', '380', '826', '840'] },
        { code: '76', name: 'Brazil', bricsPartners: ['356', '682', '360', '710'], g7Partners: ['124', '250', '276', '392', '380', '826', '840'] },
        { code: '682', name: 'Saudi Arabia', bricsPartners: ['356', '76', '360', '710'], g7Partners: ['124', '250', '276', '392', '380', '826', '840'] },
        { code: '360', name: 'Indonesia', bricsPartners: ['356', '76', '682', '710'], g7Partners: ['124', '250', '276', '392', '380', '826', '840'] },
        { code: '484', name: 'Mexico', bricsPartners: ['356', '76', '682', '360'], g7Partners: ['124', '250', '276', '392', '380', '826', '840'] },
        { code: '710', name: 'South Africa', bricsPartners: ['356', '76', '682', '360'], g7Partners: ['124', '250', '276', '392', '380', '826', '840'] },
    ];

    const periodsToFetch = ['2024', '2023'];

    let tradeData: any[] = [];
    let fetchedPeriods = new Set<string>();

    // Try to fetch from UN Comtrade API for latest periods
    if (comtradeKey) {
        for (const period of periodsToFetch) {
            try {
                console.log(`Fetching UN Comtrade data for period ${period}...`);

                for (const state of swingStates) {
                    // Fetch BRICS+ partners
                    const bricsUrl = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${state.code}&partnerCode=${state.bricsPartners.join(',')}&period=${period}&cmdCode=TOTAL&flowCode=X,M&subscription-key=${comtradeKey}`;
                    const bricsResp = await fetch(bricsUrl);

                    if (bricsResp.ok) {
                        const bricsData = await bricsResp.json();
                        const bricsTotal = (bricsData.data || []).reduce((sum: number, r: any) => sum + (r.primaryValue || 0), 0);

                        // Fetch G7 partners
                        const g7Url = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${state.code}&partnerCode=${state.g7Partners.join(',')}&period=${period}&cmdCode=TOTAL&flowCode=X,M&subscription-key=${comtradeKey}`;
                        const g7Resp = await fetch(g7Url);

                        if (g7Resp.ok) {
                            const g7Data = await g7Resp.json();
                            const g7Total = (g7Data.data || []).reduce((sum: number, r: any) => sum + (r.primaryValue || 0), 0);

                            const totalTrade = bricsTotal + g7Total;
                            if (totalTrade > 0) {
                                tradeData.push({
                                    swing_state_code: state.code,
                                    swing_state_name: state.name,
                                    bloc: 'BRICS+',
                                    period: period,
                                    trade_value_usd: bricsTotal,
                                    trade_share_pct: (bricsTotal / totalTrade) * 100,
                                    source_ref: 'live_api:comtrade',
                                    is_provisional: false,
                                });
                                tradeData.push({
                                    swing_state_code: state.code,
                                    swing_state_name: state.name,
                                    bloc: 'G7',
                                    period: period,
                                    trade_value_usd: g7Total,
                                    trade_share_pct: (g7Total / totalTrade) * 100,
                                    source_ref: 'live_api:comtrade',
                                    is_provisional: false,
                                });
                                fetchedPeriods.add(period);
                            }
                        }
                    }
                }
            } catch (apiErr: any) {
                console.warn(`API fetch failed for period ${period}: ${apiErr.message}. Will use fallback data.`);
            }
        }
    }

    // Fallback: include historical hardcoded data if API didn't provide fresh data
    if (!fetchedPeriods.has('2023')) {
        console.log('Using fallback hardcoded 2023 data');
        const fb = { source_ref: 'fallback:trade-gravity-2023', is_provisional: true };
        tradeData.push(
            // INDIA
            { swing_state_code: '699', swing_state_name: 'India', bloc: 'BRICS+', period: '2023', trade_value_usd: 445e9, trade_share_pct: 46.8, ...fb },
            { swing_state_code: '699', swing_state_name: 'India', bloc: 'G7', period: '2023', trade_value_usd: 360e9, trade_share_pct: 37.9, ...fb },
            // BRAZIL
            { swing_state_code: '76', swing_state_name: 'Brazil', bloc: 'BRICS+', period: '2023', trade_value_usd: 162e9, trade_share_pct: 44.1, ...fb },
            { swing_state_code: '76', swing_state_name: 'Brazil', bloc: 'G7', period: '2023', trade_value_usd: 138e9, trade_share_pct: 37.6, ...fb },
            // SAUDI ARABIA
            { swing_state_code: '682', swing_state_name: 'Saudi Arabia', bloc: 'BRICS+', period: '2023', trade_value_usd: 193e9, trade_share_pct: 38.9, ...fb },
            { swing_state_code: '682', swing_state_name: 'Saudi Arabia', bloc: 'G7', period: '2023', trade_value_usd: 210e9, trade_share_pct: 42.3, ...fb },
            // INDONESIA
            { swing_state_code: '360', swing_state_name: 'Indonesia', bloc: 'BRICS+', period: '2023', trade_value_usd: 125e9, trade_share_pct: 44.5, ...fb },
            { swing_state_code: '360', swing_state_name: 'Indonesia', bloc: 'G7', period: '2023', trade_value_usd: 85e9, trade_share_pct: 30.2, ...fb },
            // MEXICO
            { swing_state_code: '484', swing_state_name: 'Mexico', bloc: 'BRICS+', period: '2023', trade_value_usd: 88e9, trade_share_pct: 19.5, ...fb },
            { swing_state_code: '484', swing_state_name: 'Mexico', bloc: 'G7', period: '2023', trade_value_usd: 355e9, trade_share_pct: 78.5, ...fb },
            // SOUTH AFRICA
            { swing_state_code: '710', swing_state_name: 'South Africa', bloc: 'BRICS+', period: '2023', trade_value_usd: 72e9, trade_share_pct: 45.4, ...fb },
            { swing_state_code: '710', swing_state_name: 'South Africa', bloc: 'G7', period: '2023', trade_value_usd: 52e9, trade_share_pct: 32.8, ...fb },
        );
    }

    if (tradeData.length === 0) {
        throw new Error('No trade gravity data available from API or fallback');
    }

    const { error } = await supabase
        .from('trade_gravity')
        .upsert(tradeData, { onConflict: 'swing_state_code,bloc,period' });

    if (error) throw error;

    console.log(`Fetched periods from API: ${Array.from(fetchedPeriods).join(', ') || 'none'}`);
    return {
        ok: true,
        counts: { upserted: tradeData.length, skipped: 0 },
        meta: { message: `Upserted ${tradeData.length} trade gravity records.`, fetched_periods: Array.from(fetchedPeriods) },
    };
}

serveIngest('ingest-trade-gravity', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    return doIngestTradeGravity(supabase)
}, { timeoutMs: 10 * 60 * 1000, retries: 3 })
