/**
 * dossierStats — pure statistics for metric dossiers. Every number a dossier
 * prints is derived here from observed data; nothing is estimated or forecast.
 */

export interface SeriesPoint {
    date: string; // YYYY-MM-DD
    value: number;
}

function median(xs: number[]): number {
    if (xs.length === 0) return 0;
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Share of observations at or below `value`, 0–100. */
export function percentileRank(values: number[], value: number): number {
    if (values.length === 0) return NaN;
    const below = values.filter((v) => v <= value).length;
    return (below / values.length) * 100;
}

const DAY_MS = 86_400_000;
const toTime = (d: string) => Date.parse(`${d}T00:00:00Z`);

/** Median spacing between observations, in days. */
export function medianSpacingDays(points: SeriesPoint[]): number {
    if (points.length < 2) return 0;
    const gaps = points.slice(1).map((p, i) => (toTime(p.date) - toTime(points[i].date)) / DAY_MS);
    return median(gaps);
}

export interface Gap {
    from: string;
    to: string;
}

/**
 * Stretches with no observations: longer than `factor`× both the series' typical spacing and the
 * local spacing on either side (and at least 45 days). The local check keeps natively annual or
 * five-yearly early history from being reported as missing data.
 */
export function findGaps(points: SeriesPoint[], factor = 4): Gap[] {
    const spacing = points.slice(1).map((p, i) => (toTime(p.date) - toTime(points[i].date)) / DAY_MS);
    const limit = Math.max(factor * median(spacing), 45);
    const gaps: Gap[] = [];
    spacing.forEach((days, i) => {
        if (days <= limit) return;
        const local = median([...spacing.slice(Math.max(0, i - 3), i), ...spacing.slice(i + 1, i + 4)]);
        if (local > 0 && days <= factor * local) return;
        gaps.push({ from: points[i].date, to: points[i + 1].date });
    });
    return gaps;
}

/**
 * Last observation on or before `date`. Points must be sorted ascending.
 * With `maxAgeDays`, an observation older than that is treated as missing.
 */
export function valueAsOf(points: SeriesPoint[], date: string, maxAgeDays?: number): SeriesPoint | undefined {
    const t = toTime(date);
    let lo = 0;
    let hi = points.length - 1;
    let found: SeriesPoint | undefined;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (toTime(points[mid].date) <= t) {
            found = points[mid];
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }
    if (found && maxAgeDays !== undefined && (t - toTime(found.date)) / DAY_MS > maxAgeDays) return undefined;
    return found;
}

export function shiftDate(date: string, { years = 0, months = 0 }: { years?: number; months?: number }): string {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + months + years * 12);
    return d.toISOString().slice(0, 10);
}

export interface Change {
    from: SeriesPoint;
    to: SeriesPoint;
    abs: number;
    /** Percent change; undefined when the base is ≤ 0 (spreads, z-scores). */
    pct?: number;
}

export function changeBetween(from: SeriesPoint | undefined, to: SeriesPoint | undefined): Change | undefined {
    if (!from || !to || from.date === to.date) return undefined;
    const abs = to.value - from.value;
    const pct = from.value > 0 ? (abs / from.value) * 100 : undefined;
    return { from, to, abs, pct };
}

/**
 * Most recent earlier observation (before the last 12 months) within `tolerance` of
 * the latest value, measured in the series' own standard deviation units.
 */
export function lastTimeAtLevel(points: SeriesPoint[], tolerance = 0.05): SeriesPoint | undefined {
    if (points.length < 24) return undefined;
    const latest = points[points.length - 1];
    const sd = stdev(points.map((p) => p.value));
    if (!(sd > 0)) return undefined;
    const cutoff = toTime(latest.date) - 365 * DAY_MS;
    for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i];
        if (toTime(p.date) >= cutoff) continue;
        if (Math.abs(p.value - latest.value) <= tolerance * sd) return p;
    }
    return undefined;
}

export function stdev(xs: number[]): number {
    if (xs.length < 2) return 0;
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    return Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length - 1));
}

export interface DossierSummary {
    latest: SeriesPoint;
    first: SeriesPoint;
    count: number;
    yearsCovered: number;
    percentile: number;
    max: SeriesPoint;
    min: SeriesPoint;
    change1y?: Change;
    change5y?: Change;
    lastTimeAtLevel?: SeriesPoint;
}

