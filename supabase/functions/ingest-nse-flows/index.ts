/* eslint-disable @typescript-eslint/no-unused-vars */
import { createAdminClient } from './utils/supabaseClient.ts'
import { Logger } from './utils/logger.ts'
import { retry } from './utils/retry.ts'
import { calculateZScore, computeStats } from './utils/stats.ts'
import { parse } from 'https://esm.sh/csv-parse@5.5.3/sync'

// --- Types & Constants ---
const NSDL_BASE = 'https://www.fpi.nsdl.co.in/web';
const FAO_BASE = 'https://nsearchives.nseindia.com/content/nsccl';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/',
    'Origin': 'https://www.nseindia.com',
    'Connection': 'keep-alive',
};

const KNOWN_SECTORS = [
    'Automobile and Auto Components', 'Capital Goods', 'Chemicals', 'Construction',
    'Construction Materials', 'Consumer Durables', 'Consumer Services', 'Diversified',
    'Fast Moving Consumer Goods', 'Financial Services', 'Forest Materials', 'Healthcare',
    'Information Technology', 'Media, Entertainment & Publication', 'Metals & Mining',
    'Oil, Gas & Consumable Fuels', 'Power', 'Realty', 'Services', 'Telecommunication',
    'Textiles', 'Utilities', 'Sovereign', 'Others'
];

interface FlowData {
    date: string;
    fii_cash_net?: number;
    dii_cash_net?: number;
    fii_idx_fut_long: number; fii_idx_fut_short: number; fii_idx_fut_net: number;
    dii_idx_fut_long: number; dii_idx_fut_short: number; dii_idx_fut_net: number;
    fii_stk_fut_long: number; fii_stk_fut_short: number; fii_stk_fut_net: number;
    dii_stk_fut_long: number; dii_stk_fut_short: number; dii_stk_fut_net: number;
    client_idx_fut_long: number; client_idx_fut_short: number; client_idx_fut_net: number;
    client_stk_fut_long: number; client_stk_fut_short: number; client_stk_fut_net: number;
    fii_idx_call_long: number; fii_idx_call_short: number; fii_idx_call_net: number;
    fii_idx_put_long: number; fii_idx_put_short: number; fii_idx_put_net: number;
    pcr?: number;
    sentiment_score?: number;
    india_vix?: number;
    advances?: number;
    declines?: number;
    delivery_pct?: number;
    circuits_pct?: number;
    sector_returns?: Record<string, number>;
    midcap_perf?: number;
    smallcap_perf?: number;
    nifty_perf?: number;
    new_highs_52w?: number;
    new_lows_52w?: number;
}

// --- Helper Functions ---

const parseNum = (val: any) => {
    if (typeof val === 'string') return parseFloat(val.replace(/,/g, '')) || 0;
    return parseFloat(val) || 0;
}

function stripHtml(str: string) {
    return (str || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
}

async function getNSESession(logger: Logger) {
    try {
        const resp = await fetch('https://www.nseindia.com/', { headers: HEADERS });
        const setCookie = resp.headers.get('set-cookie');
        return setCookie || '';
    } catch (e: any) {
        logger.log('nse-flows', 'warn', 0, `Failed to get NSE session: ${e.message}`);
        return '';
    }
}

async function fetchFaoOi(dateStr: string, cookies: string, logger: Logger) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;

    // dateStr is CCYY-MM-DD
    const dateArr = dateStr.split('-');
    const day = dateArr[2];
    const month = new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(dateStr));
    const year = dateArr[0];
    const datePart = `${day}${month}${year}`;

    const urls = [
        `${FAO_BASE}/fao_participant_oi_${datePart}_b.csv`,
        `${FAO_BASE}/fao_participant_oi_${datePart}.csv`,
    ];

    for (const url of urls) {
        try {
            const resp = await fetch(url, { headers: { ...HEADERS, 'Cookie': cookies } });
            if (resp.ok) return await resp.text();
        } catch { continue; }
    }
    return null;
}

