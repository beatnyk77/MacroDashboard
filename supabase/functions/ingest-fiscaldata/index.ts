/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { fetchWithRetry, upsertObservations } from '../_shared/ingest_utils.ts'
import { serveIngest, IngestResult } from '../_shared/handler.ts';


const OUNCES_PER_TONNE = 32150.7466

// ─── US_10Y_TIPS_YIELD ────────────────────────────────────────────────────────
// Source: Federal Reserve H.15 release via FRED (series DFII10)
// Frequency: Daily (business days). Unit: percent.
async function fetchTipsYield(fredApiKey: string): Promise<{ date: string; value: number }[]> {
  const url = `https://api.stlouisfed.org/fred/series/observations`
    + `?series_id=DFII10`
    + `&api_key=${fredApiKey}`
    + `&file_type=json`
    + `&sort_order=desc`
    + `&limit=30`
    + `&observation_start=2020-01-01`

  const res = await fetchWithRetry(url, { timeoutMs: 15_000, maxRetries: 2 })
  const json = await res.json() as any

  const rows: { date: string; value: number }[] = []
  for (const obs of json.observations ?? []) {
    const val = parseFloat(obs.value)
    if (!isNaN(val)) rows.push({ date: obs.date, value: val })
  }
  return rows
}

// ─── CB_GOLD_NET ──────────────────────────────────────────────────────────────
// Source: IMF International Financial Statistics (IFS), indicator RAXG_FO
// (Gold reserves, fine troy ounces, annual frequency).
// We compute the most-recent-year net change across ALL reporting central banks
// and write a single scalar (tonnes) as CB_GOLD_NET.
// Frequency: Updated quarterly by IMF as annual revisions come in.
async function fetchCbGoldNet(): Promise<{ date: string; value: number } | null> {
  const currentYear = new Date().getFullYear()
  const startPeriod = currentYear - 3

  const url = `http://dataservices.imf.org/REST/SDMX_JSON.svc/CompactData/IFS/A..RAXG_FO.`
    + `?startPeriod=${startPeriod}&endPeriod=${currentYear}`

  const res = await fetchWithRetry(url, { timeoutMs: 30_000, maxRetries: 2 })
  const json = await res.json() as any
  const series = json?.CompactData?.DataSet?.Series

  if (!Array.isArray(series)) return null

  // Build a map: country → year → tonnes
  const holdings: Record<string, Record<number, number>> = {}
  for (const s of series) {
    const area = s['@REF_AREA'] as string
    const obs = s.Obs
    if (!Array.isArray(obs)) continue
    holdings[area] = {}
    for (const o of obs) {
      const yr = parseInt(o['@TIME_PERIOD'])
      const oz = parseFloat(o['@OBS_VALUE'])
      if (!isNaN(yr) && !isNaN(oz)) {
        holdings[area][yr] = oz / OUNCES_PER_TONNE
      }
    }
  }

  // Find the latest year with broad coverage (>=20 countries reporting)
  let latestYear = currentYear
  for (let y = currentYear; y >= startPeriod; y--) {
    const coverage = Object.values(holdings).filter(h => h[y] !== undefined).length
    if (coverage >= 20) { latestYear = y; break }
  }
  const priorYear = latestYear - 1

  let netTonnes = 0
  for (const countryHoldings of Object.values(holdings)) {
    const curr = countryHoldings[latestYear]
    const prior = countryHoldings[priorYear]
    if (curr !== undefined && prior !== undefined) {
      netTonnes += curr - prior
    }
  }

  if (netTonnes === 0) return null

  return {
    date: `${latestYear}-12-31`,
    value: Math.round(netTonnes * 10) / 10,
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serveIngest('ingest-fiscaldata', async (_req: Request): Promise<IngestResult> => {

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  
    const fredApiKey = Deno.env.get('FRED_API_KEY')
    if (!fredApiKey) throw new Error('FRED_API_KEY is not set')

    const [tipsRows, cbGold] = await Promise.all([
      fetchTipsYield(fredApiKey),
      fetchCbGoldNet(),
    ])

    const observations: any[] = []

    // US_10Y_TIPS_YIELD — backfill last 30 business days
    for (const row of tipsRows) {
      observations.push({
        metric_id: 'US_10Y_TIPS_YIELD',
        as_of_date: row.date,
        value: row.value,
        metadata: {
          source: 'FRED',
          series_id: 'DFII10',
          release: 'H.15 Selected Interest Rates',
          unit: 'percent',
          frequency: 'daily',
        },
      })
    }

    // CB_GOLD_NET — latest IMF annual net tonnes
    if (cbGold) {
      observations.push({
        metric_id: 'CB_GOLD_NET',
        as_of_date: cbGold.date,
        value: cbGold.value,
        metadata: {
          source: 'IMF IFS',
          indicator: 'RAXG_FO',
          release: 'International Financial Statistics',
          unit: 'tonnes_net',
          frequency: 'annual',
          note: 'Net change in global central bank gold holdings (buyers minus sellers)',
        },
      })
    }

    if (observations.length === 0) throw new Error('No data fetched from FRED or IMF')

    const { count } = await upsertObservations(supabase, observations)

    return {
      ok: true,
      counts: { upserted: count },
      meta: {
        tips_days: tipsRows.length,
        cb_gold_net_tonnes: cbGold?.value ?? null,
        cb_gold_as_of: cbGold?.date ?? null,
      },
    };
})
