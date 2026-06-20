import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatTradeValue } from '../types/trade'

export interface ImportFlowRow {
    partner_iso3: string
    partner_name: string | null
    total_import_usd: number
    market_share_pct: number
    macro_score: number | null
}

function computeHHI(shares: number[]): number {
    return shares.reduce((sum, s) => sum + (s / 100) ** 2, 0)
}

export function concentrationLabel(hhi: number): { label: string; color: string } {
    if (hhi > 0.25) return { label: 'Oligopoly', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
    if (hhi >= 0.10) return { label: 'Concentrated', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
    return { label: 'Competitive', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
}

export function useHSImportFlows(hsCode: string | null) {
    return useQuery({
        queryKey: ['hs-import-flows', hsCode],
        enabled: !!hsCode,
        staleTime: 30 * 60 * 1000,
        queryFn: async (): Promise<{ rows: ImportFlowRow[]; hhi: number }> => {
            const { data, error } = await supabase
                .from('trade_supplier_breakdown')
                .select('partner_iso3, partner_name, import_value_usd, year')
                .eq('hs_code', hsCode!)
                .order('year', { ascending: false })

            if (error) throw error

            const latestYear = data?.[0]?.year
            const latestRows = (data || []).filter(r => r.year === latestYear)

            const byPartner = new Map<string, { name: string | null; total: number }>()
            for (const row of latestRows) {
                const existing = byPartner.get(row.partner_iso3)
                const val = row.import_value_usd ?? 0
                if (existing) {
                    existing.total += val
                } else {
                    byPartner.set(row.partner_iso3, { name: row.partner_name, total: val })
                }
            }

            const grandTotal = [...byPartner.values()].reduce((s, p) => s + p.total, 0)
            const sorted = [...byPartner.entries()]
                .map(([iso3, { name, total }]) => ({
                    partner_iso3: iso3,
                    partner_name: name,
                    total_import_usd: total,
                    market_share_pct: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
                }))
                .sort((a, b) => b.total_import_usd - a.total_import_usd)
                .slice(0, 50)

            const shares = sorted.map(r => r.market_share_pct)
            const hhi = computeHHI(shares)

            const partnerIso3s = sorted.map(r => r.partner_iso3)
            const { data: macroRows } = partnerIso3s.length
                ? await supabase
                    .from('hs_opportunity_scores')
                    .select('reporter_iso3, macro_score')
                    .eq('hs_code', hsCode!)
                    .in('reporter_iso3', partnerIso3s)
                : { data: [] }

            const macroByIso = new Map((macroRows || []).map(r => [r.reporter_iso3, r.macro_score]))

            const rows: ImportFlowRow[] = sorted.map(r => ({
                ...r,
                macro_score: macroByIso.get(r.partner_iso3) ?? null,
            }))

            return { rows, hhi }
        },
    })
}

export function formatImportFlowValue(usd: number): string {
    return formatTradeValue(usd)
}