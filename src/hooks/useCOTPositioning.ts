import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { METRIC_IDS as MID } from '@/constants/metricIds';

export type SqueezeSignal =
  | 'BULL_SQUEEZE_RISK'
  | 'CROWDED_LONG'
  | 'MODERATE_LONG'
  | 'MODERATE_SHORT'
  | 'NEUTRAL_RANGE';

export interface COTAssetPositioning {
  metricId: string;
  assetName: string;
  category: 'Rates' | 'Precious Metals' | 'Energy' | 'Currencies' | 'Equities';
  symbol: string;
  netSpecContracts: number | null;
  delta1wContracts: number | null;
  percentile3y: number | null; // 0 to 100
  squeezeSignal: SqueezeSignal | null;
  asOfDate: string | null;
  sourceRef: string | null;
  observationCount: number;
  isAvailable: boolean;
}

export interface COTPositioningData {
  items: COTAssetPositioning[];
  lastUpdated: string | null;
  hasData: boolean;
}

const COT_TARGETS = [
  {
    metricId: MID.COT_UST_10Y_NET_SPEC,
    assetName: 'US 10Y Treasury Futures',
    category: 'Rates' as const,
    symbol: 'CBOT 10Y',
  },
  {
    metricId: MID.COT_GOLD_NET_SPEC,
    assetName: 'Gold COMEX Futures',
    category: 'Precious Metals' as const,
    symbol: 'COMEX GC',
  },
  {
    metricId: MID.COT_OIL_WTI_NET_SPEC,
    assetName: 'WTI Crude Oil Futures',
    category: 'Energy' as const,
    symbol: 'NYMEX CL',
  },
  {
    metricId: MID.COT_DXY_NET_SPEC,
    assetName: 'US Dollar Index (DXY)',
    category: 'Currencies' as const,
    symbol: 'ICE DX',
  },
  {
    metricId: MID.COT_SP500_NET_SPEC,
    assetName: 'E-Mini S&P 500 Futures',
    category: 'Equities' as const,
    symbol: 'CME ES',
  },
];

export function calculateSqueezeSignal(percentile: number | null): SqueezeSignal | null {
  if (percentile === null || !Number.isFinite(percentile)) return null;
  if (percentile <= 5) return 'BULL_SQUEEZE_RISK';
  if (percentile >= 95) return 'CROWDED_LONG';
  if (percentile >= 75) return 'MODERATE_LONG';
  if (percentile <= 25) return 'MODERATE_SHORT';
  return 'NEUTRAL_RANGE';
}

export function computePercentile(val: number, history: number[]): number {
  if (history.length <= 1) return 50.0;
  const countBelowOrEqual = history.filter((h) => h <= val).length;
  return Math.round((countBelowOrEqual / history.length) * 1000) / 10;
}

const MIN_SIGNAL_OBSERVATIONS = 52;

const emptyCOTItem = (target: typeof COT_TARGETS[number]): COTAssetPositioning => ({
  ...target,
  netSpecContracts: null,
  delta1wContracts: null,
  percentile3y: null,
  squeezeSignal: null,
  asOfDate: null,
  sourceRef: null,
  observationCount: 0,
  isAvailable: false,
});

export function useCOTPositioning() {
  return useQuery<COTPositioningData>({
    queryKey: ['cftc-cot-positioning'],
    queryFn: async () => {
      if (!supabase) {
        return {
          items: COT_TARGETS.map(emptyCOTItem),
          lastUpdated: null,
          hasData: false,
        };
      }

      const responses = await Promise.all(
        COT_TARGETS.map(async (target) => {
          const { data, error } = await supabase
            .from('metric_observations')
            .select('metric_id, as_of_date, value, source_ref, last_updated_at')
            .eq('metric_id', target.metricId)
            .order('as_of_date', { ascending: false })
            .limit(180);

          return { target, data: data ?? [], error };
        })
      );

      if (responses.every((res) => res.error || res.data.length === 0)) {
        return {
          items: COT_TARGETS.map(emptyCOTItem),
          lastUpdated: null,
          hasData: false,
        };
      }

      const items: COTAssetPositioning[] = responses.map(({ target, data: rows, error }) => {
        if (error || rows.length === 0) {
          return emptyCOTItem(target);
        }

        const latest = rows[0];
        const previous = rows.length > 1 ? rows[1] : null;
        const allValues = rows.map((r) => Number(r.value));
        const percentile = rows.length >= MIN_SIGNAL_OBSERVATIONS
          ? computePercentile(Number(latest.value), allValues)
          : null;
        const delta = previous !== null ? Number(latest.value) - Number(previous.value) : null;

        return {
          ...target,
          netSpecContracts: Number(latest.value),
          delta1wContracts: delta,
          percentile3y: percentile,
          squeezeSignal: calculateSqueezeSignal(percentile),
          asOfDate: latest.as_of_date,
          sourceRef: latest.source_ref,
          observationCount: rows.length,
          isAvailable: true,
        };
      });

      const hasAnyData = items.some((i) => i.isAvailable);
      const updatedTimestamps = responses
        .flatMap((res) => res.data.map((row) => row.last_updated_at))
        .filter((value): value is string => Boolean(value))
        .sort();
      const latestUpdated = updatedTimestamps.length > 0 ? updatedTimestamps[updatedTimestamps.length - 1] : null;

      return {
        items,
        lastUpdated: latestUpdated,
        hasData: hasAnyData,
      };
    },
    staleTime: 1000 * 60 * 30, // 30 mins
  });
}
