import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface GoldRatioData {
    asOfDate: string;
    m2Gold: { value: number; zScore: number; percentile: number };
    spxGold: { value: number; zScore: number; percentile: number };
    history: { date: string; m2: number; spx: number }[];
}

export function useGoldRatios() {
    return useQuery({
        queryKey: ['gold_ratios'],
        queryFn: async (): Promise<GoldRatioData | null> => {
            const { data, error } = await supabase
                .from('vw_gold_ratios')
                .select('*')
                .limit(30);

            if (error || !data || data.length === 0) return null;

            const latest = data[0];
            return {
                asOfDate: latest.as_of_date,
                m2Gold: {
                    value: Number(latest.m2_gold_ratio),
                    zScore: Number(latest.m2_z_score),
                    percentile: Number(latest.m2_percentile)
                },
                spxGold: {
                    value: Number(latest.spx_gold_ratio),
                    zScore: Number(latest.spx_z_score),
                    percentile: Number(latest.spx_percentile)
                },
                history: data.map(d => ({
                    date: String(d.as_of_date),
                    m2: Number(d.m2_gold_ratio),
                    spx: Number(d.spx_gold_ratio)
                })).reverse()
            };
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
