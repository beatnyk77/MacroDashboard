import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { TradeMarket, DemandState, OpportunityScore } from '../types/trade'
import { buildOpportunityTags, buildInsightText, isoToFlag } from '../types/trade'

const CACHE_STALE_DAYS = 30

function enrich(score: OpportunityScore): TradeMarket {
    return {
        ...score,
        flag: isoToFlag(score.reporter_iso2),
        opportunityTags: buildOpportunityTags(score),
        insightText: buildInsightText(score),
    }
}

export function useHSDemand(hsCode: string | null) {
    const [state, setState] = useState<DemandState>({ status: 'idle' })
    const inflightRef = useRef<string | null>(null)

    useEffect(() => {
        if (!hsCode) {
            setState({ status: 'idle' })
            return
        }

        let cancelled = false
        inflightRef.current = hsCode

        const run = async () => {
            setState({ status: 'loading' })

            try {
                // ── 1. Check opportunity scores cache ──
                const { data: cached, error: cacheErr } = await supabase
                    .from('hs_opportunity_scores')
                    .select('*')
                    .eq('hs_code', hsCode)
                    .order('overall_score', { ascending: false })
                    .limit(100)

                if (cacheErr) throw cacheErr

                const now = new Date()
                const isStale = !cached || cached.length === 0 ||
                    (cached[0]?.computed_at && (now.getTime() - new Date(cached[0].computed_at).getTime()) > CACHE_STALE_DAYS * 86400000)

                if (!isStale && cached && cached.length > 0 && !cancelled) {
                    setState({
                        status: 'success',
                        markets: cached.map(enrich),
                        hsCode,
                        cachedAt: cached[0].computed_at,
                    })
                    return
                }

                // ── 2. Cache miss → invoke edge function ──
                if (!cancelled) setState({ status: 'fetching_live' })

                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
                const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

                const res = await fetch(
                    `${supabaseUrl}/functions/v1/fetch-hs-demand?hsCode=${encodeURIComponent(hsCode)}`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'apikey': supabaseKey,
                        },
                    }
                )

                if (!res.ok && !cancelled) {
                    // Edge function failed — show cached stale data if any
                    if (cached && cached.length > 0) {
                        setState({
                            status: 'success',
                            markets: cached.map(enrich),
                            hsCode,
                            cachedAt: cached[0]?.computed_at ?? new Date().toISOString(),
                        })
                    } else {
                        setState({ status: 'error', message: `Failed to fetch trade data: ${res.statusText}` })
                    }
                    return
                }

                // Parse response to check for "soft" errors
                const resData = await res.json().catch(() => ({ ok: false, error: 'Invalid response from server' }))
                if (!resData.ok && !cancelled) {
                    if (cached && cached.length > 0) {
                        setState({
                            status: 'success',
                            markets: cached.map(enrich),
                            hsCode,
                            cachedAt: cached[0]?.computed_at ?? new Date().toISOString(),
                        })
                    } else {
                        setState({ status: 'error', message: resData.error || 'Failed to fetch live trade data' })
                    }
                    return
                }

                // ── 3. Poll for scores (edge function is async — scores arrive shortly) ──
                let attempts = 0
                const maxAttempts = 30 // Increased from 10 (60s total) to handle heavy data like HS 85
                let success = false
                const poll = async (): Promise<void> => {
                    if (cancelled || attempts >= maxAttempts) return

                    await new Promise(r => setTimeout(r, 2000)) // 2s between polls
                    attempts++

                    const { data: fresh } = await supabase
                        .from('hs_opportunity_scores')
                        .select('*')
                        .eq('hs_code', hsCode)
                        .order('overall_score', { ascending: false })
                        .limit(100)

                    if (fresh && fresh.length > 0 && !cancelled) {
                        success = true
                        setState({
                            status: 'success',
                            markets: fresh.map(enrich),
                            hsCode,
                            cachedAt: fresh[0].computed_at,
                        })
                    } else {
                        return poll()
                    }
                }

                await poll()

                if (!cancelled && !success) {
                    setState({ status: 'error', message: 'Data processing timed out. Please try again.' })
                }

            } catch (err: any) {
                if (!cancelled) {
                    setState({ status: 'error', message: err.message || 'Unknown error' })
                }
            }
        }

        run()
        return () => { cancelled = true }
    }, [hsCode])

    return state
}
