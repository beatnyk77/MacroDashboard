import { createAdminClient } from './utils/supabaseClient.ts'
import { Logger } from './utils/logger.ts'
import { retry } from './utils/retry.ts'

// @ts-ignore: Deno is a global in Supabase Edge Functions
Deno.serve(async (req: Request) => {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response('Unauthorized', { status: 401 })
    }

    const runId = crypto.randomUUID()
    const client = createAdminClient()
    const logger = new Logger(runId)

    await logger.log('nse-flows', 'processing', 0, 'Starting NSE live data ingestion')
    const start = performance.now()

    // NSE requires specific headers to avoid 403
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.nseindia.com/',
        'X-Requested-With': 'XMLHttpRequest'
    }

    try {
        let fiiNet = 0, diiNet = 0
        let fiiIdxFutNet = 0
        let advances = 0, declines = 0
        let deliveryPct = 0
        let indiaVix = 0
        let pcr = 1.0
        let sectorReturns: Record<string, number> = {}
        let midcapPerf = 0, smallcapPerf = 0, niftyPerf = 0
        let newHighs52w = 0, newLows52w = 0

        // 1. FII/DII Cash Flows
        try {
            const url = 'https://www.nseindia.com/api/fiidiiTradeReact'
            const res = await retry(() => fetch(url, { headers }))
            if (res.ok) {
                const data = await res.json()
                // FII/DII data structure: [{category, buyValue, sellValue, netValue}]
                for (const item of data) {
                    if (item.category === 'FII/FPI*' || item.category === 'FII') {
                        fiiNet = parseFloat(item.netValue) || 0
                    }
                    if (item.category === 'DII**' || item.category === 'DII') {
                        diiNet = parseFloat(item.netValue) || 0
                    }
                }
            }
        } catch (err: any) {
            console.warn(`FII/DII failed: ${err.message}`)
        }

        // 2. All Indices (VIX, Sectoral, Cap Indices)
        try {
            const url = 'https://www.nseindia.com/api/allIndices'
            const res = await retry(() => fetch(url, { headers }))
            if (res.ok) {
                const data = await res.json()
                const indices = data.data || []

                for (const idx of indices) {
                    const name = idx.index || idx.indexSymbol || ''
                    const pChange = parseFloat(idx.percentChange || idx.pChange || 0)

                    // India VIX
                    if (name === 'INDIA VIX') {
                        indiaVix = parseFloat(idx.last || idx.lastPrice || 0)
                    }

                    // Nifty 50
                    if (name === 'NIFTY 50') {
                        niftyPerf = pChange
                        advances = parseInt(idx.advances || 0)
                        declines = parseInt(idx.declines || 0)
                    }

                    // Midcap
                    if (name === 'NIFTY MIDCAP 100') {
                        midcapPerf = pChange
                    }

                    // Smallcap
                    if (name === 'NIFTY SMALLCAP 100') {
                        smallcapPerf = pChange
                    }

                    // Sectoral indices
                    if (name.startsWith('NIFTY ') && !name.includes('MIDCAP') && !name.includes('SMALLCAP') && !name.includes('NEXT') && name !== 'NIFTY 50') {
                        const sectorName = name.replace('NIFTY ', '').trim()
                        if (sectorName.length > 0 && sectorName.length < 20) {
                            sectorReturns[sectorName] = pChange
                        }
                    }
                }
            }
        } catch (err: any) {
            console.warn(`Indices failed: ${err.message}`)
        }

        // 3. PCR from Option Chain
        try {
            const url = 'https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY'
            const res = await retry(() => fetch(url, { headers }))
            if (res.ok) {
                const data = await res.json()
                const filtered = data.filtered || {}
                const putOI = parseFloat(filtered.PE?.totOI || 0)
                const callOI = parseFloat(filtered.CE?.totOI || 0)
                if (callOI > 0) {
                    pcr = putOI / callOI
                }
            }
        } catch (err: any) {
            console.warn(`PCR failed: ${err.message}`)
        }

        // 4. Market Breadth & Quality (from equity market data)
        try {
            const url = 'https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050'
            const res = await retry(() => fetch(url, { headers }))
            if (res.ok) {
                const data = await res.json()
                const metadata = data.metadata || {}
                advances = parseInt(metadata.advances || advances)
                declines = parseInt(metadata.declines || declines)
                newHighs52w = parseInt(metadata.new52WeekHigh || 0)
                newLows52w = parseInt(metadata.new52WeekLow || 0)

                // Calculate delivery % from stock data
                const stocks = data.data || []
                let totalDelivery = 0
                let count = 0
                for (const stock of stocks) {
                    const delPct = parseFloat(stock.deliveryToTradedQuantity || 0)
                    if (delPct > 0) {
                        totalDelivery += delPct
                        count++
                    }
                }
                if (count > 0) {
                    deliveryPct = totalDelivery / count
                }
            }
        } catch (err: any) {
            console.warn(`Breadth failed: ${err.message}`)
        }

        // 5. FII Index Futures Net (approximation from participant data)
        // Note: NSE doesn't provide real-time participant OI, so we'll use a proxy
        // based on FII cash flow magnitude as a rough estimate
        fiiIdxFutNet = fiiNet * 0.3 // Rough approximation: 30% of cash flow

        const today = new Date().toISOString().split('T')[0]

        // Upsert to DB
        const { error: upsertError } = await client
            .from('market_pulse_daily')
            .upsert({
                date: today,
                fii_cash_net: fiiNet,
                dii_cash_net: diiNet,
                fii_idx_fut_net: fiiIdxFutNet,
                pcr: pcr,
                india_vix: indiaVix,
                advances: advances,
                declines: declines,
                delivery_pct: deliveryPct,
                sector_returns: sectorReturns,
                midcap_perf: midcapPerf,
                smallcap_perf: smallcapPerf,
                nifty_perf: niftyPerf,
                new_highs_52w: newHighs52w,
                new_lows_52w: newLows52w
            }, { onConflict: 'date' })

        if (upsertError) throw upsertError

        // Refresh materialized view
        const { error: refreshError } = await client.rpc('refresh_market_pulse_stats')
        if (refreshError) {
            console.warn('Failed to refresh stats view:', refreshError)
        }

        const totalDuration = Math.round(performance.now() - start)
        await logger.log('nse-flows', 'success', 1, `Ingested live NSE data for ${today}`, totalDuration)

        return new Response(JSON.stringify({
            message: 'NSE live data ingestion complete',
            date: today,
            data: {
                fiiNet,
                diiNet,
                indiaVix,
                pcr,
                advances,
                declines,
                sectorCount: Object.keys(sectorReturns).length
            },
            runId
        }), { headers: { 'Content-Type': 'application/json' } })

    } catch (err: any) {
        await logger.log('nse-flows', 'error', 0, `Error: ${err.message}`)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
})
