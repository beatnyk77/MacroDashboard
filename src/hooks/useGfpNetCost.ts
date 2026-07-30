import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { FrusgNetCostRow } from '@/features/gfp/lib/types';

export interface FrusgNetCostConcentrationRow {
  stmt_fiscal_year: number;
  top5_share: number | null;
  top10_share: number | null;
  hhi: number | null;
  total_net_cost: number | null;
}

/** Accrual agency net cost by fiscal year (non-restated FRUSG). */
export function useGfpNetCost() {
  return useQuery({
    queryKey: ['gfp', 'net-cost'],
    queryFn: async () => {
      // View not yet in database.types.ts — cast until types are regenerated
      const { data, error } = await (supabase as any)
        .from('vw_frusg_net_cost_yearly')
        .select('*')
        .order('stmt_fiscal_year', { ascending: true })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as FrusgNetCostRow[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

/** Top-5 / top-10 share and HHI of net cost by FY. */
export function useGfpNetCostConcentration() {
  return useQuery({
    queryKey: ['gfp', 'net-cost-concentration'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('vw_frusg_net_cost_concentration')
        .select('*')
        .order('stmt_fiscal_year', { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as FrusgNetCostConcentrationRow[];
    },
    staleTime: 1000 * 60 * 30,
  });
}
