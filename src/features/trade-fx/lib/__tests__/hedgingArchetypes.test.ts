import { describe, it, expect } from 'vitest';
import {
    HEDGING_ARCHETYPES,
    getArchetypeFitLevel,
    sortArchetypesByFit,
} from '../hedgingArchetypes';

describe('hedgingArchetypes', () => {
    it('defines five archetypes', () => {
        expect(HEDGING_ARCHETYPES).toHaveLength(5);
    });

    it('sorts high-fit strategies ahead of low-fit in elevated regime', () => {
        const sorted = sortArchetypesByFit('elevated', 'exporter');
        const standaloneIdx = sorted.findIndex((a) => a.id === 'standalone_put');
        const forwardIdx = sorted.findIndex((a) => a.id === 'full_forward');
        expect(standaloneIdx).toBeLessThan(forwardIdx);
    });

    it('marks natural hedge as medium fit when regime passes', () => {
        expect(getArchetypeFitLevel(HEDGING_ARCHETYPES[0], 'moderate', 'exporter')).toBe(
            'medium',
        );
    });

    it('marks non-matching archetypes as low fit', () => {
        const partial = HEDGING_ARCHETYPES.find((a) => a.id === 'partial_hedge');
        expect(partial).toBeDefined();
        expect(getArchetypeFitLevel(partial!, 'low', 'exporter')).toBe('low');
    });
});