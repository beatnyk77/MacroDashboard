/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js'

// @ts-expect-error: Deno globals and third-party types: Deno is a global in Supabase Edge Functions
Deno.serve(async (req: Request) => {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response('Unauthorized', { status: 401 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const functionName = 'ingest-cie-short-selling'
    const start = new Date().toISOString()

    // Handle incoming date or default to yesterday/today
    let targetDate = new Date()
    try {
        const body = await req.json()
        if (body.date) targetDate = new Date(body.date)
    } catch (e) {
        // Fallback to today
    }

    // Format DDMMYYYY for NSE URL
    const formatNSEDate = (date: Date) => {
        const d = date.getDate().toString().padStart(2, '0')
        const m = (date.getMonth() + 1).toString().padStart(2, '0')
        const y = date.getFullYear()
        return `${d}${m}${y}`
    }

    const dateStr = formatNSEDate(targetDate)
    const dbDate = targetDate.toISOString().split('T')[0]

    // NSE Archives URL for Short Selling
    const url = `https://archives.nseindia.com/archives/shortselling/shortselling_${dateStr}.csv`

    console.log(`Fetching short selling data from: ${url}`)

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
            }
        })

        if (!response.ok) {
            const errorMsg = `NSE Report not found for ${dbDate}. This is expected on weekends/holidays.`
            await supabase.from('ingestion_logs').insert({
                function_name: functionName,
                status: 'success', // Marking as success but 0 rows because it's expected behavior
                error_message: errorMsg,
                start_time: start,
                completed_at: new Date().toISOString(),
                status_code: 404,
                rows_inserted: 0
            })
            return new Response(JSON.stringify({ error: errorMsg, status: response.status }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            })
        }

        const csvText = await response.text()
        const lines = csvText.split('\n')

        const results = []

        const { data: cieCompanies } = await supabase
            .from('cie_companies')
            .select('id, symbol')

        const companyMap = new Map<string, string>(cieCompanies?.map((c: { id: string, symbol: string }) => [c.symbol.replace('.NS', ''), c.id]))

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            const parts = line.split(',')
            if (parts.length < 3) continue

            const symbol = parts[1].trim()
            const quantity = parseInt(parts[2].trim())

            const companyId = companyMap.get(symbol)
            if (companyId) {
                results.push({
                    company_id: companyId,
                    date: dbDate,
                    short_quantity: quantity,
                })
            }
        }

        if (results.length > 0) {
            const { error: upsertError } = await supabase
                .from('cie_short_selling_history')
                .upsert(results, { onConflict: 'company_id,date' })

            if (upsertError) throw upsertError

            await supabase.from('ingestion_logs').insert({
                function_name: functionName,
                status: 'success',
                rows_inserted: results.length,
                start_time: start,
                completed_at: new Date().toISOString(),
                status_code: 200
            })

            return new Response(JSON.stringify({
                message: `Successfully ingested ${results.length} short selling records for ${dbDate}`,
                dbDate
            }), { headers: { 'Content-Type': 'application/json' } })
        }

        const noMatchMsg = `No matching Nifty 200 companies found in short selling report for ${dbDate}`
        await supabase.from('ingestion_logs').insert({
            function_name: functionName,
            status: 'success',
            rows_inserted: 0,
            start_time: start,
            completed_at: new Date().toISOString(),
            status_code: 200,
            error_message: noMatchMsg
        })

        return new Response(JSON.stringify({ message: noMatchMsg, dbDate }), { headers: { 'Content-Type': 'application/json' } })

    } catch (error: any) {
        console.error('Ingestion error:', error)
        await supabase.from('ingestion_logs').insert({
            function_name: functionName,
            status: 'failed',
            error_message: error.message,
            start_time: start,
            completed_at: new Date().toISOString(),
            status_code: 500
        })
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
})
