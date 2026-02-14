import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface USTreasuryAuction {
    id: string;
    auction_date: string;
    security_type: string;
    term: string;
    bid_to_cover: number;
    high_yield: number | null;
    total_tendered: number;
    total_accepted: number;
    primary_dealer_pct: number;
    indirect_bidder_pct: number;
    direct_bidder_pct: number;
    demand_strength_score: number;
    created_at: string;
}

export const useUSTreasuryAuctions = () => {
    return useQuery({
        queryKey: ['us-treasury-auctions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('us_treasury_auctions')
                .select('*')
                .order('auction_date', { ascending: false })
                .limit(200);

            if (error) throw error;
            return data as USTreasuryAuction[];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};
