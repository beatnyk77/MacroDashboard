import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface G20SovereignData {
    debt_gdp_current: number;
    debt_gdp_delta: number | null;
    inflation_current: number;
    inflation_delta: number | null;
    real_rate_current: number;
    real_rate_delta: number | null;
    interest_burden_current: number;
    interest_burden_delta: number | null;
    last_computed_at: string;
}

export function useG20Sovereign() {
    return useQuery({
        queryKey: ['g20_sovereign'],
        queryFn: async (): Promise<G20SovereignData | null> => {
            const { data, error } = await supabase
                .from('vw_g20_sovereign')
                .select('*')
                .single();

            if (error) {
                console.error('Error fetching G20 sovereign data:', error);
                return null;
            }

            return data as G20SovereignData;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
