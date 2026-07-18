/**
 * Calendar date helpers for market-facing surfaces (morning brief, daily signal).
 * GraphiQuestor treats the "trading day" as America/New_York, not browser local
 * and not raw UTC — so a user in IST after midnight local still sees the ET day.
 */

/** YYYY-MM-DD for America/New_York "now". */
export function marketDateISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** YYYY-MM-DD for N calendar days before a market date (simple UTC-date arithmetic on the ISO string). */
export function marketDateMinusDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() - days);
  return utc.toISOString().slice(0, 10);
}
