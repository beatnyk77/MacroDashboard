import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CommodityPrice {
    symbol: string;
    as_of_date: string;
    price: number;
    curve_type: string;
    z_score?: number;
}

const METRIC_IDS = [
    'WTI_CRUDE_PRICE',
    'BRENT_CRUDE_PRICE',
    'COPPER_PRICE_USD',
    'NICKEL_PRICE_USD',
] as const;

const METRIC_LABELS: Record<string, string> = {
    WTI_CRUDE_PRICE: 'WTI Crude',
    BRENT_CRUDE_PRICE: 'Brent Crude',
    COPPER_PRICE_USD: 'Copper ($/t)',
    NICKEL_PRICE_USD: 'Nickel ($/t)',
};

export const useCommodityPrices = () => {
    return useQuery({
        queryKey: ['commodity-prices'],
        queryFn: async (): Promise<CommodityPrice[]> => {
            const { data, error } = await supabase
                .from('metric_observations')
                .select('metric_id, as_of_date, value')
                .in('metric_id', METRIC_IDS)
                .order('as_of_date', { ascending: false })
                .limit(40);

            if (error) throw error;

            return (data || []).map(d => ({
                symbol: METRIC_LABELS[d.metric_id] ?? d.metric_id,
                as_of_date: String(d.as_of_date),
                price: Number(d.value),
                curve_type: 'spot',
            }));
        },
        staleTime: 1000 * 60 * 30,
    });
};
