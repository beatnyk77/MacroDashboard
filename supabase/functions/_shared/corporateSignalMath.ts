export function calculateCashRunway(cash: number, quarterlyOperatingCashFlow: number): number | null {
  if (!Number.isFinite(cash) || !Number.isFinite(quarterlyOperatingCashFlow) || cash < 0 || quarterlyOperatingCashFlow >= 0) return null;
  return cash / Math.abs(quarterlyOperatingCashFlow);
}

export function calculateDebtWall(
  maturities: Array<{ year: number; amount: number }>,
  cash: number,
): Array<{ year: number; amount: number; cashCoverage: number | null }> {
  return maturities.filter((item) => Number.isFinite(item.year) && Number.isFinite(item.amount)).map((item) => ({
    ...item,
    cashCoverage: cash > 0 ? cash / item.amount : null,
  }));
}

export function calculateWorkingCapitalDays(
  receivables: number,
  inventory: number,
  payables: number,
  revenue: number,
  cogs: number,
): { receivableDays: number; inventoryDays: number; payableDays: number; cashConversionDays: number } | null {
  if ([receivables, inventory, payables, revenue, cogs].some((value) => !Number.isFinite(value)) || revenue <= 0 || cogs <= 0) return null;
  const receivableDays = receivables / revenue * 365;
  const inventoryDays = inventory / cogs * 365;
  const payableDays = payables / cogs * 365;
  return { receivableDays, inventoryDays, payableDays, cashConversionDays: receivableDays + inventoryDays - payableDays };
}

export function calculateCapexImpulse(capexGrowth: number, revenueGrowth: number): number | null {
  if (!Number.isFinite(capexGrowth) || !Number.isFinite(revenueGrowth)) return null;
  return capexGrowth - revenueGrowth;
}

export function calculateInterestCoverageRatio(ebit: number, interestExpense: number): number | null {
  if (!Number.isFinite(ebit) || !Number.isFinite(interestExpense)) return null;
  if (interestExpense <= 0) {
    return ebit >= 0 ? 999.0 : -1.0;
  }
  return ebit / interestExpense;
}

export function calculateProFormaRefiIcr(
  ebit: number,
  totalDebt: number,
  maturingDebt: number,
  existingCoupon: number,
  refiRate: number,
): { proFormaIcr: number; proFormaInterest: number; additionalInterestDrag: number } | null {
  if (
    !Number.isFinite(ebit) ||
    !Number.isFinite(totalDebt) ||
    !Number.isFinite(maturingDebt) ||
    !Number.isFinite(existingCoupon) ||
    !Number.isFinite(refiRate) ||
    totalDebt <= 0
  ) {
    return null;
  }

  const boundedMaturing = Math.max(0, Math.min(totalDebt, maturingDebt));
  const remainingDebt = totalDebt - boundedMaturing;
  const existingInterest = totalDebt * existingCoupon;
  const proFormaInterest = (remainingDebt * existingCoupon) + (boundedMaturing * refiRate);
  const additionalInterestDrag = Math.max(0, proFormaInterest - existingInterest);
  const proFormaIcr = proFormaInterest > 0 ? ebit / proFormaInterest : (ebit >= 0 ? 999.0 : -1.0);

  return { proFormaIcr, proFormaInterest, additionalInterestDrag };
}

export type ZombieTier = 'confirmed_zombie' | 'rollover_zombie' | 'vulnerable' | 'solvent';

export function classifyZombieTier(
  currentIcr: number | null,
  proFormaIcr: number | null,
  cashRunwayQuarters: number | null,
): ZombieTier {
  if (currentIcr !== null && currentIcr < 1.0) {
    return 'confirmed_zombie';
  }
  if (currentIcr !== null && currentIcr >= 1.0 && proFormaIcr !== null && proFormaIcr < 1.0) {
    return 'rollover_zombie';
  }
  if (
    (proFormaIcr !== null && proFormaIcr < 1.75) ||
    (cashRunwayQuarters !== null && cashRunwayQuarters < 4)
  ) {
    return 'vulnerable';
  }
  return 'solvent';
}
