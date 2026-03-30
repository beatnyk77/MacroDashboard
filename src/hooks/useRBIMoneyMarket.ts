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
  msf_rate?: number;
  sdf_rate?: number;
}

export const useRBIMoneyMarket = () => {
  const opsQuery = useQuery({
    queryKey: ['rbi-money-market-ops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rbi_money_market_ops')
        .select('*')
        .order('date', { ascending: false })
        .limit(1000); // Fetch full historical series
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
        .limit(1000); // full history
      if (error) throw error;
      return data.map((d: any) => ({
        ...d,
        msf_amount: d.msf_amount !== null ? Number(d.msf_amount) : null,
        sdf_amount: d.sdf_amount !== null ? Number(d.sdf_amount) : null,
        slf_amount: d.slf_amount !== null ? Number(d.slf_amount) : null,
        net_liquidity_today: d.net_liquidity_today !== null ? Number(d.net_liquidity_today) : null,
        net_liquidity_outstanding: d.net_liquidity_outstanding !== null ? Number(d.net_liquidity_outstanding) : null,
        net_liquidity_total: d.net_liquidity_total !== null ? Number(d.net_liquidity_total) : null,
        msf_rate: d.msf_rate !== null ? Number(d.msf_rate) : null,
        sdf_rate: d.sdf_rate !== null ? Number(d.sdf_rate) : null
      })) as LiquidityOps[];
    },
    refetchInterval: 1000 * 60 * 60 * 4,
  });

  // Fetch the policy repo rate from metric_observations (ingested by ingest-major-economies)
  const policyRateQuery = useQuery({
    queryKey: ['in-policy-rate'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metric_observations')
        .select('value')
        .eq('metric_id', 'IN_POLICY_RATE')
        .order('as_of_date', { ascending: false })
        .limit(1)
        .maybeSingle(); // Do not throw if no row
      if (error) {
        console.warn('Failed to fetch IN_POLICY_RATE:', error);
        return undefined;
      }
      return data ? Number(data.value) : undefined;
    },
    refetchInterval: 1000 * 60 * 60 * 4,
    // Don't throw on error; just return undefined
    // This won't break the whole hook
  });

  return {
    ops: opsQuery.data,
    liq: liqQuery.data,
    repoRate: policyRateQuery.data,
    // Critical data is ops and liq; policy rate is optional
    isLoading: opsQuery.isLoading || liqQuery.isLoading,
    isError: opsQuery.isError || liqQuery.isError,
  };
};
