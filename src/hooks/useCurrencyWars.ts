import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { METRIC_IDS as MID } from '@/constants/metricIds';

export interface CurrencyWarsData {
    date: string;
    fed_rate: number;
    rbi_rate: number;
    usd_inr: number;
    divergence: number;
    pressure: number; // Mapping to composite_pressure
    tension: number;
    // EM currencies
    usd_cny?: number;
    usd_brl?: number;
    usd_mxn?: number;
    usd_twd?: number;
    // Derived metrics
    composite_pressure?: number;
    em_relative_pressure?: number;
}

interface MetricObservation {
    metric_id: string;
    as_of_date: string;
    value: number;
}

export const useCurrencyWars = () => {
    return useQuery<CurrencyWarsData[]>({
        queryKey: ['currency-wars'],
        queryFn: async () => {
            // USD_CNY/BRL/MXN/TWD are stubs: 0 rows in DB, no backend writes them yet.
            const metricIds = [
                MID.FED_FUNDS_RATE,
                MID.IN_REPO_RATE,
                MID.USD_INR_RATE,
                MID.POLICY_DIVERGENCE_INDEX,
                MID.FLOW_TENSION_INDEX,
                MID.USD_CNY_RATE,
                MID.USD_BRL_RATE,
                MID.USD_MXN_RATE,
                MID.USD_TWD_RATE,
                MID.COMPOSITE_PRESSURE_INDEX,
                MID.EM_RELATIVE_PRESSURE,
            ];

            const { data, error } = await supabase
                .from('metric_observations')
                .select('metric_id, as_of_date, value')
                .in('metric_id', metricIds)
                .order('as_of_date', { ascending: false })
                .limit(5000);

            if (error) throw error;

            // Pivot data by date with fill-forward for latest view
            const pivoted: Record<string, Partial<CurrencyWarsData>> = {};
            const latestValues: Record<string, number> = {};

            const keyMap: Record<string, keyof CurrencyWarsData> = {
                [MID.FED_FUNDS_RATE]: 'fed_rate',
                [MID.IN_REPO_RATE]: 'rbi_rate',
                [MID.USD_INR_RATE]: 'usd_inr',
                [MID.POLICY_DIVERGENCE_INDEX]: 'divergence',
                [MID.FLOW_TENSION_INDEX]: 'tension',
                [MID.USD_CNY_RATE]: 'usd_cny',
                [MID.USD_BRL_RATE]: 'usd_brl',
                [MID.USD_MXN_RATE]: 'usd_mxn',
                [MID.USD_TWD_RATE]: 'usd_twd',
                [MID.COMPOSITE_PRESSURE_INDEX]: 'composite_pressure',
                [MID.EM_RELATIVE_PRESSURE]: 'em_relative_pressure',
            };

            (data as MetricObservation[]).forEach(obs => {
                const key = keyMap[obs.metric_id];
                if (!key) return;

                latestValues[key] = obs.value;

                if (!pivoted[obs.as_of_date]) {
                    pivoted[obs.as_of_date] = { date: obs.as_of_date };
                }

                pivoted[obs.as_of_date][key] = obs.value as any;
                
                // Map composite_pressure to 'pressure' for backward compatibility in components
                if (key === 'composite_pressure') {
                    pivoted[obs.as_of_date]['pressure'] = obs.value;
                }
            });

            // Ensure the last record has all the latest values for the dashboard summaries
            const result = Object.values(pivoted).sort((a, b) => (a.date || '').localeCompare(b.date || '')) as CurrencyWarsData[];
            if (result.length > 0) {
                const last = result[result.length - 1];
                Object.keys(latestValues).forEach(k => {
                    const key = k as keyof CurrencyWarsData;
                    if (last[key] === undefined) {
                        (last as any)[key] = latestValues[key];
                    }
                });
                // Ensure pressure is synced in latest
                if (last.pressure === undefined) last.pressure = latestValues['composite_pressure'] || 0;
            }

            return result.reverse();
        }
    });
};