function parseFaoCss(csvText: string) {
    if (!csvText) return null;
    try {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return null;

        const records = parse(lines.slice(1).join('\n'), {
            skip_empty_lines: true,
            relax_column_count: true
        });

        const data: any = { FII: null, DII: null, CLIENT: null };
        for (const row of records) {
            const clientType = (row[0] || "").trim().toUpperCase();
            let key: string | null = null;
            if (clientType.includes("FII") || clientType.includes("FPI")) key = "FII";
            else if (clientType.includes("DII")) key = "DII";
            else if (clientType.includes("CLIENT") || clientType.includes("RETAIL")) key = "CLIENT";
            if (!key) continue;
            data[key] = {
                idx_fut_long: parseNum(row[1]),
                idx_fut_short: parseNum(row[2]),
                stk_fut_long: parseNum(row[3]),
                stk_fut_short: parseNum(row[4]),
                idx_call_long: parseNum(row[5]),
                idx_call_short: parseNum(row[6]),
                idx_put_long: parseNum(row[7]),
                idx_put_short: parseNum(row[8]),
            };
        }
        return data;
    } catch { return null; }
}

async function fetchNSDLSectorFlows(logger: Logger) {
    const today = new Date();
    const abbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Try to find the latest fortnightly report
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (d.getDate() !== 15 && d.getDate() !== new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()) continue;

        const dateCode = `${abbr[d.getMonth()]}${String(d.getDate()).padStart(2, '0')}${d.getFullYear()}`;
        const url = `${NSDL_BASE}/StaticReports/Fortnightly_Sector_wise_FII_Investment_Data/FIIInvestSector_${dateCode}.html`;

        try {
            const resp = await fetch(url, { headers: HEADERS });
            if (resp.ok) {
                const html = await resp.text();
                if (html.length > 2000 && html.includes('Sector')) {
                    return { html, dateCode };
                }
            }
        } catch { continue; }
    }
    return null;
}

function parseNSDLHtml(html: string) {
    const sectorData = [];
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let m;
    while ((m = trRegex.exec(html)) !== null) {
        const rowHtml = m[1];
        const cellMatches = [...rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)];
        const cells = cellMatches.map(c => stripHtml(c[1]));
        if (cells.length < 30) continue;

        const sectorCell = cells[1] || '';
        const matched = KNOWN_SECTORS.find(s => sectorCell.toLowerCase().includes(s.toLowerCase().substring(0, 12)));
        if (!matched || /^total$/i.test(sectorCell.trim())) continue;

        const n = cells.map(c => parseNum(c));
        sectorData.push({
            sector: matched,
            equity_auc_inr: n[2] || 0,
            equity_net_inr: n[26] || 0,
            debt_auc_inr: (n[3] || 0) + (n[4] || 0) + (n[5] || 0),
            debt_net_inr: (n[27] || 0) + (n[28] || 0) + (n[29] || 0),
            hybrid_auc_inr: n[6] || 0,
            total_auc_inr: n[13] || 0,
            total_net_inr: n[37] || 0,
        });
    }
    return sectorData;
}

// --- Main Handler ---

