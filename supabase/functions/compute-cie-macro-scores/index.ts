import { createClient } from '@supabase/supabase-js'

// @ts-ignore
Deno.serve(async (req: Request) => {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response('Unauthorized', { status: 401 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const functionName = 'compute-cie-macro-scores'
    const start = new Date().toISOString()

    try {
        const { data: companies, error: companiesError } = await supabase
            .from('cie_companies')
            .select('id, ticker')

        if (companiesError) throw companiesError

        let processed = 0
        const results = []

        for (const company of companies) {
            // Fetch fundamentals for the last 2 quarters
            const { data: fundamentals, error: fundError } = await supabase
                .from('cie_fundamentals')
                .select('*')
                .eq('company_id', company.id)
                .order('quarter_date', { ascending: false })
                .limit(2)

            if (fundError || !fundamentals || fundamentals.length === 0) continue

            const latest = fundamentals[0]
            const prev = fundamentals[1]

            // === Growth Score (0-100) — revenue + profit momentum ===
            let growthScore = 50
            if (prev && prev.revenue > 0) {
                const revGrowth = (latest.revenue - prev.revenue) / prev.revenue
                const profitGrowth = prev.net_profit > 0 ? (latest.net_profit - prev.net_profit) / prev.net_profit : 0
                growthScore = Math.min(100, Math.max(0, 50 + (revGrowth * 100) + (profitGrowth * 50)))
            }

            // === Quality Score (0-100) — ROE, margin, leverage ===
            const roe = latest.return_on_equity || 0
            const margin = latest.operating_margin || 0
            const debtEq = latest.debt_equity_ratio || 0
            const qualityScore = Math.min(100, Math.max(0,
                (roe * 200) +      // ROE 20% => 40 pts
                (margin * 100) +   // Op Margin 20% => 20 pts
                (debtEq < 1 ? 40 : debtEq < 2 ? 20 : 5) // Leverage penalty
            ))

            // === Composite macro_impact_score ===
            const momentumBaseline = 60
            const macroImpactScore = Math.round(
                (growthScore * 0.4) + (qualityScore * 0.4) + (momentumBaseline * 0.2)
            )

            // === Sector-specific signal heuristics ===
            // state_resilience: high for infra, banking; lower for pure consumer/IT
            const meta = latest.metadata || {}
            const sector = meta.sector || ''
            const stateResilience = (['Financial Services', 'Energy', 'Industrials'].includes(sector)) ? 70 :
                                   (['Technology', 'Consumer Defensive'].includes(sector)) ? 40 : 55

            // oil_sensitivity: higher for energy/chemicals, lower for IT
            const oilSensitivity = (['Energy'].includes(sector)) ? 85 :
                                   (['Technology', 'Financial Services'].includes(sector)) ? 20 : 50

            // formalization_premium: higher for large-cap, digital-first sectors
            const mcap = meta.market_cap || 0
            const formalizationPremium = mcap > 500_000_000_000 ? 80 :
                                         mcap > 100_000_000_000 ? 60 : 40

            // fiscal_exposure: proxy via capex-intensity
            const capex = latest.capex || 0
            const ebitda = latest.ebitda || 1
            const fiscalExposure = Math.min(100, (capex / ebitda) * 100)

            await supabase.from('cie_macro_signals').upsert({
                company_id: company.id,
                as_of_date: new Date().toISOString().split('T')[0],
                macro_impact_score: macroImpactScore,
                state_resilience: stateResilience,
                fiscal_exposure: fiscalExposure,
                oil_sensitivity: oilSensitivity,
                formalization_premium: formalizationPremium,
                digitization_premium: sector === 'Technology' ? 85 : 45,
                state_exposure_json: { sector, capex_intensity: (capex / ebitda).toFixed(2) }
            }, { onConflict: 'company_id,as_of_date' })

            processed++
            results.push({ ticker: company.ticker, score: macroImpactScore })
        }

        await supabase.from('ingestion_logs').insert({
            function_name: functionName,
            status: 'success',
            rows_inserted: processed,
            start_time: start,
            completed_at: new Date().toISOString(),
            status_code: 200
        })

        return new Response(JSON.stringify({ success: true, processed, results }), {
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        await supabase.from('ingestion_logs').insert({
            function_name: functionName,
            status: 'failed',
            error_message: error.message,
            start_time: start,
            completed_at: new Date().toISOString(),
            status_code: 500
        })
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
