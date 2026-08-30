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
