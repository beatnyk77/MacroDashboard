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
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const inflightRef = useRef<string | null>(null)

    const refresh = () => setRefreshTrigger(prev => prev + 1)

    useEffect(() => {
        if (!hsCode) {
            setState({ status: 'idle' })
            return
        }

        let cancelled = false
        inflightRef.current = hsCode

        const run = async () => {
            const isManualRefresh = refreshTrigger > 0
            
            if (isManualRefresh) {
                setState({ status: 'refreshing' })
            } else {
                setState({ status: 'loading' })
            }

            try {
                // ── 1. Check opportunity scores cache (skip if manual refresh) ──
                let cached: any[] = []
                if (!isManualRefresh) {
                    const { data, error: cacheErr } = await supabase
                        .from('hs_opportunity_scores')
                        .select('*')
                        .eq('hs_code', hsCode)
                        .order('overall_score', { ascending: false })
                        .limit(100)

                    if (cacheErr) throw cacheErr
                    cached = data || []
                }

                const now = new Date()
                const isStale = !cached || cached.length === 0 ||
                    (cached[0]?.computed_at && (now.getTime() - new Date(cached[0].computed_at).getTime()) > CACHE_STALE_DAYS * 86400000)

                // If not stale and not manual refresh, use cache
                if (!isManualRefresh && !isStale && cached.length > 0 && !cancelled) {
                    setState({
                        status: 'success',
                        markets: cached.map(enrich),
                        hsCode,
                        cachedAt: cached[0].computed_at,
                    })
                    return
                }

                // ── 2. Cache miss or Manual Refresh → invoke edge function ──
                if (!cancelled) setState({ status: isManualRefresh ? 'refreshing' : 'fetching_live' })

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
                    const errorMsg = `Edge function failed: ${res.statusText}`
                    if (cached && cached.length > 0) {
                        setState({
                            status: 'success',
                            markets: cached.map(enrich),
                            hsCode,
                            cachedAt: cached[0]?.computed_at ?? new Date().toISOString(),
                            isFallback: true,
                            softError: errorMsg
                        })
                    } else {
                        setState({ status: 'error', message: errorMsg })
                    }
                    return
                }

                // Parse response to check for "soft" errors
                const resData = await res.json().catch(() => ({ ok: false, error: 'Invalid response from server' }))
                if (!resData.ok && !cancelled) {
                    const softError = resData.error || 'Failed to fetch live trade data'
                    console.warn('[useHSDemand] Edge function returned soft error:', softError, resData.debug);
                    if (cached && cached.length > 0) {
                        setState({
                            status: 'success',
                            markets: cached.map(enrich),
                            hsCode,
                            cachedAt: cached[0]?.computed_at ?? new Date().toISOString(),
                            isFallback: true,
                            softError
                        })
                    } else {
                        setState({ status: 'error', message: softError })
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

                    // For manual refresh, we want to make sure computed_at is NEWER than when we started
                    const isNewEnough = !isManualRefresh || (fresh && fresh.length > 0 && new Date(fresh[0].computed_at) > now)

                    if (fresh && fresh.length > 0 && isNewEnough && !cancelled) {
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
                    // If we timed out but have cached data, show it as a fallback
                    const timeoutMsg = 'Data processing timed out. UN Comtrade data may still be processing.'
                    if (cached && cached.length > 0) {
                        setState({
                            status: 'success',
                            markets: cached.map(enrich),
                            hsCode,
                            cachedAt: cached[0].computed_at,
                            isFallback: true,
                            softError: timeoutMsg
                        })
                    } else {
                        setState({ status: 'error', message: timeoutMsg })
                    }
                }

            } catch (err: any) {
                if (!cancelled) {
                    setState({ status: 'error', message: err.message || 'Unknown error' })
                }
            }
        }

        run()
        return () => { cancelled = true }
    }, [hsCode, refreshTrigger])

    return { ...state, refresh }
}
