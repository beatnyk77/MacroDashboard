import { describe, expect, it } from 'vitest';
import {
  calculateCapexImpulse,
  calculateCashRunway,
  calculateDebtWall,
  calculateInterestCoverageRatio,
  calculateProFormaRefiIcr,
  calculateWorkingCapitalDays,
  classifyZombieTier,
} from './corporateSignalMath.ts';

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

  it('calculates interest coverage ratio (ICR)', () => {
    expect(calculateInterestCoverageRatio(120, 100)).toBeCloseTo(1.2);
    expect(calculateInterestCoverageRatio(80, 100)).toBeCloseTo(0.8);
    expect(calculateInterestCoverageRatio(100, 0)).toBe(999.0);
    expect(calculateInterestCoverageRatio(-50, 0)).toBe(-1.0);
    expect(calculateInterestCoverageRatio(NaN, 100)).toBeNull();
  });

  it('calculates pro-forma refinancing shock ICR and interest drag', () => {
    // Company with $1000M debt, $400M maturing <2Y, legacy coupon 4% (0.04), refi rate 8% (0.08), EBIT $50M
    // Existing interest = 1000 * 0.04 = $40M -> Current ICR = 50 / 40 = 1.25x
    // Pro-forma interest = (600 * 0.04) + (400 * 0.08) = 24 + 32 = $56M
    // Pro-forma ICR = 50 / 56 = 0.8928x (flips to zombie!)
    // Additional interest drag = 56 - 40 = $16M
    const result = calculateProFormaRefiIcr(50, 1000, 400, 0.04, 0.08);
    expect(result).not.toBeNull();
    expect(result!.proFormaInterest).toBeCloseTo(56);
    expect(result!.proFormaIcr).toBeCloseTo(50 / 56);
    expect(result!.additionalInterestDrag).toBeCloseTo(16);
  });

  it('classifies corporate zombie tiers deterministically', () => {
    // Current ICR < 1.0 -> Confirmed Zombie
    expect(classifyZombieTier(0.8, 0.5, 6)).toBe('confirmed_zombie');

    // Current ICR >= 1.0 but Pro-Forma ICR < 1.0 -> Rollover Zombie
    expect(classifyZombieTier(1.25, 0.89, 8)).toBe('rollover_zombie');

    // Pro-Forma ICR between 1.0 and 1.75 or low cash runway -> Vulnerable
    expect(classifyZombieTier(1.8, 1.4, 6)).toBe('vulnerable');
    expect(classifyZombieTier(2.5, 2.0, 3)).toBe('vulnerable');

    // Pro-Forma ICR >= 1.75 and Cash Runway >= 8 -> Solvent
    expect(classifyZombieTier(4.0, 3.2, 12)).toBe('solvent');
  });
});
