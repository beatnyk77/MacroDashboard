import { describe, it, expect } from 'vitest';
import { classifyRegime } from '../regimeEngine';
import type { RegimeEngineInput } from '../tradeFxTypes';

function makeStableHistory(spot = 85, days = 90): { date: string; value: number }[] {
    return Array.from({ length: days }, (_, i) => ({
        date: `2026-01-${String(i + 1).padStart(2, '0')}`,
        value: spot + (i % 2 === 0 ? 0.01 : -0.01),
    }));
}

const BASE_INPUT: RegimeEngineInput = {
    spotHistory: makeStableHistory(),
    compositePressure: 40,
    policyDivergence: 80,
    flowTension: 35,
    fxReservesBn: 680,
    brentPrice: 78,
    brentDelta: 2,
    usdSharePct: 58,
    usdShareDeltaYoy: -0.3,
    us10yYield: 4.2,
    sourceFreshness: {
        india_pulse: '2026-06-01T00:00:00Z',
        us_pulse: '2026-06-01T00:00:00Z',
        dedol_lab: '2026-03-01T00:00:00Z',
        commodities: '2026-06-01T00:00:00Z',
        currency_wars: '2026-06-01T00:00:00Z',
    },
};

describe('classifyRegime', () => {
    it('returns deterministic output for identical inputs', () => {
        const a = classifyRegime(BASE_INPUT);
        const b = classifyRegime(BASE_INPUT);
        expect(a).toEqual(b);
    });

    it('returns five macro signals', () => {
        const result = classifyRegime(BASE_INPUT);
        expect(result.macroSignals).toHaveLength(5);
        expect(result.volatilityRegime).toBe('low');
        expect(result.regimeNote).toContain('volatility regime');
    });

    it('bumps regime up when composite pressure is high', () => {
        const lowPressure = classifyRegime({ ...BASE_INPUT, compositePressure: 20 });
        const highPressure = classifyRegime({ ...BASE_INPUT, compositePressure: 90 });
        const order = ['low', 'moderate', 'elevated', 'high'];
        expect(order.indexOf(highPressure.volatilityRegime)).toBeGreaterThanOrEqual(
            order.indexOf(lowPressure.volatilityRegime),
        );
    });
});