import { describe, it, expect } from 'vitest';
import {
    briefContentToText,
    classifyBriefDepth,
    countWords,
    BRIEF_QUALITY,
} from '@/lib/briefQuality';

describe('briefQuality', () => {
    it('counts words', () => {
        expect(countWords('one two three')).toBe(3);
        expect(countWords('')).toBe(0);
    });

    it('classifies depth thresholds', () => {
        expect(classifyBriefDepth(BRIEF_QUALITY.minWordsDeep)).toBe('deep');
        expect(classifyBriefDepth(BRIEF_QUALITY.minWordsAcceptable)).toBe('standard');
        expect(classifyBriefDepth(50)).toBe('thin');
    });

    it('extracts text from content object', () => {
        const t = briefContentToText({
            regime_status: 'Risk-off',
            executive_summary: 'Liquidity tightens across G10.',
        });
        expect(t).toContain('Risk-off');
        expect(t).toContain('Liquidity');
    });
});
