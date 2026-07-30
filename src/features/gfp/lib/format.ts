export function formatBillions(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1000) return `$${(n / 1000).toFixed(digits)}T`;
  return `$${n.toFixed(digits)}B`;
}

export function formatPct(share: number | null | undefined, digits = 1): string {
  if (share == null || Number.isNaN(share)) return '—';
  return `${(share * 100).toFixed(digits)}%`;
}
