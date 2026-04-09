import { describe, it, expect } from 'vitest';
import { formatMetric, formatDelta, formatCompact } from '../formatMetric';

describe('formatMetric utilities', () => {
  describe('formatMetric', () => {
    it('should handle null, undefined, and NaN', () => {
      expect(formatMetric(null, 'number')).toBe('—');
      expect(formatMetric(undefined, 'number')).toBe('—');
      expect(formatMetric(NaN, 'number')).toBe('—');
    });

    it('should format trillions with unit', () => {
      expect(formatMetric(1.234, 'trillion')).toBe('1.23 T');
    });

    it('should format billions with unit', () => {
      expect(formatMetric(123.45, 'billion')).toBe('123.45 B');
    });

    it('should format percentages', () => {
      expect(formatMetric(5.67, 'percent')).toBe('5.67 %');
    });

    it('should format bps', () => {
      expect(formatMetric(12.5, 'bps')).toBe('12.5 bps');
    });

    it('should respect custom decimals', () => {
      expect(formatMetric(1.2345, 'trillion', { decimals: 3 })).toBe('1.235 T');
    });

    it('should work without unit', () => {
      expect(formatMetric(1.23, 'percent', { showUnit: false })).toBe('1.23');
    });

    it('should support prefixes', () => {
      expect(formatMetric(1.23, 'currency', { prefix: '$' })).toBe('$1.23');
    });
  });

  describe('formatDelta', () => {
    it('should format positive delta with up arrow', () => {
      expect(formatDelta(1.23)).toBe('↗ 1.23');
    });

    it('should format negative delta with down arrow', () => {
      expect(formatDelta(-1.23)).toBe('↘ 1.23');
    });

    it('should return null for delta below threshold', () => {
      expect(formatDelta(0.000001)).toBeNull();
    });

    it('should include unit if provided', () => {
      expect(formatDelta(1.23, { unit: '%' })).toBe('↗ 1.23 %');
    });
  });

  describe('formatCompact', () => {
    it('should format large numbers compactly', () => {
      expect(formatCompact(1.5e12)).toBe('1.50 T');
      expect(formatCompact(2.3e9)).toBe('2.30 B');
      expect(formatCompact(4.5e6)).toBe('4.50 M');
      expect(formatCompact(123.45)).toBe('123.45');
    });

    it('should handle negative numbers', () => {
      expect(formatCompact(-1.5e12)).toBe('-1.50 T');
    });
  });
});
