import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { GlobalAggregate } from '../types/trade'

export function useGlobalTrade(iso3: string | null) {
    const [data, setData] = useState<GlobalAggregate[]>([])
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const [prevIso3, setPrevIso3] = useState(iso3)
    const [prevTrigger, setPrevTrigger] = useState(refreshTrigger)

    // Sync state in render phase
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

        const fetchGlobalTrade = async () => {
            try {
                const isManualRefresh = refreshTrigger > prevTrigger
                
                if (isManualRefresh) {
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
                    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
                    
                    // Trigger live ingestion
                    await fetch(`${supabaseUrl}/functions/v1/ingest-trade-global-pulse?reporterISO=${iso3}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'Content-Type': 'application/json',
                        }
                    })
                }

                const { data: results, error: err } = await supabase
                    .from('trade_global_aggregates')
                    .select('*')
                    .eq('reporter_iso3', iso3)
                    .order('export_value_usd', { ascending: false })

                if (err) throw err
                setData(results || [])
            } catch (e: any) {
                console.error('[useGlobalTrade] Error:', e)
                setError(e.message)
            } finally {
                setLoading(false)
                setRefreshing(false)
            }
        }

        fetchGlobalTrade()
    }, [iso3, refreshTrigger, prevTrigger])

    const lastFetchedAt = data && data.length > 0 ? data[0].fetched_at : null

    return { data, loading, refreshing, error, refresh, lastFetchedAt }
}
