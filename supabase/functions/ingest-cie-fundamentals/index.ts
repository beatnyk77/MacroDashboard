import { createAdminClient } from './utils/supabaseClient.ts'

Deno.serve(async (req: Request) => {
    // Only allow authorized requests
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response('Unauthorized', { status: 401 })
    }

    const client = createAdminClient()
    const tickers = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'INFY.NS', 'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS']

    console.log(`Starting fundamentals ingestion for ${tickers.length} tickers...`)

    const results = []

    for (const ticker of tickers) {
        try {
            // Yahoo Finance v10 API
            const response = await fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=financialData,incomeStatementHistoryQuarterly,balanceSheetHistoryQuarterly,defaultKeyStatistics`)

            if (!response.ok) {
                console.error(`Failed to fetch for ${ticker}: ${response.statusText}`)
                continue
            }

            const data = await response.json()
            const summary = data.quoteSummary.result[0]

            if (!summary) continue

            const financialData = summary.financialData || {}
            const incomeStatement = summary.incomeStatementHistoryQuarterly?.incomeStatementHistory?.[0] || {}
            const balanceSheet = summary.balanceSheetHistoryQuarterly?.balanceSheetStatements?.[0] || {}
            const keyStats = summary.defaultKeyStatistics || {}

            const companyName = ticker.split('.')[0]

            // 1. Get or Create Company
            const { data: company, error: companyError } = await client
                .from('cie_companies')
                .upsert({
                    ticker: ticker,
                    name: companyName, // In a real app we'd get the full name from the API
                    exchange: 'NSE'
                }, { onConflict: 'ticker' })
                .select()
                .single()

            if (companyError || !company) {
                console.error(`Company error for ${ticker}:`, companyError)
                continue
            }

            // 2. Insert Fundamentals
            const quarterDate = incomeStatement.endDate?.fmt || new Date().toISOString().split('T')[0]

            const { error: fundError } = await client
                .from('cie_fundamentals')
                .upsert({
                    company_id: company.id,
                    quarter_date: quarterDate,
                    revenue: incomeStatement.totalRevenue?.raw,
                    net_profit: incomeStatement.netIncome?.raw,
                    ebitda: incomeStatement.ebitda?.raw,
                    capex: financialData.capitalExpenditure?.raw || 0,
                    eps: incomeStatement.dilutedEPS?.raw,
                    operating_margin: financialData.operatingMargins?.raw,
                    debt_equity_ratio: financialData.debtToEquity?.raw,
                    return_on_equity: financialData.returnOnEquity?.raw,
                    metadata: {
                        sector: keyStats.sector,
                        industry: keyStats.industry,
                        price_to_book: keyStats.priceToBook?.raw
                    }
                }, { onConflict: 'company_id,quarter_date' })

            if (fundError) {
                console.error(`Fundamentals error for ${ticker}:`, fundError)
            } else {
                results.push(ticker)
            }

            // Random delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 1000))

        } catch (error) {
            console.error(`Unexpected error for ${ticker}:`, error)
        }
    }

    return new Response(JSON.stringify({
        success: true,
        processed: results.length,
        tickers: results
    }), {
        headers: { 'Content-Type': 'application/json' }
    })
})
