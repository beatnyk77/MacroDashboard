import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { buildGfpInsights } from '@/features/gfp/lib/insights';
import type { GfpNarrativeInputs } from '@/features/gfp/lib/types';

export interface GfpInsightsResult {
  inputs: GfpNarrativeInputs | null;
  insights: string[];
}

/** Rule-based narrative bullets from `vw_gfp_narrative_inputs`. */
export function useGfpInsights() {
  return useQuery({
    queryKey: ['gfp', 'insights'],
    queryFn: async (): Promise<GfpInsightsResult> => {
      const { data, error } = await (supabase as any)
        .from('vw_gfp_narrative_inputs')
        .select('*')
        .maybeSingle();
      if (error) throw error;

      const inputs = (data ?? null) as GfpNarrativeInputs | null;
      if (!inputs) {
        return { inputs: null, insights: [] };
      }
      return {
        inputs,
        insights: buildGfpInsights(inputs),
      };
    },
    staleTime: 1000 * 60 * 30,
  });
}
