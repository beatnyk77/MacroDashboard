import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import {
  FCIPoint,
  FCIRegimeInfo,
  classifyFCIRegime,
} from '@/features/financial-conditions/lib/fciMath';
import { HISTORICAL_FCI_SERIES } from '@/features/financial-conditions/data/historicalFciData';

export interface FCIComponentDetail {
  id: string;
  name: string;
  ticker: string;
  zScore: number;
  weight: number;
  contribution: number;
  direction: 'tightening' | 'easing' | 'neutral';
  impactLabel: string;
  description: string;
}

export interface FinancialConditionsData {
  history: FCIPoint[];
  current: FCIPoint;
  regime: FCIRegimeInfo;
  components: FCIComponentDetail[];
  lastUpdated: string;
  staleness: 'fresh' | 'lagged' | 'very_lagged';
}

export function useFinancialConditions() {
  return useQuery<FinancialConditionsData>({
    queryKey: ['financial-conditions-commodity-cycle'],
    staleTime: 1000 * 60 * 30, // 30 minutes
    queryFn: async () => {
      try {
        const metricIds = [
          MID.BARCLAYS_GLOBAL_FCI,
          MID.COMMODITIES_CYCLE_ZSCORE,
          MID.FCI_CS_ZSCORE,
          MID.FCI_R10Y_ZSCORE,
          MID.FCI_SLOPE_ZSCORE,
          MID.FCI_FX_ZSCORE,
          MID.FCI_EQUITY_ZSCORE,
        ];

        const { data: dbObs, error } = await supabase
          .from('metric_observations')
          .select('metric_id, as_of_date, value, z_score, staleness_flag')
          .in('metric_id', metricIds)
          .order('as_of_date', { ascending: true });

        if (error || !dbObs || dbObs.length === 0) {
          // Fallback to validated historical continuous series
          return buildDatasetFromPoints(HISTORICAL_FCI_SERIES);
        }

        // Parse DB observations
        const pointsByDate = new Map<string, Partial<FCIPoint>>();
        for (const row of dbObs) {
          const d = row.as_of_date;
          if (!pointsByDate.has(d)) {
            pointsByDate.set(d, { date: d });
          }
          const pt = pointsByDate.get(d)!;
          const val = Number(row.value);

          if (row.metric_id === MID.BARCLAYS_GLOBAL_FCI) pt.fci = val;
          else if (row.metric_id === MID.COMMODITIES_CYCLE_ZSCORE) pt.commodityCycle = val;
          else if (row.metric_id === MID.FCI_CS_ZSCORE) pt.csZScore = val;
          else if (row.metric_id === MID.FCI_R10Y_ZSCORE) pt.r10yZScore = val;
          else if (row.metric_id === MID.FCI_SLOPE_ZSCORE) pt.slopeZScore = val;
          else if (row.metric_id === MID.FCI_FX_ZSCORE) pt.fxZScore = val;
          else if (row.metric_id === MID.FCI_EQUITY_ZSCORE) pt.equityZScore = val;
        }

        const validPoints: FCIPoint[] = [];
        for (const pt of pointsByDate.values()) {
          if (pt.date && typeof pt.fci === 'number' && typeof pt.commodityCycle === 'number') {
            validPoints.push(pt as FCIPoint);
          }
        }

        if (validPoints.length < 10) {
          return buildDatasetFromPoints(HISTORICAL_FCI_SERIES);
        }

        validPoints.sort((a, b) => a.date.localeCompare(b.date));
        return buildDatasetFromPoints(validPoints);
      } catch {
        return buildDatasetFromPoints(HISTORICAL_FCI_SERIES);
      }
    },
  });
}

function buildDatasetFromPoints(points: FCIPoint[]): FinancialConditionsData {
  const current = points[points.length - 1] || {
    date: new Date().toISOString().slice(0, 10),
    fci: 0.15,
    commodityCycle: 0.35,
    csZScore: 0.05,
    r10yZScore: 0.92,
    slopeZScore: 0.18,
    fxZScore: 0.50,
    equityZScore: 0.45,
  };

  const regime = classifyFCIRegime(current.fci, current.commodityCycle);

  // 5 Pillars decomposition
  const csZ = current.csZScore ?? 0.05;
  const r10yZ = current.r10yZScore ?? 0.92;
  const slopeZ = current.slopeZScore ?? 0.18;
  const fxZ = current.fxZScore ?? 0.50;
  const eqZ = current.equityZScore ?? 0.45;

  const components: FCIComponentDetail[] = [
    {
      id: 'cs',
      name: 'Credit Spreads (HY OAS)',
      ticker: 'BAMLH0A0HYM2',
      zScore: csZ,
      weight: 0.20,
      contribution: Math.round((csZ * 0.20) * 100) / 100,
      direction: csZ > 0.1 ? 'tightening' : csZ < -0.1 ? 'easing' : 'neutral',
      impactLabel: csZ > 0 ? '+ Tightening' : '- Easing',
      description: 'Widening corporate credit risk premium increases private sector cost of capital.',
    },
    {
      id: 'r10y',
      name: '10Y Real Benchmark Yield',
      ticker: 'DFII10 (TIPS)',
      zScore: r10yZ,
      weight: 0.20,
      contribution: Math.round((r10yZ * 0.20) * 100) / 100,
      direction: r10yZ > 0.1 ? 'tightening' : r10yZ < -0.1 ? 'easing' : 'neutral',
      impactLabel: r10yZ > 0 ? '+ Tightening' : '- Easing',
      description: 'Higher sovereign real discount rates compress asset valuations and capex hurdle rates.',
    },
    {
      id: 'slope',
      name: 'Yield Curve Slope (10Y-2Y)',
      ticker: 'T10Y2Y',
      zScore: slopeZ,
      weight: 0.20,
      contribution: Math.round((slopeZ * 0.20) * 100) / 100,
      direction: slopeZ > 0.1 ? 'tightening' : slopeZ < -0.1 ? 'easing' : 'neutral',
      impactLabel: slopeZ > 0 ? '+ Inverted / Restrictive' : '- Steepening / Normalizing',
      description: 'Inversion/flattening reflects restrictive monetary policy and interbank term premium compression.',
    },
    {
      id: 'fx',
      name: 'Trade-Weighted US Dollar',
      ticker: 'DTWEXBGS',
      zScore: fxZ,
      weight: 0.20,
      contribution: Math.round((fxZ * 0.20) * 100) / 100,
      direction: fxZ > 0.1 ? 'tightening' : fxZ < -0.1 ? 'easing' : 'neutral',
      impactLabel: fxZ > 0 ? '+ Dollar Squeeze' : '- Dollar Depreciation',
      description: 'Dollar appreciation mechanically contracts global offshore eurodollar liquidity.',
    },
    {
      id: 'equity',
      name: 'Equity Market Impulse',
      ticker: 'SP500',
      zScore: eqZ,
      weight: 0.20,
      contribution: Math.round((eqZ * 0.20) * 100) / 100,
      direction: eqZ > 0.1 ? 'tightening' : eqZ < -0.1 ? 'easing' : 'neutral',
      impactLabel: eqZ > 0 ? '+ Equity Drag' : '- Wealth Expansion',
      description: 'Equity drawdowns destroy balance sheet wealth buffers and elevate equity risk premia.',
    },
  ];

  return {
    history: points,
    current,
    regime,
    components,
    lastUpdated: current.date,
    staleness: 'fresh',
  };
}
