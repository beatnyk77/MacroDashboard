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
    consumption_growth_yoy: number;
    energy_intensity: number;
}

export function useIndiaEnergy() {
    return useQuery({
        queryKey: ['india_energy'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('india_energy')
                .select('*')
                .order('year', { ascending: false });

            if (error) throw error;

            const stateMap = new Map<string, StateEnergyStats>();
            const prevStateMap = new Map<string, number>();

            const years = Array.from(new Set(data?.map((d: any) => d.year))).sort((a: any, b: any) => b - a);
            const latestYear = years[0];
            const prevYear = years[1];

            // Pass 1: Get Previous Year Electricity Consumption
            if (prevYear) {
                data?.forEach((row: any) => {
                    if (row.year === prevYear && row.source_type === 'electricity' && row.metric_type === 'consumption') {
                        prevStateMap.set(row.state_code, Number(row.value) || 0);
                    }
                });
            }

            data?.forEach((row: any) => {
                if (row.year !== latestYear) return;

                const key = row.state_code;
                if (!stateMap.has(key)) {
                    stateMap.set(key, {
                        state_code: row.state_code,
                        state_name: row.state_name,
                        year: row.year,
                        coal_production: 0,
                        renewable_share: 0,
                        electricity_consumption: 0,
                        consumption_growth_yoy: 0,
                        energy_intensity: 0
                    });
                }

                const stats = stateMap.get(key)!;
                const val = Number(row.value);

                if (row.source_type === 'coal' && row.metric_type === 'production') {
                    stats.coal_production += val;
                } else if (row.source_type === 'renewable' && row.metric_type === 'production') {
                    // Temporarily store renewable production here for share calculation
                    stats.renewable_share += val;
                } else if (row.source_type === 'electricity' && row.metric_type === 'consumption') {
                    stats.electricity_consumption += val;
                    const prevCons = prevStateMap.get(key) || 0;
                    if (prevCons > 0) {
                        stats.consumption_growth_yoy = ((stats.electricity_consumption - prevCons) / prevCons) * 100;
                    }
                }
            });

            // Calculate Renewable Share % and Energy Intensity
            stateMap.forEach((stats) => {
                const totalProd = stats.coal_production + stats.renewable_share;
                if (totalProd > 0) {
                    stats.renewable_share = (stats.renewable_share / totalProd) * 100;
                } else {
                    stats.renewable_share = 0;
                }

                // Energy Intensity: Electricity Consumption per GVA (Unit: kWh / Rupee or similar)
                // Since we don't have GVA here directly, we'll keep it as a relative metric for now
                if (stats.electricity_consumption > 0 && stats.coal_production > 0) {
                    stats.energy_intensity = (stats.electricity_consumption / stats.coal_production) * 10;
                }
            });

            return Array.from(stateMap.values());
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
}
