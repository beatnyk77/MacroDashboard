import { describe, it, expect } from 'vitest'
import { formatMarketsForCsv } from '../formatMarketsForCsv'
import type { TradeMarket } from '../../types/trade'

function makeMarket(overrides: Partial<TradeMarket> = {}): TradeMarket {
    return {
        hs_code: '854231',
        reporter_iso3: 'USA',
        reporter_iso2: 'US',
        reporter_name: 'United States',
        market_size_score: 80,
        growth_score: 70,
        competition_score: 60,
        macro_score: 75,
        volatility_score: 65,
        overall_score: 72,
        hhi: 0.18,
        top_supplier_iso3: 'CHN',
        top_supplier_share: 42,
        latest_export_usd: 2_500_000_000,
        cagr_5yr_pct: 6.4,
        data_year: 2023,
        computed_at: '2026-01-01T00:00:00Z',
        opportunityTags: ['💰 Large Market', '📈 Strong Macro'],
        insightText: 'Large export market.',
        ...overrides,
    }
}

describe('formatMarketsForCsv', () => {
    it('returns empty array for empty input', () => {
        expect(formatMarketsForCsv([])).toEqual([])
    })

    it('maps market fields to institutional CSV columns', () => {
        const [row] = formatMarketsForCsv([makeMarket()])

        expect(row).toEqual({
            Rank: 1,
            Country: 'United States',
            ISO3: 'USA',
            'Opportunity Score': 72,
            'Import Value USD': 2_500_000_000,
            '5yr CAGR %': 6.4,
            HHI: 0.18,
            'Macro Score': 75,
            Tags: '💰 Large Market; 📈 Strong Macro',
            'Data Year': 2023,
            'HS Code': '854231',
        })
    })

    it('uses ISO3 as country fallback when name is missing', () => {
        const [row] = formatMarketsForCsv([makeMarket({ reporter_name: null })])
        expect(row.Country).toBe('USA')
    })

    it('preserves sort order via sequential rank numbers', () => {
        const rows = formatMarketsForCsv([
            makeMarket({ reporter_iso3: 'DEU', reporter_name: 'Germany', overall_score: 90 }),
            makeMarket({ reporter_iso3: 'JPN', reporter_name: 'Japan', overall_score: 80 }),
        ])

        expect(rows.map(r => r.Rank)).toEqual([1, 2])
        expect(rows[0].Country).toBe('Germany')
        expect(rows[1].Country).toBe('Japan')
    })

    it('joins tags with semicolons for spreadsheet-safe single cell', () => {
        const [row] = formatMarketsForCsv([makeMarket({ opportunityTags: ['🔥 Fast Growth'] })])
        expect(row.Tags).toBe('🔥 Fast Growth')
    })
})