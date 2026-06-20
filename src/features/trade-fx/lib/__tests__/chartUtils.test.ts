import { describe, it, expect } from 'vitest';
import {
    buildIllustrativeRateChartData,
    buildRateChartData,
    filterHistoryByHorizon,
} from '../chartUtils';

const SAMPLE_HISTORY = [
    { date: '2026-01-01', value: 84 },
    { date: '2026-02-01', value: 84.5 },
    { date: '2026-03-01', value: 85 },
    { date: '2026-04-01', value: 85.2 },
    { date: '2026-05-01', value: 85.5 },
    { date: '2026-06-01', value: 86 },
];

describe('filterHistoryByHorizon', () => {
    it('filters to YTD from January of latest year', () => {
        const result = filterHistoryByHorizon(SAMPLE_HISTORY, 'YTD');
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].date).toBe('2026-01-01');
    });

    it('returns sorted subset for 1M horizon', () => {
        const extended = [
            ...SAMPLE_HISTORY,
            { date: '2025-06-01', value: 83 },
        ];
        const result = filterHistoryByHorizon(extended, '1M');
        expect(result.every((p) => p.date >= '2026-05-01')).toBe(true);
    });
});

describe('buildIllustrativeRateChartData', () => {
    it('uses volProxy for band width around illustrative spot', () => {
        const result = buildIllustrativeRateChartData([
            { date: '2025-06', spot: 84.1, volProxy: 0.6 },
        ]);
        expect(result).toHaveLength(1);
        expect(result[0].spot).toBe(84.1);
        expect(result[0].bandWidth).toBeCloseTo(0.5046, 3);
        expect(result[0].volLower).toBeCloseTo(83.5954, 3);
        expect(result[0].volUpper).toBeCloseTo(84.6046, 3);
    });
});

describe('buildRateChartData', () => {
    it('returns spot with vol band fields', () => {
        const result = buildRateChartData(SAMPLE_HISTORY);
        expect(result).toHaveLength(SAMPLE_HISTORY.length);
        expect(result[0]).toMatchObject({
            date: expect.any(String),
            spot: expect.any(Number),
            volLower: expect.any(Number),
            volUpper: expect.any(Number),
            bandWidth: expect.any(Number),
        });
        expect(result[0].volUpper).toBeGreaterThanOrEqual(result[0].volLower);
        expect(result[0].bandWidth).toBeCloseTo(
            result[0].volUpper - result[0].volLower,
            5,
        );
    });
});