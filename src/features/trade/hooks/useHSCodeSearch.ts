import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { HSCodeMaster } from '../types/trade'

export function useHSCodeSearch(query: string) {
    const [results, setResults] = useState<HSCodeMaster[]>([])
    const [loading, setLoading] = useState(false)

    const search = useCallback(async (q: string) => {
        if (!q || q.trim().length < 2) {
            setResults([])
            return
        }

        setLoading(true)
        try {
            const trimmed = q.trim()

            // If numeric prefix → search by code prefix
            if (/^\d+$/.test(trimmed)) {
                const { data } = await supabase
                    .from('hs_code_master')
                    .select('code, description, chapter, heading, level')
                    .ilike('code', `${trimmed}%`)
                    .order('level')
                    .limit(12)
                setResults(data || [])
            } else {
                // Text search → full-text description search
                const { data } = await supabase
                    .from('hs_code_master')
                    .select('code, description, chapter, heading, level')
                    .ilike('description', `%${trimmed}%`)
                    .order('level')
                    .limit(12)
                setResults(data || [])
            }
        } catch (err) {
            console.error('[useHSCodeSearch]', err)
            setResults([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => search(query), 250)
        return () => clearTimeout(timer)
    }, [query, search])

    return { results, loading }
}
