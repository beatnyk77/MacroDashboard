import { describe, expect, it } from 'vitest';
import { calculateCapexImpulse, calculateCashRunway, calculateDebtWall, calculateWorkingCapitalDays } from './corporateSignalMath.ts';

describe('corporate signal math', () => {
  it('calculates cash runway only for cash burn', () => {
    expect(calculateCashRunway(100, -25)).toBe(4);
    expect(calculateCashRunway(100, 25)).toBeNull();
  });
  it('calculates debt wall cash coverage', () => {
    expect(calculateDebtWall([{ year: 2027, amount: 50 }], 100)).toEqual([{ year: 2027, amount: 50, cashCoverage: 2 }]);
  });
  it('calculates working capital days and cash conversion', () => {
    expect(calculateWorkingCapitalDays(10, 20, 5, 100, 100)).toEqual({ receivableDays: 36.5, inventoryDays: 73, payableDays: 18.25, cashConversionDays: 91.25 });
  });
  it('calculates capex growth less revenue growth', () => {
    expect(calculateCapexImpulse(0.3, 0.1)).toBeCloseTo(0.2);
  });
});
