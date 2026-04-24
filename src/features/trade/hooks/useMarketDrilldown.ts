import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { SupplierBreakdown, TrendPoint } from '../types/trade'

interface MarketDrilldown {
    trend: TrendPoint[]
    suppliers: SupplierBreakdown[]
    macroMetrics: { metric_key: string; value: number | null; as_of: string | null }[]
    loading: boolean
    error: string | null
}

export function useMarketDrilldown(hsCode: string | null, reporterIso3: string | null, reporterIso2: string | null) {
    const [data, setData] = useState<MarketDrilldown>({
        trend: [],
        suppliers: [],
        macroMetrics: [],
        loading: false,
        error: null,
    })

    useEffect(() => {
        if (!hsCode || !reporterIso3) return
        let cancelled = false

        const run = async () => {
            setData(prev => ({ ...prev, loading: true, error: null }))

            try {
                // ── Parallel fetch: trend + suppliers + macro ──
                const [trendRes, supplierRes, macroRes] = await Promise.all([
                    // 5-year import trend
                    supabase
                        .from('trade_demand_cache')
                        .select('year, import_value_usd')
                        .eq('hs_code', hsCode)
                        .eq('reporter_iso3', reporterIso3)
                        .order('year', { ascending: true })
                        .limit(10),

                    // Supplier breakdown — latest year
                    supabase
                        .from('trade_supplier_breakdown')
                        .select('hs_code, reporter_iso3, partner_iso3, partner_name, year, import_value_usd, market_share_pct')
                        .eq('hs_code', hsCode)
                        .eq('reporter_iso3', reporterIso3)
                        .order('import_value_usd', { ascending: false })
                        .limit(20),

                    // Macro metrics from country_metrics (using iso2)
                    reporterIso2
                        ? supabase
                            .from('country_metrics')
                            .select('metric_key, value, as_of')
                            .eq('iso', reporterIso2)
                            .in('metric_key', [
                                'gdp_yoy_pct', 'gdp_usd_bn', 'cpi_yoy_pct',
                                'fx_volatility_pct', 'ca_pct_gdp', 'unemployment_pct',
                                'reserves_usd_bn', 'manufacturing_pmi',
                            ])
                        : Promise.resolve({ data: [], error: null }),
                ])

                if (cancelled) return

                if (trendRes.error) throw trendRes.error
                if (supplierRes.error) throw supplierRes.error

                const trend: TrendPoint[] = (trendRes.data || []).map(r => ({
                    year: r.year,
                    import_value_usd: r.import_value_usd || 0,
                }))

                const suppliers: SupplierBreakdown[] = supplierRes.data || []

                const macroMetrics = (macroRes.data || []).map(r => ({
                    metric_key: r.metric_key,
                    value: r.value,
                    as_of: r.as_of,
                }))

                setData({ trend, suppliers, macroMetrics, loading: false, error: null })

            } catch (err: any) {
                if (!cancelled) {
                    setData(prev => ({ ...prev, loading: false, error: err.message || 'Failed to load market data' }))
                }
            }
        }

        run()
        return () => { cancelled = true }
    }, [hsCode, reporterIso3, reporterIso2])

    return data
}
