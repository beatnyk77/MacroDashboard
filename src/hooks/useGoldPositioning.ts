import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface GoldPositioningData {
    as_of_date: string;
    cot_managed_money_net: number;
    cot_producer_net: number;
    cot_swap_dealer_net: number;
    comex_open_interest: number;
    comex_daily_volume: number;
    iv_1w: number;
    iv_2w: number;
    iv_4w: number;
    price_band_low: number;
    price_band_high: number;
    whale_hedging_pressure: number;
    paper_vs_physical_ratio: number;
    sankey_data: {
        nodes: Array<{ id: string, color?: string }>;
        links: Array<{ source: string, target: string, value: number }>;
    };
    prediction_gauge_score: number;
    interpretation: string;
    metadata: any;
}

export const useGoldPositioning = () => {
    return useQuery<GoldPositioningData | null>({
        queryKey: ['gold-positioning-latest'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('gold_positioning')
                .select('*')
                .order('as_of_date', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            if (!data) return null;

            return {
                ...data,
                cot_managed_money_net: Number(data.cot_managed_money_net),
                cot_producer_net: Number(data.cot_producer_net),
                cot_swap_dealer_net: Number(data.cot_swap_dealer_net),
                comex_open_interest: Number(data.comex_open_interest),
                comex_daily_volume: Number(data.comex_daily_volume),
                iv_1w: Number(data.iv_1w),
                iv_2w: Number(data.iv_2w),
                iv_4w: Number(data.iv_4w),
                price_band_low: Number(data.price_band_low),
                price_band_high: Number(data.price_band_high),
                whale_hedging_pressure: Number(data.whale_hedging_pressure),
                paper_vs_physical_ratio: Number(data.paper_vs_physical_ratio),
                prediction_gauge_score: Number(data.prediction_gauge_score),
                sankey_data: {
                    nodes: data.sankey_data?.nodes || [],
                    links: (data.sankey_data?.links || []).map((l: any) => ({
                        ...l,
                        value: Number(l.value)
                    }))
                }
            } as GoldPositioningData;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};
