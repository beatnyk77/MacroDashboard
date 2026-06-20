import { describe, it, expect } from 'vitest';
import { describeInrMove, formatInrIndian } from '../formatInr';

describe('formatInrIndian', () => {
    it('formats crore amounts', () => {
        expect(formatInrIndian(12_500_000)).toBe('+₹1.25 Cr');
    });

    it('formats lakh amounts', () => {
        expect(formatInrIndian(850_000)).toBe('+₹8.5 L');
    });

    it('shows negative sign', () => {
        expect(formatInrIndian(-12_500_000)).toBe('−₹1.25 Cr');
    });
});

describe('describeInrMove', () => {
    it('describes depreciation and appreciation', () => {
        expect(describeInrMove(5)).toBe('INR depreciates');
        expect(describeInrMove(-3)).toBe('INR appreciates');
        expect(describeInrMove(0)).toBe('INR unchanged');
    });
});