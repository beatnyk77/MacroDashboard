/**
 * Macro Signal Engine
 * Pure deterministic scoring logic — no external imports, no side effects.
 * Used by the Edge Function and the client-side fallback hook.
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export type MacroRegime = 'RISK_ON' | 'NEUTRAL' | 'RISK_OFF';
export type ContradictionSeverity = 'NOTABLE' | 'EXTREME';

export interface ComponentScores {
  liquidity: number; // 0–100
  rates: number;     // 0–100
  dollar: number;    // 0–100
  vol: number;       // 0–100
  metals: number;    // 0–100
}

export interface MacroSignalResult {
  regime: MacroRegime;
  score: number;
  confidence_pct: number;
  key_driver: string;
  watch_item: string;
  component_scores: ComponentScores;
}

export interface ContradictionResult {
  contradiction_key: string;
  title: string;
  interpretation: string;
  severity: ContradictionSeverity;
  metric_a: string;
  metric_b: string;
}

// ─── Input contract ────────────────────────────────────────────────────────

export interface SignalInputs {
  /** From global_liquidity_direction */
  liquidityRegime: 'EXPANDING' | 'NEUTRAL' | 'CONTRACTING';
  liquidityCompositeScore: number; // 0–100 native composite
  liquidityWowPct: number;         // cb_aggregate_wow_pct

  /** From yield_curves — US 10Y and 2Y spread */
  us10yYield: number;  // percentage e.g. 4.35
  us2yYield: number;

  /** DXY z-score (from metric_observations DOLLAR_INDEX_DXY) */
  dxyZScore: number;

  /** SOFR-EFFR spread bps (from useNetLiquidity) */
  sofrEffrSpreadBps: number;

  /** From useCopperGoldRatio */
  copperGoldZScore: number;
  copperGoldStatus: 'safe' | 'warning' | 'danger' | 'neutral';

  /** From useGoldRatios — DEBT/Gold z-score */
  debtGoldZScore: number;

  /** For contradiction detection */
  goldPriceZScore: number;         // from ratio data or vw_latest_metrics
  realYieldPct: number;            // 10Y TIPS yield
  cbGoldBuyingYoYPct: number;      // cb_gold_net yoy pct
}

// ─── Sub-scorers ───────────────────────────────────────────────────────────

/** Clamp a value between min and max */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Sigmoid normalizer: maps z-score to 0–100
 * z=0 → 50, z=+2 → ~88, z=-2 → ~12
 */
function sigmoidNorm(zScore: number): number {
  const sigmoid = 1 / (1 + Math.exp(-zScore));
  return clamp(sigmoid * 100, 0, 100);
}

/**
 * LIQUIDITY SCORE (weight 0.30)
 * Based on global liquidity regime and weekly momentum.
 */
export function computeLiquidityScore(
  regime: 'EXPANDING' | 'NEUTRAL' | 'CONTRACTING',
  compositeScore: number,
  wowPct: number
): number {
  let base: number;
  if (regime === 'EXPANDING') base = 68;
  else if (regime === 'NEUTRAL') base = 50;
  else base = 30; // CONTRACTING

  // Modulate ±15 based on compositeScore (0-100 native)
  const compositeAdj = ((compositeScore - 50) / 50) * 15;

  // Modulate ±8 based on weekly momentum
  const momentumAdj = clamp(wowPct * 2, -8, 8);

  return clamp(base + compositeAdj + momentumAdj, 5, 95);
}

/**
 * RATES SCORE (weight 0.25)
 * Based on yield curve slope + 10Y level.
 * Steep positive curve + low rates = risk-on.
 */
export function computeRatesScore(us10y: number, us2y: number): number {
  const slope = us10y - us2y; // positive = normal, negative = inverted
  let base = 50;

  // Curve shape
  if (slope > 0.75) base += 20;
  else if (slope > 0.25) base += 10;
  else if (slope < -0.50) base -= 20;
  else if (slope < 0) base -= 10;

  // Level — very high rates = restrictive
  if (us10y < 3.0) base += 12;
  else if (us10y < 3.75) base += 5;
  else if (us10y > 5.5) base -= 18;
  else if (us10y > 4.75) base -= 8;

  return clamp(base, 5, 95);
}

/**
 * DOLLAR SCORE (weight 0.20)
 * Strong dollar = tighter global financial conditions = risk-off.
 * Inverted: high DXY z-score → lower risk-on score.
 */
export function computeDollarScore(dxyZScore: number): number {
  // Invert: multiply by -1 before sigmoid
  return clamp(sigmoidNorm(-dxyZScore * 1.2), 5, 95);
}

