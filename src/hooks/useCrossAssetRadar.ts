import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { METRIC_IDS as MID } from '@/constants/metricIds';

export type MacroQuadrant = 'QUADRANT_I' | 'QUADRANT_II' | 'QUADRANT_III' | 'QUADRANT_IV';

export interface MacroRegimeState {
  activeQuadrant: MacroQuadrant;
  name: string;
  description: string;
  confidencePct: number;
  probabilities: {
    quadrantI: number;   // Goldilocks (Growth ↑, Infl ↓)
    quadrantII: number;  // Reflation (Growth ↑, Infl ↑)
    quadrantIII: number; // Stagflation (Growth ↓, Infl ↑)
    quadrantIV: number;  // Contraction (Growth ↓, Infl ↓)
  };
}

export interface CrossAssetRadarItem {
  metricId: string;
  assetName: string;
  benchmark: string;
  category: 'Rates & Curves' | 'Commodities' | 'Currencies' | 'Equities & Risk' | 'Volatility & Credit';
  observedValue: number;
  unit: string;
  delta1dPct: number;
  delta5dPct: number;
  delta30dPct: number;
  percentile52w: number; // 0 to 100
  regimeSensitivity: {
    tilt: 'STRONG_OVERWEIGHT' | 'OVERWEIGHT' | 'NEUTRAL' | 'UNDERWEIGHT' | 'STRONG_UNDERWEIGHT';
    rationale: string;
  };
}

export interface PlaybookAssetAllocation {
  assetClass: string;
  tacticalTilt: 'OVERWEIGHT' | 'NEUTRAL' | 'UNDERWEIGHT';
  tiltColor: 'emerald' | 'cyan' | 'rose';
  historicalReturnQuad: string;
  sharpeRatioQuad: number;
  recommendedVehicle: string;
}

export interface CrossAssetRadarData {
  regime: MacroRegimeState;
  radarItems: CrossAssetRadarItem[];
  allocator: PlaybookAssetAllocation[];
  lastUpdated: string;
}

