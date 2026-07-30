/** Format values already in $ billions (accrual FRUSG units). */
export function formatBillions(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1000) return `$${(n / 1000).toFixed(digits)}T`;
  return `$${n.toFixed(digits)}B`;
}

/**
 * Format raw dollar amounts (MTS cash outlays / receipts) into compact units.
 * MTS stores net outlays in dollars, not billions — do not pass these to formatBillions.
 */
export function formatCashDollars(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(digits)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(digits)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(digits)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(digits)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function formatPct(share: number | null | undefined, digits = 1): string {
  if (share == null || Number.isNaN(share)) return '—';
  return `${(share * 100).toFixed(digits)}%`;
}
