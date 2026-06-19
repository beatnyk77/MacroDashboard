export function formatStaleness(flag: string | null | undefined): string {
  switch (flag) {
    case 'fresh':
      return 'fresh';
    case 'lagged':
      return 'lagged';
    case 'very_lagged':
      return 'very_lagged';
    default:
      return 'unknown';
  }
}

export function formatNumber(value: number | null | undefined, digits = 2): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Number(value.toFixed(digits));
}

export function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function joinUrl(base: string, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base.replace(/\/$/, '')}${normalized}`;
}