/**
 * VOL SCORE (weight 0.15)
 * Uses SOFR-EFFR spread as a short-rate stress proxy.
 */
export function computeVolScore(sofrEffrSpreadBps: number): number {
  if (sofrEffrSpreadBps <= 3) return 82;
  if (sofrEffrSpreadBps <= 8) return 65;
  if (sofrEffrSpreadBps <= 15) return 48;
  if (sofrEffrSpreadBps <= 25) return 32;
  return 15;
}

/**
 * METALS SCORE (weight 0.10)
 * Copper/Gold ratio is a real-time growth vs safety proxy.
 */
export function computeMetalsScore(
  cgZScore: number,
  cgStatus: 'safe' | 'warning' | 'danger' | 'neutral'
): number {
  const statusBase: Record<string, number> = {
    safe: 75,
    neutral: 50,
    warning: 30,
    danger: 10,
  };
  const base = statusBase[cgStatus] ?? 50;
  const zAdj = clamp(cgZScore * 8, -20, 20);
  return clamp(base + zAdj, 5, 95);
}

// ─── Composite scorer ──────────────────────────────────────────────────────

const WEIGHTS = {
  liquidity: 0.30,
  rates: 0.25,
  dollar: 0.20,
  vol: 0.15,
  metals: 0.10,
} as const;

export function computeMacroSignal(inputs: SignalInputs): MacroSignalResult {
  const liq = computeLiquidityScore(
    inputs.liquidityRegime,
    inputs.liquidityCompositeScore,
    inputs.liquidityWowPct
  );
  const rates = computeRatesScore(inputs.us10yYield, inputs.us2yYield);
  const dollar = computeDollarScore(inputs.dxyZScore);
  const vol = computeVolScore(inputs.sofrEffrSpreadBps);
  const metals = computeMetalsScore(inputs.copperGoldZScore, inputs.copperGoldStatus);

  const component_scores: ComponentScores = { liquidity: liq, rates, dollar, vol, metals };

  const score = clamp(
    liq * WEIGHTS.liquidity +
    rates * WEIGHTS.rates +
    dollar * WEIGHTS.dollar +
    vol * WEIGHTS.vol +
    metals * WEIGHTS.metals,
    0,
    100
  );

  // Regime thresholds
  const regime: MacroRegime =
    score >= 60 ? 'RISK_ON' :
    score <= 40 ? 'RISK_OFF' :
    'NEUTRAL';

  // Confidence = how many sub-scores agree with the composite direction
  const bullish = score >= 50;
  const agreements = [liq, rates, dollar, vol, metals].filter(s =>
    bullish ? s >= 50 : s < 50
  ).length;
  const confidence_pct = clamp(50 + agreements * 8, 50, 90);

  // Key driver = sub-score furthest from neutral (50), weighted
  const weighted: [keyof ComponentScores, number][] = [
    ['liquidity', Math.abs(liq - 50) * WEIGHTS.liquidity],
    ['rates', Math.abs(rates - 50) * WEIGHTS.rates],
    ['dollar', Math.abs(dollar - 50) * WEIGHTS.dollar],
    ['vol', Math.abs(vol - 50) * WEIGHTS.vol],
    ['metals', Math.abs(metals - 50) * WEIGHTS.metals],
  ];
  weighted.sort((a, b) => b[1] - a[1]);
  const topDriver = weighted[0][0];

  const DRIVER_LABELS: Record<keyof ComponentScores, string> = {
    liquidity: 'Global Liquidity Conditions',
    rates: 'Yield Curve & Rate Levels',
    dollar: 'US Dollar Strength (DXY)',
    vol: 'Funding Market Stress',
    metals: 'Copper/Gold Growth Proxy',
  };
  const key_driver = DRIVER_LABELS[topDriver];

  // Watch item (second most impactful driver)
  const secondDriver = weighted[1][0];
  const WATCH_LABELS: Record<keyof ComponentScores, string> = {
    liquidity: 'CB balance sheet trajectory',
    rates: 'Next Treasury auction BTC + 10Y breakeven',
    dollar: 'DXY pivot vs EM FX moves',
    vol: 'SOFR-EFFR spread & repo market',
    metals: 'Copper/Gold ratio vs PMI trend',
  };
  const watch_item = WATCH_LABELS[secondDriver];

  return { regime, score: Math.round(score * 100) / 100, confidence_pct: Math.round(confidence_pct * 10) / 10, key_driver, watch_item, component_scores };
}

// ─── Contradiction detector ────────────────────────────────────────────────

