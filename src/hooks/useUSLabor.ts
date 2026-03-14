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
            return data as USLaborData[];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};
