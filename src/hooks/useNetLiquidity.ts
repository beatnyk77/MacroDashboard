import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
}

export function useNetLiquidity() {
    const { data } = useSuspenseQuery({
        queryKey: ['net-liquidity'],
        queryFn: async (): Promise<NetLiquidityData> => {
            const [liqRes, rrpRes, tgaRes, spreadRes, fedRes] = await Promise.all([
                supabase.from('vw_net_liquidity').select('*').order('as_of_date', { ascending: false }).limit(90),
                supabase.from('vw_latest_metrics').select('value').eq('metric_id', 'RRP_BALANCE_BN').maybeSingle(),
                supabase.from('vw_latest_metrics').select('value').eq('metric_id', 'TGA_BALANCE_BN').maybeSingle(),
                supabase.from('metric_observations').select('as_of_date, value').eq('metric_id', 'SOFR_EFFR_SPREAD_BPS').order('as_of_date', { ascending: false }).limit(30),
                supabase.from('vw_latest_metrics').select('value').eq('metric_id', 'FED_BALANCE_SHEET').maybeSingle()
            ]);

            if (liqRes.error || !liqRes.data || liqRes.data.length === 0) {
                console.warn('Could not fetch net liquidity');
                // Return default values instead of null to ensure Suspense works correctly
                return {
                    as_of_date: '',
                    current_value: 0,
                    z_score: 0,
                    percentile: 0,
                    delta: 0,
                    delta_pct: 0,
                    alarm_status: 'unknown',
                    history: [],
                    rrp_balance: 0,
                    tga_balance: 0,
                    sofr_effr_spread: 0,
                    sofr_effr_history: [],
                    fed_assets: 0
                };
            }

            const latest = liqRes.data[0];
            const history = liqRes.data.map(d => ({
                date: d.as_of_date,
                value: Number(d.value)
            })).reverse();

            const spreadData = spreadRes.data || [];
            const sofr_effr_history = spreadData.map(d => ({
                date: d.as_of_date,
                value: Number(d.value)
            })).reverse();

            return {
                as_of_date: latest.as_of_date,
                current_value: Number(latest.value),
                z_score: Number(latest.z_score),
                percentile: Number(latest.percentile),
                delta: Number(latest.delta),
                delta_pct: Number(latest.delta_pct),
                alarm_status: latest.alarm_status,
                history: history,
                rrp_balance: rrpRes.data?.value || 0,
                tga_balance: tgaRes.data?.value || 0,
                sofr_effr_spread: spreadData[0]?.value || 0,
                sofr_effr_history,
                fed_assets: fedRes.data?.value || 0
            };
        },
        staleTime: 1000 * 60 * 60, // 1h
    });

    return { data };
}

