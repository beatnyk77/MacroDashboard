import { describe, it, expect, vi } from 'vitest';
import {
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatDelta,
  formatBillions,
  formatTrillions,
  getSignalLabel,
  formatScaledMetric,
  assertMetricSanityRange
} from '../formatNumber';

describe('formatNumber utilities', () => {
  describe('formatNumber', () => {
    it('should handle null, undefined, and NaN', () => {
      expect(formatNumber(null)).toBe('—');
      expect(formatNumber(undefined)).toBe('—');
      expect(formatNumber(NaN)).toBe('—');
    });

    it('should format standard numbers with default decimals', () => {
      expect(formatNumber(1234.5678)).toBe('1,234.57');
    });

    it('should format compact millions', () => {
      expect(formatNumber(1234567, { notation: 'compact' })).toBe('1.23M');
    });

    it('should format compact billions', () => {
      expect(formatNumber(1234567890, { notation: 'compact' })).toBe('1.23B');
    });

    it('should format compact trillions', () => {
      expect(formatNumber(1234567890123, { notation: 'compact' })).toBe('1.23T');
    });

    it('should respect custom decimal places', () => {
      expect(formatNumber(1234.5678, { decimals: 1 })).toBe('1,234.6');
      expect(formatNumber(1234567, { notation: 'compact', decimals: 3 })).toBe('1.235M');
    });

    it('should add sign when requested', () => {
      expect(formatNumber(123.45, { showSign: true })).toBe('+123.45');
      expect(formatNumber(-123.45, { showSign: true })).toBe('-123.45');
    });

    it('should handle prefixes and suffixes', () => {
      expect(formatNumber(100, { prefix: '$', suffix: ' USD' })).toBe('$100.00 USD');
    });
  });

  describe('formatCurrency', () => {
    it('should default to USD symbol', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });
  });

  describe('formatPercentage', () => {
    it('should add percentage suffix', () => {
      expect(formatPercentage(5.67)).toBe('5.67%');
    });
  });

  describe('formatDelta', () => {
    it('should always show sign', () => {
      expect(formatDelta(2.34)).toBe('+2.34');
      expect(formatDelta(-2.34)).toBe('-2.34');
    });
  });

  describe('formatBillions', () => {
    it('should add B suffix and use standard notation', () => {
      expect(formatBillions(5714)).toBe('5,714.00B');
    });
  });

  describe('formatTrillions', () => {
    it('should add T suffix and use standard notation', () => {
      expect(formatTrillions(1.23)).toBe('1.23T');
    });
  });

  describe('getSignalLabel', () => {
    it('should map status to labels', () => {
      expect(getSignalLabel('safe')).toBe('Stable');
      expect(getSignalLabel('danger')).toBe('Alert');
      expect(getSignalLabel('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('formatScaledMetric', () => {
    it('formats FED_BALANCE_SHEET raw millions as trillions', () => {
      // Raw FRED WALCL value in millions ($6,747,380M = $6.75T)
      expect(formatScaledMetric('FED_BALANCE_SHEET', 6747380)).toBe('6.75T');
    });

    it('formats TGA_BALANCE_BN raw millions as billions', () => {
      // Raw FRED WTREGEN value in millions ($829,620M = $829.62B)
      expect(formatScaledMetric('TGA_BALANCE_BN', 829620)).toBe('829.62B');
    });

    it('returns null for unmapped metric ids', () => {
      expect(formatScaledMetric('SOME_OTHER_METRIC', 12345)).toBeNull();
    });

    it('warns but does not throw when a value is outside the sanity range', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // 500,000M = $0.5T — below the [1, 15] plausible range for Fed balance sheet
      expect(formatScaledMetric('FED_BALANCE_SHEET', 500000)).toBe('0.50T');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      warnSpy.mockRestore();
    });
  });

  describe('assertMetricSanityRange', () => {
    it('does not throw for a plausible FED_BALANCE_SHEET value', () => {
      expect(() => assertMetricSanityRange('FED_BALANCE_SHEET', 6747380)).not.toThrow();
    });

    it('does not throw for a plausible TGA_BALANCE_BN value', () => {
      expect(() => assertMetricSanityRange('TGA_BALANCE_BN', 829620)).not.toThrow();
    });

    it('throws for a FED_BALANCE_SHEET value outside [1, 15]T', () => {
      // 500,000M = $0.5T — implausibly low for the modern Fed balance sheet
      expect(() => assertMetricSanityRange('FED_BALANCE_SHEET', 500000)).toThrow(/outside plausible range/);
    });

    it('throws for a TGA_BALANCE_BN value outside [50, 2000]B', () => {
      // 10,000,000M = $10,000B — implausibly high for the TGA
      expect(() => assertMetricSanityRange('TGA_BALANCE_BN', 10000000)).toThrow(/outside plausible range/);
    });

    it('throws for an unmapped metric id', () => {
      expect(() => assertMetricSanityRange('SOME_OTHER_METRIC', 12345)).toThrow(/no scale config/);
    });
  });
});
