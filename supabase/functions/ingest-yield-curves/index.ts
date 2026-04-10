/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/* ─── FRED series map (full US + China curves) ─────────────────── */
// US: Daily Treasury Yield Curve Rates (H.15)
// CN: International Financial Statistics (IFS) Government Bond Yields
const FRED_SERIES: { country: string; tenor: string; seriesId: string; source: string }[] = [
  // United States
  { country: 'US', tenor: '3M', seriesId: 'DGS3MO', source: 'FRED' },
  { country: 'US', tenor: '6M', seriesId: 'DGS6MO', source: 'FRED' },
  { country: 'US', tenor: '1Y', seriesId: 'DGS1', source: 'FRED' },
  { country: 'US', tenor: '2Y', seriesId: 'DGS2', source: 'FRED' },
  { country: 'US', tenor: '5Y', seriesId: 'DGS5', source: 'FRED' },
  { country: 'US', tenor: '10Y', seriesId: 'DGS10', source: 'FRED' },
  { country: 'US', tenor: '30Y', seriesId: 'DGS30', source: 'FRED' },

  // China: Full curve from IFS (INTDSRCNMXXXN where XXX = months)
  // Primary series: IFS standard tenors
  { country: 'CN', tenor: '3M', seriesId: 'INTDSRCNM003N', source: 'FRED' },
  { country: 'CN', tenor: '6M', seriesId: 'INTDSRCNM006N', source: 'FRED' },
  { country: 'CN', tenor: '1Y', seriesId: 'INTDSRCNM012N', source: 'FRED' },
  { country: 'CN', tenor: '2Y', seriesId: 'INTDSRCNM024N', source: 'FRED' },
  { country: 'CN', tenor: '5Y', seriesId: 'INTDSRCNM060N', source: 'FRED' },
  // 10Y: Use the established series (INTDSRCNM193N) - primary source
  { country: 'CN', tenor: '10Y', seriesId: 'INTDSRCNM193N', source: 'FRED' },
  // 30Y: IFS 30-year
  { country: 'CN', tenor: '30Y', seriesId: 'INTDSRCNM360N', source: 'FRED' },
]

/* ─── ECB SDW keys for German Bund yields ───────────────────────── */
const ECB_TENORS: { tenor: string; maturity: string }[] = [
  { tenor: '3M', maturity: '3M' },
  { tenor: '6M', maturity: '6M' },
  { tenor: '1Y', maturity: '1Y' },
  { tenor: '2Y', maturity: '2Y' },
  { tenor: '5Y', maturity: '5Y' },
  { tenor: '10Y', maturity: '10Y' },
  { tenor: '30Y', maturity: '30Y' },
]

/* ─── India RBI DBIE SDMX tenors ──────────────────────────────── */
const INDIA_TENOR_SET = ['P3M', 'P6M', 'P1Y', 'P2Y', 'P5Y', 'P10Y', 'P30Y']

/* ─── Helpers ────────────────────────────────────────────────────── */
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 2): Promise<Response> {
  let lastErr: Error | null = null
  for (let i = 0; i <= maxRetries; i++) {
    try {
      if (i > 0) await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000))
      const res = await fetch(url, options)
      if (res.ok) return res
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        throw new Error(`HTTP ${res.status}: ${(await res.text()).substring(0, 100)}`)
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    } catch (e: any) { lastErr = e }
  }
  throw lastErr || new Error(`Failed to fetch ${url}`)
}

