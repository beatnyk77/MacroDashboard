import { createClient } from '@supabase/supabase-js'

// ─── Types ─────────────────────────────────────────────────────────────────
type MacroRegime = 'RISK_ON' | 'NEUTRAL' | 'RISK_OFF';
type ContradictionSeverity = 'NOTABLE' | 'EXTREME';

interface ComponentScores {
  liquidity: number;
  rates: number;
  dollar: number;
  vol: number;
  metals: number;
}

interface MacroSignalResult {
  regime: MacroRegime;
  score: number;
  confidence_pct: number;
  key_driver: string;
  watch_item: string;
  component_scores: ComponentScores;
}

// ─── Scoring helpers (mirrors macroSignalEngine.ts) ─────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function computeLiquidityScore(
  regime: 'EXPANDING' | 'NEUTRAL' | 'CONTRACTING',
  compositeScore: number,
  wowPct: number
): number {
  const base = regime === 'EXPANDING' ? 68 : regime === 'NEUTRAL' ? 50 : 30;
  const compositeAdj = ((compositeScore - 50) / 50) * 15;
  const momentumAdj = clamp(wowPct * 2, -8, 8);
  return clamp(base + compositeAdj + momentumAdj, 5, 95);
}

function computeRatesScore(us10y: number, us2y: number): number {
  const slope = us10y - us2y;
  let base = 50;
  if (slope > 0.75) base += 20;
  else if (slope > 0.25) base += 10;
  else if (slope < -0.50) base -= 20;
  else if (slope < 0) base -= 10;
  if (us10y < 3.0) base += 12;
  else if (us10y < 3.75) base += 5;
  else if (us10y > 5.5) base -= 18;
  else if (us10y > 4.75) base -= 8;
  return clamp(base, 5, 95);
}

function computeDollarScore(dxyZScore: number): number {
  const sigmoid = 1 / (1 + Math.exp(dxyZScore * 1.2));
  return clamp(sigmoid * 100, 5, 95);
}

function computeVolScore(sofrSpread: number): number {
  if (sofrSpread <= 3) return 82;
  if (sofrSpread <= 8) return 65;
  if (sofrSpread <= 15) return 48;
  if (sofrSpread <= 25) return 32;
  return 15;
}

function computeMetalsScore(cgZScore: number): number {
  let status = 'neutral';
  if (cgZScore > 1) status = 'safe';
  else if (cgZScore < -1.5) status = 'danger';
  else if (cgZScore < -0.5) status = 'warning';
  const bases: Record<string, number> = { safe: 75, neutral: 50, warning: 30, danger: 10 };
  return clamp((bases[status] ?? 50) + clamp(cgZScore * 8, -20, 20), 5, 95);
}

function computeMacroSignal(inputs: {
  liquidityRegime: 'EXPANDING' | 'NEUTRAL' | 'CONTRACTING';
  liquidityCompositeScore: number;
  liquidityWowPct: number;
  us10yYield: number;
  us2yYield: number;
  dxyZScore: number;
  sofrEffrSpreadBps: number;
  copperGoldZScore: number;
}): MacroSignalResult {
  const liq = computeLiquidityScore(inputs.liquidityRegime, inputs.liquidityCompositeScore, inputs.liquidityWowPct);
  const rates = computeRatesScore(inputs.us10yYield, inputs.us2yYield);
  const dollar = computeDollarScore(inputs.dxyZScore);
  const vol = computeVolScore(inputs.sofrEffrSpreadBps);
  const metals = computeMetalsScore(inputs.copperGoldZScore);

  const component_scores: ComponentScores = { liquidity: liq, rates, dollar, vol, metals };

  const WEIGHTS = { liquidity: 0.30, rates: 0.25, dollar: 0.20, vol: 0.15, metals: 0.10 };
  const score = clamp(
    liq * WEIGHTS.liquidity + rates * WEIGHTS.rates + dollar * WEIGHTS.dollar +
    vol * WEIGHTS.vol + metals * WEIGHTS.metals,
    0, 100
  );

  const regime: MacroRegime = score >= 60 ? 'RISK_ON' : score <= 40 ? 'RISK_OFF' : 'NEUTRAL';
  const bullish = score >= 50;
  const agreements = [liq, rates, dollar, vol, metals].filter(s => bullish ? s >= 50 : s < 50).length;
  const confidence_pct = clamp(50 + agreements * 8, 50, 90);

  const DRIVER_LABELS: Record<string, string> = {
    liquidity: 'Global Liquidity Conditions',
    rates: 'Yield Curve & Rate Levels',
    dollar: 'US Dollar Strength (DXY)',
    vol: 'Funding Market Stress',
    metals: 'Copper/Gold Growth Proxy',
  };
  const WATCH_LABELS: Record<string, string> = {
    liquidity: 'CB balance sheet trajectory',
    rates: 'Next Treasury auction BTC + 10Y breakeven',
    dollar: 'DXY pivot vs EM FX moves',
    vol: 'SOFR-EFFR spread & repo market',
    metals: 'Copper/Gold ratio vs PMI trend',
  };

  const sorted = Object.entries(component_scores).sort((a, b) => Math.abs(b[1] - 50) - Math.abs(a[1] - 50));
  const key_driver = DRIVER_LABELS[sorted[0][0]] ?? 'Cross-Market Signals';
  const watch_item = WATCH_LABELS[sorted[1][0]] ?? 'Multi-market alignment';

  return {
    regime,
    score: Math.round(score * 100) / 100,
    confidence_pct: Math.round(confidence_pct * 10) / 10,
    key_driver,
    watch_item,
    component_scores,
  };
}

