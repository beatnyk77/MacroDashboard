import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AfricaMacroSnapshot {
    id: string;
    snapshot_date: string;
    continent_summary: string;
    insights_positive: string[];
    insights_neutral: string[];
    insights_negative: string[];
    metrics_summary: {
        name: string;
        value: number;
        unit: string;
        trend: 'up' | 'down' | 'neutral';
    }[];
    created_at: string;
}

export function useAfricaMacroSnapshot() {
    return useQuery({
        queryKey: ['africa_macro_snapshot'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('africa_macro_snapshots')
                .select('*')
                .order('snapshot_date', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            return data as AfricaMacroSnapshot;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
