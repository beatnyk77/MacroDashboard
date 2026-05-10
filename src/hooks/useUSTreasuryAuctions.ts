import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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

export const useAuctionHealth = () => {
  return useQuery({
    queryKey: ['auction-ingestion-health'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingestion_runs')
        .select('*')
        .eq('job_id', 'ingest-us-macro-auctions')
        .order('started_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data[0];
    },
    refetchInterval: 1000 * 30, // Poll every 30s during sync
  });
};

export const useAuctionSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ingest-us-macro?task=auctions', {
        method: 'POST',
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Treasury auction data synchronized');
      queryClient.invalidateQueries({ queryKey: ['us-treasury-auctions'] });
      queryClient.invalidateQueries({ queryKey: ['auction-ingestion-health'] });
    },
    onError: (error) => {
      console.error('Auction sync failed:', error);
      toast.error('Failed to sync auction data');
    }
  });
};
