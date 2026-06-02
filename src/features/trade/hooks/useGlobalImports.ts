import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { GlobalAggregate } from '../types/trade'

/**
 * Fetches import data for a given reporter country from vw_country_trade_imports.
 * Mirrors useGlobalTrade but queries import_value_usd and supports a manual
 * refresh that triggers the ingest-trade-global-pulse edge function (flowCode=M).
 */
export function useGlobalImports(iso3: string | null) {
    const [data, setData] = useState<GlobalAggregate[]>([])
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const [prevIso3, setPrevIso3] = useState(iso3)
    const [prevTrigger, setPrevTrigger] = useState(refreshTrigger)

    // Sync state in render phase (same pattern as useGlobalTrade)
    if (iso3 !== prevIso3) {
        setPrevIso3(iso3)
        setData([])
        setLoading(!!iso3)
        setError(null)
    } else if (refreshTrigger !== prevTrigger) {
        setPrevTrigger(refreshTrigger)
        setRefreshing(true)
        setError(null)
    }

    const refresh = () => setRefreshTrigger(prev => prev + 1)

    useEffect(() => {
        if (!iso3) return

        const fetchImports = async () => {
            try {
                const isManualRefresh = refreshTrigger > prevTrigger

                if (isManualRefresh) {
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
                    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

                    // Trigger import ingestion (edge function handles flowCode=M internally)
                    await fetch(`${supabaseUrl}/functions/v1/ingest-trade-global-pulse?reporterISO=${iso3}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'Content-Type': 'application/json',
                        }
                    })
                }

                // Query the view — fallback to base table if view doesn't yet exist
                let results: GlobalAggregate[] | null = null
                let err: { message: string } | null = null

                try {
                    const { data: viewData, error: viewErr } = await supabase
                        .from('vw_country_trade_imports')
                        .select('*')
                        .eq('reporter_iso3', iso3)
                        .order('import_value_usd', { ascending: false })
                    err = viewErr
                    results = viewData
                } catch {
                    // View not available — fall back to base table with import filter
                    const { data: tableData, error: tableErr } = await supabase
                        .from('trade_global_aggregates')
                        .select('*')
                        .eq('reporter_iso3', iso3)
                        .not('import_value_usd', 'is', null)
                        .gt('import_value_usd', 0)
                        .order('import_value_usd', { ascending: false })
                    err = tableErr
                    results = tableData
                }

                if (err) throw err
                setData(results || [])
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e)
                console.error('[useGlobalImports] Error:', msg)
                setError(msg)
            } finally {
                setLoading(false)
                setRefreshing(false)
            }
        }

        fetchImports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [iso3, refreshTrigger])

    const lastFetchedAt = data && data.length > 0 ? data[0].fetched_at : null

    return { data, loading, refreshing, error, refresh, lastFetchedAt }
}
