import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ASIMetric {
    state_code: string;
    state_name: string;
    year: number;
    sector: string;
    gva_crores: number;
    employment_thousands: number;
    capacity_utilization_rate: number;
    fixed_capital_crores: number;
    output_crores: number;
}

export interface StateASIStats {
    state_code: string;
    state_name: string;
    year: number;
    total_gva: number;
    total_employment: number;
    avg_capacity_utilization: number;
    manufacturing_gva: number;
    mining_gva: number;
    electricity_gva: number;
    employment_growth_yoy: number;
}

export function useIndiaASI() {
    return useQuery({
        queryKey: ['india_asi'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('india_asi')
                .select('*')
                .order('year', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) return [];

            const years = Array.from(new Set(data.map((d: ASIMetric) => d.year))).sort((a, b) => b - a);
            const latestYear = years[0];
            const prevYear = years[1];

            const stateMap = new Map<string, StateASIStats>();
            const prevStateMap = new Map<string, number>(); // Cache previous total employment

            // First Pass: Get Previous Year Employment
            if (prevYear) {
                data.forEach((row: ASIMetric) => {
                    if (row.year === prevYear && row.sector === 'all_industries') {
                        prevStateMap.set(row.state_code, row.employment_thousands || 0);
                    }
                });
            }

            // Second Pass: Build Current Stats
            data.forEach((row: ASIMetric) => {
                if (row.year !== latestYear) return;

                const key = row.state_code;

                if (!stateMap.has(key)) {
                    stateMap.set(key, {
                        state_code: row.state_code,
                        state_name: row.state_name,
                        year: row.year,
                        total_gva: 0,
                        total_employment: 0,
                        avg_capacity_utilization: 0,
                        manufacturing_gva: 0,
                        mining_gva: 0,
                        electricity_gva: 0,
                        employment_growth_yoy: 0 // Default
                    });
                }

                const stats = stateMap.get(key)!;

                // Aggregate by sector
                if (row.sector === 'all_industries') {
                    stats.total_gva = row.gva_crores || 0;
                    stats.total_employment = row.employment_thousands || 0;
                    stats.avg_capacity_utilization = row.capacity_utilization_rate || 0;

                    // Calculate Growth
                    const prevEmp = prevStateMap.get(key) || 0;
                    if (prevEmp > 0) {
                        stats.employment_growth_yoy = ((stats.total_employment - prevEmp) / prevEmp) * 100;
                    }
                } else if (row.sector === 'manufacturing') {
                    stats.manufacturing_gva = row.gva_crores || 0;
                } else if (row.sector === 'mining') {
                    stats.mining_gva = row.gva_crores || 0;
                } else if (row.sector === 'electricity') {
                    stats.electricity_gva = row.gva_crores || 0;
                }
            });

            return Array.from(stateMap.values());
        },
        staleTime: 1000 * 60 * 60, // 1 hour (ASI data is annual)
    });
}
