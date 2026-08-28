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
          radarItems: RADAR_CONFIG.map((c) => ({
            ...c,
            observedValue: null,
            delta1dPct: null,
            delta5dPct: null,
            delta30dPct: null,
            percentile52w: null,
            asOfDate: null,
            isAvailable: false,
          })),
          lastUpdated: null,
          hasData: false,
        };
      }

      const metricIds = RADAR_CONFIG.map((c) => c.metricId);

      const { data, error } = await supabase
        .from('metric_observations')
        .select('metric_id, as_of_date, value, last_updated_at')
        .in('metric_id', metricIds)
        .order('as_of_date', { ascending: false });

      if (error || !data || data.length === 0) {
        return {
          radarItems: RADAR_CONFIG.map((c) => ({
            ...c,
            observedValue: null,
            delta1dPct: null,
            delta5dPct: null,
            delta30dPct: null,
            percentile52w: null,
            asOfDate: null,
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

      const radarItems: CrossAssetRadarItem[] = RADAR_CONFIG.map((cfg) => {
        const rows = byMetric[cfg.metricId];
        if (!rows || rows.length === 0) {
          return {
            ...cfg,
            observedValue: null,
            delta1dPct: null,
            delta5dPct: null,
            delta30dPct: null,
            percentile52w: null,
            asOfDate: null,
            isAvailable: false,
          };
        }

        const latestVal = Number(rows[0].value);
        const allVals = rows.map((r) => Number(r.value));
        const p1d = rows.length > 1 ? Number(rows[1].value) : undefined;
        const p5d = rows.length > 5 ? Number(rows[5].value) : rows.length > 1 ? Number(rows[rows.length - 1].value) : undefined;
        const p30d = rows.length > 22 ? Number(rows[22].value) : rows.length > 1 ? Number(rows[rows.length - 1].value) : undefined;

        return {
          ...cfg,
          observedValue: latestVal,
          delta1dPct: computeDeltaPct(latestVal, p1d),
          delta5dPct: computeDeltaPct(latestVal, p5d),
          delta30dPct: computeDeltaPct(latestVal, p30d),
          percentile52w: computePercentile(latestVal, allVals),
          asOfDate: rows[0].as_of_date,
          isAvailable: true,
        };
      });

      const hasAnyData = radarItems.some((i) => i.isAvailable);

      return {
        radarItems,
        lastUpdated: data[0]?.last_updated_at || null,
        hasData: hasAnyData,
      };
    },
    staleTime: 1000 * 60 * 15, // 15 mins
  });
}
