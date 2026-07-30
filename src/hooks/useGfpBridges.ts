import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface FrusgNetPositionRow {
  stmt_fiscal_year: number;
  record_date: string;
  account_desc: string | null;
  line_item_desc: string | null;
  consolidated_bil: number | null;
  non_dedicated_funds_bil: number | null;
  dedicated_funds_bil: number | null;
  eliminations_bil: number | null;
}

export interface FrusgReconciliationRow {
  stmt_fiscal_year: number;
  record_date: string;
  account_desc: string | null;
  component_desc: string | null;
  line_item_desc: string | null;
  position_bil: number | null;
}

export interface FrusgCashBalanceRow {
  stmt_fiscal_year: number;
  record_date: string;
  account_desc: string | null;
  component_desc: string | null;
  line_item_desc: string | null;
  position_bil: number | null;
}

export interface GfpBridgesData {
  netPosition: FrusgNetPositionRow[];
  reconciliations: FrusgReconciliationRow[];
  cashBalance: FrusgCashBalanceRow[];
}

/** Accrual bridge tables: net position, budget-to-accrual recon, cash balance. */
export function useGfpBridges() {
  return useQuery({
    queryKey: ['gfp', 'bridges'],
    queryFn: async (): Promise<GfpBridgesData> => {
      const [netPosRes, reconRes, cashRes] = await Promise.all([
        (supabase as any)
          .from('vw_frusg_net_position_summary')
          .select('*')
          .order('stmt_fiscal_year', { ascending: true }),
        (supabase as any)
          .from('vw_frusg_reconciliation_summary')
          .select('*')
          .order('stmt_fiscal_year', { ascending: true }),
        (supabase as any)
          .from('vw_frusg_cash_balance_summary')
          .select('*')
          .order('stmt_fiscal_year', { ascending: true }),
      ]);

      if (netPosRes.error) throw netPosRes.error;
      if (reconRes.error) throw reconRes.error;
      if (cashRes.error) throw cashRes.error;

      return {
        netPosition: (netPosRes.data ?? []) as FrusgNetPositionRow[],
        reconciliations: (reconRes.data ?? []) as FrusgReconciliationRow[],
        cashBalance: (cashRes.data ?? []) as FrusgCashBalanceRow[],
      };
    },
    staleTime: 1000 * 60 * 30,
  });
}
