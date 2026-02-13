import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CommodityPrice {
    symbol: string;
    as_of_date: string;
    price: number;
    curve_type: string;
    z_score?: number;
}

export const useCommodityPrices = () => {
    return useQuery({
        queryKey: ['commodity-prices'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('commodity_prices')
                .select('*')
                .order('as_of_date', { ascending: false });

            if (error) throw error;
            return data as CommodityPrice[];
        }
    });
};
