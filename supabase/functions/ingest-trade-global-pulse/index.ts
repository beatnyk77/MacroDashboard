/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

declare const Deno: any;

const MAJOR_REPORTERS = [
    { code: "842", iso3: "USA" },
    { code: "699", iso3: "IND" },
    { code: "251", iso3: "FRA" },
    { code: "156", iso3: "CHN" },
    { code: "276", iso3: "DEU" },
    { code: "392", iso3: "JPN" },
    { code: "826", iso3: "GBR" },
    { code: "380", iso3: "ITA" },
    { code: "124", iso3: "CAN" },
    { code: "410", iso3: "KOR" },
    { code: "076", iso3: "BRA" },
    { code: "643", iso3: "RUS" },
    { code: "484", iso3: "MEX" },
    { code: "036", iso3: "AUS" },
    { code: "724", iso3: "ESP" },
    { code: "528", iso3: "NLD" },
    { code: "756", iso3: "CHE" },
    { code: "682", iso3: "SAU" },
    { code: "792", iso3: "TUR" },
    { code: "360", iso3: "IDN" },
];

const COMTRADE_TO_ISO3: Record<string, string> = {
    "842": "USA", "699": "IND", "251": "FRA", "156": "CHN", "276": "DEU",
    "392": "JPN", "826": "GBR", "380": "ITA", "124": "CAN", "410": "KOR",
    "076": "BRA", "643": "RUS", "484": "MEX", "036": "AUS", "724": "ESP",
    "528": "NLD", "756": "CHE", "682": "SAU", "792": "TUR", "360": "IDN",
    "356": "IND", "458": "MYS", "764": "THA", "704": "VNM", "634": "QAT",
    "400": "JOR", "818": "EGY", "566": "NGA", "710": "ZAF", "050": "BGD",
    "144": "LKA", "512": "OMN", "616": "POL", "752": "SWE", "578": "NOR",
    "208": "DNK", "246": "FIN", "040": "AUT", "056": "BEL", "620": "PRT",
    "300": "GRC", "642": "ROU", "203": "CZE", "348": "HUN", "703": "SVK",
    "191": "HRV", "100": "BGR", "804": "UKR", "398": "KAZ", "032": "ARG",
    "170": "COL", "152": "CHL", "604": "PER", "218": "ECU", "231": "ETH",
    "404": "KEN", "834": "TZA", "288": "GHA", "384": "CIV", "120": "CMR",
    "504": "MAR", "012": "DZA", "788": "TUN", "729": "SDN", "024": "AGO",
    "508": "MOZ", "702": "SGP", "344": "HKG", "158": "TWN", "554": "NZL",
    "376": "ISR", "364": "IRN", "368": "IRQ", "414": "KWT", "104": "MMR",
    "116": "KHM", "524": "NPL",
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function chunkedUpsert(supabase: SupabaseClient, table: string, rows: any[], conflict: string) {
    const chunkSize = 100;
    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await supabase.from(table).upsert(chunk, { onConflict: conflict });
        if (error) throw error;
    }
}

