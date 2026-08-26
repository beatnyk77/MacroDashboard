import { describe, expect, it } from 'vitest';
import { EVIDENCE_DEFINITIONS, EVIDENCE_FAMILIES, getFamilyDefinitions } from '@/lib/deDollarizationEvidence';

describe('de-dollarization evidence registry', () => {
    it('has a registered family for every evidence definition', () => {
        const familyIds = new Set(EVIDENCE_FAMILIES.map((family) => family.id));
        expect(EVIDENCE_DEFINITIONS.every((definition) => familyIds.has(definition.family))).toBe(true);
    });

    it('keeps unsupported settlement data out of the live metric inventory', () => {
        const settlement = getFamilyDefinitions('settlement-rails');
        expect(settlement).toHaveLength(0);
    });

    it('marks direct reserve observations as observed', () => {
        const usd = EVIDENCE_DEFINITIONS.find((definition) => definition.id === 'GLOBAL_USD_SHARE_PCT');
        expect(usd?.evidenceClass).toBe('observed');
        expect(usd?.source).toBe('IMF COFER');
    });
});
