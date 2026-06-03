import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type FocusAreaCode = 'us' | 'india' | 'china' | 'africa' | 'energy' | 'sovereign' | 'gold' | 'trade';

export interface BriefContent {
  what_changed: string[];
  regime_status: string;
  focus_observations: string[];
  watch_today: string[];
}

export interface DailyMacroBrief {
  id: string;
  brief_date: string;
  focus_areas: string[];
  content: BriefContent;
  regime_score: number | null;
  regime_label: string | null;
  generated_at: string;
  model_used: string | null;
  tokens_used: number | null;
}

export const DEFAULT_FOCUS_AREAS: FocusAreaCode[] = ['us', 'india', 'gold'];

export function getFocusAreasKey(areas: string[]): string {
  return [...areas].sort().join(',');
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function isValidContent(v: unknown): v is BriefContent {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as Record<string, unknown>;
  return Array.isArray(c.what_changed) && typeof c.regime_status === 'string';
}

export function useMacroBrief(
  focusAreas: FocusAreaCode[] = DEFAULT_FOCUS_AREAS,
  briefDate?: string
) {
  const targetDate = briefDate || todayISO();
  const focusKey = getFocusAreasKey(focusAreas);
  const defaultKey = getFocusAreasKey(DEFAULT_FOCUS_AREAS);

  return useQuery({
    queryKey: ['macro-brief', targetDate, focusKey],
    queryFn: async (): Promise<{ brief: DailyMacroBrief; isNotToday: boolean } | null> => {
      // 1. Try exact match for requested date + focus areas
      const { data: exact, error: exactErr } = await supabase
        .from('daily_macro_briefs')
        .select('*')
        .eq('brief_date', targetDate)
        .contains('focus_areas', focusAreas)
        .containedBy('focus_areas', focusAreas)
        .maybeSingle();

      if (exactErr && exactErr.code !== 'PGRST116') throw new Error(exactErr.message);

      if (exact) {
        if (!isValidContent(exact.content)) throw new Error('Brief content has unexpected shape');
        return { brief: exact as DailyMacroBrief, isNotToday: false };
      }

      // 2. Fall back to default focus areas for requested date
      if (focusKey !== defaultKey) {
        const { data: defaultBrief } = await supabase
          .from('daily_macro_briefs')
          .select('*')
          .eq('brief_date', targetDate)
          .contains('focus_areas', DEFAULT_FOCUS_AREAS)
          .containedBy('focus_areas', DEFAULT_FOCUS_AREAS)
          .maybeSingle();

        if (defaultBrief) {
          if (!isValidContent(defaultBrief.content)) throw new Error('Brief content has unexpected shape');
          return { brief: defaultBrief as DailyMacroBrief, isNotToday: false };
        }
      }

      // 3. Today's brief not generated yet — fetch most recent available
      const { data: recent } = await supabase
        .from('daily_macro_briefs')
        .select('*')
        .order('brief_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recent) {
        if (!isValidContent(recent.content)) throw new Error('Brief content has unexpected shape');
        const isNotToday = recent.brief_date !== targetDate;
        return { brief: recent as DailyMacroBrief, isNotToday };
      }

      return null;
    },
    staleTime: 1000 * 60 * 60 * 4,
    gcTime: 1000 * 60 * 60 * 8,
    retry: 1,
  });
}

export function useMacroBriefArchive() {
  return useQuery({
    queryKey: ['macro-brief', 'archive'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_macro_briefs')
        .select('id, brief_date, regime_label, regime_score, generated_at, focus_areas')
        .order('brief_date', { ascending: false })
        .limit(90);

      if (error) throw error;
      return (data ?? []) as Pick<DailyMacroBrief, 'id' | 'brief_date' | 'regime_label' | 'regime_score' | 'generated_at' | 'focus_areas'>[];
    },
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60 * 2,
  });
}
