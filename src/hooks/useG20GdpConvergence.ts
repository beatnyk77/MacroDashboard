import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface GdpPerCapitaData {
    country_code: string;
    country_name: string;
    year: number;
    value_constant_usd: number;
}

export function useG20GdpConvergence() {
    return useQuery({
        queryKey: ['g20_gdp_convergence'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('imf_gdp_per_capita')
                .select('country_code, country_name, year, value_constant_usd')
                .order('year', { ascending: true });

            if (error) throw error;
            return data as GdpPerCapitaData[];
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours as this data is slow-moving
    });
}
