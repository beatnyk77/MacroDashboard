export type InstitutionalFreshness = 'observed' | 'lagged' | 'historical' | 'unavailable';

export function indiaInstitutionalFreshness(asOf: string | null, frequency: string, now = new Date()): InstitutionalFreshness {
  if (!asOf) return 'unavailable';
  const ageDays = (now.getTime() - new Date(`${asOf}T00:00:00Z`).getTime()) / 86_400_000;
  if (!Number.isFinite(ageDays) || ageDays < 0) return 'unavailable';
  const normalized = frequency.toLowerCase();
  const [fresh, lagged] = normalized.includes('quarter') ? [120, 240] : normalized.includes('month') ? [45, 90] : normalized.includes('week') ? [9, 21] : [2, 7];
  if (ageDays <= fresh) return 'observed';
  if (ageDays <= lagged) return 'lagged';
  return 'historical';
}
