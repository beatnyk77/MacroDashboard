import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── ISO3 → ISO2 mapping for cross-linking with country_metrics (alpha-2) ──
const ISO3_TO_ISO2: Record<string, string> = {
    'USA': 'US', 'CHN': 'CN', 'DEU': 'DE', 'GBR': 'GB', 'FRA': 'FR',
    'IND': 'IN', 'JPN': 'JP', 'KOR': 'KR', 'NLD': 'NL', 'ITA': 'IT',
    'CAN': 'CA', 'AUS': 'AU', 'MEX': 'MX', 'BRA': 'BR', 'TUR': 'TR',
    'VNM': 'VN', 'THA': 'TH', 'IDN': 'ID', 'MYS': 'MY', 'PHL': 'PH',
    'ZAF': 'ZA', 'EGY': 'EG', 'NGA': 'NG', 'SAU': 'SA', 'ARE': 'AE',
    'PAK': 'PK', 'BGD': 'BD', 'LKA': 'LK', 'POL': 'PL', 'SWE': 'SE',
    'NOR': 'NO', 'DNK': 'DK', 'FIN': 'FI', 'CHE': 'CH', 'AUT': 'AT',
    'BEL': 'BE', 'PRT': 'PT', 'ESP': 'ES', 'GRC': 'GR', 'ROU': 'RO',
    'CZE': 'CZ', 'HUN': 'HU', 'SVK': 'SK', 'HRV': 'HR', 'BGR': 'BG',
    'RUS': 'RU', 'UKR': 'UA', 'KAZ': 'KZ', 'ARG': 'AR', 'COL': 'CO',
    'CHL': 'CL', 'PER': 'PE', 'ECU': 'EC', 'ETH': 'ET', 'KEN': 'KE',
    'TZA': 'TZ', 'GHA': 'GH', 'CIV': 'CI', 'CMR': 'CM', 'MAR': 'MA',
    'DZA': 'DZ', 'TUN': 'TN', 'SDN': 'SD', 'AGO': 'AO', 'MOZ': 'MZ',
    'SGP': 'SG', 'HKG': 'HK', 'TWN': 'TW', 'NZL': 'NZ', 'ISR': 'IL',
    'IRN': 'IR', 'IRQ': 'IQ', 'QAT': 'QA', 'KWT': 'KW', 'OMN': 'OM',
    'MMR': 'MM', 'KHM': 'KH', 'NPL': 'NP',
}

interface ComtradeRecord {
    reporterISO: string
    reporterDesc: string
    partnerISO: string
    partnerDesc: string
    refYear: number
    primaryValue: number
    qty: number
    qtyUnitAbbr: string
}

async function logIngestion(supabase: SupabaseClient, fnName: string, status: string, meta: object) {
    try {
        await supabase.from('ingestion_logs').insert({
            function_name: fnName,
            status,
            metadata: meta,
            start_time: new Date().toISOString(),
        })
    } catch (_) { /* non-blocking */ }
}

/**
 * Computes HHI for a set of (value, total) pairs.
 * HHI = sum of squared market shares (0–1 scale).
 */
