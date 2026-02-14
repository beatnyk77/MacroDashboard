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

    // Parse date range from request body
    let startDate = new Date()
    let endDate = new Date()

    try {
        const body = await req.json() as any
        if (body.startDate) {
            startDate = new Date(body.startDate)
        }
        if (body.endDate) {
            endDate = new Date(body.endDate)
        }
    } catch (e) {
        // No body or invalid JSON, use today as default
    }

    await logger.log('nse-flows', 'processing', 0, `Starting NSE ingestion: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)
    const start = performance.now()

    // NSE requires specific headers to avoid 403
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.nseindia.com/',
        'X-Requested-With': 'XMLHttpRequest'
    }

    const processedDates: string[] = []
    const skippedDates: string[] = []
    let currentDate = new Date(startDate)

    while (currentDate <= endDate) {
        // Skip weekends
        const dayOfWeek = currentDate.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            currentDate.setDate(currentDate.getDate() + 1)
            continue
        }

        const dateStr = currentDate.toISOString().split('T')[0]

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
                console.warn(`FII/DII failed for ${dateStr}: ${err.message}`)
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

                        if (name === 'INDIA VIX') {
                            indiaVix = parseFloat(idx.last || idx.lastPrice || 0)
                        }

                        if (name === 'NIFTY 50') {
                            niftyPerf = pChange
                            advances = parseInt(idx.advances || 0)
                            declines = parseInt(idx.declines || 0)
                        }

                        if (name === 'NIFTY MIDCAP 100') {
                            midcapPerf = pChange
                        }

                        if (name === 'NIFTY SMALLCAP 100') {
                            smallcapPerf = pChange
                        }

                        if (name.startsWith('NIFTY ') && !name.includes('MIDCAP') && !name.includes('SMALLCAP') && !name.includes('NEXT') && name !== 'NIFTY 50') {
                            const sectorName = name.replace('NIFTY ', '').trim()
                            if (sectorName.length > 0 && sectorName.length < 20) {
                                sectorReturns[sectorName] = pChange
                            }
                        }
                    }
                }
            } catch (err: any) {
                console.warn(`Indices failed for ${dateStr}: ${err.message}`)
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
                console.warn(`PCR failed for ${dateStr}: ${err.message}`)
            }

            // 4. Market Breadth & Quality
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
                console.warn(`Breadth failed for ${dateStr}: ${err.message}`)
            }

            // 5. FII Index Futures Net (approximation)
            fiiIdxFutNet = fiiNet * 0.3

            // Only insert if we have meaningful data (at least one non-zero metric)
            if (fiiNet !== 0 || diiNet !== 0 || indiaVix !== 0 || advances !== 0) {
                const { error: upsertError } = await client
                    .from('market_pulse_daily')
                    .upsert({
                        date: dateStr,
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

                processedDates.push(dateStr)
                if (processedDates.length % 10 === 0) {
                    await logger.log('nse-flows', 'processing', processedDates.length, `Processed ${processedDates.length} dates`)
                }
            } else {
                skippedDates.push(dateStr)
                console.log(`Skipped ${dateStr}: no data available (likely holiday)`)
            }

        } catch (err: any) {
            console.error(`Error for ${dateStr}:`, err)
            await logger.log('nse-flows', 'warn', 0, `Failed for ${dateStr}: ${err.message}`)
            skippedDates.push(dateStr)
        }

        currentDate.setDate(currentDate.getDate() + 1)

        // Rate limiting: wait 1000ms between requests to avoid NSE blocking
        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Refresh materialized view
    try {
        const { error: refreshError } = await client.rpc('refresh_market_pulse_stats')
        if (refreshError) {
            console.warn('Failed to refresh stats view:', refreshError)
        } else {
            await logger.log('nse-flows', 'processing', 0, 'Refreshed materialized view')
        }
    } catch (err: any) {
        console.warn('View refresh error:', err)
    }

    const totalDuration = Math.round(performance.now() - start)
    await logger.log('nse-flows', 'success', processedDates.length, `Ingested ${processedDates.length} dates, skipped ${skippedDates.length}`, totalDuration)

    return new Response(JSON.stringify({
        message: `NSE ingestion complete`,
        dateRange: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
        },
        processedDates: processedDates.length,
        skippedDates: skippedDates.length,
        sampleProcessed: processedDates.slice(0, 5),
        sampleSkipped: skippedDates.slice(0, 5),
        runId
    }), { headers: { 'Content-Type': 'application/json' } })
})
