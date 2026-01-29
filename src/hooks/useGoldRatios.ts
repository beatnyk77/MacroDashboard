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

            // 2. Fetch history for each ratio from metric_observations
            const ratioIds = finalLatest.map((r: any) => {
                if (r.ratio_name === 'M2/Gold') return 'RATIO_M2_GOLD';
                if (r.ratio_name === 'SPX/Gold') return 'RATIO_SPX_GOLD';
                if (r.ratio_name === 'DEBT/Gold') return 'RATIO_DEBT_GOLD';
                if (r.ratio_name === 'Gold/Silver') return 'RATIO_GOLD_SILVER';
                return null;
            }).filter(Boolean) as string[];

            const { data: historyData } = await supabase
                .from('metric_observations')
                .select('metric_id, value, as_of_date')
                .in('metric_id', ratioIds)
                .order('as_of_date', { ascending: false })
                .limit(2000);

            return finalLatest.map((r: any) => {
                const metricIdMap: Record<string, string> = {
                    'M2/Gold': 'RATIO_M2_GOLD',
                    'SPX/Gold': 'RATIO_SPX_GOLD',
                    'DEBT/Gold': 'RATIO_DEBT_GOLD',
                    'Gold/Silver': 'RATIO_GOLD_SILVER'
                };
                const mId = metricIdMap[r.ratio_name];

                return {
                    ratio_name: r.ratio_name,
                    current_value: Number(r.current_value),
                    z_score: Number(r.z_score),
                    percentile: Number(r.percentile),
                    last_updated: r.last_updated,
                    history: (historyData || [])
                        .filter((h: any) => h.metric_id === mId)
                        .map((h: any) => ({ date: h.as_of_date, value: Number(h.value) }))
                        .reverse()
                };
            });
        },
        staleTime: 1000 * 60 * 60, // 1h
    });
}
