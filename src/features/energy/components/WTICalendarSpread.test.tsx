import { describe, it, expect } from 'vitest';

import { getRegimeDetails } from './wtiCalendarSpreadUtils';

describe('getRegimeDetails', () => {
    it('returns EXTREME for spread > 16', () => {
        expect(getRegimeDetails(16.5).label).toBe('EXTREME BACKWARDATION');
    });

    it('returns STRESSED for spread between 10 and 16', () => {
        expect(getRegimeDetails(12).label).toBe('STRESSED');
    });

    it('returns TIGHTENING for spread between 5 and 10', () => {
        expect(getRegimeDetails(7).label).toBe('TIGHTENING');
    });

    it('returns NORMAL for spread between -5 and 5', () => {
        expect(getRegimeDetails(0).label).toBe('NORMAL REGIME');
        expect(getRegimeDetails(4.9).label).toBe('NORMAL REGIME');
    });

    it('returns OVERSUPPLY for spread < -5', () => {
        expect(getRegimeDetails(-6).label).toBe('OVERSUPPLY');
    });

    // Boundary contract: exact boundary values fall to the lower regime (strict > / <)
    it('boundary: spread === 5 is NORMAL (not TIGHTENING)', () => {
        expect(getRegimeDetails(5).label).toBe('NORMAL REGIME');
    });

    it('boundary: spread === -5 is NORMAL (not OVERSUPPLY)', () => {
        expect(getRegimeDetails(-5).label).toBe('NORMAL REGIME');
    });

    it('boundary: spread === 10 is TIGHTENING (not STRESSED)', () => {
        expect(getRegimeDetails(10).label).toBe('TIGHTENING');
    });

    it('boundary: spread === 16 is STRESSED (not EXTREME)', () => {
        expect(getRegimeDetails(16).label).toBe('STRESSED');
    });
});
