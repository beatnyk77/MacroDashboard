import { createAdminClient } from './utils/supabaseClient.ts'
import { Logger } from './utils/logger.ts'
import { retry } from './utils/retry.ts'
import { parse } from "https://deno.land/std@0.208.0/csv/parse.ts"

// @ts-ignore: Deno is a global in Supabase Edge Functions
Deno.serve(async (req: Request) => {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response('Unauthorized', { status: 401 })
    }

    const runId = crypto.randomUUID()
    const client = createAdminClient()
    const logger = new Logger(runId)

    // Parse Request Body for Backfill
    let startDate = new Date()
    let endDate = new Date()
    startDate.setDate(startDate.getDate() - 1)
    endDate.setDate(endDate.getDate() - 1)

    try {
        const body = await req.json() as any
        if (body.startDate) startDate = new Date(body.startDate)
        if (body.endDate) endDate = new Date(body.endDate)
    } catch (e) {
        // No body or invalid JSON, stick to defaults
    }

    await logger.log('nse-flows', 'processing', 0, `Starting NSE ingestion range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)
    const start = performance.now()

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/csv, application/json'
    }

    const formatNSEDate = (date: Date) => {
        const d = date.getDate().toString().padStart(2, '0')
        const m = date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
        const y = date.getFullYear()
        return `${d}${m}${y}`
    }

    const processedDates = []
    let currentDate = new Date(startDate)

    while (currentDate <= endDate) {
        // Skip weekends
        const day = currentDate.getDay()
        if (day === 0 || day === 6) {
            currentDate.setDate(currentDate.getDate() + 1)
            continue
        }

        const nseDateStr = formatNSEDate(currentDate)
        const dbDateStr = currentDate.toISOString().split('T')[0]

        try {
            let fiiNet = 0, diiNet = 0
            let siiNetIdxFut = 0
            let advances = 0, declines = 0
            let deliveryPct = 0
            let indiaVix = 0
            let pcr = 1.0

            // 1. FII/DII Cash Segment
            try {
                const url = `https://archives.nseindia.com/content/fo/FII_DII_${nseDateStr}.csv`
                const res = await retry(() => fetch(url, { headers }))
                if (res.ok) {
                    const text = await res.text()
                    const rows = await parse(text, { skipFirstRow: true }) as any[][]
                    for (const row of rows) {
                        const category = row[1]?.trim().toUpperCase()
                        const netVal = parseFloat(row[4])
                        if (category === 'FII' || category === 'FPI') fiiNet = netVal
                        if (category === 'DII') diiNet = netVal
                    }
                }
            } catch (err: any) {
                console.warn(`FII/DII failed for ${dbDateStr}: ${err.message}`)
            }

            // 2. Participant OI (Index Futures)
            try {
                const url = `https://archives.nseindia.com/content/fo/fo_participant_vol_${nseDateStr}.csv`
                const res = await retry(() => fetch(url, { headers }))
                if (res.ok) {
                    const text = await res.text()
                    const rows = await parse(text, { skipFirstRow: true }) as any[][]
                    for (const row of rows) {
                        const type = row[0]?.trim().toUpperCase()
                        if (type === 'FII') {
                            const fIdxLong = parseFloat(row[1]) || 0
                            const fIdxShort = parseFloat(row[2]) || 0
                            siiNetIdxFut = fIdxLong - fIdxShort
                        }
                    }
                }
            } catch (err: any) {
                console.warn(`OI failed for ${dbDateStr}: ${err.message}`)
            }

            // 3. Equity Level (Breadth, Delivery)
            try {
                const url = `https://archives.nseindia.com/content/equities/EQUITY_LVL_${nseDateStr}.csv`
                const res = await retry(() => fetch(url, { headers }))
                if (res.ok) {
                    const text = await res.text()
                    const rows = await parse(text, { skipFirstRow: true }) as any[][]
                    for (const row of rows) {
                        const label = row[0]?.trim()
                        if (label === 'ADVANCES') advances = parseInt(row[1]) || 0
                        if (label === 'DECLINES') declines = parseInt(row[1]) || 0
                        if (label?.includes('DELIVERY')) deliveryPct = parseFloat(row[1]) || 0
                    }
                }
            } catch (err: any) {
                console.warn(`Equity Lvl failed for ${dbDateStr}: ${err.message}`)
            }

            // Upsert to DB
            const { error: upsertError } = await client
                .from('market_pulse_daily')
                .upsert({
                    date: dbDateStr,
                    fii_cash_net: fiiNet,
                    dii_cash_net: diiNet,
                    fii_idx_fut_net: siiNetIdxFut,
                    pcr: pcr,
                    india_vix: indiaVix,
                    advances: advances,
                    declines: declines,
                    delivery_pct: deliveryPct,
                    sector_returns: {},
                    midcap_perf: 0,
                    smallcap_perf: 0,
                    nifty_perf: 0
                }, { onConflict: 'date' })

            if (upsertError) throw upsertError
            processedDates.push(dbDateStr)

        } catch (err: any) {
            console.error(`Error for ${dbDateStr}:`, err)
            await logger.log('nse-flows', 'warn', 0, `Failed for ${dbDateStr}: ${err.message}`)
        }

        currentDate.setDate(currentDate.getDate() + 1)
    }

    const totalDuration = Math.round(performance.now() - start)
    await logger.log('nse-flows', 'success', processedDates.length, `Ingested ${processedDates.length} dates`, totalDuration)

    return new Response(JSON.stringify({
        message: `NSE Ingestion complete for ${processedDates.length} dates`,
        dates: processedDates,
        runId
    }), { headers: { 'Content-Type': 'application/json' } })
})
