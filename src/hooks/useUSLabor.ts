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

            const rawData = data as USLaborData[];
            if (rawData.length === 0) return rawData;

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

            return filledData;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};
