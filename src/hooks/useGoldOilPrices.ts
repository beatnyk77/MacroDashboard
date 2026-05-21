import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface GoldOilPrices {
    goldPrice: number;
    oilPrice: number;
    isLoading: boolean;
    isError: boolean;
}

export function useGoldOilPrices() {
    return useQuery({
        queryKey: ['gold-oil-prices'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('metric_observations')
                .select('metric_id, value, as_of_date')
                .in('metric_id', ['GOLD_PRICE_USD', 'OIL_BRENT_PRICE_USD'])
                .order('as_of_date', { ascending: false });

            if (error) {
                console.warn('Error fetching Gold & Oil prices:', error);
                throw error;
            }

            // Find the most recent observation for each metric
            const goldObs = data?.find(d => d.metric_id === 'GOLD_PRICE_USD');
            const oilObs = data?.find(d => d.metric_id === 'OIL_BRENT_PRICE_USD');

            return {
                goldPrice: goldObs?.value ? Number(goldObs.value) : 2400,
                oilPrice: oilObs?.value ? Number(oilObs.value) : 80,
            };
        },
        staleTime: 1000 * 60 * 30, // Cache for 30 minutes
        gcTime: 1000 * 60 * 60,   // Keep unused query in garbage collection for 1 hour
    });
}
