import { createClient, SupabaseClient } from '@supabase/supabase-js'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── ISO3 → ISO2 for joining with country_metrics (which uses alpha-2) ──
const ISO3_TO_ISO2: Record<string, string> = {
    'USA': 'US', 'CHN': 'CN', 'DEU': 'DE', 'GBR': 'GB', 'FRA': 'FR',
    'IND': 'IN', 'JPN': 'JP', 'KOR': 'KR', 'NLD': 'NL', 'ITA': 'IT',
    'CAN': 'CA', 'AUS': 'AU', 'MEX': 'MX', 'BRA': 'BR', 'TUR': 'TR',
    'VNM': 'VN', 'THA': 'TH', 'IDN': 'ID', 'MYS': 'MY', 'PHL': 'PH',
    'ZAF': 'ZA', 'EGY': 'EG', 'NGA': 'NG', 'SAU': 'SA', 'ARE': 'AE',
    'PAK': 'PK', 'BGD': 'BD', 'LKA': 'LK', 'POL': 'PL', 'SWE': 'SE',
    'NOR': 'NO', 'DNK': 'DK', 'FIN': 'FI', 'CHE': 'CH', 'AUT': 'AT',
    'BEL': 'BE', 'PRT': 'PT', 'ESP': 'ES', 'GRC': 'GR', 'ROU': 'RO',
    'CZE': 'CZ', 'HUN': 'HU', 'SGP': 'SG', 'HKG': 'HK', 'TWN': 'TW',
    'NZL': 'NZ', 'ISR': 'IL', 'QAT': 'QA', 'KWT': 'KW',
    'RUS': 'RU', 'ARG': 'AR', 'COL': 'CO', 'CHL': 'CL', 'PER': 'PE',
}

// ── Scoring helpers ──────────────────────────────────────────────────────────

/** Market size: log scale, USD 0 → 0, USD 50B → 100 */
function scoreMarketSize(usd: number): number {
    if (!usd || usd <= 0) return 0
    const maxLog = Math.log10(50_000_000_000) // 50B
    const score = (Math.log10(usd) / maxLog) * 100
    return Math.min(100, Math.max(0, Math.round(score)))
}

/** Growth: CAGR mapped → 0 (< -5%) to 100 (> +15%) */
function scoreGrowth(cagr: number | null): number {
    if (cagr === null || isNaN(cagr)) return 50 // neutral if unknown
    if (cagr >= 15) return 100
    if (cagr <= -5) return 0
    return Math.round(((cagr + 5) / 20) * 100)
}



/** Macro: GDP growth + FX stability composite from country_metrics */
function scoreMacro(gdpGrowth: number | null, fxVolatility: number | null): number {
    const gdpScore = gdpGrowth !== null
        ? Math.min(100, Math.max(0, 50 + gdpGrowth * 10))
        : 50
    const fxScore = fxVolatility !== null
        ? Math.min(100, Math.max(0, 100 - fxVolatility * 10))
        : 50
    return Math.round(gdpScore * 0.6 + fxScore * 0.4)
}

/** Volatility: coefficient of variation (lower = more stable = higher score) */
function scoreVolatility(values: number[]): number {
    if (values.length < 2) return 70 // assume moderate if insufficient data
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    if (mean === 0) return 50
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length
    const cv = Math.sqrt(variance) / mean // coefficient of variation
    return Math.round(Math.max(0, 100 - cv * 100))
}

/** 5-year CAGR from ordered array of annual values (oldest first) */
function computeCAGR(values: number[]): number | null {
    if (values.length < 2) return null
    const first = values[0]
    const last = values[values.length - 1]
    const years = values.length - 1
    if (first <= 0) return null
    return (Math.pow(last / first, 1 / years) - 1) * 100
}



