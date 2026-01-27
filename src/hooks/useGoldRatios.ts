import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface GoldRatioData {
    ratio_name: string;
    current_value: number;
    z_score: number;
    percentile: number;
    last_updated: string;
}

export function useGoldRatios() {
    return useQuery({
        queryKey: ['gold-ratios'],
        queryFn: async (): Promise<GoldRatioData[]> => {
            const { data, error } = await supabase
                .from('vw_gold_ratios')
                .select('*');

            if (error || !data) {
                console.warn('Could not fetch gold ratios');
                return [];
            }

            return data.map(r => ({
                ratio_name: r.ratio_name,
                current_value: Number(r.current_value),
                z_score: Number(r.z_score),
                percentile: Number(r.percentile),
                last_updated: r.last_updated
            }));
        },
        staleTime: 1000 * 60 * 60, // 1h
    });
}
