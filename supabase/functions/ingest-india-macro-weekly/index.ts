/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"
import { runIngestion } from '../_shared/logging.ts'
import { runWithRetry } from '../_shared/job-runner.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface MetricEntry {
  name: string
  unit: string
  values: Record<string, number | null>
  status: string
}

type FetchResult = { value: number | null; monthKey: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function dateToMonthKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  return `${MONTHS[d.getUTCMonth()]}-${String(d.getUTCFullYear()).slice(2)}`
}

function prevMonthKey(): string {
  const now = new Date()
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  return `${MONTHS[prev.getUTCMonth()]}-${String(prev.getUTCFullYear()).slice(2)}`
}

async function fetchFredObs(series: string, apiKey: string, limit = 14): Promise<{date:string,value:string}[]> {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${limit}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`FRED ${series}: HTTP ${res.status}`)
  const json = await res.json()
  if (json.error_message) throw new Error(`FRED ${series}: ${json.error_message}`)
  return (json.observations as {date:string,value:string}[]).filter(o => o.value !== '.')
}

// Compute trailing YoY% from a monthly index series (obs sorted newest-first)
function yoyFromIndex(obs: {date:string,value:string}[]): FetchResult | null {
  if (obs.length < 13) return null
  const curr = parseFloat(obs[0].value)
  const prev12 = parseFloat(obs[12].value)
  if (isNaN(curr) || isNaN(prev12) || prev12 === 0) return null
  return {
    value: Math.round(((curr / prev12) - 1) * 10000) / 100,
    monthKey: dateToMonthKey(obs[0].date),
  }
}

// ── Individual metric fetchers ────────────────────────────────────────────────

async function fetchCPI(fredKey: string): Promise<FetchResult> {
  const obs = await fetchFredObs('INDCPIALLMINMEI', fredKey, 14)
  return yoyFromIndex(obs) ?? { value: null, monthKey: '' }
}

async function fetchWPI(fredKey: string): Promise<FetchResult> {
  const obs = await fetchFredObs('INDWPIALLMINMEI', fredKey, 14)
  return yoyFromIndex(obs) ?? { value: null, monthKey: '' }
}

async function fetchMfgPMI(fredKey: string): Promise<FetchResult> {
  const obs = await fetchFredObs('INDPMIMANMFOB', fredKey, 1)
  if (!obs.length) return { value: null, monthKey: '' }
  return { value: parseFloat(obs[0].value), monthKey: dateToMonthKey(obs[0].date) }
}

async function fetchServicesPMI(fredKey: string): Promise<FetchResult> {
  const obs = await fetchFredObs('INDPMISERVBUS', fredKey, 1)
  if (!obs.length) return { value: null, monthKey: '' }
  return { value: parseFloat(obs[0].value), monthKey: dateToMonthKey(obs[0].date) }
}

async function fetchForexReserves(): Promise<FetchResult> {
  // World Bank – FI.RES.TOTL.CD = total reserves incl. gold, current USD
  const url = 'https://api.worldbank.org/v2/country/IND/indicator/FI.RES.TOTL.CD?format=json&mrv=4&per_page=4'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`World Bank reserves: HTTP ${res.status}`)
  const json = await res.json()
  const entries: any[] = json[1] || []
  const latest = entries.find((e: any) => e.value !== null)
  if (!latest) return { value: null, monthKey: '' }
  // World Bank date is "YYYY" for annual data; map to December of that year
  const monthKey = `Dec-${String(latest.date).slice(2)}`
  const valueBn = Math.round(latest.value / 1e9 * 10) / 10
  return { value: valueBn, monthKey }
}

