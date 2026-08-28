import { describe, it, expect } from 'vitest';
import { calculateSqueezeSignal, computePercentile } from '../useCOTPositioning';

describe('useCOTPositioning Calculations', () => {
  it('correctly calculates 3-year percentile ranks', () => {
    const history = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    
    // Minimum value in history
    expect(computePercentile(10, history)).toBe(10);
    
    // Median value in history
    expect(computePercentile(50, history)).toBe(50);
    
    // Maximum value in history
    expect(computePercentile(100, history)).toBe(100);
  });

  it('correctly triggers squeeze alerts at empirical thresholds', () => {
    // 5th percentile or lower -> BULL_SQUEEZE_RISK (Extreme short crowding)
    expect(calculateSqueezeSignal(4.5)).toBe('BULL_SQUEEZE_RISK');
    expect(calculateSqueezeSignal(5.0)).toBe('BULL_SQUEEZE_RISK');

    // 95th percentile or higher -> CROWDED_LONG
    expect(calculateSqueezeSignal(95.0)).toBe('CROWDED_LONG');
    expect(calculateSqueezeSignal(98.2)).toBe('CROWDED_LONG');

    // Moderate positions
    expect(calculateSqueezeSignal(80.0)).toBe('MODERATE_LONG');
    expect(calculateSqueezeSignal(20.0)).toBe('MODERATE_SHORT');

    // Neutral range
    expect(calculateSqueezeSignal(50.0)).toBe('NEUTRAL_RANGE');

    // Null or invalid
    expect(calculateSqueezeSignal(null)).toBe(null);
  });
});
