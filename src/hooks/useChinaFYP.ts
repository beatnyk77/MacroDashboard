import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface FYPItem {
    id: string;
    section: 'pillar' | 'target' | 'milestone' | 'correlation';
    category: string;
    label: string;
    value_target: string | null;
    value_baseline: string | null;
    impact_score: number;
    metadata: any;
    created_at: string;
}

export const useChinaFYP = () => {
    return useQuery<FYPItem[]>({
        queryKey: ['china-15th-fyp'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('china_15th_fyp')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            return (data ?? []) as FYPItem[];
        },
        staleTime: 24 * 60 * 60 * 1000, // Static data, long cache
    });
};
