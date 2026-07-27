import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { METRIC_IDS as MID } from '@/constants/metricIds';

export interface CommodityPrice {
    symbol: string;
    as_of_date: string;
    price: number;
    curve_type: string;
    z_score?: number;
}

const COMMODITY_IDS = [
    MID.WTI_CRUDE_PRICE,
    MID.BRENT_CRUDE_PRICE,
    MID.COPPER_PRICE_USD,
    MID.NICKEL_PRICE_USD, // stub: 0 rows in DB until ingest-commodity-terminal backfill runs
] as const;

const METRIC_LABELS: Record<string, string> = {
    [MID.WTI_CRUDE_PRICE]: 'WTI Crude',
    [MID.BRENT_CRUDE_PRICE]: 'Brent Crude',
    [MID.COPPER_PRICE_USD]: 'Copper ($/t)',
    [MID.NICKEL_PRICE_USD]: 'Nickel ($/t)',
};

export const useCommodityPrices = () => {
    return useQuery({
        queryKey: ['commodity-prices'],
        queryFn: async (): Promise<CommodityPrice[]> => {
            const { data, error } = await supabase
                .from('metric_observations')
                .select('metric_id, as_of_date, value')
                .in('metric_id', COMMODITY_IDS)
                .order('as_of_date', { ascending: false })
                .limit(80);

            if (error) throw error;

            // Latest print per metric (table is multi-day history)
            const latestByMetric = new Map<string, CommodityPrice>();
            for (const d of data || []) {
                if (latestByMetric.has(d.metric_id)) continue;
                latestByMetric.set(d.metric_id, {
                    symbol: METRIC_LABELS[d.metric_id] ?? d.metric_id,
                    as_of_date: String(d.as_of_date),
                    price: Number(d.value),
                    curve_type: 'spot',
                });
            }
            return Array.from(latestByMetric.values());
        },
        staleTime: 1000 * 60 * 15,
        refetchInterval: 1000 * 60 * 30,
    });
};
