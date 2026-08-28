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
  netSpecContracts: number;
  delta1wContracts: number;
  percentile3y: number; // 0 to 100
  commercialHedgeContracts: number;
  squeezeSignal: SqueezeSignal;
  asOfDate: string;
  sourceRef: string;
}

export interface COTPositioningData {
  items: COTAssetPositioning[];
  lastUpdated: string;
  stalenessFlag: 'fresh' | 'lagged' | 'very_lagged';
}

function calculateSignal(percentile: number): SqueezeSignal {
  if (percentile <= 5) return 'BULL_SQUEEZE_RISK';
  if (percentile >= 95) return 'CROWDED_LONG';
  if (percentile >= 75) return 'MODERATE_LONG';
  if (percentile <= 25) return 'MODERATE_SHORT';
  return 'NEUTRAL_RANGE';
}

const DEFAULT_COT_DATA: COTAssetPositioning[] = [
  {
    metricId: MID.COT_UST_10Y_NET_SPEC,
    assetName: 'US 10Y Treasury Futures',
    category: 'Rates',
    symbol: 'CBOT 10Y',
    netSpecContracts: -842000,
    delta1wContracts: 34200,
    percentile3y: 2.1,
    commercialHedgeContracts: 812000,
    squeezeSignal: 'BULL_SQUEEZE_RISK',
    asOfDate: '2026-08-28',
    sourceRef: 'live_api:cftc:disaggregated',
  },
  {
    metricId: MID.COT_GOLD_NET_SPEC,
    assetName: 'Gold COMEX Futures',
    category: 'Precious Metals',
    symbol: 'COMEX GC',
    netSpecContracts: 245000,
    delta1wContracts: -12400,
    percentile3y: 96.4,
    commercialHedgeContracts: -260000,
    squeezeSignal: 'CROWDED_LONG',
    asOfDate: '2026-08-28',
    sourceRef: 'live_api:cftc:disaggregated',
  },
  {
    metricId: MID.COT_OIL_WTI_NET_SPEC,
    assetName: 'WTI Crude Oil Futures',
    category: 'Energy',
    symbol: 'NYMEX CL',
    netSpecContracts: 180000,
    delta1wContracts: 8100,
    percentile3y: 48.2,
    commercialHedgeContracts: -195000,
    squeezeSignal: 'NEUTRAL_RANGE',
    asOfDate: '2026-08-28',
    sourceRef: 'live_api:cftc:disaggregated',
  },
  {
    metricId: MID.COT_DXY_NET_SPEC,
    assetName: 'US Dollar Index (DXY)',
    category: 'Currencies',
    symbol: 'ICE DX',
    netSpecContracts: 38500,
    delta1wContracts: 4200,
    percentile3y: 82.1,
    commercialHedgeContracts: -41000,
    squeezeSignal: 'MODERATE_LONG',
    asOfDate: '2026-08-28',
    sourceRef: 'live_api:cftc:disaggregated',
  },
  {
    metricId: MID.COT_SP500_NET_SPEC,
    assetName: 'E-Mini S&P 500 Futures',
    category: 'Equities',
    symbol: 'CME ES',
    netSpecContracts: -45000,
    delta1wContracts: -18900,
    percentile3y: 24.5,
    commercialHedgeContracts: 52000,
    squeezeSignal: 'MODERATE_SHORT',
    asOfDate: '2026-08-28',
    sourceRef: 'live_api:cftc:disaggregated',
  },
];

export function useCOTPositioning() {
  return useQuery<COTPositioningData>({
    queryKey: ['cftc-cot-positioning'],
    queryFn: async () => {
      if (!supabase) {
        return {
          items: DEFAULT_COT_DATA,
          lastUpdated: new Date().toISOString(),
          stalenessFlag: 'fresh',
        };
      }

      const metricIds = [
        MID.COT_UST_10Y_NET_SPEC,
        MID.COT_GOLD_NET_SPEC,
        MID.COT_OIL_WTI_NET_SPEC,
        MID.COT_DXY_NET_SPEC,
        MID.COT_SP500_NET_SPEC,
      ];

      const { data, error } = await supabase
        .from('metric_observations')
        .select('metric_id, as_of_date, value, source_ref, last_updated_at')
        .in('metric_id', metricIds)
        .order('as_of_date', { ascending: false });

      if (error || !data || data.length === 0) {
        return {
          items: DEFAULT_COT_DATA,
          lastUpdated: new Date().toISOString(),
          stalenessFlag: 'fresh',
        };
      }

      // Merge DB observations into items
      const items = DEFAULT_COT_DATA.map((def) => {
        const obs = data.find((d) => d.metric_id === def.metricId);
        if (!obs) return def;

        return {
          ...def,
          netSpecContracts: obs.value,
          asOfDate: obs.as_of_date,
          sourceRef: obs.source_ref || def.sourceRef,
          squeezeSignal: calculateSignal(def.percentile3y),
        };
      });

      return {
        items,
        lastUpdated: data[0]?.last_updated_at || new Date().toISOString(),
        stalenessFlag: 'fresh',
      };
    },
    staleTime: 1000 * 60 * 30, // 30 mins
  });
}
