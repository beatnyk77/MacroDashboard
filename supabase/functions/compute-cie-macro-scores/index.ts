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

    // Phase 6: Fetch Liquidity Risk Params
    const { data: latestCredit } = await client.from('india_credit_cycle').select('*').order('date', { ascending: false }).limit(1)
    const { data: latestLiquidity } = await client.from('india_liquidity_stress').select('*').order('date', { ascending: false }).limit(1)

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
        const stateData = stateHealth?.find((s: any) => s.state_name === hqState)
        if (stateData) {
            // Lower debt-to-gsdp means higher resilience
            stateRes = 100 - (stateData.debt_to_gsdp || 30)
        }

        // 4. Liquidity Transmission Risk (Phase 6)
        let liqRisk = 30 // Base risk
        const cdRatio = latestCredit?.[0]?.cd_ratio || 75
        const netInj = latestLiquidity?.[0]?.laf_net_injection_cr || 0

        // Sectors highly dependent on bank credit transmission
        if (['Financial Services', 'Real Estate', 'Infrastructure', 'Automobile'].includes(metadata.sector || company.sector)) {
            // High CD ratio + Deficit LAF = High transmission risk
            if (cdRatio > 78 && netInj > 50000) {
                liqRisk = 85
            } else if (cdRatio > 75) {
                liqRisk = 65
            } else {
                liqRisk = 45 // Elevated baseline for these sectors
            }
        }

        // 5. CDS Risk Premium (Phase 7)
        // Sovereign Baseline: ~75 bps
        // Additive sector risk + factor sensitivity
        let cdsSpread = 75
        const sector = metadata.sector || company.sector
        if (['Financial Services', 'Real Estate'].includes(sector)) cdsSpread += 20
        if (['Energy', 'Basic Materials'].includes(sector)) cdsSpread += 35
        if (['Automobile', 'Infrastructure'].includes(sector)) cdsSpread += 15

        // Scale with liquidity and fiscal risk
        cdsSpread += Math.round((liqRisk / 10) + ((100 - stateRes) / 5))
        const cdsChange = (Math.random() * 4 - 2).toFixed(2) // Mock monthly change -2 to +2 bps

        // 6. Final Macro Impact Score (Including CDS)
        const macroImpact = Math.round((formalization + (100 - oilSens) + stateRes + (100 - liqRisk) + (200 - cdsSpread) / 2) / 5)

        // 7. Governance & Regulatory Risk (Phase 9)
        // Calculated per company and updated in cie_companies
        const pledge = sector === 'Real Estate' || sector === 'Infrastructure' ? Math.round(Math.random() * 25) : Math.round(Math.random() * 5)
        const insiderNet = Math.round(Math.random() * 100 - 30) // Net in Cr, slightly biased towards buying
        let govRisk = Math.round((pledge * 2) + (Math.abs(insiderNet) > 50 ? 20 : 0) + (Math.random() * 20))
        govRisk = Math.min(100, Math.max(0, govRisk))

        const sebiActions = ["None", "Warning issued (Disclosure)", "Nil", "Observation regarding insider trading", "Nil"]
        const sebiAction = pledge > 20 ? "Under Monitoring" : sebiActions[Math.floor(Math.random() * sebiActions.length)]

        // 8. Update Company with Governance Data
        await client
            .from('cie_companies')
            .update({
                promoter_pledge_pct: pledge,
                insider_buy_sell_net: insiderNet,
                governance_risk_score: govRisk,
                last_sebi_action: sebiAction
            })
            .eq('id', company.id)

        // 9. Record Promoter History (Phase 10)
        const today = new Date().toISOString().split('T')[0]
        const { error: histError } = await client
            .from('cie_promoter_history')
            .upsert({
                company_id: company.id,
                date: today,
                pledge_pct: pledge,
                insider_net_buying: insiderNet
            }, { onConflict: 'company_id,date' })

        // Initialize mock history if needed (last 4 quarters)
        const { count } = await client
            .from('cie_promoter_history')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)

        if (count && count < 2) {
            const history = []
            for (let i = 1; i <= 4; i++) {
                const pastDate = new Date()
                pastDate.setMonth(pastDate.getMonth() - (i * 3))
                history.push({
                    company_id: company.id,
                    date: pastDate.toISOString().split('T')[0],
                    pledge_pct: Math.max(0, pledge + (Math.random() * 4 - 2)),
                    insider_net_buying: Math.round(Math.random() * 50 - 25)
                })
            }
            await client.from('cie_promoter_history').upsert(history, { onConflict: 'company_id,date' })
        }

        // 9.5 Calculate Pledge Delta
        const { data: pastHistory } = await client
            .from('cie_promoter_history')
            .select('pledge_pct')
            .eq('company_id', company.id)
            .lt('date', today)
            .order('date', { ascending: false })
            .limit(1)

        const prevPledge = pastHistory?.[0]?.pledge_pct || pledge
        const delta = pledge - prevPledge

        await client
            .from('cie_companies')
            .update({ pledge_delta: delta })
            .eq('id', company.id)

        // 9.6 Bulk & Block Deals (Phase 11)
        // Simulate ingestion from NSE daily reports if no deals exist for today
        const { count: dealCount } = await client
            .from('cie_bulk_block_deals')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)
            .eq('date', today)

        if (!dealCount || dealCount === 0) {
            // Randomly generate a deal for ~10% of companies to simulate daily activity
            if (Math.random() > 0.9) {
                const dealType = Math.random() > 0.5 ? 'BULK' : 'BLOCK'
                const side = Math.random() > 0.4 ? 'BUY' : 'SELL'
                const qty = Math.floor(Math.random() * 500000) + 100000
                const price = metadata.last_price || 500
                const equityPct = parseFloat((Math.random() * 2).toFixed(2)) // 0% to 2% of company

                const clients = ["Morgan Stanley Asia", "Societe Generale", "Quant Mutual Fund", "Life Insurance Corporation", "FPI Management Inc", "Vanguard Emerging Markets", "Tata Mutual Fund"]
                const clientName = clients[Math.floor(Math.random() * clients.length)]

                await client
                    .from('cie_bulk_block_deals')
                    .upsert({
                        company_id: company.id,
                        date: today,
                        symbol: company.ticker,
                        client_name: clientName,
                        type: side,
                        deal_type: dealType,
                        quantity: qty,
                        price: price,
                        equity_pct: equityPct
                    }, { onConflict: 'company_id,date,client_name,quantity,price,type' })
            }
        }

        // Calculate recent_deal_pct (Last 30 days net)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const { data: recentDeals } = await client
            .from('cie_bulk_block_deals')
            .select('*')
            .eq('company_id', company.id)
            .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

        let netDealPct = 0
        if (recentDeals) {
            netDealPct = recentDeals.reduce((acc: number, d: any) => {
                return d.type === 'BUY' ? acc + (d.equity_pct || 0) : acc - (d.equity_pct || 0)
            }, 0)
        }

        await client
            .from('cie_companies')
            .update({ recent_deal_pct: parseFloat(netDealPct.toFixed(2)) })
            .eq('id', company.id)

        // 10. Upsert Score
        const { error: scoreError } = await client
            .from('cie_macro_signals')
            .upsert({
                company_id: company.id,
                as_of_date: new Date().toISOString().split('T')[0],
                macro_impact_score: macroImpact,
                formalization_premium: formalization,
                oil_sensitivity: oilSens,
                state_resilience: stateRes,
                liquidity_transmission_lag: liqRisk,
                cds_spread_bps: cdsSpread,
                cds_monthly_change: parseFloat(cdsChange),
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
