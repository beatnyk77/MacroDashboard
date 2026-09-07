/**
 * Utilities for aligning two distinct macro time-series to a normalized T=0 timeline.
 * Does not project or forecast. Merely normalizes elapsed calendar days and initial baseline.
 */

export interface TimeSeriesPoint {
    date: string;
    value: number;
}

export interface AlignedComparisonPoint {
    dayOffset: number; // e.g. -30, 0, 10, 30, 90, 180
    dateCurrent?: string;
    currentValue?: number;
    currentIndexed?: number; // Base 100 at T=0
    datePrecedent?: string;
    precedentValue?: number;
    precedentIndexed?: number; // Base 100 at T=0
}

/**
 * Calculates days between two date strings (YYYY-MM-DD)
 */
export function getDayDifference(dateStr: string, anchorStr: string): number {
    const d = new Date(dateStr).getTime();
    const anchor = new Date(anchorStr).getTime();
    return Math.round((d - anchor) / (1000 * 60 * 60 * 24));
}

/**
 * Finds the observation closest to T=0 to act as the baseline value for indexing.
 */
function findBaselineValue(series: TimeSeriesPoint[], tZeroDate: string): number | null {
    if (!series.length) return null;
    let closestVal: number | null = null;
    let minDiff = Infinity;

    for (const pt of series) {
        const diff = Math.abs(getDayDifference(pt.date, tZeroDate));
        if (diff < minDiff) {
            minDiff = diff;
            closestVal = pt.value;
        }
    }
    return closestVal;
}

/**
 * Aligns two time series along an integer dayOffset axis relative to their respective T=0 anchor dates.
 * Bucket size aggregates points into N-day intervals (e.g., 3-day or 7-day buckets) to avoid jitter.
 */
export function alignSeriesToTZero(
    currentSeries: TimeSeriesPoint[],
    currentTZeroDate: string,
    precedentSeries: TimeSeriesPoint[],
    precedentTZeroDate: string,
    minDays = -30,
    maxDays = 180,
    bucketSize = 3
): AlignedComparisonPoint[] {
    const currentBase = findBaselineValue(currentSeries, currentTZeroDate) ?? (currentSeries[0]?.value || 1);
    const precedentBase = findBaselineValue(precedentSeries, precedentTZeroDate) ?? (precedentSeries[0]?.value || 1);

    // Group current points by bucketed dayOffset
    const currentMap = new Map<number, { date: string; value: number }>();
    for (const pt of currentSeries) {
        const rawOffset = getDayDifference(pt.date, currentTZeroDate);
        if (rawOffset >= minDays && rawOffset <= maxDays) {
            const bucket = Math.round(rawOffset / bucketSize) * bucketSize;
            if (!currentMap.has(bucket)) {
                currentMap.set(bucket, pt);
            }
        }
    }

    // Group precedent points by bucketed dayOffset
    const precedentMap = new Map<number, { date: string; value: number }>();
    for (const pt of precedentSeries) {
        const rawOffset = getDayDifference(pt.date, precedentTZeroDate);
        if (rawOffset >= minDays && rawOffset <= maxDays) {
            const bucket = Math.round(rawOffset / bucketSize) * bucketSize;
            if (!precedentMap.has(bucket)) {
                precedentMap.set(bucket, pt);
            }
        }
    }

    // Combine all bucket intervals
    const allBuckets = new Set<number>([
        ...currentMap.keys(),
        ...precedentMap.keys()
    ]);
    const sortedBuckets = Array.from(allBuckets).sort((a, b) => a - b);

    return sortedBuckets.map(offset => {
        const cur = currentMap.get(offset);
        const prec = precedentMap.get(offset);

        return {
            dayOffset: offset,
            dateCurrent: cur?.date,
            currentValue: cur?.value,
            currentIndexed: cur ? (currentBase !== 0 ? Math.round(((cur.value / currentBase) * 100) * 100) / 100 : cur.value) : undefined,
            datePrecedent: prec?.date,
            precedentValue: prec?.value,
            precedentIndexed: prec ? (precedentBase !== 0 ? Math.round(((prec.value / precedentBase) * 100) * 100) / 100 : prec.value) : undefined
        };
    });
}
