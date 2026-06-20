import { describe, it, expect } from 'vitest'
import { concentrationLabel } from '../useHSImportFlows'

describe('concentrationLabel', () => {
    it('returns Oligopoly for HHI above 0.25', () => {
        const result = concentrationLabel(0.35)
        expect(result.label).toBe('Oligopoly')
        expect(result.color).toContain('rose')
    })

    it('returns Concentrated for HHI between 0.10 and 0.25', () => {
        const result = concentrationLabel(0.18)
        expect(result.label).toBe('Concentrated')
        expect(result.color).toContain('amber')
    })

    it('returns Competitive for HHI below 0.10', () => {
        const result = concentrationLabel(0.05)
        expect(result.label).toBe('Competitive')
        expect(result.color).toContain('emerald')
    })
})