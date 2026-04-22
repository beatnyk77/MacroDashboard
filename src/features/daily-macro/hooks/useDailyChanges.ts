/**
 * useDailyChanges
 * Fetches significant metric movements for today from daily_changes table.
 * Falls back to empty array if table is unpopulated (Phase 1 safe).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DailyChange {
  metric_id: string;
  metric_label: string;
  prev_value: number;
  curr_value: number;
  abs_delta: number;
  pct_delta: number;
  significance: 'HIGH' | 'MEDIUM';
  direction: 'UP' | 'DOWN' | 'FLAT';
  interpretation: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useDailyChanges() {
  const today = todayISO();

  return useQuery({
    queryKey: ['daily-changes', today],
    queryFn: async (): Promise<DailyChange[]> => {
      const { data, error } = await supabase
        .from('daily_changes')
        .select('*')
        .eq('signal_date', today)
        .order('significance', { ascending: true }) // HIGH first
        .limit(8);

      if (error) {
        console.warn('[useDailyChanges] fetch failed:', error.message);
        return [];
      }

      return (data ?? []).map((row) => ({
        metric_id: row.metric_id,
        metric_label: row.metric_label,
        prev_value: Number(row.prev_value),
        curr_value: Number(row.curr_value),
        abs_delta: Number(row.abs_delta),
        pct_delta: Number(row.pct_delta),
        significance: row.significance as 'HIGH' | 'MEDIUM',
        direction: row.direction as 'UP' | 'DOWN' | 'FLAT',
        interpretation: row.interpretation ?? '',
      }));
    },
    staleTime: 1000 * 60 * 60 * 4,
    retry: 1,
  });
}