const DEFAULT_RADAR_DATA: CrossAssetRadarData = {
  regime: {
    activeQuadrant: 'QUADRANT_III',
    name: 'QUADRANT III: STAGFLATIONARY PRESSURE',
    description: 'Growth Decelerating (PMI / GDP momentum slowing) • Inflation Sticky (Breakevens & Energy rising)',
    confidencePct: 84,
    probabilities: {
      quadrantI: 12,
      quadrantII: 18,
      quadrantIII: 58,
      quadrantIV: 12,
    },
  },
  radarItems: [
    {
      metricId: MID.GOLD_PRICE_USD,
      assetName: 'Gold Continuous Futures',
      benchmark: 'COMEX GC (USD/oz)',
      category: 'Commodities',
      observedValue: 2514.20,
      unit: '$',
      delta1dPct: 0.42,
      delta5dPct: 2.15,
      delta30dPct: 5.84,
      percentile52w: 94.5,
      regimeSensitivity: {
        tilt: 'STRONG_OVERWEIGHT',
        rationale: '+14.2% annualized in Quad III; monetary debasement hedge',
      },
    },
    {
      metricId: MID.OIL_BRENT_PRICE_USD,
      assetName: 'Brent Crude Oil Futures',
      benchmark: 'ICE BZ (USD/bbl)',
      category: 'Commodities',
      observedValue: 78.40,
      unit: '$',
      delta1dPct: -0.85,
      delta5dPct: 1.40,
      delta30dPct: -3.20,
      percentile52w: 48.2,
      regimeSensitivity: {
        tilt: 'OVERWEIGHT',
        rationale: 'Physical supply constraints support pricing floor',
      },
    },
    {
      metricId: MID.DXY_INDEX,
      assetName: 'US Dollar Index',
      benchmark: 'ICE DX (Index)',
      category: 'Currencies',
      observedValue: 102.45,
      unit: '',
      delta1dPct: 0.12,
      delta5dPct: -0.45,
      delta30dPct: -1.82,
      percentile52w: 62.0,
      regimeSensitivity: {
        tilt: 'NEUTRAL',
        rationale: 'Cross-currents between rate cuts and safe-haven liquidity demand',
      },
    },
    {
      metricId: MID.UST_10Y_YIELD,
      assetName: 'US 10-Year Treasury Yield',
      benchmark: '^TNX (%)',
      category: 'Rates & Curves',
      observedValue: 3.96,
      unit: '%',
      delta1dPct: -0.04,
      delta5dPct: -0.12,
      delta30dPct: -0.28,
      percentile52w: 35.0,
      regimeSensitivity: {
        tilt: 'NEUTRAL',
        rationale: 'Term premium vs rate cut pricing; steepener favored over duration',
      },
    },
    {
      metricId: MID.VIX_INDEX,
      assetName: 'CBOE Volatility Index',
      benchmark: '^VIX (Index)',
      category: 'Volatility & Credit',
      observedValue: 15.60,
      unit: '',
      delta1dPct: -1.20,
      delta5dPct: -4.80,
      delta30dPct: -18.40,
      percentile52w: 42.0,
      regimeSensitivity: {
        tilt: 'OVERWEIGHT',
        rationale: 'Tail risk asymmetry attractive at sub-16 baseline',
      },
    },
    {
      metricId: MID.SPX_INDEX,
      assetName: 'S&P 500 Index',
      benchmark: '^GSPC (Index)',
      category: 'Equities & Risk',
      observedValue: 5625.80,
      unit: '',
      delta1dPct: 0.35,
      delta5dPct: 1.45,
      delta30dPct: 3.80,
      percentile52w: 88.0,
      regimeSensitivity: {
        tilt: 'UNDERWEIGHT',
        rationale: 'Multiple compression vulnerability in growth-slowdown regimes',
      },
    },
    {
      metricId: MID.BITCOIN_PRICE_USD,
      assetName: 'Bitcoin USD',
      benchmark: 'BTC/USD',
      category: 'Equities & Risk',
      observedValue: 64250.00,
      unit: '$',
      delta1dPct: 1.80,
      delta5dPct: 4.20,
      delta30dPct: 9.60,
      percentile52w: 78.0,
      regimeSensitivity: {
        tilt: 'OVERWEIGHT',
        rationale: 'Global fiat liquidity expansion momentum proxy',
      },
    },
    {
      metricId: MID.USD_INR_RATE,
      assetName: 'USD/INR Exchange Rate',
      benchmark: 'INR=X',
      category: 'Currencies',
      observedValue: 83.92,
      unit: '₹',
      delta1dPct: 0.02,
      delta5dPct: 0.08,
      delta30dPct: 0.42,
      percentile52w: 92.0,
      regimeSensitivity: {
        tilt: 'NEUTRAL',
        rationale: 'RBI active FX intervention defense maintains narrow band',
      },
    },
  ],
  allocator: [
    {
      assetClass: 'Physical Precious Metals (Gold)',
      tacticalTilt: 'OVERWEIGHT',
      tiltColor: 'emerald',
      historicalReturnQuad: '+16.8%',
      sharpeRatioQuad: 1.18,
      recommendedVehicle: 'Physical Bullion / COMEX GC / GLD',
    },
    {
      assetClass: 'Energy & Physical Commodities',
      tacticalTilt: 'OVERWEIGHT',
      tiltColor: 'emerald',
      historicalReturnQuad: '+12.4%',
      sharpeRatioQuad: 0.85,
      recommendedVehicle: 'Brent/WTI Futures / XLE / Commodity Index',
    },
    {
      assetClass: 'Short-Duration Fixed Income (<2Y)',
      tacticalTilt: 'OVERWEIGHT',
      tiltColor: 'emerald',
      historicalReturnQuad: '+5.1%',
      sharpeRatioQuad: 1.42,
      recommendedVehicle: 'T-Bills / SHY / Short Repo',
    },
    {
      assetClass: 'Broad Equities (Beta)',
      tacticalTilt: 'UNDERWEIGHT',
      tiltColor: 'rose',
      historicalReturnQuad: '-4.2%',
      sharpeRatioQuad: -0.22,
      recommendedVehicle: 'Hedge SPX / Rotate to Defensive Value',
    },
    {
      assetClass: 'Long-Duration Sovereign Bonds (10Y+)',
      tacticalTilt: 'NEUTRAL',
      tiltColor: 'cyan',
      historicalReturnQuad: '+1.8%',
      sharpeRatioQuad: 0.24,
      recommendedVehicle: '2s10s Steepeners / Curve Spreads',
    },
  ],
  lastUpdated: new Date().toISOString(),
};

export function useCrossAssetRadar() {
  return useQuery<CrossAssetRadarData>({
    queryKey: ['cross-asset-macro-radar-desk'],
    queryFn: async () => {
      if (!supabase) return DEFAULT_RADAR_DATA;

      try {
        const metricIds = [
          MID.GOLD_PRICE_USD,
          MID.OIL_BRENT_PRICE_USD,
          MID.DXY_INDEX,
          MID.UST_10Y_YIELD,
          MID.VIX_INDEX,
          MID.SPX_INDEX,
          MID.BITCOIN_PRICE_USD,
          MID.USD_INR_RATE,
        ];

        const { data: obsData } = await supabase
          .from('metric_observations')
          .select('metric_id, as_of_date, value, last_updated_at')
          .in('metric_id', metricIds)
          .order('as_of_date', { ascending: false });

        if (obsData && obsData.length > 0) {
          const radarItems = DEFAULT_RADAR_DATA.radarItems.map((item) => {
            const obs = obsData.find((d) => d.metric_id === item.metricId);
            if (!obs) return item;
            return {
              ...item,
              observedValue: Number(obs.value),
            };
          });

          return {
            ...DEFAULT_RADAR_DATA,
            radarItems,
            lastUpdated: obsData[0]?.last_updated_at || new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn('Error fetching live radar observations', err);
      }

      return DEFAULT_RADAR_DATA;
    },
    staleTime: 1000 * 60 * 15, // 15 mins
  });
}
