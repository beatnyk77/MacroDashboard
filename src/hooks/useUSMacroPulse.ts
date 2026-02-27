import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
    'CAPITAL_FROM_EM_DEBT_BN',
    'CAPITAL_FROM_GOLD_ETF_BN',
    'INFLATION_HEADLINE_YOY',
    'INFLATION_CORE_YOY',
    'BOP_CURRENT_ACCOUNT_GDP',
    'BOP_RESERVES_MONTHS',
    'BOP_SHORT_TERM_DEBT_GDP',
    'HOUSING_PRICE_INDEX',
    'HOUSING_MORTGAGE_RATE_30Y',
    'PMI_US_MFG',
    'PMI_US_SERVICES',
    'LABOR_VACANCIES_JOLTS',
    'LABOR_UNEMPLOYMENT_RATE',
    'LABOR_WAGE_GROWTH_YOY',
    'US_10Y_YIELD'
];

export function useUSMacroPulse() {
    return useSuspenseQuery({
        queryKey: ['us-macro-pulse-25y'],
        queryFn: async (): Promise<USMacroPulseData[]> => {
            // ... (keep fetch logic)
            const { data: historyData, error: historyError } = await supabase
                .from('metric_observations')
                .select('metric_id, as_of_date, value')
                .in('metric_id', US_MACRO_METRICS)
                .order('as_of_date', { ascending: true });

            if (historyError) throw historyError;

            const { data: latestData, error: latestError } = await supabase
                .from('vw_latest_metrics')
                .select('*')
                .in('metric_id', US_MACRO_METRICS);

            if (latestError) throw latestError;

            return US_MACRO_METRICS.map(metricId => {
                const metricHistory = historyData
                    ?.filter(h => h.metric_id === metricId)
                    .map(h => ({
                        date: h.as_of_date,
                        value: Number(h.value)
                    })) || [];

                const latest = latestData?.find(l => l.metric_id === metricId);

                const lastDate = latest?.last_updated_at ? new Date(latest.last_updated_at) : (metricHistory.length > 0 ? new Date(metricHistory[metricHistory.length - 1].date) : null);
                const isStale = lastDate ? (new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24) > 35 : true;

                return {
                    metric_id: metricId,
                    history: metricHistory,
                    current_value: latest?.value !== undefined ? Number(latest.value) : (metricHistory.length > 0 ? metricHistory[metricHistory.length - 1].value : 0),
                    delta_yoy: latest?.delta_yoy,
                    z_score: latest?.z_score,
                    percentile: latest?.percentile,
                    isStale
                };
            });
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });
}
