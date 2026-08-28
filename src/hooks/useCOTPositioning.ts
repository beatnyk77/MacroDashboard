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

export function useCOTPositioning() {
  return useQuery<COTPositioningData>({
    queryKey: ['cftc-cot-positioning'],
    queryFn: async () => {
      if (!supabase) {
        return {
          items: COT_TARGETS.map((t) => ({
            ...t,
            netSpecContracts: null,
            delta1wContracts: null,
            percentile3y: null,
            squeezeSignal: null,
            asOfDate: null,
            sourceRef: null,
            isAvailable: false,
          })),
          lastUpdated: null,
          hasData: false,
        };
      }

      const metricIds = COT_TARGETS.map((t) => t.metricId);

      const { data, error } = await supabase
        .from('metric_observations')
        .select('metric_id, as_of_date, value, source_ref, last_updated_at')
        .in('metric_id', metricIds)
        .order('as_of_date', { ascending: false });

      if (error || !data || data.length === 0) {
        return {
          items: COT_TARGETS.map((t) => ({
            ...t,
            netSpecContracts: null,
            delta1wContracts: null,
            percentile3y: null,
            squeezeSignal: null,
            asOfDate: null,
            sourceRef: null,
            isAvailable: false,
          })),
          lastUpdated: null,
          hasData: false,
        };
      }

      // Group observations by metric_id
      const byMetric: Record<string, typeof data> = {};
      for (const row of data) {
        if (!byMetric[row.metric_id]) byMetric[row.metric_id] = [];
        byMetric[row.metric_id].push(row);
      }

      const items: COTAssetPositioning[] = COT_TARGETS.map((target) => {
        const rows = byMetric[target.metricId];
        if (!rows || rows.length === 0) {
          return {
            ...target,
            netSpecContracts: null,
            delta1wContracts: null,
            percentile3y: null,
            squeezeSignal: null,
            asOfDate: null,
            sourceRef: null,
            isAvailable: false,
          };
        }

        const latest = rows[0];
        const previous = rows.length > 1 ? rows[1] : null;
        const allValues = rows.map((r) => Number(r.value));
        const percentile = computePercentile(Number(latest.value), allValues);
        const delta = previous !== null ? Number(latest.value) - Number(previous.value) : null;

        return {
          ...target,
          netSpecContracts: Number(latest.value),
          delta1wContracts: delta,
          percentile3y: percentile,
          squeezeSignal: calculateSqueezeSignal(percentile),
          asOfDate: latest.as_of_date,
          sourceRef: latest.source_ref,
          isAvailable: true,
        };
      });

      const hasAnyData = items.some((i) => i.isAvailable);

      return {
        items,
        lastUpdated: data[0]?.last_updated_at || null,
        hasData: hasAnyData,
      };
    },
    staleTime: 1000 * 60 * 30, // 30 mins
  });
}
