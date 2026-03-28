import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface USLaborData {
    date: string;
    unemployment_rate: number;
    labor_participation_rate: number;
    nonfarm_payrolls: number;
    adp_payrolls: number;
    initial_claims: number;
    continuing_claims: number;
    jolts_openings: number;
    jolts_quits: number;
    jolts_layoffs: number;
    average_hourly_earnings: number;
    labor_distress_index: number;
}

export const useUSLabor = () => {
    return useQuery({
        queryKey: ['us-labor-market'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('us_labor_market')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;
            const numericFields: Array<keyof USLaborData> = [
                'unemployment_rate', 'labor_participation_rate', 'nonfarm_payrolls',
                'adp_payrolls', 'initial_claims', 'continuing_claims',
                'jolts_openings', 'jolts_quits', 'jolts_layoffs',
                'average_hourly_earnings', 'labor_distress_index'
            ];
            const rawData = (data as any[]).map(d => {
                const item = { ...d };
                numericFields.forEach(field => {
                    if (item[field] !== null) {
                        item[field] = Number(item[field]);
                    }
                });
                return item as USLaborData;
            });
            if (rawData.length === 0) {
                return {
                    data: [],
                    staleness: { daysStale: 0, status: 'fresh' as const, lastUpdate: new Date().toISOString() }
                };
            }
            // Forward fill null values
            const filledData = [...rawData];
            for (let i = 1; i < filledData.length; i++) {
                const current = filledData[i];
                const prev = filledData[i - 1];
                (Object.keys(current) as Array<keyof USLaborData>).forEach(key => {
                    if (current[key] === null && prev[key] !== null) {
                        (current as any)[key] = prev[key];
                    }
                });
            }

            const latestDate = filledData.length > 0 ? new Date(filledData[filledData.length - 1].date) : new Date();
            const now = new Date();
            const stalenessDays = Math.floor((now.getTime() - latestDate.getTime()) / (1000 * 3600 * 24));
            
            // For monthly labor data, freshness threshold is ~35 days.
            const status = stalenessDays > 45 ? 'critical' : stalenessDays > 35 ? 'stale' : 'fresh';

            return {
                data: filledData,
                staleness: {
                    daysStale: stalenessDays,
                    status,
                    lastUpdate: latestDate.toISOString()
                }
            };
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};
