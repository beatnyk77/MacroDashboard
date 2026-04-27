import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface IndiaChinaCompRecord {
    hs_code: string
    hs_description: string | null
    year: number
    india_import_usd: number | null
    india_qty: number | null
    china_import_usd: number | null
    china_qty: number | null
}

export function useIndiaChinaComparison(hsCode?: string) {
    const [data, setData] = useState<IndiaChinaCompRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchComparison = async () => {
            setLoading(true)
            setError(null)
            try {
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
            }
        }

        fetchComparison()
    }, [hsCode])

    return { data, loading, error }
}
