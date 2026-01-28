import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface GoldRatioData {
    ratio_name: string;
    current_value: number;
    z_score: number;
    percentile: number;
    last_updated: string;
    history?: { date: string; value: number }[];
}

export function useGoldRatios() {
    return useQuery({
        queryKey: ['gold-ratios'],
        queryFn: async (): Promise<GoldRatioData[]> => {
            // 1. Fetch latest ratios
            const { data: latestRatios, error: ratioError } = await supabase
                .rpc('get_latest_gold_ratios');

            // Fallback to manual selection if RPC fails or isn't defined
            let finalLatest = latestRatios;
            if (ratioError || !latestRatios) {
                const { data } = await supabase
                    .from('vw_gold_ratios')
                    .select('*')
                    .order('last_updated', { ascending: false });

                // Group by ratio_name to get latest
                const unique = new Map();
                data?.forEach((r: any) => {
                    if (!unique.has(r.ratio_name)) unique.set(r.ratio_name, r);
                });
                finalLatest = Array.from(unique.values());
            }

            if (!finalLatest) return [];

            // 2. Fetch history for each ratio
            // We'll fetch all history from the view and group it
            const { data: historyData } = await supabase
                .from('vw_gold_ratios')
                .select('ratio_name, current_value, last_updated')
                .order('last_updated', { ascending: false })
                .limit(1000); // 250 points per ratio if 4 ratios

            return finalLatest.map((r: any) => ({
                ratio_name: r.ratio_name,
                current_value: Number(r.current_value),
                z_score: Number(r.z_score),
                percentile: Number(r.percentile),
                last_updated: r.last_updated,
                history: (historyData || [])
                    .filter((h: any) => h.ratio_name === r.ratio_name)
                    .map((h: any) => ({ date: h.last_updated, value: Number(h.current_value) }))
                    .reverse()
            }));
        },
        staleTime: 1000 * 60 * 60, // 1h
    });
}
