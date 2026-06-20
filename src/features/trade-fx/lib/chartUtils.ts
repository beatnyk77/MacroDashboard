import type { IllustrativeRatePoint } from '../constants/illustrativeRateData';
import type { TimeHorizon } from './tradeFxTypes';
import { TIME_HORIZONS } from '../constants/currencyPairs';

export type SpotHistoryPoint = { date: string; value: number };

export type RateChartPoint = {
    date: string;
    spot: number;
    volLower: number;
    volUpper: number;
    /** Stacked area segment height (volUpper − volLower). */
    bandWidth: number;
};

const ROLLING_WINDOW = 20;

function rollingStdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const returns: number[] = [];
    for (let i = 1; i < values.length; i += 1) {
        if (values[i - 1] > 0) {
            returns.push((values[i] - values[i - 1]) / values[i - 1]);
        }
    }
    if (returns.length === 0) return 0;
    const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
    return Math.sqrt(variance);
}

export function filterHistoryByHorizon(
    history: SpotHistoryPoint[],
    horizon: TimeHorizon,
): SpotHistoryPoint[] {
    if (history.length === 0) return [];

    const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
    const latestDate = new Date(sorted[sorted.length - 1].date);

    if (horizon === 'YTD') {
        const yearStart = new Date(latestDate.getFullYear(), 0, 1);
        return sorted.filter((p) => new Date(p.date) >= yearStart);
    }

    const days = TIME_HORIZONS.find((h) => h.id === horizon)?.days ?? 90;
    const cutoff = new Date(latestDate);
    cutoff.setDate(cutoff.getDate() - days);
    return sorted.filter((p) => new Date(p.date) >= cutoff);
}

/** Builds chart rows using illustrative volProxy (±1σ band as % of spot). */
export function buildIllustrativeRateChartData(
    points: IllustrativeRatePoint[],
): RateChartPoint[] {
    return points.map((point) => {
        const bandWidth = point.spot * (point.volProxy / 100);
        return {
            date: point.date,
            spot: point.spot,
            volLower: point.spot - bandWidth,
            volUpper: point.spot + bandWidth,
            bandWidth,
        };
    });
}

/** Builds chart rows with ±1 rolling std-dev band around spot. */
export function buildRateChartData(history: SpotHistoryPoint[]): RateChartPoint[] {
    const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));

    return sorted.map((point, index) => {
        const windowStart = Math.max(0, index - ROLLING_WINDOW + 1);
        const windowValues = sorted.slice(windowStart, index + 1).map((p) => p.value);
        const dailyStd = rollingStdDev(windowValues);
        const bandWidth = point.value * dailyStd;

        return {
            date: point.date,
            spot: point.value,
            volLower: point.value - bandWidth,
            volUpper: point.value + bandWidth,
            bandWidth,
        };
    });
}