/**
 * fciMath.ts
 *
 * Core mathematical engine for the Barclays Financial Conditions Index (FCI)
 * and the Commodities Cycle.
 *
 * Formula:
 * FCI_t = 1/5 * [ Z(CS) + Z(r10Y) - Z(Slope) + Z(FX) - Z(Equities) ]
 *
 * Directional convention:
 * Positive (> 0) = Tight / Restrictive Financial Conditions
 * Negative (< 0) = Loose / Accommodative Financial Conditions
 */

export interface FCIPoint {
  date: string;
  fci: number;
  commodityCycle: number;
  csZScore?: number;
  r10yZScore?: number;
  slopeZScore?: number;
  fxZScore?: number;
  equityZScore?: number;
}

export type FCIRegimeType =
  | 'COMMODITY_TIGHTENING'
  | 'COMMODITY_EASING'
  | 'CREDIT_PLUMBING_STRESS'
  | 'LIQUIDITY_EXPANSION'
  | 'NEUTRAL';

export interface FCIRegimeInfo {
  regime: FCIRegimeType;
  title: string;
  badgeColor: string;
  description: string;
}

export function classifyFCIRegime(fci: number, commodityCycle: number): FCIRegimeInfo {
  if (fci > 0.2 && commodityCycle > 0.2) {
    return {
      regime: 'COMMODITY_TIGHTENING',
      title: 'Commodity-Driven Tightening',
      badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
      description: 'Commodity cost-push pressures are actively feeding into real yields and credit spreads, mechanically restricting financial conditions.',
    };
  }

  if (fci < -0.2 && commodityCycle < -0.2) {
    return {
      regime: 'COMMODITY_EASING',
      title: 'Commodity Disinflation Easing',
      badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
      description: 'Collapsing raw material and energy prices are relieving central bank rate pressures and loosening global financial conditions.',
    };
  }

  if (fci > 0.2 && commodityCycle <= 0.2) {
    return {
      regime: 'CREDIT_PLUMBING_STRESS',
      title: 'Credit / Plumbing Stress',
      badgeColor: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
      description: 'Financial conditions are restrictive despite quiescent commodities, driven primarily by credit spread blowout, bank funding stress, or sovereign supply.',
    };
  }

  if (fci < -0.2 && commodityCycle >= -0.2) {
    return {
      regime: 'LIQUIDITY_EXPANSION',
      title: 'Monetary Liquidity Easing',
      badgeColor: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
      description: 'Central bank balance sheet expansion and market risk appetite are keeping conditions loose despite firm commodity prices.',
    };
  }

  return {
    regime: 'NEUTRAL',
    title: 'Balanced / Neutral Transmission',
    badgeColor: 'border-slate-500/30 text-slate-300 bg-slate-500/10',
    description: 'Financial conditions and commodity impulses are oscillating near multi-year equilibrium averages.',
  };
}

export function computeCompositeFCI(
  csZ: number,
  r10yZ: number,
  slopeZ: number,
  fxZ: number,
  equityZ: number
): number {
  // Sign convention (+ = Tightening):
  // + Credit Spreads
  // + Real 10Y TIPS Yield
  // - Curve Slope (flattening/inversion = tightening)
  // + Broad Dollar Strength
  // - Equity Returns (drops = tightening)
  const composite = (csZ + r10yZ - slopeZ + fxZ - equityZ) / 5;
  return Math.round(composite * 100) / 100;
}

export function computeZScore(value: number, mean: number, std: number): number {
  if (std === 0) return 0;
  return (value - mean) / std;
}
