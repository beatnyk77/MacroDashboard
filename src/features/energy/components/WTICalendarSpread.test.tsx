import { describe, it, expect } from 'vitest';

// We'll export this helper after extracting it in Step 3.
import { getRegimeDetails } from './WTICalendarSpread';

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
});
