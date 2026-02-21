import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AIComputeEnergyData {
    id: number;
    metric_id: string;
    as_of_date: string;
    value: number;
    label: string | null;
    category: string | null;
    metadata: any;
    updated_at: string;
}

export const useAIComputeEnergy = () => {
    return useQuery({
        queryKey: ['ai-compute-energy'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_compute_energy')
                .select('*')
                .order('as_of_date', { ascending: true }); // Important for chronological charts

            if (error) throw error;
            return data as AIComputeEnergyData[];
        },
        staleTime: 1000 * 60 * 60 * 6, // 6 hours
    });
};
