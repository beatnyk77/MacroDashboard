import { describe, expect, it } from 'vitest';
import { mapLatestMetric } from '@/lib/metricData';

describe('mapLatestMetric', () => {
    it('maps provenance, freshness, history, and the canonical delta together', () => {
        const result = mapLatestMetric({
            value: 101,
            delta_mom: 0,
            delta_wow: -2,
            display_frequency: 'monthly',
            staleness_flag: 'fresh',
            as_of_date: '2026-08-26',
            source_name: 'FRED',
            native_frequency: 'monthly',
        }, [{ as_of_date: '2026-08-25', value: 100 }]);

        expect(result.value).toBe(101);
        expect(result.trend).toBe('neutral');
        expect(result.deltaPeriod).toBe('MoM');
        expect(result.history).toEqual([{ date: '2026-08-25', value: 100 }]);
        expect(result.source).toBe('FRED');
    });
});