// ─── Main handler ──────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const today = new Date().toISOString().slice(0, 10);

  try {
    // ── 1. Fetch all inputs ──────────────────────────────────────────────
    const metricsNeeded = [
      'US_10Y_YIELD', 'US_2Y_YIELD', 'DOLLAR_INDEX_DXY',
      'SOFR_EFFR_SPREAD_BPS', 'COPPER_GOLD_RATIO',
      'GOLD_COMEX_USD', 'US_10Y_TIPS_YIELD', 'CB_GOLD_NET',
    ];

    const [metricsRes, liquidityRes, prevSignalRes] = await Promise.all([
      supabase.from('vw_latest_metrics').select('metric_id, value, z_score').in('metric_id', metricsNeeded),
      supabase.from('global_liquidity_direction').select('regime_label, composite_score, cb_aggregate_wow_pct').order('as_of_date', { ascending: false }).limit(1).single(),
      supabase.from('daily_signal').select('score, regime').order('signal_date', { ascending: false }).limit(1).maybeSingle(),
    ]);

    const metrics = metricsRes.data ?? [];
    const liq = liquidityRes.data;
    const prev = prevSignalRes.data;

    const getVal = (id: string) => Number(metrics.find((m: { metric_id: string; value: number }) => m.metric_id === id)?.value ?? 0);
    const getZ = (id: string) => Number(metrics.find((m: { metric_id: string; z_score: number }) => m.metric_id === id)?.z_score ?? 0);

    // ── 2. Compute signal ────────────────────────────────────────────────
    const signal = computeMacroSignal({
      liquidityRegime: (liq?.regime_label ?? 'NEUTRAL') as 'EXPANDING' | 'NEUTRAL' | 'CONTRACTING',
      liquidityCompositeScore: Number(liq?.composite_score ?? 50),
      liquidityWowPct: Number(liq?.cb_aggregate_wow_pct ?? 0),
      us10yYield: getVal('US_10Y_YIELD') || 4.3,
      us2yYield: getVal('US_2Y_YIELD') || 4.8,
      dxyZScore: getZ('DOLLAR_INDEX_DXY'),
      sofrEffrSpreadBps: getVal('SOFR_EFFR_SPREAD_BPS') || 5,
      copperGoldZScore: getZ('COPPER_GOLD_RATIO'),
    });

    const score_delta = prev ? Math.round((signal.score - prev.score) * 100) / 100 : 0;
    const regime_changed = prev ? signal.regime !== prev.regime : false;

    // ── 3. Generate brief lines ──────────────────────────────────────────
    const regimeEmoji = signal.regime === 'RISK_ON' ? '🟢' : signal.regime === 'RISK_OFF' ? '🔴' : '🟡';
    const deltaStr = score_delta >= 0 ? `+${score_delta.toFixed(1)}` : score_delta.toFixed(1);
    const regime_line = `${regimeEmoji} Regime: ${signal.regime.replace('_', '-')} · Score ${signal.score.toFixed(0)}/100 (${deltaStr} vs yesterday)`;
    const driver_line = `⚡ Key Driver: ${signal.key_driver}`;
    const watch_line = `👁 Watch: ${signal.watch_item}`;
    const liqDir = signal.component_scores.liquidity >= 60 ? 'supportive' : signal.component_scores.liquidity <= 40 ? 'tightening' : 'neutral';
    const ratesDir = signal.component_scores.rates >= 60 ? 'accommodative' : signal.component_scores.rates <= 40 ? 'restrictive' : 'mixed';
    const context_line = `Context: Global liquidity ${liqDir}, policy backdrop ${ratesDir}.`;

    // ── 4. Upsert daily_signal ───────────────────────────────────────────
    const { error: sigError } = await supabase
      .from('daily_signal')
      .upsert({
        signal_date: today,
        regime: signal.regime,
        score: signal.score,
        confidence_pct: signal.confidence_pct,
        score_delta,
        regime_changed,
        key_driver: signal.key_driver,
        watch_item: signal.watch_item,
        component_scores: signal.component_scores,
        computed_at: new Date().toISOString(),
      }, { onConflict: 'signal_date' });

    if (sigError) throw sigError;

    // ── 5. Upsert macro_brief ────────────────────────────────────────────
    await supabase.from('macro_brief').upsert({
      signal_date: today,
      regime_line,
      driver_line,
      watch_line,
      context_line,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'signal_date' });

    // ── 6. Contradiction detection ───────────────────────────────────────
    const goldZ = getZ('GOLD_COMEX_USD');
    const realYield = getVal('US_10Y_TIPS_YIELD');
    const cbGoldYoY = getVal('CB_GOLD_NET');
    const cgZ = getZ('COPPER_GOLD_RATIO');
    const dxyZ = getZ('DOLLAR_INDEX_DXY');
    const us10y = getVal('US_10Y_YIELD') || 4.3;
    const us2y = getVal('US_2Y_YIELD') || 4.8;
    const slope = us10y - us2y;
    const liqRegime = (liq?.regime_label ?? 'NEUTRAL') as string;

    const contradictions: Array<{
      contradiction_key: string;
      title: string;
      interpretation: string;
      severity: ContradictionSeverity;
      metric_a: string;
      metric_b: string;
    }> = [];

    if (goldZ > 1.0 && realYield > 1.5) {
      contradictions.push({
        contradiction_key: 'gold_vs_real_yields',
        title: 'Gold ↑ while Real Yields ↑',
        interpretation: 'Gold is rising despite positive real returns on Treasuries — geopolitical risk premium or de-dollarization demand beyond inflation hedging.',
        severity: goldZ > 2 ? 'EXTREME' : 'NOTABLE',
        metric_a: 'GOLD_COMEX_USD',
        metric_b: 'US_10Y_TIPS_YIELD',
      });
    }

    if (cgZ < -1.0 && us10y < 3.5) {
      contradictions.push({
        contradiction_key: 'copper_vs_easy_rates',
        title: 'Copper/Gold ↓ despite Easy Rates',
        interpretation: 'Growth proxy contracting even as rates remain accommodative — demand destruction that policy may not cure.',
        severity: cgZ < -2 ? 'EXTREME' : 'NOTABLE',
        metric_a: 'COPPER_GOLD_RATIO',
        metric_b: 'US_10Y_YIELD',
      });
    }

    if (slope < -0.25 && liqRegime === 'EXPANDING') {
      contradictions.push({
        contradiction_key: 'inverted_curve_expanding_liquidity',
        title: 'Inverted Curve + CB Easing',
        interpretation: 'Bond market pricing recession while CBs expand balance sheets. Watch IG/HY spread widening for resolution.',
        severity: slope < -0.75 ? 'EXTREME' : 'NOTABLE',
        metric_a: 'US_10Y_YIELD',
        metric_b: 'GLOBAL_CB_BALANCE_SHEET',
      });
    }

    if (dxyZ > 1.5 && cbGoldYoY > 10) {
      contradictions.push({
        contradiction_key: 'strong_dollar_vs_cb_gold',
        title: 'Strong DXY + CB Gold Accumulation',
        interpretation: 'Dollar strength coexists with accelerating sovereign gold accumulation — EM central banks hedging at scale.',
        severity: dxyZ > 2.5 ? 'EXTREME' : 'NOTABLE',
        metric_a: 'DOLLAR_INDEX_DXY',
        metric_b: 'CB_GOLD_NET',
      });
    }

    // Sort and take top 2
    const topContradictions = contradictions
      .sort((a, b) => (a.severity === 'EXTREME' ? -1 : 1) - (b.severity === 'EXTREME' ? -1 : 1))
      .slice(0, 2);

    // Delete old contradictions for today, insert fresh
    await supabase.from('macro_contradictions').delete().eq('signal_date', today);
    if (topContradictions.length > 0) {
      await supabase.from('macro_contradictions').insert(
        topContradictions.map(c => ({ ...c, signal_date: today }))
      );
    }

    // ── 7. Detect significant changes ────────────────────────────────────
    // Compare latest vs yesterday metrics
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const watchMetrics = [
      { id: 'US_10Y_YIELD', label: 'US 10Y Treasury Yield', type: 'yield' },
      { id: 'COPPER_GOLD_RATIO', label: 'Copper/Gold Ratio', type: 'ratio' },
      { id: 'DOLLAR_INDEX_DXY', label: 'US Dollar Index (DXY)', type: 'default' },
      { id: 'SOFR_EFFR_SPREAD_BPS', label: 'SOFR-EFFR Spread', type: 'yield' },
      { id: 'GOLD_COMEX_USD', label: 'Gold Price (COMEX)', type: 'default' },
    ];

    const thresholds: Record<string, { pct: number; abs: number | null }> = {
      yield: { pct: 3, abs: 0.10 },
      liquidity: { pct: 1.5, abs: 100 },
      ratio: { pct: 2, abs: null },
      default: { pct: 5, abs: null },
    };

    const changes: Array<{
      signal_date: string;
      metric_id: string;
      metric_label: string;
      prev_value: number;
      curr_value: number;
      abs_delta: number;
      pct_delta: number;
      significance: string;
      direction: string;
      interpretation: string;
    }> = [];

    for (const m of watchMetrics) {
      const curr = Number(metrics.find((x: { metric_id: string; value: number }) => x.metric_id === m.id)?.value ?? null);
      if (!curr) continue;

      const { data: prevData } = await supabase
        .from('metric_observations')
        .select('value')
        .eq('metric_id', m.id)
        .eq('as_of_date', yesterdayStr)
        .maybeSingle();

      if (!prevData?.value) continue;
      const prev_value = Number(prevData.value);
      const abs_delta = curr - prev_value;
      const pct_delta = (abs_delta / Math.abs(prev_value)) * 100;
      const t = thresholds[m.type] ?? thresholds.default;

      const absHit = t.abs !== null && Math.abs(abs_delta) >= t.abs;
      const pctHit = Math.abs(pct_delta) >= t.pct;
      const halfHit = Math.abs(pct_delta) >= t.pct * 0.5;

      let significance = '';
      if (pctHit || absHit) significance = 'HIGH';
      else if (halfHit) significance = 'MEDIUM';
      else continue;

      const direction = abs_delta > 0 ? 'UP' : 'DOWN';
      changes.push({
        signal_date: today,
        metric_id: m.id,
        metric_label: m.label,
        prev_value,
        curr_value: curr,
        abs_delta,
        pct_delta,
        significance,
        direction,
        interpretation: `${m.label} ${direction === 'UP' ? 'rose' : 'fell'} ${Math.abs(pct_delta).toFixed(2)}% overnight.`,
      });
    }

    // Delete old changes for today, insert fresh
    await supabase.from('daily_changes').delete().eq('signal_date', today);
    if (changes.length > 0) {
      await supabase.from('daily_changes').insert(changes);
    }

    return new Response(JSON.stringify({
      ok: true,
      date: today,
      regime: signal.regime,
      score: signal.score,
      contradictions: topContradictions.length,
      changes: changes.length,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[compute-daily-macro-signal]', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
