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
      return data.map((d: any) => ({
        ...d,
        call_money_vol: d.call_money_vol !== null ? Number(d.call_money_vol) : null,
        call_money_rate: d.call_money_rate !== null ? Number(d.call_money_rate) : null,
        triparty_repo_vol: d.triparty_repo_vol !== null ? Number(d.triparty_repo_vol) : null,
        triparty_repo_rate: d.triparty_repo_rate !== null ? Number(d.triparty_repo_rate) : null,
        market_repo_vol: d.market_repo_vol !== null ? Number(d.market_repo_vol) : null,
        market_repo_rate: d.market_repo_rate !== null ? Number(d.market_repo_rate) : null,
        notice_money_vol: d.notice_money_vol !== null ? Number(d.notice_money_vol) : null,
        notice_money_rate: d.notice_money_rate !== null ? Number(d.notice_money_rate) : null
      })) as MoneyMarketOps[];
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
      return data.map((d: any) => ({
        ...d,
        msf_amount: d.msf_amount !== null ? Number(d.msf_amount) : null,
        sdf_amount: d.sdf_amount !== null ? Number(d.sdf_amount) : null,
        slf_amount: d.slf_amount !== null ? Number(d.slf_amount) : null,
        net_liquidity_today: d.net_liquidity_today !== null ? Number(d.net_liquidity_today) : null,
        net_liquidity_outstanding: d.net_liquidity_outstanding !== null ? Number(d.net_liquidity_outstanding) : null,
        net_liquidity_total: d.net_liquidity_total !== null ? Number(d.net_liquidity_total) : null
      })) as LiquidityOps[];
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
