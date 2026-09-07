import { describe, it, expect } from 'vitest';
import { getDayDifference, alignSeriesToTZero } from './precedentAligner';

describe('precedentAligner', () => {
    it('calculates day difference correctly', () => {
        expect(getDayDifference('2024-01-10', '2024-01-01')).toBe(9);
        expect(getDayDifference('2024-01-01', '2024-01-10')).toBe(-9);
        expect(getDayDifference('2024-01-01', '2024-01-01')).toBe(0);
    });

    it('aligns series to T=0 and computes base-100 indexing', () => {
        const currentSeries = [
            { date: '2024-01-01', value: 100 },
            { date: '2024-01-04', value: 105 },
            { date: '2024-01-10', value: 110 },
        ];

        const precedentSeries = [
            { date: '2013-05-22', value: 50 },
            { date: '2013-05-25', value: 55 },
            { date: '2013-05-31', value: 60 },
        ];

        const aligned = alignSeriesToTZero(
            currentSeries,
            '2024-01-01', // T=0 current
            precedentSeries,
            '2013-05-22', // T=0 precedent
            -10,
            30,
            1 // 1-day bucket
        );

        expect(aligned.length).toBeGreaterThan(0);

        // At T=0 (dayOffset 0)
        const tZeroPoint = aligned.find(p => p.dayOffset === 0);
        expect(tZeroPoint).toBeDefined();
        expect(tZeroPoint?.currentIndexed).toBe(100);
        expect(tZeroPoint?.precedentIndexed).toBe(100);

        // At dayOffset 3
        const day3Point = aligned.find(p => p.dayOffset === 3);
        expect(day3Point).toBeDefined();
        expect(day3Point?.currentIndexed).toBe(105);
        expect(day3Point?.precedentIndexed).toBe(110); // 55 / 50 * 100 = 110
    });
});
