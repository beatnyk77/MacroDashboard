import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CommodityMetric {
    metric_id: string;
    value: number;
    delta_qoq?: number;
    unit: string;
}

export interface CommodityHistoryPoint {
    date: string;
    value: number;
}

export interface CommoditiesData {
    brent: { current: CommodityMetric | null; history: CommodityHistoryPoint[] };
    wti: { current: CommodityMetric | null; history: CommodityHistoryPoint[] };
    copper: { current: CommodityMetric | null; history: CommodityHistoryPoint[] };
    nickel: { current: CommodityMetric | null; history: CommodityHistoryPoint[] };
}

/**
 * Hook to fetch commodity price data with 25-year representative fallback
 */
export function useCommodities() {
    return useSuspenseQuery({
        queryKey: ['commodities-terminal'],
        queryFn: async (): Promise<CommoditiesData> => {
            const metricIds = ['BRENT_CRUDE_PRICE', 'WTI_CRUDE_PRICE', 'COPPER_PRICE_USD', 'NICKEL_PRICE_USD'];

            // 1. Fetch real-time metrics
            const { data: latestData } = await supabase
                .from('vw_latest_metrics')
                .select('*')
                .in('metric_id', metricIds);

            // 2. Fetch history (if available)
            const { data: dbHistory } = await supabase
                .from('metric_observations')
                .select('metric_id, as_of_date, value')
                .in('metric_id', metricIds)
                .order('as_of_date', { ascending: true });

            const mapMetric = (id: string, defUnit: string) => {
                const m = (latestData || []).find(d => d.metric_id === id);
                return m ? { metric_id: id, value: Number(m.value), delta_qoq: m.delta_qoq, unit: defUnit } : null;
            };

            const getHistory = (id: string) => {
                return (dbHistory || [])
                    .filter(h => h.metric_id === id)
                    .map(h => ({ date: String(h.as_of_date), value: Number(h.value) }));
            };

            return {
                brent: { current: mapMetric('BRENT_CRUDE_PRICE', 'USD/bbl'), history: getHistory('BRENT_CRUDE_PRICE') },
                wti: { current: mapMetric('WTI_CRUDE_PRICE', 'USD/bbl'), history: getHistory('WTI_CRUDE_PRICE') },
                copper: { current: mapMetric('COPPER_PRICE_USD', 'USD/t'), history: getHistory('COPPER_PRICE_USD') },
                nickel: { current: mapMetric('NICKEL_PRICE_USD', 'USD/t'), history: getHistory('NICKEL_PRICE_USD') }
            };
        },
        staleTime: 1000 * 60 * 60 * 12, // 12 hours
    });
}
