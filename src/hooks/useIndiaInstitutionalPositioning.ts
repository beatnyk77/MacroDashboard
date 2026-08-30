import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { METRIC_IDS as MID } from '@/constants/metricIds';

export type IndiaPositioningRegime = 'Foreign Accumulation' | 'Domestic Cushion' | 'Distribution' | 'Synchronized Risk' | 'Mixed / Insufficient Coverage';
export interface IndiaPositioningSnapshot {
  as_of_date: string;
  score: number | null;
  regime: IndiaPositioningRegime;
  confidence: number;
  coverage_mask: string[];
  components: Record<string, { score: number | null; available: boolean; inputs: string[] }>;
  input_dates: { daily?: string[]; sector?: string[]; metric_ids?: string[] };
  calculation_version: string;
}

export interface IndiaPositioningHistoryPoint {
  date: string;
  fii: number | null;
  dii: number | null;
  nifty: number | null;
  usdInr: number | null;
  vix: number | null;
}

export interface IndiaSectorObservation {
  sector_key: string;
  source_sector_label: string;
  report_period_end: string;
  equity_flow_inr_crore: number | null;
  equity_aum_inr_crore: number | null;
}

export interface IndiaPositioningData {
  latest: IndiaPositioningSnapshot | null;
  history: IndiaPositioningSnapshot[];
  sectors: IndiaSectorObservation[];
  marketHistory: IndiaPositioningHistoryPoint[];
}

export function useIndiaInstitutionalPositioning() {
  return useQuery({
    queryKey: ['india-institutional-positioning-v1'],
    queryFn: async () => {
      const [{ data: snapshots, error: snapshotError }, { data: sectors, error: sectorError }, { data: marketRows, error: marketError }] = await Promise.all([
        supabase.from('india_institutional_positioning_snapshots').select('*').order('as_of_date', { ascending: false }).limit(90),
        supabase.from('india_institutional_sector_observations').select('*').order('report_period_end', { ascending: false }).limit(120),
        supabase.from('metric_observations').select('metric_id, as_of_date, value').in('metric_id', [
          MID.IN_FII_CASH_NET,
          MID.IN_DII_CASH_NET,
          MID.IN_NIFTY_RETURN,
          MID.IN_USD_INR_RETURN,
          MID.IN_INDIA_VIX,
        ]).order('as_of_date', { ascending: true }).limit(1500),
      ]);
      if (snapshotError) throw snapshotError;
      if (sectorError) throw sectorError;
      if (marketError) throw marketError;
      const marketHistory = new Map<string, IndiaPositioningHistoryPoint>();
      for (const row of marketRows ?? []) {
        const point = marketHistory.get(row.as_of_date) ?? { date: row.as_of_date, fii: null, dii: null, nifty: null, usdInr: null, vix: null };
        if (row.metric_id === MID.IN_FII_CASH_NET) point.fii = Number(row.value);
        if (row.metric_id === MID.IN_DII_CASH_NET) point.dii = Number(row.value);
        if (row.metric_id === MID.IN_NIFTY_RETURN) point.nifty = Number(row.value);
        if (row.metric_id === MID.IN_USD_INR_RETURN) point.usdInr = Number(row.value);
        if (row.metric_id === MID.IN_INDIA_VIX) point.vix = Number(row.value);
        marketHistory.set(row.as_of_date, point);
      }
      return { latest: (snapshots?.[0] as unknown as IndiaPositioningSnapshot | undefined) ?? null, history: (snapshots ?? []) as unknown as IndiaPositioningSnapshot[], sectors: (sectors ?? []) as IndiaSectorObservation[], marketHistory: [...marketHistory.values()] } satisfies IndiaPositioningData;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
