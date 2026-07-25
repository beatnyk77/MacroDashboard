import { describe, it, expect } from 'vitest';
import { normalizeCountryPath, toCanonicalPath, toAbsoluteUrl } from '@/lib/urlPath';

describe('country URL normalization', () => {
    it('lowercases ISO segment', () => {
        expect(normalizeCountryPath('/countries/US')).toBe('/countries/us');
        expect(normalizeCountryPath('/countries/IN/')).toBe('/countries/in/');
    });

    it('toCanonicalPath lowercases and trailing-slashes', () => {
        expect(toCanonicalPath('/countries/US')).toBe('/countries/us/');
        expect(toCanonicalPath('/countries/gb/')).toBe('/countries/gb/');
    });

    it('toAbsoluteUrl produces lowercase country canonicals', () => {
        expect(toAbsoluteUrl('/countries/CN')).toBe('https://graphiquestor.com/countries/cn/');
    });

    it('leaves non-country paths alone aside from trailing slash', () => {
        expect(toCanonicalPath('/api-docs')).toBe('/api-docs/');
    });
});
