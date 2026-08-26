import { describe, expect, it } from 'vitest';
import { resolveMetricDelta } from '@/lib/metricDelta';

describe('resolveMetricDelta', () => {
    it('preserves zero as a neutral change', () => {
        expect(resolveMetricDelta(0, -2, 'monthly')).toEqual({ value: 0, period: 'MoM', trend: 'neutral' });
    });

    it('prefers week-over-week for daily series', () => {
        expect(resolveMetricDelta(4, 2, 'daily')).toEqual({ value: 2, period: 'WoW', trend: 'up' });
    });

    it('falls back to the available comparison period', () => {
        expect(resolveMetricDelta(null, -3, 'monthly')).toEqual({ value: -3, period: 'WoW', trend: 'down' });
    });
});
