/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'
import { upsertObservations } from '../_shared/ingest_utils.ts'

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

function prevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  if (m === 1) return `${y - 1}-12`
  return `${y}-${String(m - 1).padStart(2, '0')}`
}

async function doIngestCopperGoldRatio(supabase: any, fredApiKey: string, isBackfill: boolean): Promise<IngestResult> {
  const copperLimit = isBackfill ? 60 : 3
  const goldLimit   = isBackfill ? 2000 : 90

  console.log(`[ingest-copper-gold-ratio] mode=${isBackfill ? 'backfill' : 'incremental'} copperLimit=${copperLimit} goldLimit=${goldLimit}`)

  const [copperObs, goldObs] = await Promise.all([
    fetchFredSeries('PCOPPUSDM', fredApiKey, copperLimit, isBackfill ? 'asc' : 'desc'),
    fetchFredSeries('GOLDAMGBD228NLBM', fredApiKey, goldLimit, isBackfill ? 'asc' : 'desc'),
  ])

  if (copperObs.length === 0) throw new Error('FRED returned no copper observations (PCOPPUSDM)')
  if (goldObs.length === 0)   throw new Error('FRED returned no gold observations (GOLDAMGBD228NLBM)')

  const goldByMonth = new Map<string, { date: string; value: number }>()
  for (const g of goldObs) {
    const ym = g.date.slice(0, 7)
    const existing = goldByMonth.get(ym)
    if (!existing || g.date > existing.date) goldByMonth.set(ym, g)
  }

  const observations: any[] = []

  for (const copper of copperObs) {
    const ym = copper.date.slice(0, 7)
    const gold = goldByMonth.get(ym)

    if (!gold) {
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

  const { count } = await upsertObservations(supabase, observations, {
    source_ref: 'live_api:ingest-copper-gold-ratio',
    is_provisional: false,
  })

  const latest = observations.filter(o => o.metric_id === 'COPPER_GOLD_RATIO').at(-1)
  return {
    ok: true,
    counts: { upserted: count ?? 0, skipped: 0 },
    meta: {
      mode: isBackfill ? 'backfill' : 'incremental',
      ...(latest ? { ratio: latest.value, date: latest.as_of_date, copper_usd_per_mt: latest.metadata.copper_usd_per_mt, gold_usd_per_oz: latest.metadata.gold_usd_per_oz } : {}),
    },
  }
}

serveIngest('ingest-copper-gold-ratio', async (req: Request): Promise<IngestResult> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
  const fredApiKey = Deno.env.get('FRED_API_KEY') ?? ''
  if (!fredApiKey) throw new Error('FRED_API_KEY not found')

  let isBackfill = new URL(req.url).searchParams.get('backfill') === 'true'
  try {
    const body = await req.json()
    if (body?.backfill === true) isBackfill = true
  } catch {
    // no body / not JSON
  }

  return doIngestCopperGoldRatio(supabase, fredApiKey, isBackfill)
}, { timeoutMs: 10 * 60 * 1000, retries: 3 })
