import { describe, it, expect } from 'vitest';
import { 
  formatNumber, 
  formatCurrency, 
  formatPercentage, 
  formatDelta, 
  formatBillions, 
  formatTrillions,
  getSignalLabel 
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
});