async function logIngestion(supabase: SupabaseClient, status: string, meta: object) {
    try {
        await supabase.from('ingestion_logs').insert({
            function_name: 'compute-hs-opportunity-scores',
            status,
            metadata: meta,
            start_time: new Date().toISOString(),
        })
    } catch (_) { /* non-blocking */ }
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Supabase configuration (URL/Key)")
        }

        const supabase = createClient(supabaseUrl, supabaseKey)
        const url = new URL(req.url)
        const hsCode = url.searchParams.get('hsCode') || '620342'

        console.log(`[compute-hs-opportunity-scores] Computing for HS ${hsCode}`)

        // ── 1. Get all reporters and years from trade_demand_cache ──
        const { data: demandRows, error: demandErr } = await supabase
            .from('trade_demand_cache')
            .select('reporter_iso3, reporter_iso2, reporter_name, year, import_value_usd')
            .eq('hs_code', hsCode)
            .order('reporter_iso3')
            .order('year')

        if (demandErr) throw demandErr
        if (!demandRows || demandRows.length === 0) {
            console.warn(`[compute-hs-opportunity-scores] No demand data found for HS ${hsCode}`)
            return new Response(JSON.stringify({ ok: false, message: 'No demand data found. Run fetch-hs-demand first.' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        console.log(`[compute-hs-opportunity-scores] Found ${demandRows.length} demand rows`)

        // Group demand rows by reporter
        const byReporter: Record<string, { iso2: string | null; name: string | null; yearlyValues: { year: number; usd: number }[] }> = {}
        for (const row of demandRows) {
            if (!byReporter[row.reporter_iso3]) {
                byReporter[row.reporter_iso3] = {
                    iso2: row.reporter_iso2 || ISO3_TO_ISO2[row.reporter_iso3] || null,
                    name: row.reporter_name,
                    yearlyValues: [],
                }
            }
            byReporter[row.reporter_iso3].yearlyValues.push({ year: row.year, usd: row.import_value_usd || 0 })
        }



        // ── 3. Get macro data from country_metrics ──
        const isoList = Object.values(byReporter)
            .map(r => r.iso2)
            .filter(Boolean) as string[]

        const { data: macroRows } = await supabase
            .from('country_metrics')
            .select('iso, metric_key, value')
            .in('iso', isoList)
            .in('metric_key', ['gdp_yoy_pct', 'fx_volatility_pct', 'cpi_yoy_pct'])

        // Build macro lookup: iso2 → { gdp, fx }
        const macroByIso: Record<string, { gdp: number | null; fx: number | null }> = {}
        for (const row of (macroRows || [])) {
            if (!macroByIso[row.iso]) macroByIso[row.iso] = { gdp: null, fx: null }
            if (row.metric_key === 'gdp_yoy_pct') macroByIso[row.iso].gdp = row.value
            if (row.metric_key === 'fx_volatility_pct') macroByIso[row.iso].fx = row.value
        }

        // ── 4. Compute scores per reporter ──
        const scoreRows = []

        for (const [iso3, data] of Object.entries(byReporter)) {
            const sorted = [...data.yearlyValues].sort((a, b) => a.year - b.year)
            const values = sorted.map(v => v.usd)
            const latestValue = values[values.length - 1] || 0

            // Market size
            const marketSizeScore = scoreMarketSize(latestValue)

            // Growth (5yr CAGR)
            const last5 = sorted.slice(-6) // up to 6 points for 5yr CAGR
            const cagr = computeCAGR(last5.map(v => v.usd))
            const growthScore = scoreGrowth(cagr)

            // Volatility
            const volatilityScore = scoreVolatility(values)

            const latestYear = Math.max(...demandRows.map(r => r.year))

            // Macro overlay
            const iso2 = data.iso2
            const macro = iso2 ? macroByIso[iso2] : null
            const macroScoreVal = scoreMacro(macro?.gdp ?? null, macro?.fx ?? null)

            // Weighted overall
            const overall = Math.round(
                marketSizeScore * 0.30 +
                growthScore * 0.30 +
                macroScoreVal * 0.25 +
                volatilityScore * 0.15
            )

            scoreRows.push({
                hs_code: hsCode,
                reporter_iso3: iso3,
                reporter_iso2: iso2,
                reporter_name: data.name,
                market_size_score: marketSizeScore,
                growth_score: growthScore,
                macro_score: macroScoreVal,
                volatility_score: volatilityScore,
                overall_score: overall,
                competition_score: null, // Removed in Phase 1
                hhi: null,
                top_supplier_iso3: null,
                top_supplier_share: null,
                latest_import_usd: latestValue,
                cagr_5yr_pct: cagr !== null ? parseFloat(cagr.toFixed(3)) : null,
                data_year: latestYear,
                computed_at: new Date().toISOString(),
            })
        }

        if (scoreRows.length === 0) {
            console.warn(`[compute-hs-opportunity-scores] No scorable markets for HS ${hsCode}`)
            return new Response(JSON.stringify({ ok: false, message: 'No scorable markets found.' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        console.log(`[compute-hs-opportunity-scores] Upserting ${scoreRows.length} scores`)

        // ── 5. Upsert scores ──
        const { error: upsertErr } = await supabase
            .from('hs_opportunity_scores')
            .upsert(scoreRows, { onConflict: 'hs_code,reporter_iso3' })

        if (upsertErr) throw upsertErr

        await logIngestion(supabase, 'success', { hsCode, scored: scoreRows.length })

        return new Response(JSON.stringify({
            ok: true,
            hsCode,
            scored: scoreRows.length,
            topMarkets: scoreRows
                .sort((a, b) => b.overall_score - a.overall_score)
                .slice(0, 5)
                .map(r => ({ country: r.reporter_iso3, score: r.overall_score, usd: r.latest_import_usd })),
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (err) {
        console.error('[compute-hs-opportunity-scores] Global catch:', err)
        
        // Try to log failure
        try {
            const supabaseUrl = Deno.env.get('SUPABASE_URL')
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
            if (supabaseUrl && supabaseKey) {
                const supabase = createClient(supabaseUrl, supabaseKey)
                const hsCode = new URL(req.url).searchParams.get('hsCode') || 'unknown'
                await supabase.from('ingestion_logs').insert({
                    function_name: 'compute-hs-opportunity-scores',
                    status: 'failed',
                    metadata: { hsCode, error: String(err) },
                    start_time: new Date().toISOString()
                })
            }
        } catch (_) { /* ignore */ }

        return new Response(JSON.stringify({ 
            ok: false, 
            error: String(err),
            details: "Critical failure in compute-hs-opportunity-scores."
        }), {
            status: 200, // Fail soft
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
