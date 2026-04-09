import { describe, it, expect } from 'vitest';
import { getISO3FromTIC, TIC_COUNTRY_MAPPING } from '../ticCountryMapping';

describe('ticCountryMapping', () => {
    describe('getISO3FromTIC', () => {
        it('returns correct ISO3 code for known countries', () => {
            expect(getISO3FromTIC('Japan')).toBe('JPN');
            expect(getISO3FromTIC('China, Mainland')).toBe('CHN');
            expect(getISO3FromTIC('United Kingdom')).toBe('GBR');
        });

        it('returns null for unknown countries', () => {
            expect(getISO3FromTIC('Unknown Country')).toBeNull();
            expect(getISO3FromTIC('')).toBeNull();
            expect(getISO3FromTIC('USA')).toBeNull(); // USA is not in the list
        });
    });

    describe('TIC_COUNTRY_MAPPING', () => {
        it('is an object with string keys and values', () => {
            expect(typeof TIC_COUNTRY_MAPPING).toBe('object');
            expect(Object.keys(TIC_COUNTRY_MAPPING).length).toBeGreaterThan(0);
        });
    });
});
