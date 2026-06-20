import { describe, it, expect } from 'vitest';
import {
    calculateCollarMetrics,
    calculateExposureImpact,
    generateCollarPayoffData,
} from '../collarPayoff';

const BASE_PARAMS = {
    currentSpot: 85,
    forwardRate: 86.5,
    floorStrike: 82,
    capStrike: 88,
    notionalFC: 1_000_000,
    horizonDays: 90,
};

describe('generateCollarPayoffData', () => {
    it('returns correct shape with 101 points by default', () => {
        const data = generateCollarPayoffData(BASE_PARAMS);
        expect(data).toHaveLength(101);
        expect(data[0]).toMatchObject({
            spotAtMaturity: expect.any(Number),
            unhedged: expect.any(Number),
            forwardHedge: 86.5,
            zeroCollar: expect.any(Number),
        });
    });

    it('collar payoff is floored below floor strike and capped above cap', () => {
        const data = generateCollarPayoffData(BASE_PARAMS, 200);
        const belowFloor = data.filter((p) => p.spotAtMaturity < BASE_PARAMS.floorStrike);
        const aboveCap = data.filter((p) => p.spotAtMaturity > BASE_PARAMS.capStrike);

        belowFloor.forEach((p) => expect(p.zeroCollar).toBe(BASE_PARAMS.floorStrike));
        aboveCap.forEach((p) => expect(p.zeroCollar).toBe(BASE_PARAMS.capStrike));
    });
});

describe('calculateCollarMetrics', () => {
    it('returns floor, cap, and participation zone', () => {
        const metrics = calculateCollarMetrics(BASE_PARAMS);
        expect(metrics.protectedFloor).toBe(82);
        expect(metrics.cappedAt).toBe(88);
        expect(metrics.participationZone).toEqual([82, 88]);
    });
});

describe('calculateExposureImpact', () => {
    it('exporter gains when INR depreciates (positive deltaRate)', () => {
        const result = calculateExposureImpact('exporter', 1_000_000, 85, 5);
        expect(result.pnlINR).toBeGreaterThan(0);
        expect(result.direction).toBe('gain');
    });

    it('importer loses when INR depreciates (positive deltaRate)', () => {
        const result = calculateExposureImpact('importer', 1_000_000, 85, 5);
        expect(result.pnlINR).toBeLessThan(0);
        expect(result.direction).toBe('loss');
    });

    it('exporter loses when INR appreciates (negative deltaRate)', () => {
        const result = calculateExposureImpact('exporter', 1_000_000, 85, -5);
        expect(result.pnlINR).toBeLessThan(0);
        expect(result.direction).toBe('loss');
    });
});