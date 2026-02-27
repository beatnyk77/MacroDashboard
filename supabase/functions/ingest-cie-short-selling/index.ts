import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// @ts-ignore: Deno is a global in Supabase Edge Functions
Deno.serve(async (req: Request) => {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response('Unauthorized', { status: 401 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

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
            return new Response(JSON.stringify({
                error: `NSE Report not found for ${dbDate}. This is expected on weekends/holidays.`,
                status: response.status
            }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            })
        }

        const csvText = await response.text()
        const lines = csvText.split('\n')

        // NSE Short Selling CSV Format:
        // Date,Symbol,Quantity
        // Usually starts from line 1 (0-indexed) if header is line 0

        const results = []
        const symbols = []

        // Fetch Nifty 200 symbols from our DB to map correctly
        const { data: cieCompanies } = await supabase
            .from('cie_companies')
            .select('id, symbol')

        const companyMap = new Map<string, string>(cieCompanies?.map((c: { id: string, symbol: string }) => [c.symbol, c.id]))

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

            return new Response(JSON.stringify({
                message: `Successfully ingested ${results.length} short selling records for ${dbDate}`,
                dbDate
            }), { headers: { 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify({
            message: `No matching Nifty 200 companies found in short selling report for ${dbDate}`,
            dbDate
        }), { headers: { 'Content-Type': 'application/json' } })

    } catch (error: any) {
        console.error('Ingestion error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
})
