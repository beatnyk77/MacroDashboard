import { describe, expect, it } from 'vitest';
import {
    downsample,
    episodeOutcome,
    findGaps,
    lastTimeAtLevel,
    percentileRank,
    ratioMonthly,
    realMonthly,
    spreadMonthly,
    summarize,
    valueAsOf,
    yoyMonthly,
    type SeriesPoint,
} from '../dossierStats';
import { buildNowReading, formatChange, formatValue, isMonthlyOrSlower, ordinal } from '../dossierNarrative';
import { DOSSIERS } from '../dossierRegistry';
import { METRICS_CATALOG } from '@/features/metrics/metricsCatalog';
import { MACRO_EPISODES } from '../macroEpisodes';

/** Monthly series starting Jan of `startYear`. */
const monthly = (startYear: number, values: number[]): SeriesPoint[] =>
    values.map((value, i) => {
        const y = startYear + Math.floor(i / 12);
        const m = (i % 12) + 1;
        return { date: `${y}-${String(m).padStart(2, '0')}-01`, value };
    });

describe('core statistics', () => {
    it('percentileRank counts values at or below', () => {
        expect(percentileRank([1, 2, 3, 4], 3)).toBe(75);
    });

    it('valueAsOf returns the last observation on or before the date', () => {
        const pts = monthly(2020, [1, 2, 3]);
        expect(valueAsOf(pts, '2020-02-15')?.value).toBe(2);
        expect(valueAsOf(pts, '2019-12-31')).toBeUndefined();
    });

    it('summarize reports coverage, extremes, and 1y/5y changes', () => {
        const pts = monthly(2010, Array.from({ length: 121 }, (_, i) => 100 + i));
        const s = summarize(pts)!;
        expect(s.latest.value).toBe(220);
        expect(s.first.date).toBe('2010-01-01');
        expect(s.max.value).toBe(220);
        expect(s.min.value).toBe(100);
        expect(s.change1y?.abs).toBe(12);
        expect(s.change5y?.abs).toBe(60);
        expect(Math.round(s.yearsCovered)).toBe(10);
    });

    it('omits 5y change when history is shorter than five years', () => {
        const s = summarize(monthly(2024, Array.from({ length: 24 }, (_, i) => i + 1)))!;
        expect(s.change5y).toBeUndefined();
    });

    it('lastTimeAtLevel skips the trailing 12 months', () => {
        const values = [...Array.from({ length: 24 }, (_, i) => i), 5, ...Array(14).fill(30), 5];
        const hit = lastTimeAtLevel(monthly(2000, values));
        expect(hit?.date).toBe('2002-01-01');
    });

    it('episodeOutcome measures the 12 months after an episode', () => {
        const pts = monthly(2000, Array.from({ length: 36 }, (_, i) => 10 + i));
        const o = episodeOutcome(pts, '2001-01-15');
        expect(o.at?.value).toBe(22);
        expect(o.change12m?.abs).toBe(12);
        expect(episodeOutcome(pts, '1999-01-01')).toEqual({});
    });

    it('treats a reading across a data gap as missing, not as the episode value', () => {
        const pts = [...monthly(1960, Array(120).fill(10)), ...monthly(1983, Array(24).fill(5))];
        expect(findGaps(pts)).toEqual([{ from: '1969-12-01', to: '1983-01-01' }]);
        expect(episodeOutcome(pts, '1971-08-15')).toEqual({ at: undefined, after12m: undefined, change12m: undefined, pending: false });
    });

    it('does not report natively annual early history as a gap', () => {
        const annual = [1940, 1941, 1942, 1943, 1944].map((y) => ({ date: `${y}-06-30`, value: y }));
        const quarterly = Array.from({ length: 40 }, (_, i) => ({
            date: `${1945 + Math.floor(i / 4)}-${String((i % 4) * 3 + 1).padStart(2, '0')}-01`,
            value: i,
        }));
        expect(findGaps([...annual, ...quarterly])).toEqual([]);
    });

    it('marks an episode pending when 12 months have not elapsed', () => {
        const pts = monthly(2000, Array.from({ length: 18 }, (_, i) => i + 1));
        const o = episodeOutcome(pts, '2001-01-01');
        expect(o.change12m).toBeUndefined();
        expect(o.pending).toBe(true);
    });
});

