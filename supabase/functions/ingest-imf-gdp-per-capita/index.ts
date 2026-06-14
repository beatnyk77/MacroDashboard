/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

const G20_COUNTRIES: Record<string, string> = {
    'USA': 'United States',
    'IND': 'India',
    'CHN': 'China',
    'DEU': 'Germany',
    'BRA': 'Brazil',
    'JPN': 'Japan',
    'FRA': 'France',
    'GBR': 'United Kingdom',
    'ITA': 'Italy',
    'CAN': 'Canada',
    'RUS': 'Russia',
    'KOR': 'South Korea',
    'MEX': 'Mexico',
    'IDN': 'Indonesia',
    'TUR': 'Turkey',
    'SAU': 'Saudi Arabia',
    'ARG': 'Argentina',
    'ZAF': 'South Africa',
    'AUS': 'Australia',
    'EU27': 'European Union'
}

// Fixed 2023 GDP per capita (constant PPP international $) from IMF Oct 2024 WEO
// This serves as the anchor point for the growth chain.
const ANCHOR_YEAR = 2023;
const ANCHOR_VALUES: Record<string, number> = {
    'USA': 82715.1,
    'IND': 9183.3,
    'CHN': 24502.5,
    'DEU': 67759.7,
    'BRA': 20084.7,
    'JPN': 52120.3,
    'FRA': 60132.8,
    'GBR': 59858.9,
    'ITA': 56905.0,
    'CAN': 61581.6,
    'RUS': 38292.0,
    'KOR': 54032.5,
    'MEX': 23932.1,
    'IDN': 15836.3,
    'TUR': 44151.7,
    'SAU': 68453.3,
    'ARG': 27232.0,
    'ZAF': 15904.7,
    'AUS': 66498.4,
    'EU27': 59500.0 // Approximation for EU aggregate
}

async function doIngest(supabase: ReturnType<typeof createClient>): Promise<IngestResult> {
    console.log('Starting IMF DataMapper ingestion (NGDP_RPCH)')

    // Fetch growth rates for all G20 countries
    const isos = Object.keys(G20_COUNTRIES).join('/')
    const url = `https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/${isos}`

    const response = await fetch(url)
    if (!response.ok) throw new Error(`IMF API failed: ${response.status}`)

    const data = await response.json()
    const values = data?.values?.NGDP_RPCH
    if (!values) throw new Error('No values found in IMF response')

    const rowsToUpsert: any[] = []

    for (const iso of Object.keys(G20_COUNTRIES)) {
        const growthRates = values[iso]
        const anchorVal = ANCHOR_VALUES[iso]
        if (!growthRates || !anchorVal) continue

        // Calculate historical and projected values based on the anchor year
        const years = Object.keys(growthRates).map(Number).sort((a, b) => a - b)

        // We calculate in two directions from the anchor year
        const calculatedValues: Record<number, number> = {}
        calculatedValues[ANCHOR_YEAR] = anchorVal

        // Forward from anchor (2024 onwards)
        let currentVal = anchorVal
        for (let y = ANCHOR_YEAR + 1; y <= Math.max(...years); y++) {
            const growth = growthRates[y.toString()]
            if (growth !== undefined) {
                currentVal = currentVal * (1 + growth / 100)
                calculatedValues[y] = currentVal
            }
        }

        // Backward from anchor (2022 downwards)
        currentVal = anchorVal
        for (let y = ANCHOR_YEAR - 1; y >= Math.min(...years); y--) {
            const growthNextYear = growthRates[(y + 1).toString()]
            if (growthNextYear !== undefined) {
                currentVal = currentVal / (1 + growthNextYear / 100)
                calculatedValues[y] = currentVal
            }
        }

        for (const [year, val] of Object.entries(calculatedValues)) {
            rowsToUpsert.push({
                country_code: iso,
                country_name: G20_COUNTRIES[iso],
                year: parseInt(year),
                value_constant_usd: val,
                last_updated_at: new Date().toISOString()
            })
        }
    }

    let upserted = 0;
    if (rowsToUpsert.length > 0) {
        // Chunking for safe upsert
        const chunkSize = 500
        for (let i = 0; i < rowsToUpsert.length; i += chunkSize) {
            const chunk = rowsToUpsert.slice(i, i + chunkSize)
            const { error: upsertError } = await supabase
                .from('imf_gdp_per_capita')
                .upsert(chunk, { onConflict: 'country_code, year' })
            if (upsertError) throw upsertError
            upserted += chunk.length
        }
    }

    console.log(`Successfully calculated and ingested ${upserted} data points`)

    return {
        ok: true,
        counts: { upserted, skipped: 0 },
        meta: { processed: upserted },
    }
}

serveIngest('ingest-imf-gdp-per-capita', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    return doIngest(supabase)
}, { timeoutMs: 15 * 60 * 1000, retries: 3 })
