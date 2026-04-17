import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface MacroSnapshot {
    id: string;
    snapshot_date: string;
    geopolitical_summary: string;
    insights_positive: string[];
    insights_neutral: string[];
    insights_negative: string[];
    metrics_data: {
        name: string;
        unit: string;
        values: Record<string, number | null>;
        status: 'positive' | 'neutral' | 'negative';
    }[];
    created_at: string;
}

export function useIndiaMacroSnapshot() {
    return useQuery({
        queryKey: ['india_macro_snapshot'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('india_macro_snapshots')
                .select('*')
                .order('snapshot_date', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                console.warn('[useIndiaMacroSnapshot] fetch error:', error.message);
                return null;
            }
            return data as MacroSnapshot | null;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
        retry: 1,
    });
}
