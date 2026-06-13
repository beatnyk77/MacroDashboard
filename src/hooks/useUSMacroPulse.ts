import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { METRIC_IDS as MID } from '@/constants/metricIds';

export interface USMacroMetricPoint {
    date: string;
    value: number;
}

export interface USMacroPulseData {
    metric_id: string;
    history: USMacroMetricPoint[];
    current_value: number;
    delta_yoy?: number;
    z_score?: number;
    percentile?: number;
    isStale: boolean;
}

const US_MACRO_METRICS = [
    MID.CAPITAL_FROM_EM_DEBT_BN,
    MID.CAPITAL_FROM_GOLD_ETF_BN,
    MID.INFLATION_HEADLINE_YOY,
    MID.INFLATION_CORE_YOY,
    MID.BOP_CURRENT_ACCOUNT_GDP,
    MID.BOP_RESERVES_MONTHS,
    MID.BOP_SHORT_TERM_DEBT_GDP,
    MID.HOUSING_PRICE_INDEX,
    MID.HOUSING_MORTGAGE_RATE_30Y,
    MID.PMI_US_MFG,
    MID.PMI_US_SERVICES,
    MID.LABOR_VACANCIES_JOLTS,
    MID.LABOR_UNEMPLOYMENT_RATE,
    MID.LABOR_WAGE_GROWTH_YOY,
    MID.US_10Y_YIELD,
    MID.US_DEFENSE_SPENDING,
    MID.US_FEDERAL_INTEREST_PAYMENTS,
    MID.SRF_USAGE,
    MID.FX_SWAP_LINES,
    MID.TGA_BALANCE,
    MID.REVERSE_REPO_OUTSTANDING,
];

export function useUSMacroPulse() {
    return useSuspenseQuery({
        queryKey: ['us-macro-pulse-25y'],
        queryFn: async (): Promise<USMacroPulseData[]> => {
            // Fetch history for each metric individually to avoid PostgREST's default 1000-row limit truncation.
            // Ordering descending and limiting ensures we fetch the latest observations, 
            // and reversing maintains ascending order for proper UI rendering.
            const historyPromises = US_MACRO_METRICS.map(async (metricId) => {
                const { data, error } = await supabase
                    .from('metric_observations')
                    .select('as_of_date, value')
                    .eq('metric_id', metricId)
                    .order('as_of_date', { ascending: false })
                    .limit(1000);

                if (error) throw error;
                
                return {
                    metricId,
                    history: (data || []).map((h: any) => ({
                        date: h.as_of_date,
                        value: Number(h.value)
                    })).reverse()
                };
            });

            const historyResults = await Promise.all(historyPromises);
            const historyMap = new Map(historyResults.map(r => [r.metricId, r.history]));

            const { data: latestData, error: latestError } = await supabase
                .from('vw_latest_metrics')
                .select('*')
                .in('metric_id', US_MACRO_METRICS);

            if (latestError) throw latestError;

            return US_MACRO_METRICS.map(metricId => {
                const metricHistory = historyMap.get(metricId) || [];
                const latest = latestData?.find((l: any) => l.metric_id === metricId);

                const lastDate = latest?.last_updated_at ? new Date(latest.last_updated_at) : (metricHistory.length > 0 ? new Date(metricHistory[metricHistory.length - 1].date) : null);
                const isStale = lastDate ? (new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24) > 35 : true;

                return {
                    metric_id: metricId,
                    history: metricHistory,
                    current_value: latest?.value !== undefined ? Number(latest.value) : (metricHistory.length > 0 ? metricHistory[metricHistory.length - 1].value : 0),
                    delta_yoy: latest?.delta_mom ?? undefined, // delta_yoy not in vw_latest_metrics; using delta_mom as proxy
                    z_score: latest?.z_score ?? undefined,
                    percentile: latest?.percentile ?? undefined,
                    isStale
                };
            });
        },
        staleTime: 1000 * 60 * 5, // 5 minutes (prevents spamming but keeps telemetry fresh)
    });
}
