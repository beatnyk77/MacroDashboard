/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'
import { runWithRetry } from '../_shared/job-runner.ts'
import { upsertObservations } from '../_shared/ingest_utils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// FRED series used:
//   PCOPPUSDM        — Global Price of Copper, USD per Metric Ton, monthly
//   GOLDAMGBD228NLBM — Gold Fixing Price AM (London), USD per Troy Oz, daily business days
//
// Root cause of prior 500s: AlphaVantage has no GOLD commodity endpoint —
// gold is not in their physical-commodities API family, so the old
// fetchAlphaVantageCommodity('GOLD', ...) always returned [] → threw → 500.

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const fredApiKey = Deno.env.get('FRED_API_KEY')

  if (!fredApiKey) {
    return new Response(JSON.stringify({ error: 'FRED_API_KEY not found' }), { status: 500 })
  }

  const supabaseClient = createClient(supabaseUrl, supabaseKey)

  return runIngestion(supabaseClient, 'ingest-copper-gold-ratio', async (_ctx) => {
    const result = await runWithRetry(
      'ingest-copper-gold-ratio',
      () => doIngestCopperGoldRatio(supabaseClient, fredApiKey, req.url),
      { timeoutMs: 10 * 60 * 1000, maxRetries: 3, backoffMs: 60_000 }
    )
    if (!result.ok) throw new Error(`All attempts failed: ${result.error}`)
    return result.value!
  })
})

async function fetchFredSeries(
  seriesId: string,
  apiKey: string,
  limit: number,
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<Array<{ date: string; value: number }>> {
  const url =
    `https://api.stlouisfed.org/fred/series/observations` +
    `?series_id=${seriesId}&api_key=${apiKey}&file_type=json` +
    `&sort_order=${sortOrder}&limit=${limit}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`FRED HTTP ${res.status} for ${seriesId}`)

  const json = await res.json()
  if (json.error_code) throw new Error(`FRED error for ${seriesId}: ${json.error_message}`)

  return (json.observations as Array<{ date: string; value: string }>)
    .filter(o => o.value !== '.')
    .map(o => ({ date: o.date, value: parseFloat(o.value) }))
    .filter(o => !isNaN(o.value))
}

async function doIngestCopperGoldRatio(supabase: any, fredApiKey: string, reqUrl: string) {
  const isBackfill = new URL(reqUrl).searchParams.get('backfill') === 'true'

  // Incremental: last 3 copper months + 90 gold days (enough to align any month-end).
  // Backfill:    5 years of copper + 7 years of gold daily to cover every pairing.
  const copperLimit = isBackfill ? 60 : 3
  const goldLimit   = isBackfill ? 2000 : 90

  console.log(`[ingest-copper-gold-ratio] mode=${isBackfill ? 'backfill' : 'incremental'} copperLimit=${copperLimit} goldLimit=${goldLimit}`)

  const [copperObs, goldObs] = await Promise.all([
    fetchFredSeries('PCOPPUSDM', fredApiKey, copperLimit, isBackfill ? 'asc' : 'desc'),
    fetchFredSeries('GOLDAMGBD228NLBM', fredApiKey, goldLimit, isBackfill ? 'asc' : 'desc'),
  ])

  if (copperObs.length === 0) throw new Error('FRED returned no copper observations (PCOPPUSDM)')
  if (goldObs.length === 0)   throw new Error('FRED returned no gold observations (GOLDAMGBD228NLBM)')

  // Build a gold lookup keyed by YYYY-MM for fast monthly pairing.
  // For each month, keep the last (latest) gold observation in that month.
  const goldByMonth = new Map<string, { date: string; value: number }>()
  for (const g of goldObs) {
    const ym = g.date.slice(0, 7) // "YYYY-MM"
    const existing = goldByMonth.get(ym)
    if (!existing || g.date > existing.date) goldByMonth.set(ym, g)
  }

  const observations: any[] = []

  for (const copper of copperObs) {
    const ym = copper.date.slice(0, 7)
    const gold = goldByMonth.get(ym)

    if (!gold) {
      // Try adjacent month (copper can publish one month ahead of gold settlement).
      const prevYm = prevMonth(ym)
      const goldFallback = goldByMonth.get(prevYm)
      if (!goldFallback) {
        console.warn(`[ingest-copper-gold-ratio] No gold data for month ${ym} or ${prevYm}, skipping copper date ${copper.date}`)
        continue
      }
      observations.push(...buildObservations(copper, goldFallback))
    } else {
      observations.push(...buildObservations(copper, gold))
    }
  }

  if (observations.length === 0) {
    throw new Error('No copper/gold date pairs could be aligned — check FRED data availability')
  }

  const { count } = await upsertObservations(supabase, observations)

  const latest = observations.filter(o => o.metric_id === 'COPPER_GOLD_RATIO').at(-1)
  return {
    rows_inserted: count,
    mode: isBackfill ? 'backfill' : 'incremental',
    metadata: latest
      ? {
          ratio: latest.value,
          date: latest.as_of_date,
          copper_usd_per_mt: latest.metadata.copper_usd_per_mt,
          gold_usd_per_oz: latest.metadata.gold_usd_per_oz,
        }
      : null,
  }
}

function buildObservations(
  copper: { date: string; value: number },
  gold: { date: string; value: number }
): any[] {
  const ratio = copper.value / gold.value
  return [
    {
      metric_id: 'COPPER_PRICE_USD',
      as_of_date: copper.date,
      value: copper.value,
      metadata: { source: 'FRED/PCOPPUSDM', unit: 'USD/metric ton' },
    },
    {
      metric_id: 'COPPER_GOLD_RATIO',
      as_of_date: copper.date,
      value: ratio,
      metadata: {
        source: 'FRED',
        copper_series: 'PCOPPUSDM',
        gold_series: 'GOLDAMGBD228NLBM',
        copper_usd_per_mt: copper.value,
        gold_usd_per_oz: gold.value,
        gold_date: gold.date,
      },
    },
  ]
}

// Returns the YYYY-MM string for the month before the given YYYY-MM string.
function prevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  if (m === 1) return `${y - 1}-12`
  return `${y}-${String(m - 1).padStart(2, '0')}`
}