async function fetchGSTCollections(): Promise<FetchResult> {
  // Scrape the GST news listing for the most recent "GST Revenue Collection" press release
  const listRes = await fetch('https://www.gst.gov.in/newsandupdates/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GraphiQuestor/1.0)' },
  })
  if (!listRes.ok) throw new Error(`gst.gov.in listing: HTTP ${listRes.status}`)
  const listHtml = await listRes.text()
  const $list = cheerio.load(listHtml)

  // Find the first link whose text contains "GST Revenue Collection"
  let prUrl: string | null = null
  $list('a').each((_: number, el: any) => {
    const text = $list(el).text().trim()
    if (/GST Revenue Collection/i.test(text) && !prUrl) {
      const href = $list(el).attr('href') || ''
      prUrl = href.startsWith('http') ? href : `https://www.gst.gov.in${href}`
    }
  })
  if (!prUrl) throw new Error('GST press release link not found on listing page')

  const prRes = await fetch(prUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GraphiQuestor/1.0)' },
  })
  if (!prRes.ok) throw new Error(`GST press release: HTTP ${prRes.status}`)
  const prHtml = await prRes.text()
  const $pr = cheerio.load(prHtml)

  // Parse month/year from title: "GST Revenue Collection for May 2026"
  const titleText = $pr('title').text()
  const titleMatch = titleText.match(/for\s+(\w+)\s+(\d{4})/i)
  if (!titleMatch) throw new Error(`GST title parse failed: "${titleText}"`)
  const MONTH_MAP: Record<string, string> = {
    january:'Jan', february:'Feb', march:'Mar', april:'Apr', may:'May', june:'Jun',
    july:'Jul', august:'Aug', september:'Sep', october:'Oct', november:'Nov', december:'Dec',
  }
  const shortMonth = MONTH_MAP[titleMatch[1].toLowerCase()] ?? titleMatch[1].slice(0, 3)
  const monthKey = `${shortMonth}-${String(titleMatch[2]).slice(2)}`

  // Parse collection value: "₹2.37 lakh crore" or large crore figure
  const bodyText = $pr('body').text()
  const lakhCroreMatch = bodyText.match(/([\d.]+)\s*lakh\s*crore/i)
  if (lakhCroreMatch) {
    const value = parseFloat(lakhCroreMatch[1])
    if (!isNaN(value)) return { value, monthKey }
  }
  // Fallback: total crores (e.g. "2,37,500 crore") → divide by 1e5 for lakh crore
  const croreMatch = bodyText.match(/(?:gross|total)\s+[^₹\n]*?([\d,]+)\s+crore/i)
  if (croreMatch) {
    const crores = parseFloat(croreMatch[1].replace(/,/g, ''))
    if (!isNaN(crores)) return { value: Math.round(crores / 1e5 * 100) / 100, monthKey }
  }
  throw new Error('GST collection value not parsed from press release')
}

async function fetchVehicleRegistrations(): Promise<FetchResult> {
  // VAHAN dashboard JSON endpoint backing vahan.parivahan.gov.in
  const url = 'https://vahan.parivahan.gov.in/vahan4dashboard/vahan/dashboardview/getAllVehicleRegistrationDetails.xhtml'
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (compatible; GraphiQuestor/1.0)',
      'Accept': 'application/json, text/plain, */*',
    },
    body: new URLSearchParams({ selectedYear: 'currentyear' }).toString(),
  })
  if (!res.ok) throw new Error(`VAHAN API: HTTP ${res.status}`)
  const json = await res.json()

  // VAHAN returns an array of state-wise counts; sum for national total
  const rows: any[] = Array.isArray(json) ? json : (json.data ?? json.registrationData ?? [])
  const total = rows.reduce((sum: number, row: any) => {
    const count = parseInt(row.vehicleCount ?? row.count ?? row.totalVehicles ?? '0', 10)
    return sum + (isNaN(count) ? 0 : count)
  }, 0)
  if (total === 0) throw new Error('VAHAN: no vehicle count in response')

  const valueInMn = Math.round(total / 1e5) / 10  // units → millions, 1 dp
  return { value: valueInMn, monthKey: prevMonthKey() }
}

async function fetchNaukriJobIndex(): Promise<FetchResult> {
  // Naukri publishes the JobSpeak Index monthly on naukri.com/jobspeak
  // The page is a React SPA; we look for the index value in the embedded JS state
  const res = await fetch('https://www.naukri.com/jobspeak/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
  })
  if (!res.ok) throw new Error(`Naukri: HTTP ${res.status}`)
  const html = await res.text()
  const $ = cheerio.load(html)

  let index: number | null = null

  // Search inline <script> tags for embedded JSON state containing the index value
  $('script').each((_: number, el: any) => {
    if (index) return
    const src = $(el).html() ?? ''
    const m = src.match(/"jobSpeakIndex"\s*:\s*(\d+)/) ??
               src.match(/"index"\s*:\s*(\d{3,5})/) ??
               src.match(/jobspeak[^"]*"?\s*:\s*(\d{3,5})/i)
    if (m) index = parseInt(m[1], 10)
  })

  // Fallback: look for a 4-digit number adjacent to "JobSpeak" in visible text
  if (!index) {
    const bodyText = $('body').text()
    const m = bodyText.match(/JobSpeak[^0-9]{0,60}(\d{4})/i) ??
               bodyText.match(/(\d{4})[^0-9]{0,20}JobSpeak/i)
    if (m) index = parseInt(m[1], 10)
  }

  if (!index) throw new Error('Naukri JobSpeak index not found in page source')
  return { value: index, monthKey: prevMonthKey() }
}

// ── Null-preserving merge ─────────────────────────────────────────────────────

