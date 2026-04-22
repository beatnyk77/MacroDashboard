/**
 * useDailyMacroSignal
 *
 * Primary hook for the Daily Macro Layer.
 * Strategy:
 *   1. Fetch today's pre-computed row from daily_signal (fast path)
 *   2. If missing, compute client-side from cached hook data (fallback)
 *   3. Always cache aggressively — data is daily
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { MacroSignalResult, MacroRegime } from '../services/macroSignalEngine';
import { computeMacroSignal } from '../services/macroSignalEngine';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface DailySignalRow {
  signal_date: string;
  regime: MacroRegime;
  score: number;
  confidence_pct: number;
  score_delta: number;
  regime_changed: boolean;
  key_driver: string;
  watch_item: string;
  component_scores: {
    liquidity: number;
    rates: number;
    dollar: number;
    vol: number;
    metals: number;
  };
  computed_at: string;
  // From joined macro_brief via view
  regime_line?: string;
  driver_line?: string;
  watch_line?: string;
  context_line?: string;
}

// ─── Helper: format today's date as YYYY-MM-DD ─────────────────────────────
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useDailyMacroSignal() {
  const today = todayISO();

  return useQuery({
    queryKey: ['daily-macro-signal', today],
    queryFn: async (): Promise<DailySignalRow | null> => {
      // Fast path: pre-computed row
      const { data, error } = await supabase
        .from('vw_latest_daily_signal')
        .select('*')
        .single();

      if (error) {
        console.warn('[useDailyMacroSignal] view fetch failed:', error.message);
      }

      if (data) return data as DailySignalRow;

      // ── Fallback: client-side compute ────────────────────────────────────
      // Pull from vw_latest_metrics what we need for scoring
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
        supabase
          .from('vw_latest_metrics')
          .select('metric_id, value, z_score')
          .in('metric_id', metricsNeeded),
        supabase
          .from('global_liquidity_direction')
          .select('regime_label, composite_score, cb_aggregate_wow_pct')
          .order('as_of_date', { ascending: false })
          .limit(1)
          .single(),
      ]);

      const metrics = metricsRes.data ?? [];
      const liq = liquidityRes.data;

      const getMetric = (id: string) =>
        metrics.find((m: { metric_id: string; value: number; z_score: number | null }) => m.metric_id === id);

      const us10y = Number(getMetric('US_10Y_YIELD')?.value ?? 4.3);
      const us2y = Number(getMetric('US_2Y_YIELD')?.value ?? 4.8);
      const dxyZ = Number(getMetric('DOLLAR_INDEX_DXY')?.z_score ?? 0);
      const sofrSpread = Number(getMetric('SOFR_EFFR_SPREAD_BPS')?.value ?? 5);
      const cgRatioZ = Number(getMetric('COPPER_GOLD_RATIO')?.z_score ?? 0);
      const debtGoldZ = Number(getMetric('DEBT_GOLD_RATIO')?.z_score ?? 0);
      const goldZ = Number(getMetric('GOLD_COMEX_USD')?.z_score ?? 0);
      const realYield = Number(getMetric('US_10Y_TIPS_YIELD')?.value ?? 1.5);
      const cbGoldYoY = Number(getMetric('CB_GOLD_NET')?.value ?? 0);

      // Determine copper/gold status from z-score
      let cgStatus: 'safe' | 'warning' | 'danger' | 'neutral' = 'neutral';
      if (cgRatioZ > 1) cgStatus = 'safe';
      else if (cgRatioZ < -1.5) cgStatus = 'danger';
      else if (cgRatioZ < -0.5) cgStatus = 'warning';

      const liquidityRegime: 'EXPANDING' | 'NEUTRAL' | 'CONTRACTING' =
        (liq?.regime_label as 'EXPANDING' | 'NEUTRAL' | 'CONTRACTING') ?? 'NEUTRAL';

      const computed: MacroSignalResult = computeMacroSignal({
        liquidityRegime,
        liquidityCompositeScore: Number(liq?.composite_score ?? 50),
        liquidityWowPct: Number(liq?.cb_aggregate_wow_pct ?? 0),
        us10yYield: us10y,
        us2yYield: us2y,
        dxyZScore: dxyZ,
        sofrEffrSpreadBps: sofrSpread,
        copperGoldZScore: cgRatioZ,
        copperGoldStatus: cgStatus,
        debtGoldZScore: debtGoldZ,
        goldPriceZScore: goldZ,
        realYieldPct: realYield,
        cbGoldBuyingYoYPct: cbGoldYoY,
      });

      return {
        signal_date: today,
        regime: computed.regime,
        score: computed.score,
        confidence_pct: computed.confidence_pct,
        score_delta: 0, // No yesterday to compare client-side
        regime_changed: false,
        key_driver: computed.key_driver,
        watch_item: computed.watch_item,
        component_scores: computed.component_scores,
        computed_at: new Date().toISOString(),
      };
    },
    staleTime: 1000 * 60 * 60 * 4, // 4 hours — data is daily
    gcTime: 1000 * 60 * 60 * 8,
    retry: 1,
  });
}
