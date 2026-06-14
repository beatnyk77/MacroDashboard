/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

async function doIngest(supabase: ReturnType<typeof createClient>): Promise<IngestResult> {
    const { data: companies, error: companiesError } = await supabase
        .from('cie_companies')
        .select('id, ticker')
    if (companiesError) throw companiesError

    let processed = 0
    const results = []

    for (const company of companies) {
        const { data: fundamentals, error: fundError } = await supabase
            .from('cie_fundamentals')
            .select('*')
            .eq('company_id', company.id)
            .order('quarter_date', { ascending: false })
            .limit(2)

        if (fundError || !fundamentals || fundamentals.length === 0) continue

        const latest = fundamentals[0]
        const prev = fundamentals[1]

        let growthScore = 50
        if (prev && prev.revenue > 0) {
            const revGrowth = (latest.revenue - prev.revenue) / prev.revenue
            const profitGrowth = prev.net_profit > 0 ? (latest.net_profit - prev.net_profit) / prev.net_profit : 0
            growthScore = Math.min(100, Math.max(0, 50 + (revGrowth * 100) + (profitGrowth * 50)))
        }

        const roe = latest.return_on_equity || 0
        const margin = latest.operating_margin || 0
        const debtEq = latest.debt_equity_ratio || 0
        const qualityScore = Math.min(100, Math.max(0,
            (roe * 200) + (margin * 100) + (debtEq < 1 ? 40 : debtEq < 2 ? 20 : 5)
        ))

        const momentumBaseline = 60
        const macroImpactScore = Math.round(
            (growthScore * 0.4) + (qualityScore * 0.4) + (momentumBaseline * 0.2)
        )

        const meta = latest.metadata || {}
        const sector = meta.sector || ''
        const stateResilience = (['Financial Services', 'Energy', 'Industrials'].includes(sector)) ? 70 :
                               (['Technology', 'Consumer Defensive'].includes(sector)) ? 40 : 55
        const oilSensitivity = (['Energy'].includes(sector)) ? 85 :
                               (['Technology', 'Financial Services'].includes(sector)) ? 20 : 50
        const mcap = meta.market_cap || 0
        const formalizationPremium = mcap > 500_000_000_000 ? 80 : mcap > 100_000_000_000 ? 60 : 40
        const capex = latest.capex || 0
        const ebitda = latest.ebitda || 1
        const fiscalExposure = Math.min(100, (capex / ebitda) * 100)

        try {
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
        } catch (rowErr: any) {
            console.warn('Failed to upsert macro signal row:', rowErr.message);
        }
    }

    return { ok: true, counts: { upserted: processed, skipped: companies.length - processed }, meta: { results } }
}

serveIngest('compute-cie-macro-scores', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    return doIngest(supabase)
}, { timeoutMs: 15 * 60 * 1000, retries: 3 })