function mergeIntoSnapshot(
  metricsData: MetricEntry[],
  metricName: string,
  monthKey: string,
  value: number | null,
  defaultUnit = '',
): MetricEntry[] {
  if (value === null || !monthKey) return metricsData

  const idx = metricsData.findIndex(m => m.name === metricName)
  if (idx === -1) {
    // New metric — append it
    return [...metricsData, { name: metricName, unit: defaultUnit, values: { [monthKey]: value }, status: 'neutral' }]
  }
  // Existing metric — only write if this month's slot is empty
  if (metricsData[idx].values[monthKey] != null) return metricsData
  return metricsData.map((m, i) =>
    i === idx ? { ...m, values: { ...m.values, [monthKey]: value } } : m
  )
}

// ── Entry point ───────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
  const fredKey = Deno.env.get('FRED_API_KEY') ?? ''

  return runIngestion(supabase, 'ingest-india-macro-weekly', async () => {
    const result = await runWithRetry(
      'ingest-india-macro-weekly',
      () => doIngest(supabase, fredKey),
      { timeoutMs: 5 * 60 * 1000, maxRetries: 2, backoffMs: 15_000 },
    )
    if (!result.ok) throw new Error(`All attempts failed: ${result.error}`)
    return result.value!
  })
})

async function doIngest(supabase: any, fredKey: string) {
  console.log('[india-macro-weekly] Fetching 8 metrics in parallel...')

  const [cpiR, wpiR, mfgR, svcR, forexR, gstR, vahanR, naukriR] =
    await Promise.allSettled([
      fetchCPI(fredKey),
      fetchWPI(fredKey),
      fetchMfgPMI(fredKey),
      fetchServicesPMI(fredKey),
      fetchForexReserves(),
      fetchGSTCollections(),
      fetchVehicleRegistrations(),
      fetchNaukriJobIndex(),
    ])

  const labels = ['CPI', 'WPI', 'MfgPMI', 'SvcPMI', 'Forex', 'GST', 'VAHAN', 'Naukri']
  const settled = [cpiR, wpiR, mfgR, svcR, forexR, gstR, vahanR, naukriR]
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(`  [${labels[i]}] ✓  value=${r.value.value}  month=${r.value.monthKey}`)
    } else {
      console.warn(`  [${labels[i]}] ✗  ${(r as PromiseRejectedResult).reason?.message}`)
    }
  })

  // Load latest snapshot
  const { data: snap, error: snapErr } = await supabase
    .from('india_macro_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (snapErr) throw snapErr

  // snapshot_date = first day of current UTC month
  const now = new Date()
  const snapshotDate = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`

  const v = (r: PromiseSettledResult<FetchResult>): FetchResult =>
    r.status === 'fulfilled' ? r.value : { value: null, monthKey: '' }

  let metricsData: MetricEntry[] = snap?.metrics_data ?? []
  metricsData = mergeIntoSnapshot(metricsData, 'CPI (retail inflation)', v(cpiR).monthKey, v(cpiR).value, '%')
  metricsData = mergeIntoSnapshot(metricsData, 'WPI',                    v(wpiR).monthKey, v(wpiR).value, '%')
  metricsData = mergeIntoSnapshot(metricsData, 'PMI-Manufacturing',      v(mfgR).monthKey, v(mfgR).value, '')
  metricsData = mergeIntoSnapshot(metricsData, 'PMI-Services',           v(svcR).monthKey, v(svcR).value, '')
  metricsData = mergeIntoSnapshot(metricsData, 'Forex Reserves',         v(forexR).monthKey, v(forexR).value, '$bn')
  metricsData = mergeIntoSnapshot(metricsData, 'GST Collections',        v(gstR).monthKey, v(gstR).value, '₹tn')
  metricsData = mergeIntoSnapshot(metricsData, 'Vehicle Registrations',  v(vahanR).monthKey, v(vahanR).value, 'mn units')
  metricsData = mergeIntoSnapshot(metricsData, 'Naukri Job Index',       v(naukriR).monthKey, v(naukriR).value, '')

  const { error: upsertErr } = await supabase
    .from('india_macro_snapshots')
    .upsert({
      snapshot_date: snapshotDate,
      geopolitical_summary: snap?.geopolitical_summary ?? '',
      insights_positive:    snap?.insights_positive    ?? [],
      insights_neutral:     snap?.insights_neutral     ?? [],
      insights_negative:    snap?.insights_negative    ?? [],
      metrics_data: metricsData,
    }, { onConflict: 'snapshot_date' })
  if (upsertErr) throw upsertErr

  const updated = settled.filter(r => r.status === 'fulfilled' && r.value.value !== null).length
  console.log(`[india-macro-weekly] Done. ${updated}/8 metrics updated.`)
  return { metrics_updated: updated, snapshot_date: snapshotDate }
}
