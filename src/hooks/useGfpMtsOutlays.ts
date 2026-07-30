import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { MtsOutlayRankRow } from '@/features/gfp/lib/types';

export interface MtsOutlayMonthlyRow {
  record_date: string;
  classification_id: string | null;
  parent_id: string | null;
  classification_desc: string | null;
  current_month_net_outly: number | null;
  current_fytd_net_outly: number | null;
  prior_fytd_net_outly: number | null;
  sequence_level_nbr: number | null;
  data_type_cd: string | null;
  line_code_nbr: number | null;
}

export interface GfpMtsOutlaysData {
  rank: MtsOutlayRankRow[];
  /** Monthly series, limited to the last ~36 months client-side when possible. */
  monthly: MtsOutlayMonthlyRow[];
}

const MONTHLY_LOOKBACK_MS = 1000 * 60 * 60 * 24 * 30 * 36; // ~36 months
const RANK_LIMIT = 500;
const MONTHLY_LIMIT = 5000;

function filterLast36Months(rows: MtsOutlayMonthlyRow[]): MtsOutlayMonthlyRow[] {
  if (rows.length === 0) return rows;
  const maxTs = rows.reduce((max, r) => {
    const t = Date.parse(r.record_date);
    return Number.isFinite(t) && t > max ? t : max;
  }, 0);
  if (!maxTs) return rows;
  const cutoff = maxTs - MONTHLY_LOOKBACK_MS;
  return rows.filter((r) => {
    const t = Date.parse(r.record_date);
    return Number.isFinite(t) && t >= cutoff;
  });
}

/** Cash-basis MTS agency outlays: latest-month rank + monthly series. */
export function useGfpMtsOutlays() {
  return useQuery({
    queryKey: ['gfp', 'mts-outlays'],
    queryFn: async (): Promise<GfpMtsOutlaysData> => {
      const [rankRes, monthlyRes] = await Promise.all([
        (supabase as any)
          .from('vw_mts_agency_outlays_rank')
          .select('*')
          .order('rnk', { ascending: true })
          .limit(RANK_LIMIT),
        (supabase as any)
          .from('vw_mts_agency_outlays_monthly')
          .select('*')
          .order('record_date', { ascending: false })
          .limit(MONTHLY_LIMIT),
      ]);

      if (rankRes.error) throw rankRes.error;
      if (monthlyRes.error) throw monthlyRes.error;

      // Query newest-first so LIMIT keeps recent months; re-sort ASC for charts.
      const monthlyAll = ((monthlyRes.data ?? []) as MtsOutlayMonthlyRow[]).slice().sort((a, b) =>
        a.record_date.localeCompare(b.record_date),
      );

      return {
        rank: (rankRes.data ?? []) as MtsOutlayRankRow[],
        monthly: filterLast36Months(monthlyAll),
      };
    },
    staleTime: 1000 * 60 * 30,
  });
}
