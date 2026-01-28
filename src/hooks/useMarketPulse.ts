import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface MarketPulseItem {
    id: string;
    name: string;
    value: number;
    delta_wow: number;
    staleness_flag: string;
}

export function useMarketPulse() {
    return useQuery({
        queryKey: ['market-pulse'],
        queryFn: async (): Promise<MarketPulseItem[]> => {
            const tickerIds = [
                'GOLD_PRICE_USD',
                'WTI_CRUDE_PRICE',
                'SILVER_PRICE_USD',
                'VIX_INDEX',
                'DXY_INDEX',
                'UST_10Y_YIELD',
                'UST_10Y_2Y_SPREAD',
                'BITCOIN_PRICE_USD',
                'SOFR_RATE',
                'EM_FX_RESERVES',
                'PRIMARY_DEALER_UST_HOLDINGS'
            ];
            // SOFR_EFFR_SPREAD is often calculated, but if it has its own ID we add it. 
            // I'll add BRENT as well to reach 12.
            tickerIds.push('BRENT_CRUDE_PRICE');

            const { data, error } = await supabase
                .from('vw_latest_metrics')
                .select('metric_id, metric_name, value, delta_wow, staleness_flag')
                .in('metric_id', tickerIds);

            if (error) throw error;

            return (data || []).map(m => ({
                id: m.metric_id,
                name: m.metric_name,
                value: Number(m.value),
                delta_wow: Number(m.delta_wow || 0),
                staleness_flag: m.staleness_flag
            }));
        },
        staleTime: 1000 * 60 * 5, // 5m
    });
}
