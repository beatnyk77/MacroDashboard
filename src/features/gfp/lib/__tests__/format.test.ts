import { describe, it, expect } from 'vitest';
import { formatBillions, formatCashDollars, formatPct } from '../format';

describe('formatBillions', () => {
  it('formats billions and trillions', () => {
    expect(formatBillions(12.34)).toBe('$12.3B');
    expect(formatBillions(1500)).toBe('$1.5T');
  });

  it('handles null/NaN', () => {
    expect(formatBillions(null)).toBe('—');
    expect(formatBillions(undefined)).toBe('—');
    expect(formatBillions(Number.NaN)).toBe('—');
  });
});

describe('formatCashDollars', () => {
  it('formats raw dollars into M/B/T', () => {
    expect(formatCashDollars(1_200_000)).toBe('$1.2M');
    expect(formatCashDollars(3_400_000_000)).toBe('$3.4B');
    expect(formatCashDollars(1_100_000_000_000)).toBe('$1.1T');
  });

  it('formats smaller magnitudes', () => {
    expect(formatCashDollars(4_500)).toBe('$4.5K');
    expect(formatCashDollars(42)).toBe('$42');
  });

  it('preserves sign for negatives', () => {
    expect(formatCashDollars(-2_500_000_000)).toBe('-$2.5B');
    expect(formatCashDollars(-900_000)).toBe('-$900.0K');
    expect(formatCashDollars(-1_200_000)).toBe('-$1.2M');
  });

  it('handles null/NaN', () => {
    expect(formatCashDollars(null)).toBe('—');
    expect(formatCashDollars(undefined)).toBe('—');
    expect(formatCashDollars(Number.NaN)).toBe('—');
  });

  it('does not treat raw dollars as already-billions', () => {
    // $50B cash outlay would be mislabeled as $50.0B if passed to formatBillions
    // as raw 5e10 → formatBillions would show $50000000000.0B
    expect(formatCashDollars(50_000_000_000)).toBe('$50.0B');
    expect(formatBillions(50_000_000_000)).not.toBe('$50.0B');
  });
});

describe('formatPct', () => {
  it('formats share as percent', () => {
    expect(formatPct(0.72)).toBe('72.0%');
    expect(formatPct(null)).toBe('—');
  });
});
