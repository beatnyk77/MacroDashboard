import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type IndiaPositioningRegime = 'Foreign Accumulation' | 'Domestic Cushion' | 'Distribution' | 'Synchronized Risk' | 'Mixed / Insufficient Coverage';
export interface IndiaPositioningSnapshot {
  as_of_date: string;
  score: number | null;
  regime: IndiaPositioningRegime;
  confidence: number;
  coverage_mask: string[];
  components: Record<string, { score: number | null; available: boolean; inputs: string[] }>;
  input_dates: { daily?: string[]; sector?: string[] };
  calculation_version: string;
}

export function useIndiaInstitutionalPositioning() {
  return useQuery({
    queryKey: ['india-institutional-positioning-v1'],
    queryFn: async () => {
      const [{ data: snapshots, error: snapshotError }, { data: sectors, error: sectorError }] = await Promise.all([
        supabase.from('india_institutional_positioning_snapshots').select('*').order('as_of_date', { ascending: false }).limit(90),
        supabase.from('india_institutional_sector_observations').select('*').order('report_period_end', { ascending: false }).limit(120),
      ]);
      if (snapshotError) throw snapshotError;
      if (sectorError) throw sectorError;
      return { latest: (snapshots?.[0] as unknown as IndiaPositioningSnapshot | undefined) ?? null, history: (snapshots ?? []) as unknown as IndiaPositioningSnapshot[], sectors: sectors ?? [] };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
