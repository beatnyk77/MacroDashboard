import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ReceiptsAgencyYear } from '@/features/gfp/lib/types';

/**
 * Cash receipts by agency / fiscal year (treasury receipts + agency map).
 * Caps at 10k rows (multi-year × agencies); filter to latest FY client-side in UI.
 */
export function useGfpReceipts() {
  return useQuery({
    queryKey: ['gfp', 'receipts'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('vw_receipts_by_agency_yearly')
        .select('*')
        .order('fiscal_year_end_year', { ascending: false })
        .limit(10000);
      if (error) throw error;
      // Return oldest→newest for any multi-year consumers
      return ((data ?? []) as ReceiptsAgencyYear[]).slice().sort(
        (a, b) => a.fiscal_year_end_year - b.fiscal_year_end_year,
      );
    },
    staleTime: 1000 * 60 * 30,
  });
}
