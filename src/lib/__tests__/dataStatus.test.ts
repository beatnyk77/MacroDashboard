import { describe, it, expect } from 'vitest';
import { statusFromThreshold, STATUS_DOT_CLASS } from '../dataStatus';

describe('statusFromThreshold', () => {
    it('returns no-data for null', () => {
        expect(statusFromThreshold(null, (v) => v > 70)).toBe('no-data');
    });

    it('returns no-data for undefined', () => {
        expect(statusFromThreshold(undefined, (v) => v > 70)).toBe('no-data');
    });

    it('returns safe when the value passes the predicate', () => {
        expect(statusFromThreshold(80, (v) => v > 70)).toBe('safe');
    });

    it('returns warning when the value fails the predicate', () => {
        expect(statusFromThreshold(50, (v) => v > 70)).toBe('warning');
    });

    it('treats a real zero as data, not as missing', () => {
        expect(statusFromThreshold(0, (v) => v >= 0)).toBe('safe');
        expect(statusFromThreshold(0, (v) => v > 0)).toBe('warning');
    });
});

describe('STATUS_DOT_CLASS', () => {
    it('has a distinct class for every status', () => {
        const classes = Object.values(STATUS_DOT_CLASS);
        expect(new Set(classes).size).toBe(classes.length);
        expect(STATUS_DOT_CLASS['no-data']).not.toMatch(/emerald|amber/);
    });
});
