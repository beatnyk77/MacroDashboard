import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { METRIC_IDS as MID } from '@/constants/metricIds';

export interface CrossAssetRadarItem {
  metricId: string;
  assetName: string;
  benchmark: string;
  category: 'Rates & Curves' | 'Commodities' | 'Currencies' | 'Equities & Risk' | 'Volatility & Credit';
  observedValue: number | null;
  unit: string;
  delta1dPct: number | null;
  delta5dPct: number | null;
  delta30dPct: number | null;
  percentile52w: number | null; // 0 to 100
  asOfDate: string | null;
  sourceRef: string | null;
  lastUpdatedAt: string | null;
  observationCount: number;
  isAvailable: boolean;
}

export interface CrossAssetRadarData {
  radarItems: CrossAssetRadarItem[];
  lastUpdated: string | null;
  hasData: boolean;
}

const RADAR_CONFIG = [
  {
    metricId: MID.GOLD_PRICE_USD,
    assetName: 'Gold Continuous Futures',
    benchmark: 'COMEX GC (USD/oz)',
    category: 'Commodities' as const,
    unit: '$',
  },
  {
    metricId: MID.OIL_BRENT_PRICE_USD,
    assetName: 'Brent Crude Oil Futures',
    benchmark: 'ICE BZ (USD/bbl)',
    category: 'Commodities' as const,
    unit: '$',
  },
  {
    metricId: MID.DXY_INDEX,
    assetName: 'US Dollar Index',
    benchmark: 'ICE DX (Index)',
    category: 'Currencies' as const,
    unit: '',
  },
  {
    metricId: MID.UST_10Y_YIELD,
    assetName: 'US 10-Year Treasury Yield',
    benchmark: '^TNX (%)',
    category: 'Rates & Curves' as const,
    unit: '%',
  },
  {
    metricId: MID.VIX_INDEX,
    assetName: 'CBOE Volatility Index',
    benchmark: '^VIX (Index)',
    category: 'Volatility & Credit' as const,
    unit: '',
  },
  {
    metricId: MID.SPX_INDEX,
    assetName: 'S&P 500 Index',
    benchmark: '^GSPC (Index)',
    category: 'Equities & Risk' as const,
    unit: '',
  },
  {
    metricId: MID.BITCOIN_PRICE_USD,
    assetName: 'Bitcoin USD',
    benchmark: 'BTC/USD',
    category: 'Equities & Risk' as const,
    unit: '$',
  },
  {
    metricId: MID.USD_INR_RATE,
    assetName: 'USD/INR Exchange Rate',
    benchmark: 'INR=X',
    category: 'Currencies' as const,
    unit: '₹',
  },
];

export function computePercentile(val: number, history: number[]): number {
  if (history.length <= 1) return 50.0;
  const countBelowOrEqual = history.filter((h) => h <= val).length;
  return Math.round((countBelowOrEqual / history.length) * 1000) / 10;
}

const emptyRadarItem = (cfg: typeof RADAR_CONFIG[number]): CrossAssetRadarItem => ({
  ...cfg,
  observedValue: null,
  delta1dPct: null,
  delta5dPct: null,
  delta30dPct: null,
  percentile52w: null,
  asOfDate: null,
  sourceRef: null,
  lastUpdatedAt: null,
  observationCount: 0,
  isAvailable: false,
});

export function computeDeltaPct(latest: number, past: number | undefined): number | null {
  if (past === undefined || past === 0) return null;
  return Math.round(((latest - past) / past) * 10000) / 100;
}

export function useCrossAssetRadar() {
  return useQuery<CrossAssetRadarData>({
    queryKey: ['cross-asset-macro-radar-desk'],
    queryFn: async () => {
      if (!supabase) {
        return {
          radarItems: RADAR_CONFIG.map(emptyRadarItem),
          lastUpdated: null,
          hasData: false,
        };
      }

      const responses = await Promise.all(
        RADAR_CONFIG.map(async (cfg) => {
          const { data, error } = await supabase
            .from('metric_observations')
            .select('metric_id, as_of_date, value, source_ref, last_updated_at')
            .eq('metric_id', cfg.metricId)
            .order('as_of_date', { ascending: false })
            .limit(320);

          return { cfg, data: data ?? [], error };
        })
      );

      if (responses.every((res) => res.error || res.data.length === 0)) {
        return {
          radarItems: RADAR_CONFIG.map(emptyRadarItem),
          lastUpdated: null,
          hasData: false,
        };
      }

      const radarItems: CrossAssetRadarItem[] = responses.map(({ cfg, data: rows, error }) => {
        if (error || rows.length === 0) {
          return emptyRadarItem(cfg);
        }

        const latestVal = Number(rows[0].value);
        const percentileWindow = rows.slice(0, 260).map((r) => Number(r.value));
        const p1d = rows.length > 1 ? Number(rows[1].value) : undefined;
        const p5d = rows.length > 5 ? Number(rows[5].value) : rows.length > 1 ? Number(rows[rows.length - 1].value) : undefined;
        const p30d = rows.length > 22 ? Number(rows[22].value) : rows.length > 1 ? Number(rows[rows.length - 1].value) : undefined;

        return {
          ...cfg,
          observedValue: latestVal,
          delta1dPct: computeDeltaPct(latestVal, p1d),
          delta5dPct: computeDeltaPct(latestVal, p5d),
          delta30dPct: computeDeltaPct(latestVal, p30d),
          percentile52w: percentileWindow.length >= 120 ? computePercentile(latestVal, percentileWindow) : null,
          asOfDate: rows[0].as_of_date,
          sourceRef: rows[0].source_ref,
          lastUpdatedAt: rows[0].last_updated_at,
          observationCount: rows.length,
          isAvailable: true,
        };
      });

      const hasAnyData = radarItems.some((i) => i.isAvailable);
      const updatedTimestamps = radarItems
        .map((i) => i.lastUpdatedAt)
        .filter((value): value is string => Boolean(value))
        .sort();
      const latestUpdated = updatedTimestamps.length > 0 ? updatedTimestamps[updatedTimestamps.length - 1] : null;

      return {
        radarItems,
        lastUpdated: latestUpdated,
        hasData: hasAnyData,
      };
    },
    staleTime: 1000 * 60 * 15, // 15 mins
  });
}