function computeHHI(supplierValues: number[], total: number): number {
    if (total === 0) return 0
    const shares = supplierValues.map(v => v / total)
    return shares.reduce((acc, s) => acc + s * s, 0)
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const comtradeKey = Deno.env.get('COMTRADE_API_KEY') || Deno.env.get('comtrade_api_key') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const hsCode = url.searchParams.get('hsCode') || '620342'
    // Try 2024 first (latest available), fallback to 2023
    const yearParam = url.searchParams.get('year')
    const years = yearParam ? [parseInt(yearParam)] : [2024, 2023, 2022]

    try {
        console.log(`[fetch-hs-demand] Starting for HS ${hsCode}`)

        let totalRecords = 0
        let bilateralRecords = 0

        for (const year of years) {
            // ── Step 1: Fetch import totals per reporter (partnerCode=0 = World aggregate) ──
            const totalsUrl = `https://comtradeapi.un.org/data/v1/get/C/A/HS` +
                `?reporterCode=ALL&period=${year}&cmdCode=${hsCode}&flowCode=M&partnerCode=0` +
                (comtradeKey ? `&subscription-key=${comtradeKey}` : '')

            console.log(`[fetch-hs-demand] Fetching totals for year ${year}...`)
            const totalsRes = await fetch(totalsUrl)

            if (!totalsRes.ok) {
                const errText = await totalsRes.text().catch(() => '')
                console.warn(`[fetch-hs-demand] Totals fetch failed for ${year}: ${totalsRes.status} - ${errText}`)
                if (year === years[years.length - 1]) throw new Error(`Comtrade API error: ${totalsRes.status} ${totalsRes.statusText}`)
                continue
            }

            const totalsData = await totalsRes.json()
            const totalRows: ComtradeRecord[] = totalsData?.data || []

            if (totalRows.length === 0) {
                console.warn(`[fetch-hs-demand] No data for HS ${hsCode} year ${year}, trying next...`)
                continue
            }

            console.log(`[fetch-hs-demand] Got ${totalRows.length} total rows for year ${year}`)

            // Upsert import totals into trade_demand_cache
            const demandRows = totalRows
                .filter(r => r.reporterISO && r.reporterISO !== 'W00') // exclude World aggregate reporter
                .map(r => ({
                    hs_code: hsCode,
                    reporter_iso3: r.reporterISO,
                    reporter_iso2: ISO3_TO_ISO2[r.reporterISO] || null,
                    reporter_name: r.reporterDesc,
                    year: r.refYear || year,
                    import_value_usd: Math.round(r.primaryValue || 0),
                    qty_value: r.qty ? Math.round(r.qty) : null,
                    qty_unit: r.qtyUnitAbbr || null,
                    fetched_at: new Date().toISOString(),
                }))

            if (demandRows.length > 0) {
                const { error: demandErr } = await supabase
                    .from('trade_demand_cache')
                    .upsert(demandRows, { onConflict: 'hs_code,reporter_iso3,year' })
                if (demandErr) throw demandErr
                totalRecords += demandRows.length
            }

            // ── Step 2: Fetch bilateral breakdown (who supplies each importer) ──
            // We limit to partnerCode=ALL to get full bilateral matrix
            const bilateralUrl = `https://comtradeapi.un.org/data/v1/get/C/A/HS` +
                `?reporterCode=ALL&period=${year}&cmdCode=${hsCode}&flowCode=M&partnerCode=ALL` +
                (comtradeKey ? `&subscription-key=${comtradeKey}` : '')

            console.log(`[fetch-hs-demand] Fetching bilateral breakdown for year ${year}...`)
            const bilateralRes = await fetch(bilateralUrl)

            if (bilateralRes.ok) {
                const bilateralData = await bilateralRes.json()
                const bilRows: ComtradeRecord[] = bilateralData?.data || []

                // Build total per reporter for market share computation
                const reporterTotals: Record<string, number> = {}
                demandRows.forEach(r => {
                    reporterTotals[r.reporter_iso3] = r.import_value_usd || 0
                })

                const supplierRows = bilRows
                    .filter(r =>
                        r.reporterISO &&
                        r.partnerISO &&
                        r.partnerISO !== 'W00' && // exclude World
                        r.reporterISO !== 'W00'
                    )
                    .map(r => {
                        const total = reporterTotals[r.reporterISO] || 1
                        const importVal = Math.round(r.primaryValue || 0)
                        return {
                            hs_code: hsCode,
                            reporter_iso3: r.reporterISO,
                            partner_iso3: r.partnerISO,
                            partner_name: r.partnerDesc,
                            year: r.refYear || year,
                            import_value_usd: importVal,
                            market_share_pct: total > 0 ? parseFloat(((importVal / total) * 100).toFixed(3)) : 0,
                            fetched_at: new Date().toISOString(),
                        }
                    })

                if (supplierRows.length > 0) {
                    const { error: suppErr } = await supabase
                        .from('trade_supplier_breakdown')
                        .upsert(supplierRows, { onConflict: 'hs_code,reporter_iso3,partner_iso3,year' })
                    if (suppErr) console.warn('[fetch-hs-demand] Supplier upsert warn:', suppErr.message)
                    else bilateralRecords += supplierRows.length
                }
            } else {
                console.warn(`[fetch-hs-demand] Bilateral fetch failed: ${bilateralRes.status}`)
            }

            // Successfully fetched — no need to try earlier years
            break
        }

        // ── Step 3: Trigger opportunity score computation ──
        const scoreUrl = `${supabaseUrl}/functions/v1/compute-hs-opportunity-scores?hsCode=${hsCode}`
        // Fire and don't wait — scores compute asynchronously
        fetch(scoreUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
            },
        }).catch(e => console.warn('[fetch-hs-demand] Score trigger warn:', e))

        await logIngestion(supabase, 'fetch-hs-demand', 'success', {
            hsCode, totalRecords, bilateralRecords,
        })

        return new Response(JSON.stringify({
            ok: true,
            hsCode,
            totalRecords,
            bilateralRecords,
            message: `Fetched demand data for HS ${hsCode}. Opportunity scores computing asynchronously.`,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (err) {
        console.error('[fetch-hs-demand] Error:', err)
        await logIngestion(supabase, 'fetch-hs-demand', 'failed', { hsCode, error: String(err) })
        return new Response(JSON.stringify({ ok: false, error: String(err) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
