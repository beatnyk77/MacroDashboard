import type { UKOTSFlow } from '../hooks/useUKTradeFlows'

export interface UKFlowMonth {
    month: string
    Import: number
    Export: number
}

/** Aggregate OTS rows into monthly import/export totals for charting. */
export function aggregateUKFlows(flows: UKOTSFlow[], maxMonths = 24): UKFlowMonth[] {
    const byMonth = new Map<number, UKFlowMonth>()

    for (const row of flows) {
        const monthKey = String(row.month_id)
        const label = `${monthKey.slice(0, 4)}-${monthKey.slice(4)}`
        const existing = byMonth.get(row.month_id) ?? { month: label, Import: 0, Export: 0 }
        const val = row.value_gbp ?? 0
        if (row.flow_type === 'Import') existing.Import += val
        else existing.Export += val
        byMonth.set(row.month_id, existing)
    }

    return [...byMonth.entries()]
        .sort((a, b) => a[0] - b[0])
        .slice(-maxMonths)
        .map(([, v]) => v)
}