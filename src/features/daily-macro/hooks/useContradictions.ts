/**
 * useContradictions
 * Fetches today's cross-market contradictions.
 * Falls back to empty array if table is unpopulated (Phase 1 safe).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Contradiction {
  contradiction_key: string;
  title: string;
  interpretation: string;
  severity: 'NOTABLE' | 'EXTREME';
  metric_a: string;
  metric_b: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useContradictions() {
  const today = todayISO();

  return useQuery({
    queryKey: ['macro-contradictions', today],
    queryFn: async (): Promise<Contradiction[]> => {
      const { data, error } = await supabase
        .from('macro_contradictions')
        .select('*')
        .eq('signal_date', today)
        .order('severity', { ascending: true }) // EXTREME first (alphabetical happens to work here)
        .limit(2);

      if (error) {
        console.warn('[useContradictions] fetch failed:', error.message);
        return [];
      }

      return (data ?? []).map((row) => ({
        contradiction_key: row.contradiction_key,
        title: row.title,
        interpretation: row.interpretation,
        severity: row.severity as 'NOTABLE' | 'EXTREME',
        metric_a: row.metric_a,
        metric_b: row.metric_b,
      }));
    },
    staleTime: 1000 * 60 * 60 * 4,
    retry: 1,
  });
}
