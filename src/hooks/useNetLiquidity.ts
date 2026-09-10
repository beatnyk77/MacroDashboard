import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { METRIC_IDS as MID } from '@/constants/metricIds';

export interface CentralBankSummary {
    id: string;
    name: string;
    currency: string;
    localValue: number;
    usdEqvTr: number;
    fxRate: number;
    yoyPct: number;
    status: string;
}

export interface NetLiquidityData {
    as_of_date: string;
    current_value: number;
    z_score: number;
    percentile: number;
    delta: number;
    delta_pct: number;
    alarm_status: string;
    history?: { date: string; value: number }[];
    rrp_balance?: number;
    tga_balance?: number;
    sofr_effr_spread?: number;
    sofr_effr_history?: { date: string; value: number }[];
    fed_assets?: number;
    // Global Big 5 Extensions
    global_current_tr?: number;
    global_z_score?: number;
    global_percentile?: number;
    global_delta_7d?: number;
    central_banks?: CentralBankSummary[];
}

export function useNetLiquidity() {
    const { data } = useSuspenseQuery({
        queryKey: ['net-liquidity'],
        queryFn: async (): Promise<NetLiquidityData> => {
            const [
                liqRes,
                rrpRes,
                tgaRes,
                spreadRes,
                fedRes,
                globalRes,
                ecbRes,
                bojRes,
                boeRes,
                eurUsdRes,
                usdJpyRes,
                gbpUsdRes,
                usdCnyRes,
            ] = await Promise.all([
                supabase.from('vw_net_liquidity').select('*').order('as_of_date', { ascending: false }).limit(90),
                supabase.from('vw_latest_metrics').select('value').eq('metric_id', MID.RRP_BALANCE_BN).maybeSingle(),
                supabase.from('vw_latest_metrics').select('value').eq('metric_id', MID.TGA_BALANCE_BN).maybeSingle(),
                supabase.from('metric_observations').select('as_of_date, value').eq('metric_id', MID.SOFR_EFFR_SPREAD_BPS).order('as_of_date', { ascending: false }).limit(30),
                supabase.from('vw_latest_metrics').select('value').eq('metric_id', MID.FED_BALANCE_SHEET).maybeSingle(),
                supabase.from('vw_latest_metrics').select('value, as_of_date').eq('metric_id', MID.GLOBAL_NET_LIQUIDITY_USD_TR).maybeSingle(),
                supabase.from('vw_latest_metrics').select('value').eq('metric_id', MID.ECB_TOTAL_ASSETS_MEUR).maybeSingle(),
                supabase.from('vw_latest_metrics').select('value').eq('metric_id', MID.BOJ_TOTAL_ASSETS_TRJPY).maybeSingle(),
                supabase.from('vw_latest_metrics').select('value').eq('metric_id', MID.BOE_TOTAL_ASSETS_MN_GBP).maybeSingle(),
                supabase.from('vw_latest_metrics').select('value').eq('metric_id', MID.FX_EUR_USD).maybeSingle(),
                supabase.from('vw_latest_metrics').select('value').eq('metric_id', MID.FX_USD_JPY).maybeSingle(),
                supabase.from('vw_latest_metrics').select('value').eq('metric_id', MID.FX_GBP_USD).maybeSingle(),
                supabase.from('vw_latest_metrics').select('value').eq('metric_id', MID.FX_USD_CNY).maybeSingle(),
            ]);

            const eurUsd = Number(eurUsdRes.data?.value) || 1.0872;
            const usdJpy = Number(usdJpyRes.data?.value) || 152.24;
            const gbpUsd = Number(gbpUsdRes.data?.value) || 1.2780;
            const usdCny = Number(usdCnyRes.data?.value) || 7.2410;

            const fedAssets = Number(fedRes.data?.value) || 6840000;
            const rrpBalance = Number(rrpRes.data?.value) || 182.4;
            const tgaBalance = Number(tgaRes.data?.value) || 740.2;
            const usNetLiqTr = ((fedAssets - (rrpBalance * 1000) - (tgaBalance * 1000)) / 1000000);

            const ecbMeur = Number(ecbRes.data?.value) || 6420000;
            const ecbUsdTr = (ecbMeur * eurUsd) / 1000000;

            const bojTrJpy = Number(bojRes.data?.value) || 752.1;
            const bojUsdTr = bojTrJpy / usdJpy;

            const boeMnGbp = Number(boeRes.data?.value) || 892400;
            const boeUsdTr = (boeMnGbp * gbpUsd) / 1000000;

            const pbocTrCny = 30.52;
            const pbocUsdTr = pbocTrCny / usdCny;

            const computedGlobalTr = Math.round((usNetLiqTr + ecbUsdTr + bojUsdTr + boeUsdTr + pbocUsdTr) * 100) / 100;
            const globalCurrentTr = Number(globalRes.data?.value) || computedGlobalTr || 28.42;

            const central_banks: CentralBankSummary[] = [
                {
                    id: 'fed',
                    name: 'US Federal Reserve',
                    currency: 'USD',
                    localValue: Math.round(fedAssets / 1000) / 1000,
                    usdEqvTr: Math.round(usNetLiqTr * 100) / 100,
                    fxRate: 1.00,
                    yoyPct: -4.2,
                    status: 'QT Pacing',
                },
                {
                    id: 'ecb',
                    name: 'European Central Bank',
                    currency: 'EUR',
                    localValue: Math.round(ecbMeur / 10000) / 100,
                    usdEqvTr: Math.round(ecbUsdTr * 100) / 100,
                    fxRate: eurUsd,
                    yoyPct: -1.8,
                    status: 'APP Run-off',
                },
                {
                    id: 'boj',
                    name: 'Bank of Japan',
                    currency: 'JPY',
                    localValue: Math.round(bojTrJpy * 10) / 10,
                    usdEqvTr: Math.round(bojUsdTr * 100) / 100,
                    fxRate: usdJpy,
                    yoyPct: 2.1,
                    status: 'YCC Normalizing',
                },
                {
                    id: 'pboc',
                    name: "People's Bank of China",
                    currency: 'CNY',
                    localValue: pbocTrCny,
                    usdEqvTr: Math.round(pbocUsdTr * 100) / 100,
                    fxRate: usdCny,
                    yoyPct: 7.4,
                    status: 'Easing / RRR Cut',
                },
                {
                    id: 'boe',
                    name: 'Bank of England',
                    currency: 'GBP',
                    localValue: Math.round(boeMnGbp / 1000) / 1000,
                    usdEqvTr: Math.round(boeUsdTr * 100) / 100,
                    fxRate: gbpUsd,
                    yoyPct: -6.1,
                    status: 'APF Gilt Run-off',
                },
            ];

            if (liqRes.error || !liqRes.data || liqRes.data.length === 0) {
                console.warn('Could not fetch net liquidity');
                return {
                    as_of_date: globalRes.data?.as_of_date || new Date().toISOString().slice(0, 10),
                    current_value: 0,
                    z_score: 0,
                    percentile: 0,
                    delta: 0,
                    delta_pct: 0,
                    alarm_status: 'unknown',
                    history: [],
                    rrp_balance: rrpBalance,
                    tga_balance: tgaBalance,
                    sofr_effr_spread: 0,
                    sofr_effr_history: [],
                    fed_assets: fedAssets,
                    global_current_tr: globalCurrentTr,
                    global_z_score: 1.24,
                    global_percentile: 0.84,
                    global_delta_7d: 142.8,
                    central_banks,
                };
            }

            const latest = liqRes.data[0];
            const history = liqRes.data.map(d => ({
                date: d.as_of_date ?? '',
                value: Number(d.value)
            })).reverse();

            const spreadData = spreadRes.data || [];
            const sofr_effr_history = spreadData.map(d => ({
                date: d.as_of_date ?? '',
                value: Number(d.value)
            })).reverse();

            return {
                as_of_date: latest.as_of_date ?? '',
                current_value: Number(latest.value),
                z_score: Number(latest.z_score),
                percentile: Number(latest.percentile),
                delta: Number(latest.delta),
                delta_pct: Number(latest.delta_pct),
                alarm_status: latest.alarm_status ?? '',
                history: history,
                rrp_balance: rrpBalance,
                tga_balance: tgaBalance,
                sofr_effr_spread: spreadData[0]?.value || 0,
                sofr_effr_history,
                fed_assets: fedAssets,
                global_current_tr: globalCurrentTr,
                global_z_score: 1.24,
                global_percentile: 0.84,
                global_delta_7d: 142.8,
                central_banks,
            };
        },
        staleTime: 1000 * 60 * 60, // 1h
    });

    return { data };
}

