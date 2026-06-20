import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { METRIC_IDS as MID } from '@/constants/metricIds';

export interface GoldOilPrices {
    goldPrice: number | null;
    oilPrice: number | null;
}

export function useGoldOilPrices() {
    return useQuery({
        queryKey: ['gold-oil-prices'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('metric_observations')
                .select('metric_id, value, as_of_date')
                .in('metric_id', [MID.GOLD_PRICE_USD, MID.BRENT_CRUDE_PRICE])
                .order('as_of_date', { ascending: false });

            if (error) {
                console.warn('Error fetching Gold & Oil prices:', error);
                throw error;
            }

            // Find the most recent observation for each metric
            const goldObs = data?.find(d => d.metric_id === MID.GOLD_PRICE_USD);
            const oilObs = data?.find(d => d.metric_id === MID.BRENT_CRUDE_PRICE);

            return {
                goldPrice: goldObs?.value != null ? Number(goldObs.value) : null,
                oilPrice: oilObs?.value != null ? Number(oilObs.value) : null,
            };
        },
        staleTime: 1000 * 60 * 30, // Cache for 30 minutes
        gcTime: 1000 * 60 * 60,   // Keep unused query in garbage collection for 1 hour
    });
}
