import { describe, it, expect } from 'vitest';
import { computeDeltaPct, computePercentile } from '../useCrossAssetRadar';

describe('useCrossAssetRadar Calculations', () => {
  it('correctly calculates percentage deltas', () => {
    // Up move: 100 -> 105 (+5%)
    expect(computeDeltaPct(105, 100)).toBe(5);

    // Down move: 100 -> 98 (-2%)
    expect(computeDeltaPct(98, 100)).toBe(-2);

    // Handling undefined or zero past values
    expect(computeDeltaPct(100, undefined)).toBe(null);
    expect(computeDeltaPct(100, 0)).toBe(null);
  });

  it('correctly calculates 52-week percentile ranks', () => {
    const history = [100, 110, 120, 130, 140, 150];
    
    expect(computePercentile(100, history)).toBe(16.7);
    expect(computePercentile(150, history)).toBe(100);
    expect(computePercentile(125, history)).toBe(50);
  });
});
