/**
 * Derivations for the EIA weekly balance desk. Pure functions over weekly observations so the
 * 5-year band, deviation and days-of-cover arithmetic are testable without the database.
 */

export interface WeeklyPoint {
    /** Week-ending date, YYYY-MM-DD. */
    date: string;
    value: number;
}

export interface FiveYearBand {
    min: number;
    max: number;
    avg: number;
    /** Prior years that had a print within the match window (3 to 5). */
    years: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** EIA weeks end on a Friday, but holiday weeks can shift a print; match within three days. */
const MATCH_WINDOW_DAYS = 3;
const MIN_YEARS = 3;

const toUtc = (date: string) => new Date(`${date}T00:00:00Z`).getTime();

function sameDayInYear(date: string, yearsBack: number): number {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCFullYear(d.getUTCFullYear() - yearsBack);
    return d.getTime();
}

/**
 * Min / max / average of the same week in each of the five calendar years before `date`'s year
 * (the current year is excluded). Null when fewer than three of those years have a print.
 */
export function fiveYearBand(series: WeeklyPoint[], date: string): FiveYearBand | null {
    const values: number[] = [];
    for (let back = 1; back <= 5; back += 1) {
        const target = sameDayInYear(date, back);
        let best: WeeklyPoint | null = null;
        let bestGap = Infinity;
        for (const p of series) {
            const gap = Math.abs(toUtc(p.date) - target) / DAY_MS;
            if (gap <= MATCH_WINDOW_DAYS && gap < bestGap) {
                best = p;
                bestGap = gap;
            }
        }
        if (best) values.push(best.value);
    }
    if (values.length < MIN_YEARS) return null;
    return {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        years: values.length,
    };
}

/** Sorts ascending by date without mutating the input. */
export function sortAsc(series: WeeklyPoint[]): WeeklyPoint[] {
    return [...series].sort((a, b) => a.date.localeCompare(b.date));
}

export interface LatestVsBand {
    date: string;
    value: number;
    /** Change from the previous weekly print; null when there is none. */
    weeklyChange: number | null;
    band: FiveYearBand | null;
    /** value minus the 5-year average, in the series' own unit. */
    deviation: number | null;
    deviationPct: number | null;
    /** 0 = at the 5-year minimum, 1 = at the maximum; can fall outside [0, 1]. */
    rangePosition: number | null;
}

export function latestVsBand(series: WeeklyPoint[]): LatestVsBand | null {
    const asc = sortAsc(series);
    const latest = asc[asc.length - 1];
    if (!latest) return null;
    const prev = asc[asc.length - 2];
    const band = fiveYearBand(asc, latest.date);
    const deviation = band ? latest.value - band.avg : null;
    return {
        date: latest.date,
        value: latest.value,
        weeklyChange: prev ? latest.value - prev.value : null,
        band,
        deviation,
        deviationPct: band && band.avg !== 0 && deviation !== null ? (deviation / band.avg) * 100 : null,
        rangePosition: band && band.max > band.min ? (latest.value - band.min) / (band.max - band.min) : null,
    };
}

/** Mean of the newest four weekly prints; null unless all four exist. */
export function fourWeekAverage(series: WeeklyPoint[]): number | null {
    const last4 = sortAsc(series).slice(-4);
    if (last4.length < 4) return null;
    return last4.reduce((a, p) => a + p.value, 0) / 4;
}

/** Four-week average ending at `endDate`'s match one year earlier; null when the year-ago weeks are missing. */
export function fourWeekAverageYearAgo(series: WeeklyPoint[], endDate: string): number | null {
    const asc = sortAsc(series);
    const target = sameDayInYear(endDate, 1);
    let endIdx = -1;
    let bestGap = Infinity;
    asc.forEach((p, i) => {
        const gap = Math.abs(toUtc(p.date) - target) / DAY_MS;
        if (gap <= MATCH_WINDOW_DAYS && gap < bestGap) {
            endIdx = i;
            bestGap = gap;
        }
    });
    if (endIdx < 3) return null;
    const window = asc.slice(endIdx - 3, endIdx + 1);
    return window.reduce((a, p) => a + p.value, 0) / 4;
}

/** Percentage change of `current` over `previous`; null when either is missing or previous is zero. */
export function pctChange(current: number | null, previous: number | null): number | null {
    if (current === null || previous === null || previous === 0) return null;
    return ((current - previous) / previous) * 100;
}

/** Stocks in thousand barrels over demand in thousand barrels per day. Null when demand is missing or zero. */
export function daysOfCover(stocksKbbl: number | null, demandKbd: number | null): number | null {
    if (stocksKbbl === null || demandKbd === null || demandKbd <= 0) return null;
    return stocksKbbl / demandKbd;
}

export interface ChartRow {
    date: string;
    value: number;
    min: number | null;
    max: number | null;
    avg: number | null;
}

/** The last `weeks` prints, each with the 5-year band for its own week, for the stocks-vs-band chart. */
export function chartRows(series: WeeklyPoint[], weeks = 52): ChartRow[] {
    const asc = sortAsc(series);
    return asc.slice(-weeks).map(p => {
        const band = fiveYearBand(asc, p.date);
        return { date: p.date, value: p.value, min: band?.min ?? null, max: band?.max ?? null, avg: band?.avg ?? null };
    });
}

export type ReleaseStatus = 'current' | 'awaiting_release' | 'overdue';

/**
 * Where the newest print sits against the WPSR schedule. A week ending Friday D is published the
 * Wednesday 12 days later (10:30 ET, 14:30-15:30 UTC); holiday weeks slip to Thursday. Between the
 * Wednesday release time and Thursday 18:00 UTC a missing print is "awaiting release", not stale.
 */
export function releaseStatus(latestWeekEnding: string, now: Date): ReleaseStatus {
    const base = toUtc(latestWeekEnding);
    const releaseFrom = base + 12 * DAY_MS + 14.5 * 60 * 60 * 1000;
    const releaseBy = base + 13 * DAY_MS + 18 * 60 * 60 * 1000;
    const t = now.getTime();
    if (t < releaseFrom) return 'current';
    if (t <= releaseBy) return 'awaiting_release';
    return 'overdue';
}
