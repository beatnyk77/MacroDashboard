import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { MacroBrief, FocusArea } from '@/types/brief';

export function useMacroBrief(
  date: string,  // YYYY-MM-DD
  focusAreas: FocusArea[]
) {
  const sortedAreas = [...focusAreas].sort();
  
  return useQuery({
    queryKey: ['macro-brief', date, sortedAreas],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_macro_briefs')
        .select('*')
        .eq('brief_date', date)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error || !data) {
        // Fall back to yesterday's brief
        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        const yDate = yesterday.toISOString().split('T')[0];
        
        const { data: fallback, error: fallbackError } = await supabase
          .from('daily_macro_briefs')
          .select('*')
          .eq('brief_date', yDate)
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (fallbackError || !fallback) {
          return null;
        }
        return fallback as unknown as MacroBrief; // TODO(types): content is Json — shape validated at runtime
      }
      return data as unknown as MacroBrief; // TODO(types): content is Json — shape validated at runtime
    },
    staleTime: 1000 * 60 * 30,  // 30 minutes
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
    staleTime: 1000 * 60 * 60,  // 1 hour
  });
}
