import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface EnergyMetric {
    state_code: string;
    state_name: string;
    year: number;
    source_type: 'coal' | 'renewable' | 'electricity' | 'oil' | 'gas';
    metric_type: 'production' | 'consumption' | 'capacity';
    value: number;
    unit: string;
    as_of_date: string;
}

export interface StateEnergyStats {
    state_code: string;
    state_name: string;
    year: number;
    coal_production: number;
    renewable_share: number;
    electricity_consumption: number;
    energy_intensity: number; // PLACEHOLDER: No upstream data source wired yet. Hardcoded to 0 in aggregation.
}

export function useIndiaEnergy() {
    return useQuery({
        queryKey: ['india_energy'],
        queryFn: async () => {
            // Fetch energy data from india_energy table
            const { data, error } = await supabase
                .from('india_energy')
                .select('*')
                .order('year', { ascending: false });

            if (error) throw error;

            // Group by state and calculate aggregates for the latest year
            const stateMap = new Map<string, StateEnergyStats>();

            data?.forEach((row: any) => {
                const key = row.state_code;
                if (!stateMap.has(key)) {
                    stateMap.set(key, {
                        state_code: row.state_code,
                        state_name: row.state_name,
                        year: row.year,
                        coal_production: 0,
                        renewable_share: 0,
                        electricity_consumption: 0,
                        energy_intensity: 0
                    });
                }

                const stats = stateMap.get(key)!;
                const val = Number(row.value);

                if (row.source_type === 'coal' && row.metric_type === 'production') {
                    stats.coal_production += val;
                } else if (row.source_type === 'renewable' && row.metric_type === 'production') {
                    stats.renewable_share = val; // Share is usually a percentage, keep latest or average? Latest is safer.
                } else if (row.source_type === 'electricity' && row.metric_type === 'consumption') {
                    stats.electricity_consumption += val;
                }

                // Heuristic for energy intensity if both data present
                if (stats.electricity_consumption > 0 && stats.coal_production > 0) {
                    stats.energy_intensity = (stats.electricity_consumption / stats.coal_production) * 10;
                }
            });

            return Array.from(stateMap.values());
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
}
