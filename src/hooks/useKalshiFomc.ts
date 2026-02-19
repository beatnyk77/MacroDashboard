import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface KalshiFomcProbability {
    meeting_date: string;
    outcome: string;
    probability: number;
    volume_contracts: number;
    prev_day_probability: number | null;
    ticker: string;
    fetched_at: string;
}

export const useKalshiFomc = () => {
    return useQuery({
        queryKey: ['kalshi-fomc-probabilities'],
        queryFn: async () => {
            // Get the latest batch
            const { data: latestBatch, error: latestError } = await supabase
                .from('kalshi_fomc_probabilities')
                .select('fetched_at')
                .order('fetched_at', { ascending: false })
                .limit(1);

            if (latestError) throw latestError;
            if (!latestBatch || latestBatch.length === 0) return [];

            const { data, error } = await supabase
                .from('kalshi_fomc_probabilities')
                .select('*')
                .eq('fetched_at', latestBatch[0].fetched_at)
                .order('probability', { ascending: false });

            if (error) throw error;
            return data as KalshiFomcProbability[];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};
