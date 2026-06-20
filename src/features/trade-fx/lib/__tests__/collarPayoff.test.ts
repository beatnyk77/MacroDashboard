import { describe, it, expect } from 'vitest';
import { buildPayoffTable } from '../collarPayoff';

describe('buildPayoffTable', () => {
    const baseParams = {
        currentSpot: 84,
        forwardRate: 84.5,
        floorStrike: 81.5,
        capStrike: 86.5,
        notionalFC: 1_000_000,
        horizonDays: 90,
    };

    it('returns four scenario rows', () => {
        const rows = buildPayoffTable(baseParams);
        expect(rows).toHaveLength(4);
        expect(rows.map((r) => r.label)).toEqual([
            'Floor (protection level)',
            'Current spot',
            'Cap (upside limit)',
            'Tail scenario (+8%)',
        ]);
    });

    it('caps collar payoff at floor strike when spot is below floor', () => {
        const floorRow = buildPayoffTable(baseParams)[0];
        expect(floorRow.collarINR).toBe(baseParams.floorStrike * baseParams.notionalFC);
        expect(floorRow.unhedgedINR).toBe(baseParams.floorStrike * baseParams.notionalFC);
    });

    it('computes diffVsUnhedged as collar minus unhedged', () => {
        const rows = buildPayoffTable(baseParams);
        rows.forEach((row) => {
            expect(row.diffVsUnhedged).toBeCloseTo(row.collarINR - row.unhedgedINR, 2);
        });
    });
});