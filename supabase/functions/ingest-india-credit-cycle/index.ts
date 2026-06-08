/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'
import { runWithRetry } from '../_shared/job-runner.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Phase quadrant thresholds calibrated to 10-year RBI averages
const CD_RATIO_MID = 77.0
const CREDIT_GROWTH_MID = 14.5

type Phase = 'Recovery' | 'Expansion' | 'Downturn' | 'Repair'

function derivePhase(creditGrowthYoy: number, cdRatio: number): Phase {
    const highCredit = creditGrowthYoy >= CREDIT_GROWTH_MID
    const highCd = cdRatio >= CD_RATIO_MID
    if (highCredit && !highCd) return 'Expansion'
    if (highCredit && highCd) return 'Downturn'
    if (!highCredit && highCd) return 'Repair'
    return 'Recovery'
}

function lastDayOfMonth(year: number, month: number): string {
    const d = new Date(Date.UTC(year, month + 1, 0))
    return d.toISOString().split('T')[0]
}

// RBI DBIE SDMX periods can be YYYY-MM or YYYY-MM-DD
function parsePeriodToDate(period: string): string | null {
    if (/^\d{4}-\d{2}$/.test(period)) {
        const [y, m] = period.split('-').map(Number)
        return lastDayOfMonth(y, m - 1)
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(period)) return period
    return null
}

interface MonthlyLevel {
    date: string
    credit_cr: number  // Total bank credit, ₹ Crore
    deposit_cr: number // Aggregate deposits, ₹ Crore
}

/**
 * Fetches monthly SCB aggregate credit and deposit levels from RBI DBIE SDMX.
 *
 * Dataset BSC1: "Scheduled Commercial Banks – Operations in India"
 * The DATATYPE dimension distinguishes credit from deposit series.
 * We look for any series whose DATATYPE id/name contains "CREDIT" or "DEPOSIT"
 * (case-insensitive) so we're robust to minor naming changes.
 */
