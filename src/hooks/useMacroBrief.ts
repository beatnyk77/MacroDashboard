import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { marketDateMinusDays } from '@/lib/marketDate';
import type { MacroBrief, FocusArea } from '@/types/brief';

/** How many prior market days to walk when today's brief is missing. */
const FALLBACK_LOOKBACK_DAYS = 3;

async function fetchBriefForDate(date: string): Promise<MacroBrief | null> {
  const { data, error } = await supabase
    .from('daily_macro_briefs')
    .select('*')
    .eq('brief_date', date)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[useMacroBrief] query error for', date, error.message);
    return null;
  }
  if (!data) return null;
  return data as unknown as MacroBrief; // TODO(types): content is Json — shape validated at runtime
}

/**
 * Fetch the morning brief for `date` (YYYY-MM-DD, America/New_York market day).
 * Falls back up to FALLBACK_LOOKBACK_DAYS prior days so a single missed cron
 * does not blank the page. Callers compare `brief_date` to the requested date
 * to show a "showing previous session" banner.
 */
export function useMacroBrief(
  date: string, // YYYY-MM-DD
  focusAreas: FocusArea[]
) {
  const sortedAreas = [...focusAreas].sort();

  return useQuery({
    queryKey: ['macro-brief', date, sortedAreas],
    queryFn: async () => {
      const primary = await fetchBriefForDate(date);
      if (primary) return primary;

      for (let i = 1; i <= FALLBACK_LOOKBACK_DAYS; i++) {
        const prior = marketDateMinusDays(date, i);
        const fallback = await fetchBriefForDate(prior);
        if (fallback) return fallback;
      }
      return null;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useMacroBriefArchive(page = 0) {
  return useQuery({
    queryKey: ['macro-brief-archive', page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_macro_briefs')
        .select('brief_date, regime_label, regime_score, generated_at')
        .order('brief_date', { ascending: false })
        .range(page * 30, (page + 1) * 30 - 1);

      if (error) throw error;
      return (data ?? []) as Pick<MacroBrief, 'brief_date' | 'regime_label' | 'regime_score' | 'generated_at'>[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
