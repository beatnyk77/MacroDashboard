import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CurrencyWarsData {
    date: string;
    fed_rate: number;
    rbi_rate: number;
    usd_inr: number;
    divergence: number;
    pressure: number;
    tension: number;
}

export const useCurrencyWars = () => {
    return useQuery({
        queryKey: ['currency-wars'],
        queryFn: async () => {
            const metricIds = [
                'FED_FUNDS_RATE',
                'IN_REPO_RATE',
                'USD_INR_RATE',
                'POLICY_DIVERGENCE_INDEX',
                'RUPEE_PRESSURE_SCORE',
                'FLOW_TENSION_INDEX'
            ];

            const { data, error } = await supabase
                .from('metric_observations')
                .select('metric_id, as_of_date, value')
                .in('metric_id', metricIds)
                .order('as_of_date', { ascending: true });

            if (error) throw error;

            // Pivot data by date with fill-forward for latest view
            const pivoted: Record<string, any> = {};
            const latestValues: Record<string, number> = {};

            data.forEach(obs => {
                const keyMap: Record<string, string> = {
                    'FED_FUNDS_RATE': 'fed_rate',
                    'IN_REPO_RATE': 'rbi_rate',
                    'USD_INR_RATE': 'usd_inr',
                    'POLICY_DIVERGENCE_INDEX': 'divergence',
                    'RUPEE_PRESSURE_SCORE': 'pressure',
                    'FLOW_TENSION_INDEX': 'tension'
                };

                const key = keyMap[obs.metric_id];
                if (!key) return;

                latestValues[key] = obs.value;

                if (!pivoted[obs.as_of_date]) {
                    pivoted[obs.as_of_date] = { date: obs.as_of_date };
                }

                // For the chart, we want the actual observation on that date
                pivoted[obs.as_of_date][key] = obs.value;
            });

            // Ensure the last record has all the latest values for the dashboard summaries
            const result = Object.values(pivoted).sort((a: any, b: any) => a.date.localeCompare(b.date)) as CurrencyWarsData[];
            if (result.length > 0) {
                const last = result[result.length - 1];
                Object.keys(latestValues).forEach(key => {
                    if (last[key as keyof CurrencyWarsData] === undefined) {
                        (last as any)[key] = latestValues[key];
                    }
                });
            }

            return result;
        }
    });
};