export function summarize(points: SeriesPoint[]): DossierSummary | undefined {
    if (points.length === 0) return undefined;
    const latest = points[points.length - 1];
    const first = points[0];
    let max = first;
    let min = first;
    for (const p of points) {
        if (p.value > max.value) max = p;
        if (p.value < min.value) min = p;
    }
    const yearsCovered = (toTime(latest.date) - toTime(first.date)) / (365.25 * DAY_MS);
    const maxAge = Math.max(3 * medianSpacingDays(points), 10);
    const backTo = (years: number) =>
        yearsCovered >= years
            ? changeBetween(valueAsOf(points, shiftDate(latest.date, { years: -years }), maxAge), latest)
            : undefined;
    return {
        latest,
        first,
        count: points.length,
        yearsCovered,
        percentile: percentileRank(points.map((p) => p.value), latest.value),
        max,
        min,
        change1y: backTo(1),
        change5y: backTo(5),
        lastTimeAtLevel: lastTimeAtLevel(points),
    };
}

export interface EpisodeOutcome {
    at?: SeriesPoint;
    after12m?: SeriesPoint;
    change12m?: Change;
    /** True when 12 months have not yet elapsed since the episode */
    pending?: boolean;
}

/** Value at an episode date and what the series did over the following 12 months. */
export function episodeOutcome(points: SeriesPoint[], date: string): EpisodeOutcome {
    if (points.length === 0 || date < points[0].date) return {};
    // A reading more than ~3 observation periods away is a data gap, not the value at the episode.
    const maxAge = Math.max(3 * medianSpacingDays(points), 10);
    const at = valueAsOf(points, date, maxAge);
    const target = shiftDate(date, { years: 1 });
    const latest = points[points.length - 1];
    const pending = target > latest.date;
    const after12m = pending ? undefined : valueAsOf(points, target, maxAge);
    return { at, after12m, change12m: changeBetween(at, after12m), pending };
}

// ── Series transforms (all inputs sorted ascending) ──────────────────────────

const monthKey = (d: string) => d.slice(0, 7);

/** Collapse to one observation per month (last print in the month, dated to the month start). */
export function toMonthly(points: SeriesPoint[]): SeriesPoint[] {
    const byMonth = new Map<string, number>();
    for (const p of points) byMonth.set(monthKey(p.date), p.value);
    return [...byMonth.entries()].map(([m, value]) => ({ date: `${m}-01`, value }));
}

/** a ÷ b on matching months. */
export function ratioMonthly(a: SeriesPoint[], b: SeriesPoint[], scale = 1): SeriesPoint[] {
    const bm = new Map(toMonthly(b).map((p) => [p.date, p.value]));
    return toMonthly(a)
        .filter((p) => (bm.get(p.date) ?? 0) !== 0)
        .map((p) => ({ date: p.date, value: (p.value / bm.get(p.date)!) * scale }));
}

/** Year-over-year percent change on a monthly series. */
export function yoyMonthly(points: SeriesPoint[]): SeriesPoint[] {
    const m = toMonthly(points);
    const byDate = new Map(m.map((p) => [p.date, p.value]));
    return m
        .map((p) => {
            const prev = byDate.get(shiftDate(p.date, { years: -1 }));
            return prev ? { date: p.date, value: (p.value / prev - 1) * 100 } : undefined;
        })
        .filter((p): p is SeriesPoint => !!p);
}

/** a − b on matching months. */
export function spreadMonthly(a: SeriesPoint[], b: SeriesPoint[]): SeriesPoint[] {
    const bm = new Map(toMonthly(b).map((p) => [p.date, p.value]));
    return toMonthly(a)
        .filter((p) => bm.has(p.date))
        .map((p) => ({ date: p.date, value: p.value - bm.get(p.date)! }));
}

/** Deflate a nominal series into the price level of the latest deflator month. */
export function realMonthly(nominal: SeriesPoint[], deflator: SeriesPoint[]): SeriesPoint[] {
    const d = toMonthly(deflator);
    if (d.length === 0) return [];
    const base = d[d.length - 1].value;
    return ratioMonthly(nominal, d, base);
}

export function scaleSeries(points: SeriesPoint[], factor: number): SeriesPoint[] {
    return factor === 1 ? points : points.map((p) => ({ date: p.date, value: p.value * factor }));
}

/** Evenly thin a long series for charting, always keeping the first and last point. */
export function downsample(points: SeriesPoint[], maxPoints: number): SeriesPoint[] {
    if (points.length <= maxPoints) return points;
    const step = (points.length - 1) / (maxPoints - 1);
    const out: SeriesPoint[] = [];
    for (let i = 0; i < maxPoints; i++) out.push(points[Math.round(i * step)]);
    return out;
}
