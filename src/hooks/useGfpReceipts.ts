import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ReceiptsAgencyYear } from '@/features/gfp/lib/types';

/** Cash receipts by agency / fiscal year (treasury receipts + agency map). */
export function useGfpReceipts() {
  return useQuery({
    queryKey: ['gfp', 'receipts'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('vw_receipts_by_agency_yearly')
        .select('*')
        .order('fiscal_year_end_year', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ReceiptsAgencyYear[];
    },
    staleTime: 1000 * 60 * 30,
  });
}
