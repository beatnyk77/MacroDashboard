import type { FreshnessStatus } from '@/components/FreshnessChip';

/** Returns true on UTC Saturday (6) or Sunday (0). */
export function isMarketWeekend(): boolean {
    const day = new Date().getUTCDay();
    return day === 0 || day === 6;
}

/**
 * Returns the "expected" maximum lag in hours before we should consider
 * a staleness event genuinely alarming.
 */
export function getExpectedLagHours(): number {
    if (isMarketWeekend()) return 72;
    const hour = new Date().getUTCHours();
    if (hour < 10) return 14;
    return 8;
}

/** Hours elapsed since lastUpdated relative to now. */
export function getDataAgeHours(lastUpdated: string | Date): number {
    const updateDate = new Date(lastUpdated);
    if (isNaN(updateDate.getTime())) return Number.POSITIVE_INFINITY;
    return (Date.now() - updateDate.getTime()) / (1000 * 60 * 60);
}

/**
 * Returns the next Monday at 02:30 UTC as a compact string,
 * e.g. "Mon 02:30 UTC".
 */
export function nextMondayRefreshLabel(): string {
    const now = new Date();
    const day = now.getUTCDay();
    const daysUntilMon = day === 0 ? 1 : 7 - day + 1;
    const mon = new Date(now);
    mon.setUTCDate(now.getUTCDate() + daysUntilMon);
    mon.setUTCHours(2, 30, 0, 0);
    return `Mon ${mon.getUTCHours().toString().padStart(2, '0')}:${mon.getUTCMinutes().toString().padStart(2, '0')} UTC`;
}

const WEEKEND_FRESHNESS_GRACE_HOURS = 72;

/**
 * On weekends, overdue feeds younger than 72h are expected — show a scheduled
 * refresh label instead of alarming overdue state.
 */
export function resolveWeekendFreshness(
    status: FreshnessStatus,
    lastUpdated: string | Date,
): { status: FreshnessStatus; label?: string } {
    if (
        isMarketWeekend() &&
        status === 'overdue' &&
        getDataAgeHours(lastUpdated) < WEEKEND_FRESHNESS_GRACE_HOURS
    ) {
        return { status: 'weekend', label: 'WEEKEND · Refreshes Mon' };
    }
    return { status };
}