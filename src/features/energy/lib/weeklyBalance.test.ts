import { describe, it, expect } from 'vitest';
import {
    chartRows,
    daysOfCover,
    fiveYearBand,
    fourWeekAverage,
    fourWeekAverageYearAgo,
    latestVsBand,
    pctChange,
    releaseStatus,
} from './weeklyBalance';

/** One print per year on the same calendar day, values given oldest first. */
const yearly = (values: Array<[number, number]>, monthDay = '10-23') =>
    values.map(([year, value]) => ({ date: `${year}-${monthDay}`, value }));

describe('fiveYearBand', () => {
    it('uses the five prior years and excludes the current year', () => {
        const series = [
            ...yearly([[2021, 400], [2022, 420], [2023, 440], [2024, 380], [2025, 460]]),
            { date: '2026-10-23', value: 999 },
        ];
        expect(fiveYearBand(series, '2026-10-23')).toEqual({ min: 380, max: 460, avg: 420, years: 5 });
    });

    it('matches a shifted holiday-week print within three days', () => {
        const series = yearly([[2021, 400], [2022, 410], [2023, 420]], '10-20');
        expect(fiveYearBand(series, '2026-10-23')?.years).toBe(3);
    });

    it('ignores prints more than three days away', () => {
        const series = yearly([[2021, 400], [2022, 410], [2023, 420]], '10-12');
        expect(fiveYearBand(series, '2026-10-23')).toBeNull();
    });

    it('returns null with fewer than three prior years rather than a thin band', () => {
        const series = yearly([[2024, 400], [2025, 410]]);
        expect(fiveYearBand(series, '2026-10-23')).toBeNull();
    });
});

describe('latestVsBand', () => {
    const series = [
        ...yearly([[2021, 400], [2022, 420], [2023, 440], [2024, 380], [2025, 460]]),
        { date: '2026-10-16', value: 415 },
        { date: '2026-10-23', value: 410 },
    ];

    it('reports weekly change, deviation from the 5-year average and range position', () => {
        const r = latestVsBand(series)!;
        expect(r.date).toBe('2026-10-23');
        expect(r.weeklyChange).toBe(-5);
        expect(r.deviation).toBe(-10);
        expect(r.deviationPct).toBeCloseTo(-2.381, 3);
        expect(r.rangePosition).toBeCloseTo(0.375, 3);
    });

    it('is order independent', () => {
        expect(latestVsBand([...series].reverse())).toEqual(latestVsBand(series));
    });

    it('returns null for an empty series and a null band when history is short', () => {
        expect(latestVsBand([])).toBeNull();
        const short = latestVsBand([{ date: '2026-10-23', value: 410 }])!;
        expect(short.band).toBeNull();
        expect(short.deviation).toBeNull();
        expect(short.weeklyChange).toBeNull();
    });
});

describe('four-week averages', () => {
    const weekly = (vals: number[], start = '2026-10-02') =>
        vals.map((value, i) => {
            const d = new Date(`${start}T00:00:00Z`);
            d.setUTCDate(d.getUTCDate() + i * 7);
            return { date: d.toISOString().slice(0, 10), value };
        });

    it('averages the newest four prints', () => {
        expect(fourWeekAverage(weekly([1, 2, 3, 4, 5]))).toBe(3.5);
    });

    it('returns null with fewer than four prints', () => {
        expect(fourWeekAverage(weekly([1, 2, 3]))).toBeNull();
    });

    it('averages the four weeks ending one year before the given date', () => {
        const lastYear = weekly([10, 20, 30, 40], '2025-10-03');
        expect(fourWeekAverageYearAgo(lastYear, '2026-10-23')).toBe(25);
    });

    it('returns null when the year-ago window is incomplete', () => {
        expect(fourWeekAverageYearAgo(weekly([10, 20], '2025-10-10'), '2026-10-23')).toBeNull();
    });
});

describe('daysOfCover and pctChange', () => {
    it('divides stocks by daily demand', () => {
        expect(daysOfCover(410625, 20209)).toBeCloseTo(20.32, 2);
    });

    it('never divides by missing or zero demand', () => {
        expect(daysOfCover(410625, null)).toBeNull();
        expect(daysOfCover(410625, 0)).toBeNull();
        expect(daysOfCover(null, 20000)).toBeNull();
    });

    it('computes percentage change and refuses a zero base', () => {
        expect(pctChange(110, 100)).toBe(10);
        expect(pctChange(110, 0)).toBeNull();
        expect(pctChange(null, 100)).toBeNull();
    });
});

describe('chartRows', () => {
    it('attaches each week\'s own band and caps the window', () => {
        const series = [
            ...yearly([[2021, 400], [2022, 420], [2023, 440]], '10-23'),
            { date: '2026-10-23', value: 410 },
        ];
        const rows = chartRows(series, 52);
        const last = rows[rows.length - 1];
        expect(last).toMatchObject({ date: '2026-10-23', value: 410, min: 400, max: 440 });
        expect(rows[0].min).toBeNull();
        expect(chartRows(series, 2)).toHaveLength(2);
    });
});

describe('releaseStatus', () => {
    // Week ending Fri 2026-10-23: next release is Wed 2026-11-04 (10:30 ET), holiday slip to Thu 11-05.
    it('is current before the next Wednesday release', () => {
        expect(releaseStatus('2026-10-23', new Date('2026-11-03T20:00:00Z'))).toBe('current');
        expect(releaseStatus('2026-10-23', new Date('2026-11-04T14:00:00Z'))).toBe('current');
    });

    it('is awaiting release from Wednesday 14:30 UTC through Thursday 18:00 UTC', () => {
        expect(releaseStatus('2026-10-23', new Date('2026-11-04T16:00:00Z'))).toBe('awaiting_release');
        expect(releaseStatus('2026-10-23', new Date('2026-11-05T17:59:00Z'))).toBe('awaiting_release');
    });

    it('is overdue once Thursday 18:00 UTC has passed without a new print', () => {
        expect(releaseStatus('2026-10-23', new Date('2026-11-05T18:30:00Z'))).toBe('overdue');
    });
});
