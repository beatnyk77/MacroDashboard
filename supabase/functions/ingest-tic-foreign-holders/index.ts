/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js'

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
        const ticUrl = 'https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table5.txt'
        const res = await fetch(ticUrl)
        if (!res.ok) throw new Error(`Treasury HTTP ${res.status}`)

        const text = await res.text()

        // The TIC slt_table5.txt format is tab-separated.
        // Country	2026-01	2025-12	2025-11
        // Japan	1225.3	1185.5	1202.7

        const lines = text.split('\n')

        // Find the header line that contains the months
        let headerIndex = lines.findIndex(l => l.startsWith('Country\t'))
        
        if (headerIndex === -1) throw new Error('Could not identify TIC data structure')

        const headerTokens = lines[headerIndex].split('\t').map(s => s.trim())
        
        // Extract dates from the header. Format is YYYY-MM
        const monthData: { index: number; dateStr: string }[] = []
        for (let i = 1; i < headerTokens.length; i++) {
            const token = headerTokens[i]
            if (/^\d{4}-\d{2}$/.test(token)) {
                // Approximate end of month by appending -28 (close enough for mostly monthly data)
                // TIC data is traditionally end-of-month
                // Let's create a date object for the 1st of next month, subtract 1 day
                const [year, month] = token.split('-')
                const d = new Date(Number(year), Number(month), 0)
                monthData.push({ index: i, dateStr: d.toISOString().split('T')[0] })
            }
        }

        const holders: Array<{ country_name: string; as_of_date: string; holdings_usd_bn: number; }> = []
        const majorCountries = [
            'Japan', 'China, Mainland', 'United Kingdom', 'Luxembourg', 'Canada',
            'Belgium', 'Cayman Islands', 'Ireland', 'Taiwan', 'France',
            'Switzerland', 'India', 'Hong Kong', 'Singapore', 'Brazil',
            'Korea, South', 'Saudi Arabia', 'Norway', 'Israel', 'United Arab Emirates',
            'Germany', 'Thailand', 'Qatar'
        ]

        // Iterate through lines to find country data
        for (let i = headerIndex + 1; i < lines.length; i++) {
            const line = lines[i]
            if (!line.trim()) continue;
            
            const tokens = line.split('\t').map(s => s.trim())
            const rawCountry = tokens[0]
            
            const country = majorCountries.find(c => rawCountry === c)

            if (country) {
                monthData.forEach(m => {
                    if (m.index < tokens.length) {
                        const valStr = tokens[m.index].replace(/,/g, '')
                        const val = parseFloat(valStr)

                        if (!isNaN(val)) {
                            holders.push({
                                country_name: country,
                                as_of_date: m.dateStr,
                                holdings_usd_bn: val
                            })
                        }
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
