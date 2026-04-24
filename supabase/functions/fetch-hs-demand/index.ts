import { createClient, SupabaseClient } from '@supabase/supabase-js'

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
 * Chunk helper to prevent payload size errors
 */
async function chunkedUpsert(supabase: SupabaseClient, table: string, rows: any[], conflict: string, chunkSize = 100) {
    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize)
        const { error } = await supabase.from(table).upsert(chunk, { onConflict: conflict })
        if (error) throw error
    }
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const comtradeKey = Deno.env.get('COMTRADE_API_KEY') || Deno.env.get('comtrade_api_key') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const hsCode = url.searchParams.get('hsCode') || '620342'
    const yearParam = url.searchParams.get('year')
    const years = yearParam ? [parseInt(yearParam)] : [2024, 2023, 2022, 2021]

    try {
        console.log(`[fetch-hs-demand] Starting for HS ${hsCode}`)

        let totalRecords = 0
        let bilateralRecords = 0

        for (const year of years) {
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

            const demandRows = totalRows
                .filter(r => r.reporterISO && r.reporterISO !== 'W00')
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
                await chunkedUpsert(supabase, 'trade_demand_cache', demandRows, 'hs_code,reporter_iso3,year')
                totalRecords += demandRows.length
            }

            const bilateralUrl = `https://comtradeapi.un.org/data/v1/get/C/A/HS` +
                `?reporterCode=ALL&period=${year}&cmdCode=${hsCode}&flowCode=M&partnerCode=ALL` +
                (comtradeKey ? `&subscription-key=${comtradeKey}` : '')

            console.log(`[fetch-hs-demand] Fetching bilateral breakdown for year ${year}...`)
            const bilateralRes = await fetch(bilateralUrl)

            if (bilateralRes.ok) {
                const bilateralData = await bilateralRes.json()
                const bilRows: ComtradeRecord[] = bilateralData?.data || []

                const reporterTotals: Record<string, number> = {}
                demandRows.forEach(r => {
                    reporterTotals[r.reporter_iso3] = r.import_value_usd || 0
                })

                const supplierRows = bilRows
                    .filter(r =>
                        r.reporterISO &&
                        r.partnerISO &&
                        r.partnerISO !== 'W00' &&
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
                    try {
                        await chunkedUpsert(supabase, 'trade_supplier_breakdown', supplierRows, 'hs_code,reporter_iso3,partner_iso3,year')
                        bilateralRecords += supplierRows.length
                    } catch (suppErr) {
                        console.warn('[fetch-hs-demand] Supplier upsert error:', suppErr)
                    }
                }
            } else {
                console.warn(`[fetch-hs-demand] Bilateral fetch failed: ${bilateralRes.status}`)
            }

            break
        }
        
        if (totalRecords === 0) {
            return new Response(JSON.stringify({ 
                ok: false, 
                error: `No market data found for HS ${hsCode} in recent years (2021-2024).` 
            }), {
                status: 200, // Fail soft: return 200 with error object
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const scoreUrl = `${supabaseUrl}/functions/v1/compute-hs-opportunity-scores?hsCode=${hsCode}`
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
        return new Response(JSON.stringify({ 
            ok: false, 
            error: String(err),
            details: "Critical failure in fetch-hs-demand pipeline."
        }), {
            status: 200, // Fail soft: return 200 with error object
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