/* ─── FRED fetcher ──────────────────────────────────────────────── */
async function fetchFredYields(apiKey: string) {
  const results: any[] = []

  const batchSize = 4
  for (let i = 0; i < FRED_SERIES.length; i += batchSize) {
    const batch = FRED_SERIES.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(async (s) => {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${s.seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=5`
      try {
        const res = await fetchWithRetry(url)
        const data = await res.json() as any
        const obs = (data.observations || []).filter((o: any) => o.value !== '.' && !isNaN(parseFloat(o.value)))
        if (obs.length === 0) return []

        const latest = obs[0]
        const prev = obs.length > 1 ? obs[1] : null

        return [{
          country: s.country,
          tenor: s.tenor,
          yield_pct: parseFloat(latest.value),
          prev_yield: prev ? parseFloat(prev.value) : null,
          as_of_date: latest.date,
          source: s.source,
        }]
      } catch (err: any) {
        console.error(`FRED error for ${s.seriesId}: ${err.message}`)
        return []
      }
    }))
    results.push(...batchResults.flat())
  }
  return results
}

/* ─── ECB SDW fetcher (Euro area AAA government bonds) ────────────── */
async function fetchECBYields() {
  const results: any[] = []

  // Using ECB Yield curve spot rate, AAA rated government bonds
  // Pattern: YC.B.U2.EUR.4F.G_N_A.SV_C_YM.SR_{maturity}
  const maturities = ['3M', '6M', '1Y', '2Y', '5Y', '10Y', '30Y']

  for (const tenor of maturities) {
    const key = `B.U2.EUR.4F.G_N_A.SV_C_YM.SR_${tenor}`
    const url = `https://data-api.ecb.europa.eu/service/data/YC/${key}?format=jsondata&lastNObservations=5`

    try {
      const res = await fetchWithRetry(url, {
        headers: { 'Accept': 'application/json' }
      })
      const data = await res.json() as any

      const dataset = data?.dataSets?.[0]
      const series = dataset?.series
      if (!series) continue

      const seriesKey = Object.keys(series)[0]
      if (!seriesKey) continue

      const observations = series[seriesKey].observations
      const timePeriods = data?.structure?.dimensions?.observation?.[0]?.values

      if (!observations || !timePeriods) continue

      const obsKeys = Object.keys(observations).sort((a, b) => parseInt(b) - parseInt(a))
      if (obsKeys.length === 0) continue

      const latestKey = obsKeys[0]
      const prevKey = obsKeys.length > 1 ? obsKeys[1] : null

      const latestVal = parseFloat(observations[latestKey][0])
      const prevVal = prevKey ? parseFloat(observations[prevKey][0]) : null
      const latestDate = timePeriods[parseInt(latestKey)]?.id

      if (isNaN(latestVal) || !latestDate) continue

      const dateStr = latestDate.length === 7 ? `${latestDate}-01` : latestDate

      results.push({
        country: 'EU',
        tenor: tenor,
        yield_pct: latestVal,
        prev_yield: prevVal && !isNaN(prevVal) ? prevVal : null,
        as_of_date: dateStr.split('T')[0], // handle ECB datetime 
        source: 'ECB',
      })
    } catch (err: any) {
      console.error(`ECB error for ${tenor}: ${err.message}`)
    }
  }

  return results
}

/* ─── India RBI DBIE SDMX fetcher (Direct) ─────────────────────── */
async function fetchIndiaYields() {
  const results: any[] = []

  // Tenors provided by user. ISO 8601 or numeric shorthand.
  // IRFCY dataset: Government Securities Yield Curve
  const tenors = ['P3M', 'P6M', 'P1Y', 'P2Y', 'P5Y', 'P10Y', 'P30Y']
  const tenorMap: Record<string, string> = {
    'P3M': '3M', 'P6M': '6M', 'P1Y': '1Y', 'P2Y': '2Y', 'P5Y': '5Y', 'P10Y': '10Y', 'P30Y': '30Y',
    '003M': '3M', '006M': '6M', '01Y': '1Y', '02Y': '2Y', '05Y': '5Y'
  }

  // Use a startPeriod 3 months back to ensure we get data even if there's a reporting lag
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const startPeriod = threeMonthsAgo.toISOString().split('T')[0];

  const url = `https://data.rbi.org.in/DBIE/SDMX/JSON/RBI/IRFCY/?TENOR=${tenors.join(',')}&startPeriod=${startPeriod}`

  try {
    const res = await fetchWithRetry(url, {
      headers: { 'Accept': 'application/json' }
    })
    const data = await res.json() as any

    const dataset = data?.dataSets?.[0]
    const series = dataset?.series
    const dimensions = data?.structure?.dimensions?.series
    const timePeriods = data?.structure?.dimensions?.observation?.[0]?.values

    if (!series || !dimensions || !timePeriods) {
      throw new Error('Malformed SDMX response from RBI')
    }

    // Find the tenor dimension index
    const tenorDimIndex = dimensions.findIndex((d: any) => d.id === 'TENOR' || d.id === 'MATURITY')
    if (tenorDimIndex === -1) throw new Error('Could not find TENOR dimension in RBI response')

    for (const [key, value] of Object.entries(series)) {
      const keyParts = key.split(':')
      const rawTenor = dimensions[tenorDimIndex].values[parseInt(keyParts[tenorDimIndex])].id
      const mappedTenor = tenorMap[rawTenor] || rawTenor

      const observations = (value as any).observations
      if (!observations) continue

      const obsKeys = Object.keys(observations).sort((a, b) => parseInt(b) - parseInt(a))
      if (obsKeys.length === 0) continue

      const latestKey = obsKeys[0]
      const prevKey = obsKeys.length > 1 ? obsKeys[1] : null

      const latestVal = parseFloat(observations[latestKey][0])
      const prevVal = prevKey ? parseFloat(observations[prevKey][0]) : null
      const latestDate = timePeriods[parseInt(latestKey)]?.id

      if (!isNaN(latestVal) && latestDate) {
        results.push({
          country: 'IN',
          tenor: mappedTenor,
          yield_pct: latestVal,
          prev_yield: prevVal && !isNaN(prevVal) ? prevVal : null,
          as_of_date: latestDate,
          source: 'RBI DBIE',
        })
      }
    }
  } catch (err: any) {
    console.error(`RBI SDMX error: ${err.message}`)
    // We could add FRED fallback here if needed, but better to fix direct access
  }

  return results
}

/* ─── Main Serve ──────────────────────────────────────────────── */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const fredApiKey = Deno.env.get('FRED_API_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Log start
  let logId: number | null = null
  try {
    const { data: logRow } = await supabase
      .from('ingestion_logs')
      .insert({ function_name: 'ingest-yield-curves', status: 'started', start_time: new Date().toISOString() })
      .select('id')
      .single()
    logId = logRow?.id ?? null
  } catch { /* ignore */ }

  try {
    if (!fredApiKey) throw new Error('FRED_API_KEY is not set')

    console.log('Fetching US + CN yields from FRED...')
    const fredResults = await fetchFredYields(fredApiKey)
    console.log(`FRED: ${fredResults.length} records`)

    console.log('Fetching EU Bund yields from ECB...')
    const ecbResults = await fetchECBYields()
    console.log(`ECB: ${ecbResults.length} records`)

    console.log('Fetching India yields (Direct RBI SDMX)...')
    const indiaResults = await fetchIndiaYields()
    console.log(`India: ${indiaResults.length} records`)

    const allRecords = [...fredResults, ...ecbResults, ...indiaResults]
      .filter(r => r.yield_pct != null && !isNaN(r.yield_pct))
      .map(r => ({ ...r, updated_at: new Date().toISOString() }))

    console.log(`Total records to upsert: ${allRecords.length}`)

    if (allRecords.length > 0) {
      const { error } = await supabase
        .from('yield_curves')
        .upsert(allRecords, {
          onConflict: 'country,tenor,as_of_date',
          ignoreDuplicates: false,
        })

      if (error) {
        console.error('Upsert error:', error)
        throw error
      }
    }

    const stats = {
      success: true,
      total: allRecords.length,
      fred: fredResults.length,
      ecb: ecbResults.length,
      india: indiaResults.length,
      countries: [...new Set(allRecords.map(r => r.country))],
    }

    if (logId) {
      await supabase.from('ingestion_logs').update({
        completed_at: new Date().toISOString(),
        status: 'success',
        rows_inserted: allRecords.length,
        metadata: stats,
      }).eq('id', logId)
    }

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Fatal error:', error.message)
    if (logId) {
      await supabase.from('ingestion_logs').update({
        completed_at: new Date().toISOString(),
        status: 'failed',
        error_message: error.message,
      }).eq('id', logId)
    }
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
