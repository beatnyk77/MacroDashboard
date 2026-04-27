import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { GlobalAggregate } from '../types/trade'

export function useGlobalTrade(iso3: string | null) {
    const [data, setData] = useState<GlobalAggregate[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!iso3) {
            setData([])
            return
        }

        const fetchGlobalTrade = async () => {
            setLoading(true)
            setError(null)
            try {
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
            }
        }

        fetchGlobalTrade()
    }, [iso3])

    return { data, loading, error }
}
