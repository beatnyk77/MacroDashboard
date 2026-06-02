import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ImportOriginEntry {
    partner_iso3: string
    partner_name: string | null
    total_import_usd: number
    market_share_pct: number
}

/**
 * Aggregates trade_supplier_breakdown across all HS chapters for a given reporter
 * to produce a ranked list of import origin countries, suitable for choropleth rendering.
 *
 * Falls back to empty array if the import_value_usd column isn't yet populated
 * (graceful degradation while the edge function runs the first ingestion pass).
 */
export function useImportOrigins(reporterIso3: string | null) {
    return useQuery<ImportOriginEntry[]>({
        queryKey: ['import-origins', reporterIso3],
        enabled: !!reporterIso3,
        staleTime: 30 * 60 * 1000,       // 30 min — same as platform default
        gcTime: 2 * 60 * 60 * 1000,      // 2 h
        refetchOnWindowFocus: false,
        queryFn: async () => {
            if (!reporterIso3) return []

            // Prefer import_value_usd over export_value_usd for imports
            const { data, error } = await supabase
                .from('trade_supplier_breakdown')
                .select('partner_iso3, partner_name, import_value_usd, market_share_pct')
                .eq('reporter_iso3', reporterIso3)
                .not('import_value_usd', 'is', null)
                .gt('import_value_usd', 0)
                .order('import_value_usd', { ascending: false })

            if (error) {
                console.warn('[useImportOrigins] Query error (may be normal if import data not yet ingested):', error.message)
                return []
            }

            if (!data || data.length === 0) return []

            // Aggregate: sum import_value_usd per partner across all HS chapters
            const partnerMap = new Map<string, ImportOriginEntry>()
            for (const row of data) {
                const iso3 = row.partner_iso3
                if (!iso3) continue
                const existing = partnerMap.get(iso3)
                const val = (row.import_value_usd ?? 0) as number
                if (existing) {
                    existing.total_import_usd += val
                } else {
                    partnerMap.set(iso3, {
                        partner_iso3: iso3,
                        partner_name: row.partner_name as string | null,
                        total_import_usd: val,
                        market_share_pct: 0, // recalculated below
                    })
                }
            }

            const entries = Array.from(partnerMap.values()).sort(
                (a, b) => b.total_import_usd - a.total_import_usd
            )

            const grandTotal = entries.reduce((s, e) => s + e.total_import_usd, 0)
            if (grandTotal > 0) {
                for (const e of entries) {
                    e.market_share_pct = parseFloat(((e.total_import_usd / grandTotal) * 100).toFixed(3))
                }
            }

            return entries
        },
    })
}
