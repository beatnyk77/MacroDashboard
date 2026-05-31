import { describe, it, expect } from 'vitest';
import { buildNarrative } from './useEnergyRegime';

describe('buildNarrative', () => {
    it('returns acute stress narrative for EXTREME regime', () => {
        const result = buildNarrative('EXTREME', 92);
        expect(result).toContain('acute stress');
    });

    it('returns acute stress narrative for STRESSED regime', () => {
        const result = buildNarrative('STRESSED', 88);
        expect(result).toContain('acute stress');
    });

    it('returns capacity ceiling narrative for TIGHTENING + high utilization', () => {
        const result = buildNarrative('TIGHTENING', 91);
        expect(result).toContain('capacity ceiling');
    });

    it('returns oversupply narrative for OVERSUPPLY regime', () => {
        const result = buildNarrative('OVERSUPPLY', 85);
        expect(result).toContain('Oversupply');
    });

    it('returns refinery slack narrative when utilization < 80', () => {
        const result = buildNarrative('NORMAL', 75);
        expect(result).toContain('slack');
    });

    it('returns balanced narrative for NORMAL regime with adequate utilization', () => {
        const result = buildNarrative('NORMAL', 85);
        expect(result).toContain('Balanced');
    });

    it('returns tightening narrative for TIGHTENING with utilization <= 90', () => {
        const result = buildNarrative('TIGHTENING', 85);
        expect(result).toContain('tightening');
    });
});
