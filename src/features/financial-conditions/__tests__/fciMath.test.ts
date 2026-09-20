import { describe, it, expect } from 'vitest';
import {
  computeCompositeFCI,
  classifyFCIRegime,
  computeZScore,
} from '../lib/fciMath';

describe('fciMath - Barclays Financial Conditions Index Engine', () => {
  it('computes composite FCI with exact sign conventions', () => {
    // Formula: 1/5 * [ +CS + r10Y - Slope + FX - Equities ]
    // Scenario:
    // CS = +1.0 (spreads wide, tightening)
    // r10Y = +1.0 (real yields high, tightening)
    // Slope = -1.0 (curve inverted, tightening, so -(-1.0) = +1.0)
    // FX = +1.0 (strong USD, tightening)
    // Equities = -1.0 (stocks down, tightening, so -(-1.0) = +1.0)
    // Composite should be: (1 + 1 + 1 + 1 + 1) / 5 = +1.0
    const fci = computeCompositeFCI(1.0, 1.0, -1.0, 1.0, -1.0);
    expect(fci).toBe(1.0);
  });

  it('computes composite FCI for accommodative regime', () => {
    // Accommodative scenario:
    // CS = -1.0 (tight credit spreads)
    // r10Y = -1.0 (low real yields)
    // Slope = +1.0 (steep curve, -1.0)
    // FX = -1.0 (weak USD)
    // Equities = +1.0 (surging stocks, -1.0)
    // Composite should be: (-1 - 1 - 1 - 1 - 1) / 5 = -1.0
    const fci = computeCompositeFCI(-1.0, -1.0, 1.0, -1.0, 1.0);
    expect(fci).toBe(-1.0);
  });

  it('correctly calculates neutral equilibrium', () => {
    const fci = computeCompositeFCI(0, 0, 0, 0, 0);
    expect(fci).toBe(0);
  });

  it('classifies COMMODITY_TIGHTENING regime when both FCI and Commodities are elevated', () => {
    const regime = classifyFCIRegime(0.6, 0.8);
    expect(regime.regime).toBe('COMMODITY_TIGHTENING');
    expect(regime.title).toBe('Commodity-Driven Tightening');
  });

  it('classifies COMMODITY_EASING regime when both FCI and Commodities are collapsed', () => {
    const regime = classifyFCIRegime(-0.5, -0.7);
    expect(regime.regime).toBe('COMMODITY_EASING');
    expect(regime.title).toBe('Commodity Disinflation Easing');
  });

  it('classifies CREDIT_PLUMBING_STRESS when FCI is tight but commodities are subdued', () => {
    const regime = classifyFCIRegime(0.7, -0.4);
    expect(regime.regime).toBe('CREDIT_PLUMBING_STRESS');
    expect(regime.title).toBe('Credit / Plumbing Stress');
  });

  it('classifies LIQUIDITY_EXPANSION when FCI is loose despite high commodities', () => {
    const regime = classifyFCIRegime(-0.6, 0.5);
    expect(regime.regime).toBe('LIQUIDITY_EXPANSION');
    expect(regime.title).toBe('Monetary Liquidity Easing');
  });

  it('classifies NEUTRAL when readings hover near zero', () => {
    const regime = classifyFCIRegime(0.05, 0.1);
    expect(regime.regime).toBe('NEUTRAL');
  });

  it('computes standardized Z-Score correctly', () => {
    const z = computeZScore(12, 10, 2);
    expect(z).toBe(1.0);

    const zeroStd = computeZScore(5, 5, 0);
    expect(zeroStd).toBe(0);
  });
});
