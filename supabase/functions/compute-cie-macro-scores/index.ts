import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

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

            // Calculate Growth Score (0-100)
            let growthScore = 50
            if (prev) {
                const revGrowth = prev.revenue > 0 ? (latest.revenue - prev.revenue) / prev.revenue : 0
                const profitGrowth = prev.net_profit > 0 ? (latest.net_profit - prev.net_profit) / prev.net_profit : 0
                growthScore = Math.min(100, Math.max(0, 50 + (revGrowth * 100) + (profitGrowth * 50)))
            }

            // Calculate Quality Score (0-100)
            const qualityScore = Math.min(100, Math.max(0,
                (latest.return_on_equity * 200) + // ROE 20% -> 40 pts
                (latest.operating_margin * 100) + // Margin 20% -> 20 pts
                (latest.debt_equity_ratio < 1 ? 40 : 10) // Low debt -> 40 pts
            ))

            // Calculate Momentum Score (Price relative to moving average - simplified)
            const momentumScore = 60 // Baseline

            const totalScore = (growthScore * 0.4) + (qualityScore * 0.4) + (momentumScore * 0.2)

            await supabase.from('cie_macro_signals').upsert({
                company_id: company.id,
                as_of_date: new Date().toISOString().split('T')[0],
                growth_score: growthScore,
                quality_score: qualityScore,
                momentum_score: momentumScore,
                total_macro_score: totalScore
            }, { onConflict: 'company_id,as_of_date' })

            processed++
            results.push({ ticker: company.ticker, score: totalScore })
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
