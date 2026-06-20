import { describe, it, expect } from 'vitest';
import { buildRiskFlags } from '../riskFlags';
import type { MacroRegimeSignal } from '../tradeFxTypes';

const BASE_SIGNALS: MacroRegimeSignal[] = [
    {
        source: 'india_pulse',
        label: 'Reserves',
        sentiment: 'supportive',
        detail: 'RBI supportive.',
        freshness: '2026-06-01',
        link: '/intel/india',
        staleness: 'fresh',
    },
    {
        source: 'us_pulse',
        label: 'Fed',
        sentiment: 'cautionary',
        detail: 'USD strength risk.',
        freshness: '2026-06-01',
        link: '/labs/us-macro-fiscal',
        staleness: 'fresh',
    },
    {
        source: 'dedol_lab',
        label: 'Settlement',
        sentiment: 'supportive',
        detail: 'INR corridor signal.',
        freshness: '2026-03-01',
        link: '/labs/de-dollarization-gold',
        staleness: 'lagged',
    },
];

describe('buildRiskFlags', () => {
    it('returns exporter opportunity flag in low volatility regime', () => {
        const flags = buildRiskFlags('exporter', 'low', BASE_SIGNALS);
        expect(flags.some((f) => f.headline === 'Hedging window open')).toBe(true);
    });

    it('returns importer dedollarization caution flag', () => {
        const flags = buildRiskFlags('importer', 'moderate', BASE_SIGNALS);
        expect(flags.some((f) => f.headline === 'CNY corridor signal emerging')).toBe(true);
    });

    it('combines exporter and importer flags in balanced mode', () => {
        const flags = buildRiskFlags('balanced', 'moderate', BASE_SIGNALS);
        expect(flags.length).toBeGreaterThan(1);
    });
});