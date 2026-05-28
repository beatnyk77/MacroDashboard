/**
 * useContradictions
 * Fetches today's cross-market contradictions.
 * Falls back to empty array if table is unpopulated (Phase 1 safe).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Contradiction {
  contradiction_key: string;
  title: string;
  interpretation: string;
  severity: 'NOTABLE' | 'EXTREME';
  metric_a: string;
  metric_b: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useContradictions(signalDate?: string) {
  const queryDate = signalDate || todayISO();

  return useQuery({
    queryKey: ['macro-contradictions', queryDate],
    queryFn: async (): Promise<Contradiction[]> => {
      const { data, error } = await supabase
        .from('macro_contradictions')
        .select('*')
        .eq('signal_date', queryDate)
        .order('severity', { ascending: true }) // EXTREME first
        .limit(2);

      if (error) {
        console.warn('[useContradictions] fetch failed:', error.message);
      }

      if (data && data.length > 0) {
        return data.map((row) => ({
          contradiction_key: row.contradiction_key,
          title: row.title,
          interpretation: row.interpretation,
          severity: row.severity as 'NOTABLE' | 'EXTREME',
          metric_a: row.metric_a,
          metric_b: row.metric_b,
        }));
      }

      // Fallback: Compute client-side
      const metricsNeeded = [
        'US_10Y_YIELD',
        'US_2Y_YIELD',
        'DOLLAR_INDEX_DXY',
        'SOFR_EFFR_SPREAD_BPS',
        'COPPER_GOLD_RATIO',
        'DEBT_GOLD_RATIO',
        'GOLD_COMEX_USD',
        'US_10Y_TIPS_YIELD',
        'CB_GOLD_NET',
      ];
      const [metricsRes, liquidityRes] = await Promise.all([
        supabase.from('vw_latest_metrics').select('metric_id, value, z_score').in('metric_id', metricsNeeded),
        supabase.from('global_liquidity_direction').select('regime_label, composite_score, cb_aggregate_wow_pct').order('as_of_date', { ascending: false }).limit(1).single(),
      ]);

      const metrics = metricsRes.data ?? [];
      const liq = liquidityRes.data;

      const getMetric = (id: string) => metrics.find((m: any) => m.metric_id === id);

      const computed = await import('../services/macroSignalEngine').then(m => m.detectContradictions({
        liquidityRegime: (liq?.regime_label as 'EXPANDING' | 'NEUTRAL' | 'CONTRACTING') ?? 'NEUTRAL',
        liquidityCompositeScore: Number(liq?.composite_score ?? 50),
        liquidityWowPct: Number(liq?.cb_aggregate_wow_pct ?? 0),
        us10yYield: Number(getMetric('US_10Y_YIELD')?.value ?? 4.3),
        us2yYield: Number(getMetric('US_2Y_YIELD')?.value ?? 4.8),
        dxyZScore: Number(getMetric('DOLLAR_INDEX_DXY')?.z_score ?? 0),
        sofrEffrSpreadBps: Number(getMetric('SOFR_EFFR_SPREAD_BPS')?.value ?? 5),
        copperGoldZScore: Number(getMetric('COPPER_GOLD_RATIO')?.z_score ?? 0),
        copperGoldStatus: 'neutral', // simplified fallback
        debtGoldZScore: Number(getMetric('DEBT_GOLD_RATIO')?.z_score ?? 0),
        goldPriceZScore: Number(getMetric('GOLD_COMEX_USD')?.z_score ?? 0),
        realYieldPct: Number(getMetric('US_10Y_TIPS_YIELD')?.value ?? 1.5),
        cbGoldBuyingYoYPct: Number(getMetric('CB_GOLD_NET')?.value ?? 0),
      }));

      return computed;
    },
    staleTime: 1000 * 60 * 60 * 4,
    retry: 1,
  });
}
