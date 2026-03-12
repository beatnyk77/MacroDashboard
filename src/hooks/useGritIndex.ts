import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface GritIndexData {
    id: string;
    country_code: string;
    as_of_date: string;
    grit_score: number;
    debt_stress_score: number;
    monetary_resilience_score: number;
    is_crisis_active: boolean;
    components: {
        debt_gdp: number;
        deficit_gdp: number;
        yield: number;
        reserve_velocity: number;
        ca_gdp: number;
        m2_gold: number;
    };
    last_updated_at: string;
}

export const useGritIndex = () => {
    return useQuery({
        queryKey: ['grit-index'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('grit_index')
                .select('*')
                .order('as_of_date', { ascending: false });

            if (error) throw error;
            return data as GritIndexData[];
        },
        refetchInterval: 1000 * 60 * 60, // Refresh every hour
    });
};
