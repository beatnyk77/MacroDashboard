import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/* ─── FRED series map (US full curve + CN 10Y) ──────────────────── */
const FRED_SERIES: { country: string; tenor: string; seriesId: string; source: string }[] = [
  { country: 'US', tenor: '3M', seriesId: 'DGS3MO', source: 'FRED' },
  { country: 'US', tenor: '6M', seriesId: 'DGS6MO', source: 'FRED' },
  { country: 'US', tenor: '1Y', seriesId: 'DGS1', source: 'FRED' },
  { country: 'US', tenor: '2Y', seriesId: 'DGS2', source: 'FRED' },
  { country: 'US', tenor: '5Y', seriesId: 'DGS5', source: 'FRED' },
  { country: 'US', tenor: '10Y', seriesId: 'DGS10', source: 'FRED' },
  { country: 'US', tenor: '30Y', seriesId: 'DGS30', source: 'FRED' },
  { country: 'CN', tenor: '10Y', seriesId: 'INTDSRCNM193N', source: 'FRED' },
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

/* ─── India RBI DBIE known benchmark yields ───────────────────── */
const INDIA_BENCHMARK_YIELDS: { tenor: string; label: string }[] = [
  { tenor: '3M', label: '91 Day' },
  { tenor: '6M', label: '182 Day' },
  { tenor: '1Y', label: '364 Day' },
  { tenor: '5Y', label: '5 Year' },
  { tenor: '10Y', label: '10 Year' },
  { tenor: '30Y', label: '30 Year' },
]

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

/* ─── India RBI yield fallback (use FRED proxy + static benchmarks) ─ */
async function fetchIndiaYields(fredApiKey: string) {
  const results: any[] = []

  // Primary: RBI DBIE API attempt
  try {
    const rbiUrl = 'https://api.data.gov.in/resource/9698dcc0-6554-4e49-8e35-1b567a3e9c39?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&limit=10'
    const rbiRes = await fetchWithRetry(rbiUrl)
    const rbiData = await rbiRes.json() as any

    if (rbiData?.records && rbiData.records.length > 0) {
      // Parse government securities data
      for (const record of rbiData.records) {
        const tenor = record.tenor || record.security_type
        const yieldVal = parseFloat(record.yield || record.rate)
        if (tenor && !isNaN(yieldVal)) {
          // Map tenor names
          let mappedTenor: string | null = null
          for (const ib of INDIA_BENCHMARK_YIELDS) {
            if (tenor.includes(ib.label) || tenor.includes(ib.tenor)) {
              mappedTenor = ib.tenor
              break
            }
          }
          if (mappedTenor) {
            results.push({
              country: 'IN',
              tenor: mappedTenor,
              yield_pct: yieldVal,
              prev_yield: null,
              as_of_date: record.date || new Date().toISOString().split('T')[0],
              source: 'RBI',
            })
          }
        }
      }
    }
  } catch (err: any) {
    console.warn(`RBI API not available, falling back to FRED: ${err.message}`)
  }

  // Fallback: Use FRED for India 10Y if RBI didn't return it
  const has10Y = results.some(r => r.tenor === '10Y')
  if (!has10Y) {
    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=INDIRLTLT01STM&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=5`
      const res = await fetchWithRetry(url)
      const data = await res.json() as any
      const obs = (data.observations || []).filter((o: any) => o.value !== '.' && !isNaN(parseFloat(o.value)))
      if (obs.length > 0) {
        results.push({
          country: 'IN',
          tenor: '10Y',
          yield_pct: parseFloat(obs[0].value),
          prev_yield: obs.length > 1 ? parseFloat(obs[1].value) : null,
          as_of_date: obs[0].date,
          source: 'FRED',
        })
      }
    } catch (err: any) {
      console.error(`India FRED fallback error: ${err.message}`)
    }
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

    console.log('Fetching India yields (RBI + FRED fallback)...')
    const indiaResults = await fetchIndiaYields(fredApiKey)
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