describe('series transforms', () => {
    const a = monthly(2020, [10, 20, 30]);
    const b = monthly(2020, [2, 4, 5]);

    it('ratioMonthly divides matching months', () => {
        expect(ratioMonthly(a, b).map((p) => p.value)).toEqual([5, 5, 6]);
    });

    it('spreadMonthly subtracts matching months', () => {
        expect(spreadMonthly(a, b).map((p) => p.value)).toEqual([8, 16, 25]);
    });

    it('realMonthly expresses prices in latest-month index terms', () => {
        const cpi = monthly(2020, [100, 100, 200]);
        expect(realMonthly(a, cpi).map((p) => p.value)).toEqual([20, 40, 30]);
    });

    it('yoyMonthly computes 12-month percent change', () => {
        const idx = monthly(2020, [...Array(12).fill(100), 110]);
        const yoy = yoyMonthly(idx);
        expect(yoy).toHaveLength(1);
        expect(yoy[0].date).toBe('2021-01-01');
        expect(yoy[0].value).toBeCloseTo(10);
    });

    it('collapses intra-month daily prints to the last one', () => {
        const daily: SeriesPoint[] = [
            { date: '2020-01-02', value: 1 },
            { date: '2020-01-31', value: 3 },
        ];
        expect(ratioMonthly(daily, monthly(2020, [1]))).toEqual([{ date: '2020-01-01', value: 3 }]);
    });

    it('downsample keeps endpoints and caps length', () => {
        const pts = monthly(1900, Array.from({ length: 5000 }, (_, i) => i));
        const out = downsample(pts, 100);
        expect(out).toHaveLength(100);
        expect(out[0]).toBe(pts[0]);
        expect(out[99]).toBe(pts[4999]);
    });
});

describe('narrative and formatting', () => {
    it('formats units', () => {
        expect(formatValue(23342.8, 'usd-bn', 0)).toBe('$23.34T');
        expect(formatValue(883.4, 'usd-bn', 0)).toBe('$883B');
        expect(formatValue(-1, 'bp', 1)).toBe('-1.0 bp');
        expect(formatValue(1.234, 'sigma', 2)).toBe('+1.23σ');
        expect(formatValue(33.37, 'pct', 1)).toBe('33.4%');
    });

    it('reports level-unit changes in their own units and ratios in percent', () => {
        const from = { date: '2020-01-01', value: 30 };
        const to = { date: '2021-01-01', value: 33 };
        expect(formatChange({ from, to, abs: 3, pct: 10 }, 'pct', 1)).toBe('+3.0 pp');
        expect(formatChange({ from, to, abs: 3, pct: 10 }, 'ratio', 2)).toBe('+10.0%');
        expect(formatChange(undefined, 'ratio', 2)).toBe('—');
    });

    it('ordinal handles teens', () => {
        expect([1, 2, 3, 11, 12, 13, 21, 92].map(ordinal)).toEqual(['1st', '2nd', '3rd', '11th', '12th', '13th', '21st', '92nd']);
    });

    it('detects cadence', () => {
        expect(isMonthlyOrSlower(monthly(2020, [1, 2, 3, 4]))).toBe(true);
        const daily = Array.from({ length: 10 }, (_, i) => ({ date: `2020-01-${String(i + 1).padStart(2, '0')}`, value: i }));
        expect(isMonthlyOrSlower(daily)).toBe(false);
    });

    it('qualifies percentile claims on short histories', () => {
        const summary = summarize(monthly(2025, Array.from({ length: 12 }, (_, i) => i + 1)))!;
        const text = buildNowReading({ name: 'Test ratio', unit: 'ratio', decimals: 2, summary, monthly: true }).join(' ');
        expect(text).toContain('short window');
        expect(text).not.toContain('recorded high');
    });

    it('states long-run placement on deep histories', () => {
        const values = [...Array.from({ length: 599 }, (_, i) => i + 1), 590];
        const summary = summarize(monthly(1960, values))!;
        const text = buildNowReading({ name: 'Test ratio', unit: 'ratio', decimals: 2, summary, monthly: true }).join(' ');
        expect(text).toContain('since 1960');
        expect(text).toContain('at the top of its recorded range');
    });

    it('names a record low or high instead of quoting a 0th or 100th percentile', () => {
        const low = summarize(monthly(1960, [...Array(100).fill(10), 1]))!;
        const high = summarize(monthly(1960, [...Array(100).fill(10), 99]))!;
        const read = (summary: typeof low) => buildNowReading({ name: 'X', unit: 'ratio', decimals: 2, summary, monthly: true }).join(' ');
        expect(read(low)).toContain('the lowest reading among 101 observations');
        expect(read(high)).toContain('the highest reading among 101 observations');
    });
});

describe('dossier registry', () => {
    it('defines 25 dossiers, each backed by catalog methodology', () => {
        expect(DOSSIERS).toHaveLength(25);
        const catalogIds = new Set(METRICS_CATALOG.map((m) => m.id));
        expect(DOSSIERS.filter((d) => !catalogIds.has(d.id))).toEqual([]);
    });

    it('has unique ids and compare targets that are dossiers', () => {
        const ids = DOSSIERS.map((d) => d.id);
        expect(new Set(ids).size).toBe(ids.length);
        const bad = DOSSIERS.flatMap((d) => d.compare.filter((c) => !ids.includes(c) || c === d.id));
        expect(bad).toEqual([]);
    });

    it('keeps search titles within Google display length once the brand suffix is added', () => {
        const tooLong = DOSSIERS.filter((d) => `${d.seoTitle} | GraphiQuestor`.length > 78).map((d) => d.id);
        expect(tooLong).toEqual([]);
    });

    it('uses only dated episodes from the shared library', () => {
        for (const d of DOSSIERS) {
            for (const key of d.episodes) expect(MACRO_EPISODES[key].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
    });
});
