import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        console.log('Fetching TIC data from Treasury.gov...')

        // Major Foreign Holders (MFH) Historical data in text format
        // This file is updated monthly.
        const ticUrl = 'https://home.treasury.gov/system/files/221/mfh.txt'
        const res = await fetch(ticUrl)
        if (!res.ok) throw new Error(`Treasury HTTP ${res.status}`)

        const text = await res.text()

        // The TIC mfh.txt format is a fixed-width or space-separated text file.
        // It's quite legacy. Example structure:
        // Country             Oct 2024  Sep 2024 ...
        // Japan                 1100.5    1120.2
        // China                  770.1     775.4

        const lines = text.split('\n')

        // Find the header line that contains months
        let headerIndex = -1
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('Grand Total') || lines[i].includes('Jan 20') || lines[i].includes('Dec 20')) {
                // Usually the line before or the line itself contains the column headers
                if (lines[i].toLowerCase().includes('country')) {
                    headerIndex = i
                    break
                }
            }
        }

        // If we can't find a clean 'country' header, we might need a more robust parser.
        // Many TIC files use a specific line for months.
        let monthLineIndex = lines.findIndex(l => l.includes('2024') || l.includes('2025'))
        if (monthLineIndex === -1) monthLineIndex = lines.findIndex(l => l.includes('2023'))

        if (monthLineIndex === -1) throw new Error('Could not identify TIC data structure')

        const monthLine = lines[monthLineIndex]
        // Extract months and years. e.g. "Oct 2024  Sep 2024 ..."
        const monthMatches = Array.from(monthLine.matchAll(/([A-Z][a-z]{2})\s(\d{4})/g))
        const monthData = monthMatches.map(m => {
            const monthName = m[1]
            const year = m[2]
            const date = new Date(`${monthName} 1, ${year}`)
            return { dateStr: date.toISOString().split('T')[0], index: m.index }
        })

        const holders: Array<{ country_name: string; as_of_date: string; holdings_usd_bn: number; }> = []
        const majorCountries = [
            'Japan', 'China', 'United Kingdom', 'Luxembourg', 'Canada',
            'Belgium', 'Cayman Islands', 'Ireland', 'Taiwan', 'France',
            'Switzerland', 'India', 'Hong Kong', 'Singapore', 'Brazil'
        ]

        // Iterate through lines to find country data
        for (let i = monthLineIndex + 1; i < lines.length; i++) {
            const line = lines[i]
            const country = majorCountries.find(c => line.startsWith(c))
            if (country) {
                // Extract values based on position or spacing
                // TIC data usually has values aligned under the month headers
                monthData.forEach((m, idx) => {
                    // Use a substring near the column header
                    // Value is usually about 10 chars wide
                    const start = m.index! - 2
                    const end = start + 12
                    const valStr = line.substring(start, end).trim().replace(/,/g, '')
                    const val = parseFloat(valStr)

                    if (!isNaN(val)) {
                        holders.push({
                            country_name: country,
                            as_of_date: m.dateStr,
                            holdings_usd_bn: val
                        })
                    }
                })
            }
        }

        console.log(`Parsed ${holders.length} holding records.`)

        if (holders.length === 0) {
            throw new Error('No data records parsed')
        }

        // Upsert into Supabase
        const { error } = await supabase.from('tic_foreign_holders').upsert(holders, { onConflict: 'country_name, as_of_date' })
        if (error) throw error

        return new Response(JSON.stringify({
            message: 'Success',
            recordsParsed: holders.length,
            countries: Array.from(new Set(holders.map(h => h.country_name)))
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('Error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
