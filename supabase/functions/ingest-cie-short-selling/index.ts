/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

async function doIngest(supabase: ReturnType<typeof createClient>, req: Request): Promise<IngestResult> {
    let targetDate = new Date()
    try {
        const body = await req.json()
        if (body.date) targetDate = new Date(body.date)
    } catch (e: any) {
        // Fallback to today
    }

    const formatNSEDate = (date: Date) => {
        const d = date.getDate().toString().padStart(2, '0')
        const m = (date.getMonth() + 1).toString().padStart(2, '0')
        const y = date.getFullYear()
        return `${d}${m}${y}`
    }

    const dateStr = formatNSEDate(targetDate)
    const dbDate = targetDate.toISOString().split('T')[0]
    const url = `https://archives.nseindia.com/archives/shortselling/shortselling_${dateStr}.csv`

    console.log(`Fetching short selling data from: ${url}`)

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
        }
    })

    if (!response.ok) {
        const errorMsg = `NSE Report not found for ${dbDate}. This is expected on weekends/holidays.`
        console.warn(errorMsg)
        return { ok: true, counts: { upserted: 0, skipped: 0 }, meta: { date: dbDate, message: errorMsg } }
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
            results.push({ company_id: companyId, date: dbDate, short_quantity: quantity })
        }
    }

    let upserted = 0
    if (results.length > 0) {
        const { error: upsertError } = await supabase
            .from('cie_short_selling_history')
            .upsert(results, { onConflict: 'company_id,date' })
        if (upsertError) throw upsertError
        upserted = results.length
    }

    return { ok: true, counts: { upserted, skipped: 0 }, meta: { date: dbDate } }
}

serveIngest('ingest-cie-short-selling', async (req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    return doIngest(supabase, req)
}, { timeoutMs: 15 * 60 * 1000, retries: 3 })