export function detectContradictions(inputs: SignalInputs): ContradictionResult[] {
  const results: ContradictionResult[] = [];

  // 1. Gold rising while real yields also rising
  if (inputs.goldPriceZScore > 1.0 && inputs.realYieldPct > 1.5) {
    results.push({
      contradiction_key: 'gold_vs_real_yields',
      title: 'Gold ↑ while Real Yields ↑',
      interpretation:
        'Gold is rising despite positive real returns on Treasuries — suggests a geopolitical risk premium or de-dollarization demand beyond inflation hedging.',
      severity: inputs.goldPriceZScore > 2 ? 'EXTREME' : 'NOTABLE',
      metric_a: 'GOLD_COMEX_USD',
      metric_b: 'US_10Y_TIPS_YIELD',
    });
  }

  // 2. Copper/Gold declining while rates are easy
  if (inputs.copperGoldZScore < -1.0 && inputs.us10yYield < 3.5) {
    results.push({
      contradiction_key: 'copper_vs_easy_rates',
      title: 'Copper/Gold ↓ despite Easy Rates',
      interpretation:
        'The growth proxy (Copper/Gold) is contracting even as rates remain accommodative — signals demand destruction that policy may not cure.',
      severity: inputs.copperGoldZScore < -2 ? 'EXTREME' : 'NOTABLE',
      metric_a: 'COPPER_GOLD_RATIO',
      metric_b: 'US_10Y_YIELD',
    });
  }

  // 3. Liquidity contracting but copper/gold still 'safe'
  if (inputs.liquidityRegime === 'CONTRACTING' && inputs.copperGoldStatus === 'safe') {
    results.push({
      contradiction_key: 'liquidity_vs_growth_proxy',
      title: 'Liquidity Draining but Growth Proxy Bullish',
      interpretation:
        'Global central bank liquidity is contracting, yet Copper/Gold remains elevated. Liquidity leads risk assets by 6–12 months; this gap typically resolves downward.',
      severity: 'NOTABLE',
      metric_a: 'GLOBAL_LIQUIDITY',
      metric_b: 'COPPER_GOLD_RATIO',
    });
  }

  // 4. Inverted curve + expanding CB liquidity
  const slope = inputs.us10yYield - inputs.us2yYield;
  if (slope < -0.25 && inputs.liquidityRegime === 'EXPANDING') {
    results.push({
      contradiction_key: 'inverted_curve_expanding_liquidity',
      title: 'Inverted Curve + CB Easing',
      interpretation:
        'The bond market is pricing recession while central banks are expanding balance sheets. Credit spreads are the arbiter — watch IG/HY spread widening for resolution.',
      severity: slope < -0.75 ? 'EXTREME' : 'NOTABLE',
      metric_a: 'US_10Y_YIELD',
      metric_b: 'GLOBAL_CB_BALANCE_SHEET',
    });
  }

  // 5. Strong dollar + accelerating CB gold buying
  if (inputs.dxyZScore > 1.5 && inputs.cbGoldBuyingYoYPct > 10) {
    results.push({
      contradiction_key: 'strong_dollar_vs_cb_gold',
      title: 'Strong DXY + Central Banks Buying Gold',
      interpretation:
        'Dollar strength coexists with accelerating sovereign gold accumulation. Historically precedes major dollar regime shifts; EM central banks are hedging at scale.',
      severity: inputs.dxyZScore > 2.5 ? 'EXTREME' : 'NOTABLE',
      metric_a: 'DOLLAR_INDEX_DXY',
      metric_b: 'CB_GOLD_NET',
    });
  }

  // Return top 2 by severity (EXTREME first, then NOTABLE)
  return results
    .sort((a, b) => (a.severity === 'EXTREME' ? -1 : 1) - (b.severity === 'EXTREME' ? -1 : 1))
    .slice(0, 2);
}

// ─── Brief generator ───────────────────────────────────────────────────────

