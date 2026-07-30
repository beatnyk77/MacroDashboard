import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { FrusgBalanceSummary } from '@/features/gfp/lib/types';

export interface FrusgBsLineItem {
  stmt_fiscal_year: number;
  record_date: string;
  account_desc: string | null;
  line_item_desc: string | null;
  position_bil: number | null;
  src_line_nbr: number | null;
}

export interface GfpBalanceSheetData {
  summary: FrusgBalanceSummary[];
  lineItems: FrusgBsLineItem[];
}

/**
 * Consolidated FRUSG balance sheet summary (assets / liabilities / net position).
 * Optionally loads line items for drill-down when `includeLineItems` is true.
 */
export function useGfpBalanceSheet(includeLineItems = false) {
  return useQuery({
    queryKey: ['gfp', 'balance-sheet', includeLineItems],
    queryFn: async (): Promise<GfpBalanceSheetData> => {
      const summaryPromise = (supabase as any)
        .from('vw_frusg_balance_sheet_summary')
        .select('*')
        .order('stmt_fiscal_year', { ascending: true });

      const lineItemsPromise = includeLineItems
        ? (supabase as any)
            .from('vw_frusg_bs_line_items')
            .select('*')
            .order('stmt_fiscal_year', { ascending: true })
        : Promise.resolve({ data: [], error: null });

      const [summaryRes, lineItemsRes] = await Promise.all([
        summaryPromise,
        lineItemsPromise,
      ]);

      if (summaryRes.error) throw summaryRes.error;
      if (lineItemsRes.error) throw lineItemsRes.error;

      return {
        summary: (summaryRes.data ?? []) as FrusgBalanceSummary[],
        lineItems: (lineItemsRes.data ?? []) as FrusgBsLineItem[],
      };
    },
    staleTime: 1000 * 60 * 30,
  });
}
