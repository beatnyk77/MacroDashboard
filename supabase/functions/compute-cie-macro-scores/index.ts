import { createAdminClient } from './utils/supabaseClient.ts'

Deno.serve(async (req: Request) => {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response('Unauthorized', { status: 401 })
    }

    const client = createAdminClient()

    // 1. Fetch all companies and their latest fundamentals
    const { data: companies, error: compError } = await client
        .from('cie_companies')
        .select(`
            *,
            cie_fundamentals (*)
        `)

    if (compError) {
        return new Response(JSON.stringify({ error: compError.message }), { status: 500 })
    }

    // 2. Fetch Macro Benchmarks
    const { data: stateHealth } = await client.from('india_state_fiscal_health').select('*').order('date', { ascending: false }).limit(30)
    const { data: digiPremium } = await client.from('india_digitization_premium').select('*').order('date', { ascending: false }).limit(1)

    const results = []

    for (const company of companies) {
        const fundamentals = company.cie_fundamentals?.[0] || {}
        const metadata = fundamentals.metadata || {}

        // --- PROPRIETARY LOGIC ---

        // 1. Formalization Premium (Based on sector and digitization trends)
        let formalization = 50
        if (['Technology', 'Financial Services', 'Consumer Defensive'].includes(metadata.sector)) {
            formalization += 20 // These sectors benefit more from UPI/GST
        }
        if (digiPremium?.[0]?.upi_volume_bn > 10) {
            formalization += 10 // High macro digitization lift
        }

        // 2. Oil Sensitivity (High for manufacturing/energy)
        let oilSens = 50
        if (['Energy', 'Basic Materials', 'Industrials'].includes(metadata.sector)) {
            oilSens += 30
        }

        // 3. State Resilience (Derived from HQ state fiscal health)
        let stateRes = 50
        const hqState = company.state_hq || 'Maharashtra' // Fallback
        const stateData = stateHealth?.find(s => s.state_name === hqState)
        if (stateData) {
            // Lower debt-to-gsdp means higher resilience
            stateRes = 100 - (stateData.debt_to_gsdp || 30)
        }

        // 4. Final Macro Impact Score
        const macroImpact = Math.round((formalization + (100 - oilSens) + stateRes) / 3)

        // 5. Upsert Score
        const { error: scoreError } = await client
            .from('cie_macro_signals')
            .upsert({
                company_id: company.id,
                as_of_date: new Date().toISOString().split('T')[0],
                macro_impact_score: macroImpact,
                formalization_premium: formalization,
                oil_sensitivity: oilSens,
                state_resilience: stateRes,
                digitization_premium: digiPremium?.[0]?.rbi_dpi_index || 70,
                state_exposure_json: { primary_state: hqState, fiscal_debt_to_gsdp: stateData?.debt_to_gsdp }
            }, { onConflict: 'company_id,as_of_date' })

        if (!scoreError) {
            results.push({ ticker: company.ticker, score: macroImpact })
        }
    }

    return new Response(JSON.stringify({
        success: true,
        calculated: results.length,
        samples: results.slice(0, 5)
    }), {
        headers: { 'Content-Type': 'application/json' }
    })
})