async function fetchImportChapters(
    supabase: SupabaseClient,
    reporter: { code: string; iso3: string },
    targetYear: string,
    prevYear: string,
    comtradeKey: string
): Promise<number> {
    const tryFetch = async (y: string, p: string) => {
        const url = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${reporter.code}&period=${y}&cmdCode=AG2&flowCode=M&partnerCode=${p}`
        const res = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': comtradeKey } })
        if (!res.ok) return []
        const d = await res.json() as any
        return d.data || []
    }

    let records: any[] = await tryFetch(targetYear, '0')
    let effectiveYear = targetYear

    if (records.length === 0) {
        records = await tryFetch(prevYear, '0')
        effectiveYear = prevYear
    }

    if (records.length === 0) return 0

    const prevRecords = await tryFetch(String(parseInt(effectiveYear) - 1), '0')
    const prevMap = new Map<string, number>()
    prevRecords.forEach((r: any) => {
        const cmd = r.CmdCode || r.cmdCode
        const val = r.PrimaryValue || r.primaryValue || 0
        prevMap.set(cmd, val)
    })

    const totalImportValue = records.reduce((s: number, r: any) => s + (r.PrimaryValue || r.primaryValue || 0), 0)

    const rows = records.map((r: any) => {
        const cmdCode = r.CmdCode || r.cmdCode
        const currentVal = r.PrimaryValue || r.primaryValue || 0
        const prevVal = prevMap.get(cmdCode) || 0
        const growth = prevVal > 0 ? ((currentVal - prevVal) / prevVal) * 100 : null
        const share = totalImportValue > 0 ? (currentVal / totalImportValue) * 100 : 0
        return {
            reporter_iso3: reporter.iso3,
            hs_code: cmdCode,
            year: parseInt(String(r.Period || r.period || effectiveYear).substring(0, 4)),
            import_value_usd: Math.round(currentVal),
            yoy_growth_pct: growth !== null ? parseFloat(growth.toFixed(2)) : null,
            share_of_total_pct: parseFloat(share.toFixed(3)),
            fetched_at: new Date().toISOString(),
        }
    })

    const uniqueRows = Array.from(
        rows.reduce((m: Map<string, any>, row: any) => {
            const k = `${row.reporter_iso3}-${row.hs_code}-${row.year}`
            m.set(k, row)
            return m
        }, new Map()).values()
    )

    if (uniqueRows.length > 0) {
        await chunkedUpsert(supabase, 'trade_global_aggregates', uniqueRows, 'reporter_iso3,hs_code,year')
    }

    // ── Bilateral breakdown for choropleth map ──
    await delay(300)
    try {
        const bilateralRaw: any[] = await tryFetch(effectiveYear, 'all')
        if (bilateralRaw.length > 0) {
            const partnerMap = new Map<string, { hs: string; partner_code: string; partner_name: string; value: number }>()
            bilateralRaw.forEach((r: any) => {
                const cmd = r.CmdCode || r.cmdCode
                const pCode = String(r.PartnerCode || r.partnerCode || '')
                const pName = r.PartnerDesc || r.PartnerName || r.partnerDesc || pCode
                if (!pCode || pCode === '0' || pCode === 'W00') return
                const key = `${cmd}-${pCode}`
                const existing = partnerMap.get(key)
                const val = r.PrimaryValue || r.primaryValue || 0
                if (!existing || val > existing.value) {
                    partnerMap.set(key, { hs: cmd, partner_code: pCode, partner_name: pName, value: val })
                }
            })

            const year = parseInt(effectiveYear)
            const supplierRows = Array.from(partnerMap.values())
                .map(entry => {
                    const iso3 = COMTRADE_TO_ISO3[entry.partner_code] || null
                    if (!iso3) return null
                    const chapterTotal = uniqueRows.find((r: any) => r.hs_code === entry.hs)?.import_value_usd || 0
                    const share = chapterTotal > 0 ? (entry.value / chapterTotal) * 100 : 0
                    return {
                        hs_code: entry.hs,
                        reporter_iso3: reporter.iso3,
                        partner_iso3: iso3,
                        partner_name: entry.partner_name,
                        year,
                        import_value_usd: Math.round(entry.value),
                        market_share_pct: parseFloat(Math.min(100, share).toFixed(3)),
                        fetched_at: new Date().toISOString(),
                    }
                })
                .filter(Boolean) as any[]

            if (supplierRows.length > 0) {
                await chunkedUpsert(supabase, 'trade_supplier_breakdown', supplierRows, 'hs_code,reporter_iso3,partner_iso3,year')
            }
        }
    } catch (bilateralErr: any) {
        // Intentional skip: bilateral breakdown is supplemental; don't fail the whole reporter
        console.warn(`[fetchImportChapters] Bilateral fetch failed for ${reporter.iso3}:`, bilateralErr.message)
    }

    return uniqueRows.length
}

serveIngest('ingest-trade-global-pulse', async (req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const comtradeKey = Deno.env.get('COMTRADE_API_KEY')!

    const url = new URL(req.url)
    const targetYear = url.searchParams.get('year') || '2023'
    const prevYear = String(parseInt(targetYear) - 1)
    const reporterISO = url.searchParams.get('reporterISO')

    console.log(`[ingest-trade-global-pulse] Starting for ${targetYear}`)

    let totalUpserted = 0;
    let skipped = 0;
    const reporters = reporterISO
        ? MAJOR_REPORTERS.filter(r => r.iso3 === reporterISO)
        : MAJOR_REPORTERS

    for (const reporter of reporters) {
        console.log(`[ingest-trade-global-pulse] Processing ${reporter.iso3}...`)
        let targetRecords: any[] = [];
        let effectiveYear = targetYear;

        const tryFetch = async (y: string, p: string) => {
            const fetchUrl = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${reporter.code}&period=${y}&cmdCode=AG2&flowCode=X&partnerCode=${p}`
            const res = await fetch(fetchUrl, { headers: { 'Ocp-Apim-Subscription-Key': comtradeKey } })
            if (!res.ok) return [];
            const d = await res.json() as any;
            return d.data || [];
        }

        targetRecords = await tryFetch(targetYear, '0');

        if (targetRecords.length === 0) {
            const allPartners = await tryFetch(targetYear, 'all');
            if (allPartners.length > 0) {
                const agg = new Map();
                allPartners.forEach((r: any) => {
                    const cmd = r.CmdCode || r.cmdCode;
                    const val = r.PrimaryValue || r.primaryValue || 0;
                    agg.set(cmd, (agg.get(cmd) || 0) + val);
                });
                targetRecords = Array.from(agg.entries()).map(([code, val]) => ({
                    CmdCode: code, PrimaryValue: val, ReporterCode: reporter.code, Period: targetYear
                }));
            }
        }

        if (targetRecords.length === 0) {
            targetRecords = await tryFetch(prevYear, '0');
            effectiveYear = prevYear;
        }

        if (targetRecords.length === 0) {
            const allPartners = await tryFetch(prevYear, 'all');
            if (allPartners.length > 0) {
                const agg = new Map();
                allPartners.forEach((r: any) => {
                    const cmd = r.CmdCode || r.cmdCode;
                    const val = r.PrimaryValue || r.primaryValue || 0;
                    agg.set(cmd, (agg.get(cmd) || 0) + val);
                });
                targetRecords = Array.from(agg.entries()).map(([code, val]) => ({
                    CmdCode: code, PrimaryValue: val, ReporterCode: reporter.code, Period: prevYear
                }));
                effectiveYear = prevYear;
            }
        }

        if (targetRecords.length === 0) {
            // Intentional skip: no data available for this reporter after all fallbacks
            console.error(`CRITICAL: No data found for ${reporter.iso3} after all fallbacks.`)
            skipped++
            continue
        }

        console.log(`[ingest-trade-global-pulse] Found ${targetRecords.length} export records for ${reporter.iso3} in ${effectiveYear}`)

        const growthPrevYear = String(parseInt(effectiveYear) - 1)
        let prevRecords = await tryFetch(growthPrevYear, '0');

        if (prevRecords.length === 0) {
            const allPartnersPrev = await tryFetch(growthPrevYear, 'all');
            if (allPartnersPrev.length > 0) {
                const agg = new Map();
                allPartnersPrev.forEach((r: any) => {
                    const cmd = r.CmdCode || r.cmdCode;
                    const val = r.PrimaryValue || r.primaryValue || 0;
                    agg.set(cmd, (agg.get(cmd) || 0) + val);
                });
                prevRecords = Array.from(agg.entries()).map(([code, val]) => ({
                    CmdCode: code, PrimaryValue: val, ReporterCode: reporter.code, Period: growthPrevYear
                }));
            }
        }

        const prevMap = new Map();
        prevRecords.forEach((r: any) => prevMap.set(r.CmdCode || r.cmdCode, r.PrimaryValue || r.primaryValue || 0));

        const totalExportValue = targetRecords.reduce((sum: number, r: any) => sum + (r.PrimaryValue || r.primaryValue || 0), 0);

        const rows = targetRecords.map((r: any) => {
            const currentVal = r.PrimaryValue || r.primaryValue || 0;
            const cmdCode = r.CmdCode || r.cmdCode;
            const period = r.Period || r.period;

            const hasPrev = prevMap.has(cmdCode);
            const prevVal = hasPrev ? prevMap.get(cmdCode) : 0;
            const growth = (hasPrev && prevVal > 0) ? ((currentVal - prevVal) / prevVal) * 100 : null;
            const share = totalExportValue > 0 ? (currentVal / totalExportValue) * 100 : 0;

            let untapped = 0;
            if (growth !== null && growth > 10) untapped += 40;
            if (growth !== null && growth > 25) untapped += 20;
            if (share < 2) untapped += 20;

            return {
                reporter_iso3: reporter.iso3,
                hs_code: cmdCode,
                year: parseInt(String(period).substring(0, 4)),
                export_value_usd: Math.round(currentVal),
                yoy_growth_pct: growth !== null ? parseFloat(growth.toFixed(2)) : null,
                share_of_total_pct: parseFloat(share.toFixed(3)),
                untapped_score: Math.min(100, untapped),
                fetched_at: new Date().toISOString()
            }
        })

        const uniqueRows = Array.from(
            rows.reduce((map, row) => {
                const key = `${row.reporter_iso3}-${row.hs_code}-${row.year}`;
                map.set(key, row);
                return map;
            }, new Map()).values()
        );

        if (uniqueRows.length > 0) {
            await chunkedUpsert(supabase, 'trade_global_aggregates', uniqueRows, 'reporter_iso3,hs_code,year')
            totalUpserted += uniqueRows.length
        }

        // ── Imports: second pass (flowCode=M) ──────────────────────────
        await delay(300)
        try {
            const importCount = await fetchImportChapters(supabase, reporter, effectiveYear, prevYear, comtradeKey)
            console.log(`[ingest-trade-global-pulse] Import rows for ${reporter.iso3}: ${importCount}`)
            totalUpserted += importCount
        } catch (importErr: any) {
            // Intentional skip: import fetch failure for one reporter should not block the rest
            console.error(`[ingest-trade-global-pulse] Import fetch failed for ${reporter.iso3}:`, importErr.message)
            skipped++
        }

        await delay(500);
    }

    return {
        ok: true,
        counts: { upserted: totalUpserted, skipped },
    }
})
