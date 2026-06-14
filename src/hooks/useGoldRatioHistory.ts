import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { METRIC_IDS as MID } from '@/constants/metricIds';

export interface GoldRatioHistory {
    date: string;
    ratios: {
        ratio_name: string;
        value: number;
    }[];
}

export function useGoldRatioHistory(days: number = 90) {
    return useQuery({
        queryKey: ['gold-ratio-history', days],
        queryFn: async () => {
            // We fetch the raw observations and compute ratios in JS for flexibility
            // Metrics needed: GOLD_PRICE_USD, US_M2, SPX_INDEX, TOTAL_PUBLIC_DEBT, SILVER_PRICE_USD
            const { data, error } = await supabase
                .from('metric_observations')
                .select('metric_id, as_of_date, value')
                .in('metric_id', [MID.GOLD_PRICE_USD, MID.US_M2, MID.SPX_INDEX, MID.TOTAL_PUBLIC_DEBT, MID.SILVER_PRICE_USD])
                .gte('as_of_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                .order('as_of_date', { ascending: true });

            if (error || !data) return [];

            // Group by date
            const byDate: Record<string, any> = {};
            data.forEach(obs => {
                if (!byDate[obs.as_of_date]) byDate[obs.as_of_date] = {};
                byDate[obs.as_of_date][obs.metric_id] = Number(obs.value);
            });

            // Calculate ratios
            return Object.entries(byDate).map(([date, vals]) => {
                const gold = vals[MID.GOLD_PRICE_USD];
                const silver = vals[MID.SILVER_PRICE_USD];
                const m2 = vals[MID.US_M2];
                const spx = vals[MID.SPX_INDEX];
                const debt = vals[MID.TOTAL_PUBLIC_DEBT];

                const ratios = [];
                if (gold && m2) ratios.push({ ratio_name: 'M2/Gold', value: m2 / gold });
                if (gold && spx) ratios.push({ ratio_name: 'SPX/Gold', value: spx / gold });
                if (gold && debt) ratios.push({ ratio_name: 'DEBT/Gold', value: (debt / gold) / 1000000000.0 });
                if (gold && silver) ratios.push({ ratio_name: 'Gold/Silver', value: gold / silver });

                return { date, ratios };
            }).filter(d => d.ratios.length > 0);
        },
        staleTime: 1000 * 60 * 30, // 30 min
    });
}