export function generateMacroBrief(
  signal: MacroSignalResult,
  scoreDelta: number
): { regime_line: string; driver_line: string; watch_line: string; context_line: string } {
  const regimeEmoji = signal.regime === 'RISK_ON' ? '🟢' : signal.regime === 'RISK_OFF' ? '🔴' : '🟡';
  const deltaStr = scoreDelta >= 0 ? `+${scoreDelta.toFixed(1)}` : scoreDelta.toFixed(1);
  const dirStr = scoreDelta > 1 ? ' ↑' : scoreDelta < -1 ? ' ↓' : '';

  const regime_line = `${regimeEmoji} Regime: ${signal.regime.replace('_', '-')} · Score ${signal.score.toFixed(0)}/100 (${deltaStr} vs yesterday)${dirStr} · Confidence ${signal.confidence_pct.toFixed(0)}%`;

  const driver_line = `⚡ Key Driver: ${signal.key_driver} (${signal.component_scores[Object.keys(signal.component_scores).reduce((a, b) =>
    (signal.component_scores[a as keyof ComponentScores] > signal.component_scores[b as keyof ComponentScores] ? a : b)) as keyof ComponentScores].toFixed(0)}/100)`;

  const watch_line = `👁 Watch: ${signal.watch_item}`;

  const liqDir = signal.component_scores.liquidity >= 60 ? 'supportive' : signal.component_scores.liquidity <= 40 ? 'tightening' : 'neutral';
  const ratesDir = signal.component_scores.rates >= 60 ? 'accommodative' : signal.component_scores.rates <= 40 ? 'restrictive' : 'mixed';
  const context_line = `Context: Global liquidity ${liqDir}, policy backdrop ${ratesDir} — dollar and metals in ${signal.component_scores.dollar >= 55 ? 'risk-off' : signal.component_scores.dollar <= 45 ? 'risk-on' : 'neutral'} configuration.`;

  return { regime_line, driver_line, watch_line, context_line };
}

// ─── Change detection ──────────────────────────────────────────────────────

export type ChangeSignificance = 'HIGH' | 'MEDIUM';

export interface ChangeInput {
  metric_id: string;
  metric_label: string;
  curr_value: number;
  prev_value: number;
  metric_type: 'yield' | 'liquidity' | 'ratio' | 'default';
}

interface ChangeThreshold {
  pctThreshold: number;
  absThreshold: number | null;
}

const THRESHOLDS: Record<string, ChangeThreshold> = {
  yield: { pctThreshold: 3, absThreshold: 0.10 },       // 10bps on a yield
  liquidity: { pctThreshold: 1.5, absThreshold: 100 },   // $100B on net liquidity
  ratio: { pctThreshold: 2, absThreshold: null },
  default: { pctThreshold: 5, absThreshold: null },
};

export interface DetectedChange {
  metric_id: string;
  metric_label: string;
  prev_value: number;
  curr_value: number;
  abs_delta: number;
  pct_delta: number;
  significance: ChangeSignificance;
  direction: 'UP' | 'DOWN' | 'FLAT';
  interpretation: string;
}

export function detectChange(input: ChangeInput): DetectedChange | null {
  if (!input.prev_value || input.prev_value === 0) return null;

  const abs_delta = input.curr_value - input.prev_value;
  const pct_delta = (abs_delta / Math.abs(input.prev_value)) * 100;
  const t = THRESHOLDS[input.metric_type] ?? THRESHOLDS.default;

  const absHit = t.absThreshold !== null && Math.abs(abs_delta) >= t.absThreshold;
  const pctHit = Math.abs(pct_delta) >= t.pctThreshold;
  const halfPctHit = Math.abs(pct_delta) >= t.pctThreshold * 0.5;

  let significance: ChangeSignificance | null = null;
  if (pctHit || absHit) significance = 'HIGH';
  else if (halfPctHit) significance = 'MEDIUM';

  if (!significance) return null;

  const direction: 'UP' | 'DOWN' | 'FLAT' = abs_delta > 0 ? 'UP' : abs_delta < 0 ? 'DOWN' : 'FLAT';

  return {
    metric_id: input.metric_id,
    metric_label: input.metric_label,
    prev_value: input.prev_value,
    curr_value: input.curr_value,
    abs_delta,
    pct_delta,
    significance,
    direction,
    interpretation: buildChangeInterpretation(input, pct_delta, direction),
  };
}

function buildChangeInterpretation(
  input: ChangeInput,
  pctDelta: number,
  direction: 'UP' | 'DOWN' | 'FLAT'
): string {
  const sign = direction === 'UP' ? 'rose' : 'fell';
  const pctStr = Math.abs(pctDelta).toFixed(1);

  const context: Record<string, Record<string, string>> = {
    COPPER_GOLD_RATIO: {
      UP: 'Growth proxy strengthening — markets pricing re-acceleration.',
      DOWN: 'Growth proxy weakening — recessionary signal building.',
    },
    US_10Y_YIELD: {
      UP: 'Longer-duration financing costs rising; watch mortgage and IG spread repricing.',
      DOWN: 'Safe-haven bid or growth concern; watch equity risk premium compression.',
    },
  };

  const specific = context[input.metric_id]?.[direction];
  if (specific) return specific;

  return `${input.metric_label} ${sign} ${pctStr}% overnight.`;
}
