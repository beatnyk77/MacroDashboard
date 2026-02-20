import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface YieldCurveData {
    id: string;
    country: string;
    tenor: string;
    yield_pct: number;
    prev_yield: number | null;
    as_of_date: string;
    source: string;
    updated_at: string;
}

export function useYieldCurves() {
    return useQuery({
        queryKey: ['yield-curves'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('yield_curves')
                .select('*')
                .order('as_of_date', { ascending: false });

            if (error) throw error;
            return data as YieldCurveData[];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
        refetchOnWindowFocus: false,
    });
}
