import { describe, it, expect } from 'vitest'
import { aggregateUKFlows } from '../aggregateUKFlows'
import type { UKOTSFlow } from '../../hooks/useUKTradeFlows'

function row(overrides: Partial<UKOTSFlow>): UKOTSFlow {
    return {
        id: '1',
        hs_code: '854231',
        month_id: 202401,
        flow_type: 'Import',
        partner_country_iso: null,
        region_id: null,
        port_id: null,
        value_gbp: 100,
        net_mass_kg: null,
        last_updated: '2026-01-01',
        ...overrides,
    }
}

describe('aggregateUKFlows', () => {
    it('returns empty array for no flows', () => {
        expect(aggregateUKFlows([])).toEqual([])
    })

    it('aggregates import and export per month', () => {
        const result = aggregateUKFlows([
            row({ month_id: 202401, flow_type: 'Import', value_gbp: 100 }),
            row({ id: '2', month_id: 202401, flow_type: 'Export', value_gbp: 50 }),
            row({ id: '3', month_id: 202402, flow_type: 'Import', value_gbp: 200 }),
        ])

        expect(result).toEqual([
            { month: '2024-01', Import: 100, Export: 50 },
            { month: '2024-02', Import: 200, Export: 0 },
        ])
    })

    it('limits to maxMonths most recent', () => {
        const flows = Array.from({ length: 30 }, (_, i) => {
            const year = 2022 + Math.floor(i / 12)
            const month = (i % 12) + 1
            return row({ id: String(i), month_id: year * 100 + month, value_gbp: i + 1 })
        })
        const result = aggregateUKFlows(flows, 12)
        expect(result).toHaveLength(12)
        expect(result[0].month).toBe('2023-07')
        expect(result[11].month).toBe('2024-06')
    })
})