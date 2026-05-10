import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface IndiaChinaCompRecord {
    hs_code: string
    hs_description: string | null
    year: number
    india_export_usd: number | null
    india_qty: number | null
    china_export_usd: number | null
    china_qty: number | null
    fetched_at?: string
}

export function useIndiaChinaComparison(hsCode?: string) {
    const [data, setData] = useState<IndiaChinaCompRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const refresh = () => setRefreshTrigger(prev => prev + 1)

    useEffect(() => {
        const fetchComparison = async () => {
            const isManualRefresh = refreshTrigger > 0
            if (isManualRefresh) setRefreshing(true)
            else setLoading(true)

            setError(null)
            try {
                if (isManualRefresh && hsCode) {
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
                    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
                    
                    // Trigger live ingestion for the specific HS code
                    // fetch-hs-demand refreshes both IND and CHN by default (top reporters list)
                    await fetch(`${supabaseUrl}/functions/v1/fetch-hs-demand?hsCode=${hsCode}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'Content-Type': 'application/json',
                        }
                    })
                }

                let query = supabase
                    .from('view_india_china_comparison')
                    .select('*')
                    .order('year', { ascending: false })

                if (hsCode) {
                    query = query.eq('hs_code', hsCode)
                }

                const { data: results, error: err } = await query

                if (err) throw err
                setData(results || [])
            } catch (e: any) {
                console.error('[useIndiaChinaComparison] Error:', e)
                setError(e.message)
            } finally {
                setLoading(false)
                setRefreshing(false)
            }
        }

        fetchComparison()
    }, [hsCode, refreshTrigger])

    const lastFetchedAt = data && data.length > 0 ? data[0].fetched_at : null

    return { data, loading, refreshing, error, refresh, lastFetchedAt }
}