Deno.serve(async (req: Request) => {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401 })

    const runId = crypto.randomUUID()
    const client = createAdminClient()
    const logger = new Logger(runId)

    let startDate = new Date(); startDate.setDate(startDate.getDate() - 3);
    let endDate = new Date();

    try {
        const body = await req.json() as any
        if (body.startDate) startDate = new Date(body.startDate)
        if (body.endDate) endDate = new Date(body.endDate)
    } catch { /* Default to last 3 days */ }

    await logger.log('nse-flows', 'processing', 0, `Starting FII/DII Ingestion: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)
    const startTimeMill = performance.now()

    const cookies = await getNSESession(logger)
    const headers = { ...HEADERS, 'Cookie': cookies }

    const processedDates: string[] = []
    let currentDate = new Date(startDate)

    while (currentDate <= endDate) {
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
            currentDate.setDate(currentDate.getDate() + 1); continue;
        }

        const dateStr = currentDate.toISOString().split('T')[0]
        try {
            const data: Partial<FlowData> = { date: dateStr, sector_returns: {} }

            // 1. Daily Cash Flows
            const cashRes = await retry(() => fetch('https://www.nseindia.com/api/fiidiiTradeReact', { headers })) as any
            if (cashRes.ok) {
                const cashData = await cashRes.json() as any[]
                for (const item of cashData) {
                    const cat = (item.category || '').toUpperCase()
                    if (cat.includes('FII') || cat.includes('FPI')) {
                        data.fii_cash_net = parseNum(item.netValue);
                    } else if (cat.includes('DII')) {
                        data.dii_cash_net = parseNum(item.netValue);
                    }
                }
            }

            // 2. F&O Participants
            const faoText = await fetchFaoOi(dateStr, cookies, logger)
            if (faoText) {
                const fao = parseFaoCss(faoText)
                if (fao?.FII) {
                    const f = fao.FII
                    data.fii_idx_fut_long = f.idx_fut_long; data.fii_idx_fut_short = f.idx_fut_short; data.fii_idx_fut_net = f.idx_fut_long - f.idx_fut_short;
                    data.fii_stk_fut_long = f.stk_fut_long; data.fii_stk_fut_short = f.stk_fut_short; data.fii_stk_fut_net = f.stk_fut_long - f.stk_fut_short;
                    data.fii_idx_call_long = f.idx_call_long; data.fii_idx_call_short = f.idx_call_short; data.fii_idx_call_net = f.idx_call_long - f.idx_call_short;
                    data.fii_idx_put_long = f.idx_put_long; data.fii_idx_put_short = f.idx_put_short; data.fii_idx_put_net = f.idx_put_long - f.idx_put_short;
                    data.pcr = f.idx_call_short > 0 ? parseFloat((f.idx_put_short / f.idx_call_short).toFixed(2)) : 1.0;
                }
                if (fao?.DII) {
                    const d = fao.DII
                    data.dii_idx_fut_long = d.idx_fut_long; data.dii_idx_fut_short = d.idx_fut_short; data.dii_idx_fut_net = d.idx_fut_long - d.idx_fut_short;
                    data.dii_stk_fut_long = d.stk_fut_long; data.dii_stk_fut_short = d.stk_fut_short; data.dii_stk_fut_net = d.stk_fut_long - d.stk_fut_short;
                }
                if (fao?.CLIENT) {
                    const c = fao.CLIENT;
                    data.client_idx_fut_long = c.idx_fut_long; data.client_idx_fut_short = c.idx_fut_short; data.client_idx_fut_net = c.idx_fut_long - c.idx_fut_short;
                    data.client_stk_fut_long = c.stk_fut_long; data.client_stk_fut_short = c.stk_fut_short; data.client_stk_fut_net = c.stk_fut_long - c.stk_fut_short;
                }
            }

            // 3. Market Indices
            const idxRes = await retry(() => fetch('https://www.nseindia.com/api/allIndices', { headers })) as any
            if (idxRes.ok) {
                const idxData = await idxRes.json() as any; const indices = idxData.data || []
                for (const idx of indices) {
                    const name = idx.index || idx.indexSymbol || ''; const pChange = parseNum(idx.percentChange || idx.pChange || 0)
                    if (name === 'INDIA VIX') data.india_vix = parseNum(idx.last || idx.lastPrice || 0)
                    if (name === 'NIFTY 50') { data.nifty_perf = pChange; data.advances = parseInt(idx.advances || 0); data.declines = parseInt(idx.declines || 0) }
                    if (name === 'NIFTY MIDCAP 100') data.midcap_perf = pChange
                    if (name === 'NIFTY SMALLCAP 100') data.smallcap_perf = pChange
                    if (name.startsWith('NIFTY ') && !/MIDCAP|SMALLCAP|NEXT|50/.test(name)) {
                        const sName = name.replace('NIFTY ', '').trim()
                        if (sName.length > 0 && sName.length < 25) data.sector_returns![sName] = pChange
                    }
                }
            }

            if (data.fii_cash_net !== undefined || data.india_vix !== undefined) {
                // Filter out undefined values before upserting
                const rawData = Object.fromEntries(
                    Object.entries(data).filter(([_, v]) => v !== undefined)
                ) as any;
                const { error: upsertError } = await client.from('market_pulse_daily').upsert(rawData, { onConflict: 'date' })
                if (!upsertError) {
                    processedDates.push(dateStr);
                    // Log observation for health tracking
                    await client.from('metric_observations').upsert({
                        metric_id: 'IN_NSE_FLOWS',
                        as_of_date: dateStr,
                        observation_value: data.fii_cash_net,
                        provenance: 'NSE_API'
                    }, { onConflict: 'metric_id,as_of_date' }).catch(() => { });
                }
            }
        } catch (err: any) { logger.log('nse-flows', 'warn', 0, `Failed for ${dateStr}: ${err.message}`) }
        currentDate.setDate(currentDate.getDate() + 1)
        await new Promise(r => setTimeout(r, 1000))
    }

    // 5. NSDL Sector Flows (Fortnightly)
    try {
        const nsdl = await fetchNSDLSectorFlows(logger)
        if (nsdl) {
            const sectors = parseNSDLHtml(nsdl.html)
            const periodMatch = nsdl.html.match(/Fortnight[^\n]*?(\d{1,2}[A-Za-z]{3}\d{4})[^\n]*?(\d{1,2}[A-Za-z]{3}\d{4})/i);
            const period = periodMatch ? periodMatch[0].replace(/<[^>]+>/g, '').trim() : nsdl.dateCode;

            const monthMap: Record<string, string> = {
                'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
                'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
            };
            const monthStr = nsdl.dateCode.substring(0, 3);
            const dayStr = nsdl.dateCode.substring(3, 5);
            const yearStr = nsdl.dateCode.substring(5, 9);
            const fortnight_end_date = `${yearStr}-${monthMap[monthStr]}-${dayStr}`;

            const records = sectors.map(s => ({
                date_code: nsdl.dateCode,
                period,
                sector: s.sector,
                equity_auc_inr: s.equity_auc_inr,
                equity_net_inr: s.equity_net_inr,
                debt_auc_inr: s.debt_auc_inr,
                debt_net_inr: s.debt_net_inr,
                hybrid_auc_inr: s.hybrid_auc_inr,
                total_auc_inr: s.total_auc_inr,
                total_net_inr: s.total_net_inr,
                fortnight_end_date
            }))

            const { error: sectorError } = await client.from('fpi_sector_flows').upsert(records, { onConflict: 'date_code,sector' })
            if (sectorError) logger.log('nse-flows', 'warn', 0, `Sector upsert failed: ${sectorError.message}`)
            else {
                await logger.log('nse-flows', 'processing', records.length, `Ingested ${records.length} sector flows for ${nsdl.dateCode}`);
                // Log observation for health tracking
                await client.from('metric_observations').upsert({
                    metric_id: 'IN_NSDL_SECTOR_FLOWS',
                    as_of_date: fortnight_end_date,
                    observation_value: records.reduce((sum, r) => sum + (r.total_net_inr || 0), 0),
                    provenance: 'NSDL_HTML'
                }, { onConflict: 'metric_id,as_of_date' }).catch(() => { });
            }
        }
    } catch (err: any) { logger.log('nse-flows', 'warn', 0, `NSDL processing failed: ${err.message}`) }

    // Refresh materialized view
    await client.rpc('refresh_market_pulse_stats').catch(() => { })

    return new Response(JSON.stringify({
        message: `FII/DII Ingestion complete`,
        processedDates: processedDates.length,
        runId
    }), { headers: { 'Content-Type': 'application/json' } })
})