async function fetchRbiDbieMonthly(startPeriod: string): Promise<MonthlyLevel[]> {
    const url = `https://data.rbi.org.in/DBIE/SDMX/JSON/RBI/BSC1/?startPeriod=${startPeriod}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`RBI DBIE HTTP ${res.status}`)

    const data = await res.json() as any
    const dataset = data?.dataSets?.[0]
    const seriesMap = dataset?.series
    const dimensions: any[] = data?.structure?.dimensions?.series ?? []
    const timePeriods: any[] = data?.structure?.dimensions?.observation?.[0]?.values ?? []

    if (!seriesMap || !dimensions.length || !timePeriods.length) {
        throw new Error('Malformed SDMX response from RBI DBIE BSC1')
    }

    // Find the DATATYPE dimension index (identifies what each series measures)
    const dtDimIdx = dimensions.findIndex(
        (d: any) => /DATATYPE|INDICATOR|ITEM/i.test(d.id)
    )
    if (dtDimIdx === -1) throw new Error('Cannot find DATATYPE dimension in BSC1 response')

    // Collect all time periods → level values for credit and deposits separately
    const creditByDate = new Map<string, number>()
    const depositByDate = new Map<string, number>()

    for (const [key, value] of Object.entries(seriesMap)) {
        const keyParts = (key as string).split(':')
        const dtValue = dimensions[dtDimIdx].values[parseInt(keyParts[dtDimIdx])]
        const dtId: string = (dtValue?.id ?? dtValue?.name ?? '').toUpperCase()
        const dtName: string = (dtValue?.name ?? '').toUpperCase()

        const isCredit = dtId.includes('CREDIT') || dtName.includes('CREDIT') ||
            dtId.includes('LOAN') || dtName.includes('LOAN')
        const isDeposit = dtId.includes('DEPOSIT') || dtName.includes('DEPOSIT')

        if (!isCredit && !isDeposit) continue

        const observations = (value as any).observations ?? {}
        for (const [obsIdx, obsArr] of Object.entries(observations)) {
            const level = parseFloat((obsArr as any)[0])
            if (isNaN(level)) continue
            const period: string = timePeriods[parseInt(obsIdx as string)]?.id
            if (!period) continue
            const date = parsePeriodToDate(period)
            if (!date) continue

            if (isCredit) {
                // Keep only the highest credit value per date (total vs sectoral sub-series)
                const prev = creditByDate.get(date) ?? 0
                if (level > prev) creditByDate.set(date, level)
            } else {
                const prev = depositByDate.get(date) ?? 0
                if (level > prev) depositByDate.set(date, level)
            }
        }
    }

    if (creditByDate.size === 0 || depositByDate.size === 0) {
        throw new Error('BSC1 response had no usable credit or deposit series')
    }

    // Intersect dates where both credit and deposit are available
    const dates = [...creditByDate.keys()]
        .filter(d => depositByDate.has(d))
        .sort()

    return dates.map(date => ({
        date,
        credit_cr: creditByDate.get(date)!,
        deposit_cr: depositByDate.get(date)!,
    }))
}

/**
 * Computes YoY growth % from a sorted array of monthly levels.
 * Returns null for months where the comparison month (12 months prior) is absent.
 */
function computeYoY(levels: MonthlyLevel[]): Array<{
    date: string
    credit_growth_yoy: number
    deposit_growth_yoy: number
    cd_ratio: number
    phase: Phase
}> {
    const byDate = new Map(levels.map(l => [l.date, l]))
    const results = []

    for (const row of levels) {
        const dt = new Date(row.date + 'T00:00:00Z')
        // Find the matching month 12 months prior
        const prevYear = new Date(Date.UTC(dt.getUTCFullYear() - 1, dt.getUTCMonth() + 1, 0))
        const prevDate = prevYear.toISOString().split('T')[0]

        const prior = byDate.get(prevDate)
        if (!prior) continue // no 12-month baseline yet

        const creditGrowthYoy = parseFloat(
            (((row.credit_cr - prior.credit_cr) / prior.credit_cr) * 100).toFixed(1)
        )
        const depositGrowthYoy = parseFloat(
            (((row.deposit_cr - prior.deposit_cr) / prior.deposit_cr) * 100).toFixed(1)
        )
        const cdRatio = parseFloat(
            ((row.credit_cr / row.deposit_cr) * 100).toFixed(1)
        )

        results.push({
            date: row.date,
            credit_growth_yoy: creditGrowthYoy,
            deposit_growth_yoy: depositGrowthYoy,
            cd_ratio: cdRatio,
            phase: derivePhase(creditGrowthYoy, cdRatio),
        })
    }

    return results
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    return runIngestion(supabase, 'ingest-india-credit-cycle', async (_ctx) => {
        const result = await runWithRetry(
            'ingest-india-credit-cycle',
            () => doIngestIndiaCreditCycle(supabase),
            { timeoutMs: 20 * 60 * 1000, maxRetries: 3, backoffMs: 20_000 }
        )
        if (!result.ok) throw new Error(`All attempts failed: ${result.error}`)
        return result.value!
    })
})

async function doIngestIndiaCreditCycle(supabase: any) {
    // Fetch 36 months of levels so we can compute 24 months of YoY after the 12-month
    // baseline window is consumed. RBI DBIE monthly data lags by ~4–6 weeks.
    const threeYearsAgo = new Date()
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3)
    const startPeriod = threeYearsAgo.toISOString().split('T')[0]

    console.log(`Fetching RBI DBIE BSC1 monthly levels from ${startPeriod}...`)
    const levels = await fetchRbiDbieMonthly(startPeriod)
    console.log(`RBI DBIE returned ${levels.length} monthly level observations`)

    const rows = computeYoY(levels)
    if (rows.length === 0) throw new Error('No YoY rows computed — insufficient history in DBIE response')

    const { error } = await supabase
        .from('india_credit_cycle')
        .upsert(rows, { onConflict: 'date' })
    if (error) throw error

    const latest = rows[rows.length - 1]
    console.log(`Upserted ${rows.length} rows. Latest: ${latest.date} | Credit YoY: ${latest.credit_growth_yoy}% | CD Ratio: ${latest.cd_ratio}% | Phase: ${latest.phase}`)

    return {
        rows_inserted: rows.length,
        metadata: {
            latest_date: latest.date,
            latest_credit_growth: latest.credit_growth_yoy,
            latest_deposit_growth: latest.deposit_growth_yoy,
            latest_cd_ratio: latest.cd_ratio,
            latest_phase: latest.phase,
            provenance: 'rbi_dbie_bsc1',
        },
    }
}
