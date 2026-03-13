import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface MoneyMarketOps {
  date: string;
  call_money_vol: number;
  call_money_rate: number;
  triparty_repo_vol: number;
  triparty_repo_rate: number;
  market_repo_vol: number;
  market_repo_rate: number;
  notice_money_vol?: number;
  notice_money_rate?: number;
}

export interface LiquidityOps {
  date: string;
  msf_amount: number;
  sdf_amount: number;
  slf_amount: number;
  net_liquidity_today: number;
  net_liquidity_outstanding: number;
  net_liquidity_total: number;
}

export const useRBIMoneyMarket = () => {
  const opsQuery = useQuery({
    queryKey: ['rbi-money-market-ops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rbi_money_market_ops')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as MoneyMarketOps[];
    },
    refetchInterval: 1000 * 60 * 60 * 4, // 4 hours
  });

  const liqQuery = useQuery({
    queryKey: ['rbi-liquidity-ops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rbi_liquidity_ops')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as LiquidityOps[];
    },
    refetchInterval: 1000 * 60 * 60 * 4,
  });

  return {
    ops: opsQuery.data,
    liq: liqQuery.data,
    isLoading: opsQuery.isLoading || liqQuery.isLoading,
    isError: opsQuery.isError || liqQuery.isError,
  };
};
