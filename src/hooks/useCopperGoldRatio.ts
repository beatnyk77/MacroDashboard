import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CopperGoldRatioData {
    value: number;
    delta_yoy: number;
    z_score: number;
    history: { date: string; value: number }[];
    last_updated: string;
    status: 'safe' | 'warning' | 'danger' | 'neutral';
}

export function useCopperGoldRatio() {
    return useQuery({
        queryKey: ['copper-gold-ratio'],
        queryFn: async (): Promise<CopperGoldRatioData | null> => {
            // 1. Get latest ratio
            const { data: latest, error: latestError } = await supabase
                .from('vw_latest_metrics')
                .select('*')
                .eq('metric_id', 'COPPER_GOLD_RATIO')
                .maybeSingle();

            if (latestError || !latest) {
                console.warn('COPPER_GOLD_RATIO not found');
                return null;
            }

            // 2. Fetch history for sparkline
            const { data: history } = await supabase
                .from('metric_observations')
                .select('as_of_date, value')
                .eq('metric_id', 'COPPER_GOLD_RATIO')
                .order('as_of_date', { ascending: false })
                .limit(250);

            const latestValue = Number(latest.value);
            const zScore = Number(latest.z_score || 0);

            // Mapping: High ratio = risk on / expansion = safe sentiment for growth
            // Low ratio = risk off / recession = danger/warning
            let status: 'safe' | 'warning' | 'danger' | 'neutral' = 'neutral';
            if (zScore > 1) status = 'safe';
            else if (zScore < -1.5) status = 'danger';
            else if (zScore < -0.5) status = 'warning';

            return {
                value: latestValue,
                delta_yoy: Number(latest.delta_mom || 0), // Defaulting to delta_mom for now if YoY not computed in view
                z_score: zScore,
                history: (history || []).map(h => ({ date: String(h.as_of_date), value: Number(h.value) })).reverse(),
                last_updated: latest.as_of_date,
                status
            };
        },
        staleTime: 1000 * 60 * 15, // 15 min
    });
}
