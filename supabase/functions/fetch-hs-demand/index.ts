import { createClient, SupabaseClient } from '@supabase/supabase-js'

declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── ISO3 → ISO2 mapping for cross-linking with country_metrics (alpha-2) ──
interface ComtradeRecord {
  reporterCode: number;
  reporterISO: string;
  reporterIso?: string;
  reporteriso?: string;
  reporterDesc: string;
  reporterName?: string;
  reporterdesc?: string;
  partnerCode: number | string;
  flowCode: string;
  flowDesc: string;
  primaryValue: number;
  value?: number;
  tradeValue?: number;
  refYear: number | string;
  period: string;
  qtyUnitAbbr?: string;
  qty?: number;
  rt3ISO?: string;
  rtCode?: number | string;
  reporter_code?: number | string;
  rtTitle?: string;
  reporter_desc?: string;
  TradeValue?: number;
  yr?: number | string;
  year?: number | string;
  cmdCode?: string | number;
}

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

const REPORTER_CODE_TO_ISO3: Record<string, string> = {
    "842": "USA", "156": "CHN", "276": "DEU", "392": "JPN", "826": "GBR",
    "699": "IND", "251": "FRA", "380": "ITA", "124": "CAN", "410": "KOR"
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

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
async function chunkedUpsert(supabase: SupabaseClient, table: string, rows: Record<string, unknown>[], conflict: string, chunkSize = 100) {
    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize)
        const { error } = await supabase.from(table).upsert(chunk, { onConflict: conflict })
        if (error) throw error
    }
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const comtradeKey = Deno.env.get('COMTRADE_API_KEY') || Deno.env.get('comtrade_api_key') || ''

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Supabase configuration (URL/Key)")
        }

        const supabase = createClient(supabaseUrl, supabaseKey)
        const url = new URL(req.url)
        const hsCode = url.searchParams.get('hsCode') || '620342'
        const yearParam = url.searchParams.get('year')
        const years = yearParam ? [parseInt(yearParam)] : [2024, 2023, 2022, 2021]

        console.log(`[fetch-hs-demand] Starting for HS ${hsCode}`)

        let totalRecords = 0
        const bilateralRecords = 0
        let firstBatchDebug: Record<string, unknown> | null = null;
        
        const topReportersList = ["842", "156", "276", "392", "826", "699", "251", "380", "124", "410"]; // USA, China, Germany, Japan, UK, India, France, Italy, Canada, Korea
        const reporterString = topReportersList.join(',');
        const yearString = years.join(',');
        
        // ── Progressive Fetch Strategy ──
        // For 'heavy' HS codes (like 2-digit chapters), Comtrade often 500s on massive batches.
        // We now iterate through years and attempt batch fetching per-year.
        // If that fails, we degrade to individual reporter fetches for that year.

        const yearTotalRows: ComtradeRecord[] = [];
        
        for (const year of years) {
            console.log(`[fetch-hs-demand] Attempting fetch for year ${year}...`);
            const yearUrl = `https://comtradeapi.un.org/data/v1/get/C/A/HS` +
                `?reporterCode=${reporterString}&period=${year}&cmdCode=${hsCode}&flowCode=X&partnerCode=0`;

            try {
                const yearRes = await fetch(yearUrl, {
                    headers: { 'Ocp-Apim-Subscription-Key': comtradeKey }
                });

                if (yearRes.ok) {
                    const yearData = await yearRes.json() as { data?: ComtradeRecord[] };
                    let yearRecords: any[] = yearData?.data || [];
                    console.log(`[fetch-hs-demand] Got ${yearRecords.length} records for year ${year}`);
                    
                    // Fallback: try partnerCode=all if World is missing
                    if (yearRecords.length === 0) {
                        console.log(`[fetch-hs-demand] No 'World' data for ${year}. Trying partners=all...`);
                        const allUrl = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${reporterString}&period=${year}&cmdCode=${hsCode}&flowCode=X&partnerCode=all`;
                        const allRes = await fetch(allUrl, { headers: { 'Ocp-Apim-Subscription-Key': comtradeKey } });
                        if (allRes.ok) {
                            const allJson = await allRes.json() as { data: any[] };
                            const rawPartnerRows = allJson.data || [];
                            if (rawPartnerRows.length > 0) {
                                const aggMap = new Map();
                                rawPartnerRows.forEach((r: any) => {
                                    const repCode = r.ReporterCode || r.reporterCode;
                                    const key = `${repCode}`;
                                    const existing = aggMap.get(key) || { ...r, PrimaryValue: 0, primaryValue: 0 };
                                    existing.PrimaryValue += (r.PrimaryValue || r.primaryValue || 0);
                                    aggMap.set(key, existing);
                                });
                                yearRecords = Array.from(aggMap.values());
                            }
                        }
                    }

                    if (yearRecords.length > 0) {
                        if (!firstBatchDebug) {
                            firstBatchDebug = { status: yearRes.status, dataCount: yearRecords.length, url: yearUrl };
                        }
                        yearRecords.forEach(rec => {
                            const repCode = rec.ReporterCode || rec.reporterCode || rec.rtCode || rec.reporter_code;
                            if (repCode) yearTotalRows.push(rec);
                        });
                    }
                }
            } catch (err) {
                console.error(`[fetch-hs-demand] Error fetching year ${year}: ${err}`);
            }

            // If we have any data, we stop (prioritize latest year)
            if (yearTotalRows.length > 0) break;
        }

        if (yearTotalRows.length === 0 && hsCode.length > 4) {
            const fallbackHs = hsCode.substring(0, 4);
            console.log(`[fetch-hs-demand] No data for ${hsCode}. Falling back to 4-digit: ${fallbackHs}`);
            
            for (const year of years) {
                const yearUrl = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${reporterString}&period=${year}&cmdCode=${fallbackHs}&flowCode=X&partnerCode=0`;
                const yearRes = await fetch(yearUrl, { headers: { 'Ocp-Apim-Subscription-Key': comtradeKey } });
                if (yearRes.ok) {
                    const yearData = await yearRes.json() as { data?: ComtradeRecord[] };
                    const yearRecords = yearData?.data || [];
                    if (yearRecords.length > 0) {
                        yearRecords.forEach(rec => {
                            const repCode = rec.ReporterCode || rec.reporterCode || rec.rtCode;
                            if (repCode) yearTotalRows.push(rec);
                        });
                        break; // Stop at first successful year
                    }
                }
            }
        }

        if (yearTotalRows.length === 0) {
            return new Response(JSON.stringify({ 
                ok: false, 
                error: `No market data found for HS ${hsCode} in recent years.`,
                debug: {
                    hsCode,
                    yearsQueryed: years,
                    hasApiKey: !!comtradeKey,
                    firstBatch: firstBatchDebug,
                    sampleRecord: yearTotalRows.length > 0 ? yearTotalRows[0] : null,
                    message: "The function finished all attempts but found 0 records."
                }
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log(`[fetch-hs-demand] Processing ${yearTotalRows.length} aggregated rows`);
        if (yearTotalRows.length > 0) {
            console.log(`[fetch-hs-demand] Sample record structure: ${JSON.stringify(yearTotalRows[0]).substring(0, 500)}`);
        }

        const demandRows = yearTotalRows
            .map(r => {
                const repCode = r.ReporterCode || r.reporterCode || r.rtCode || r.reporter_code;
                const reporterCode = String(repCode || "");
                const iso3Candidate = r.ReporterISO || r.reporterISO || r.reporterIso || r.reporteriso || r.rt3ISO;
                const iso3 = iso3Candidate || REPORTER_CODE_TO_ISO3[reporterCode];
                
                const cmd = r.CmdCode || r.cmdCode || hsCode;
                const val = r.PrimaryValue || r.primaryValue || 0;
                const qty = r.Qty || r.qty || null;
                const unit = r.QtyUnitAbbr || r.qtyUnitAbbr || null;

                if (!iso3 || iso3 === 'W00') return null;

                return {
                    hs_code: hsCode, // Always store as the requested code for UI consistency
                    reporter_iso3: iso3,
                    reporter_iso2: ISO3_TO_ISO2[iso3] || null,
                    reporter_name: r.ReporterName || r.reporterName || r.rtTitle || iso3,
                    year: parseInt(String(r.Period || r.period || r.yr || 0).substring(0, 4)),
                    export_value_usd: Math.round(parseFloat(String(val))),
                    qty_value: qty ? Math.round(parseFloat(String(qty))) : null,
                    qty_unit: unit,
                    fetched_at: new Date().toISOString()
                };
            })
            .filter((r): r is NonNullable<typeof r> => r !== null && (String(r.hs_code) === hsCode || String(r.hs_code) === hsCode.substring(0, 4)));

        if (demandRows.length > 0) {
            // Deduplicate to avoid Supabase ON CONFLICT multiple update errors
            const uniqueMap = new Map();
            for (const row of demandRows) {
                const key = `${row.hs_code}-${row.reporter_iso3}-${row.year}`;
                if (uniqueMap.has(key)) {
                    if (row.export_value_usd > uniqueMap.get(key).export_value_usd) {
                        uniqueMap.set(key, row);
                    }
                } else {
                    uniqueMap.set(key, row);
                }
            }
            const uniqueDemandRows = Array.from(uniqueMap.values());

            await chunkedUpsert(supabase, 'trade_demand_cache', uniqueDemandRows, 'hs_code,reporter_iso3,year', 200);
            totalRecords = uniqueDemandRows.length;
            console.log(`[fetch-hs-demand] Upserted ${uniqueDemandRows.length} unique demand rows`);
        }

        await logIngestion(supabase, 'fetch-hs-demand', 'success', {
            hsCode, totalRecords, bilateralRecords
        })

        if (totalRecords === 0) {
            return new Response(JSON.stringify({ 
                ok: false, 
                error: `No market data found for HS ${hsCode} in recent years.`,
                debug: {
                    hsCode,
                    yearsQueryed: years,
                    hasApiKey: !!comtradeKey,
                    numReportersAttempted: topReportersList.length,
                    firstBatch: firstBatchDebug,
                    message: "The function finished all attempts but found 0 records."
                }
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Trigger scoring
        const scoreUrl = `${supabaseUrl}/functions/v1/compute-hs-opportunity-scores?hsCode=${hsCode}`
        console.log(`[fetch-hs-demand] Triggering scoring at ${scoreUrl}`)
        
        let scoreResponseText = ''
        try {
            const res = await fetch(scoreUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                },
            })
            scoreResponseText = await res.text()
            console.log(`[fetch-hs-demand] Score response: ${res.status} ${scoreResponseText}`)
        } catch (e) {
            console.warn('[fetch-hs-demand] Score trigger error:', e)
            scoreResponseText = String(e)
        }

        await logIngestion(supabase, 'fetch-hs-demand', 'success', {
            hsCode, totalRecords, bilateralRecords,
            sample: yearTotalRows.length > 0 ? yearTotalRows[0] : null
        })

        return new Response(JSON.stringify({
            ok: true,
            hsCode,
            totalRecords,
            message: `Data fetch complete. Scored processing started.`,
            scoreResponseText
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (err: any) {
        console.error('[fetch-hs-demand] Global catch:', err)
        
        const errorMessage = err instanceof Error ? err.message : (err?.message || JSON.stringify(err));

        return new Response(JSON.stringify({ 
            ok: false, 
            error: errorMessage,
            details: "Processing failure. Check logs for payload issues."
        }), {
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
