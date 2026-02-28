import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PredictionMarket {
    id: string;
    market_id: string;
    question: string;
    platform: string;
    probability: number;
    volume: number;
    liquidity: number;
    open_interest: number;
    best_odds: { yes: number; no: number } | null;
    category: string;
    affiliate_url: string;
    last_updated: string;
}

export const usePredictionMarkets = () => {
    return useQuery({
        queryKey: ['prediction-markets'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('domeapi_markets')
                .select('*')
                .order('volume', { ascending: false });

            if (error) throw error;
            return data as PredictionMarket[];
        }
    });
};
