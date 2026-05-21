/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'
import { runWithRetry } from '../_shared/job-runner.ts'

declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
  // UpperCamelCase variants from v1 API
  ReporterCode?: number;
  ReporterISO?: string;
  CmdCode?: string | number;
  PrimaryValue?: number;
  Period?: string | number;
  Qty?: number;
  QtyUnitAbbr?: string;
  ReporterName?: string;
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

async function doIngestHSDemand(ctx: { supabase: SupabaseClient, hsCode: string, years: number[], comtradeKey: string, supabaseUrl: string, supabaseKey: string }) {
    const { supabase, hsCode, years, comtradeKey, supabaseUrl, supabaseKey } = ctx;
    
    console.log(`[fetch-hs-demand] Starting for HS ${hsCode}`)

    let totalRecords = 0
    const bilateralRecords = 0
    let firstBatchDebug: Record<string, unknown> | null = null;
    
    const topReportersList = ["842", "156", "276", "392", "826", "699", "251", "380", "124", "410"]; // USA, China, Germany, Japan, UK, India, France, Italy, Canada, Korea
    const reporterString = topReportersList.join(',');
    
    const yearTotalRows: ComtradeRecord[] = [];
    
    for (const year of years) {
        console.log(`[fetch-hs-demand] Attempting fetch for year ${year}...`);
        const yearUrl = `https://comtradeapi.un.org/data/v1/get/C/A/HS` +
            `?reporterCode=${reporterString}&period=${year}&cmdCode=${hsCode}&flowCode=M&partnerCode=0,699`;

        try {
            const yearRes = await fetch(yearUrl, {
                headers: { 'Ocp-Apim-Subscription-Key': comtradeKey }
            });

            if (yearRes.ok) {
                const yearData = await yearRes.json() as { data?: ComtradeRecord[] };
                const yearRecords = yearData?.data || [];
                console.log(`[fetch-hs-demand] Got ${yearRecords.length} records for year ${year}`);
                
                if (yearRecords.length > 0) {
                    yearRecords.forEach(rec => {
                        const repCode = rec.ReporterCode || rec.reporterCode || rec.rtCode || rec.reporter_code;
                        if (repCode) yearTotalRows.push(rec);
                    });
                }
            }
        } catch (err) {
            console.error(`[fetch-hs-demand] Error fetching year ${year}: ${err}`);
        }

        if (yearTotalRows.length > 0) break;
    }

    if (yearTotalRows.length === 0 && hsCode.length > 4) {
        const fallbackHs = hsCode.substring(0, 4);
        console.log(`[fetch-hs-demand] No data for ${hsCode}. Falling back to 4-digit: ${fallbackHs}`);
        
        for (const year of years) {
            const yearUrl = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${reporterString}&period=${year}&cmdCode=${fallbackHs}&flowCode=M&partnerCode=0,699`;
            const yearRes = await fetch(yearUrl, { headers: { 'Ocp-Apim-Subscription-Key': comtradeKey } });
            if (yearRes.ok) {
                const yearData = await yearRes.json() as { data?: ComtradeRecord[] };
                const yearRecords = yearData?.data || [];
                if (yearRecords.length > 0) {
                    yearRecords.forEach(rec => {
                        const repCode = rec.ReporterCode || rec.reporterCode || rec.rtCode;
                        if (repCode) yearTotalRows.push(rec);
                    });
                    break; 
                }
            }
        }
    }

    if (yearTotalRows.length === 0) {
        throw new Error(`No market data found for HS ${hsCode} in recent years.`);
    }

    const demandRows: any[] = [];
    const supplierRows: any[] = [];

    yearTotalRows.forEach(r => {
        const repCode = r.ReporterCode || r.reporterCode || r.rtCode || r.reporter_code;
        const reporterCode = String(repCode || "");
        const iso3Candidate = r.ReporterISO || r.reporterISO || r.reporterIso || r.reporteriso || r.rt3ISO;
        const iso3 = iso3Candidate || REPORTER_CODE_TO_ISO3[reporterCode];
        
        const partnerCode = String(r.PartnerCode || r.partnerCode || "");
        const pIso3Candidate = r.PartnerISO || r.partnerISO || r.partnerIso || r.pt3ISO;
        
        const val = r.PrimaryValue || r.primaryValue || 0;
        const qty = r.Qty || r.qty || null;
        const unit = r.QtyUnitAbbr || r.qtyUnitAbbr || null;

        if (!iso3 || iso3 === 'W00') return;

        if (partnerCode === '0' || pIso3Candidate === 'W00') {
            demandRows.push({
                hs_code: hsCode, 
                reporter_iso3: iso3,
                reporter_iso2: ISO3_TO_ISO2[iso3] || null,
                reporter_name: r.ReporterName || r.reporterName || r.rtTitle || iso3,
                year: parseInt(String(r.Period || r.period || r.yr || 0).substring(0, 4)),
                import_value_usd: Math.round(parseFloat(String(val))),
                qty_value: qty ? Math.round(parseFloat(String(qty))) : null,
                qty_unit: unit,
                fetched_at: new Date().toISOString()
            });
        } else if (partnerCode === '699' || pIso3Candidate === 'IND') {
            supplierRows.push({
                hs_code: hsCode,
                reporter_iso3: iso3,
                partner_iso3: 'IND',
                partner_name: 'India',
                year: parseInt(String(r.Period || r.period || r.yr || 0).substring(0, 4)),
                import_value_usd: Math.round(parseFloat(String(val))),
                fetched_at: new Date().toISOString()
            });
        }
    });

    // Dedup and Upsert Demand
    const uniqueDemandMap = new Map();
    demandRows.forEach(row => {
        const key = `${row.hs_code}-${row.reporter_iso3}-${row.year}`;
        if (!uniqueDemandMap.has(key) || row.import_value_usd > uniqueDemandMap.get(key).import_value_usd) {
            uniqueDemandMap.set(key, row);
        }
    });
    const finalDemandRows = Array.from(uniqueDemandMap.values());
    if (finalDemandRows.length > 0) {
        await chunkedUpsert(supabase, 'trade_demand_cache', finalDemandRows, 'hs_code,reporter_iso3,year', 200);
        totalRecords = finalDemandRows.length;
    }

    // Dedup and Upsert Suppliers with share calculation
    const uniqueSupplierMap = new Map();
    supplierRows.forEach(row => {
        const key = `${row.hs_code}-${row.reporter_iso3}-${row.year}`;
        if (!uniqueSupplierMap.has(key) || row.import_value_usd > uniqueSupplierMap.get(key).import_value_usd) {
            uniqueSupplierMap.set(key, row);
        }
    });

    const finalSupplierRows = Array.from(uniqueSupplierMap.values()).map(s => {
        const matchingDemand = finalDemandRows.find(d => d.reporter_iso3 === s.reporter_iso3 && d.year === s.year);
        const share = matchingDemand && matchingDemand.import_value_usd > 0
            ? (s.import_value_usd / matchingDemand.import_value_usd) * 100
            : 0;
        return { ...s, market_share_pct: Math.min(100, parseFloat(share.toFixed(3))) };
    });

    if (finalSupplierRows.length > 0) {
        await chunkedUpsert(supabase, 'trade_supplier_breakdown', finalSupplierRows, 'hs_code,reporter_iso3,partner_iso3,year', 200);
        bilateralRecords = finalSupplierRows.length;
    }

    // Trigger scoring
    const scoreUrl = `${supabaseUrl}/functions/v1/compute-hs-opportunity-scores?hsCode=${hsCode}`
    console.log(`[fetch-hs-demand] Triggering scoring at ${scoreUrl}`)
    
    try {
        const res = await fetch(scoreUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
            },
        })
        const scoreResponseText = await res.text()
        console.log(`[fetch-hs-demand] Score response: ${res.status} ${scoreResponseText}`)
    } catch (e) {
        console.warn('[fetch-hs-demand] Score trigger error:', e)
    }

    return {
        hsCode,
        totalRecords,
        bilateralRecords,
        metadata: { hsCode, totalRecords }
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

        return await runIngestion(supabase, 'fetch-hs-demand', async () => {
            return await runWithRetry(`fetch-hs-demand-${hsCode}`, async () => {
                return await doIngestHSDemand({
                    supabase,
                    hsCode,
                    years,
                    comtradeKey,
                    supabaseUrl,
                    supabaseKey
                });
            }, { maxRetries: 2, backoffMs: 5000 });
        }, corsHeaders);

    } catch (err: any) {
        console.error('[fetch-hs-demand] Global catch:', err)
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
