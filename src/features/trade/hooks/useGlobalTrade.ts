import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { GlobalAggregate } from '../types/trade'

export function useGlobalTrade(iso3: string | null) {
    const [data, setData] = useState<GlobalAggregate[]>([])
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const refresh = () => setRefreshTrigger(prev => prev + 1)

    useEffect(() => {
        if (!iso3) {
            setData([])
            return
        }

        const fetchGlobalTrade = async () => {
            const isManualRefresh = refreshTrigger > 0
            if (isManualRefresh) setRefreshing(true)
            else setLoading(true)
            
            setError(null)
            try {
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
    }, [iso3, refreshTrigger])

    const lastFetchedAt = data && data.length > 0 ? data[0].fetched_at : null

    return { data, loading, refreshing, error, refresh, lastFetchedAt }
}
