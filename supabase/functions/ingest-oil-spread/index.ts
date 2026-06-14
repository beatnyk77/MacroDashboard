/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { serveIngest } from '../_shared/handler.ts';


// WTI NYMEX month codes: Jan=F, Feb=G, Mar=H, Apr=J, May=K, Jun=M, Jul=N, Aug=Q, Sep=U, Oct=V, Nov=X, Dec=Z
const MONTH_CODES = 'FGHJKMNQUVXZ';

function wtiTicker(year: number, month0: number): string {
    // month0 = 0-indexed (0=Jan … 11=Dec)
    return `CL${MONTH_CODES[month0]}${String(year).slice(-2)}.NYM`;
}

// Returns the current CL2 (second month) ticker.
// WTI front month expires ~3rd business day before the 25th of the prior month.
// For simplicity: if today >= 15th, use month+2; otherwise month+1.
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getCL2Ticker(shortName?: string): { ticker: string; fallback: string } {
    const now = new Date();

    if (shortName) {
        // e.g. "Crude Oil Jul 26" or "WTI Crude Oil Jul 26"
        const match = shortName.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2,4})/i);
        if (match) {
            const monthStr = match[1];
            const yearStr = match[2];

            const monthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase() === monthStr.toLowerCase());
            const year = yearStr.length === 2 ? 2000 + parseInt(yearStr) : parseInt(yearStr);

            if (monthIndex !== -1 && !isNaN(year)) {
                // Front month contract code parsed successfully.
                // The second month (CL2) is M+1 (e.g. August for July front month).
                const cl2Month = (monthIndex + 1) % 12;
                const cl2Year = monthIndex === 11 ? year + 1 : year;

                const cl3Month = (monthIndex + 2) % 12;
                const cl3Year = monthIndex >= 10 ? year + 1 : year;

                console.log(`[ingest-oil-spread] Dynamically parsed front-month: ${monthStr} ${year}. CL2 ticker target: month=${cl2Month}, year=${cl2Year}`);

                return {
                    ticker: wtiTicker(cl2Year, cl2Month),
                    fallback: wtiTicker(cl3Year, cl3Month),
                };
            }
        }
    }

    // ── Fallback: date-based offset ─────────────────────────────────────────
    console.warn(`[ingest-oil-spread] Failed to parse shortName "${shortName}", falling back to date-based offsets.`);
    const day = now.getUTCDate();
    const month = now.getUTCMonth(); // 0-indexed
    const year = now.getUTCFullYear();

    // WTI front month rolls around the 15-20th of the month.
    // In month M, the M+1 contract is front month (CL1) before the roll, and rolls to M+2 after the roll.
    // Therefore, CL2 (second month) is M+2 before the roll, and M+3 after.
    const offset = day >= 15 ? 3 : 2;

    const cl2Month = (month + offset) % 12;
    const cl2Year = month + offset >= 12 ? year + 1 : year;
    const cl3Month = (month + offset + 1) % 12;
    const cl3Year = month + offset + 1 >= 12 ? year + 1 : year;

    return {
        ticker: wtiTicker(cl2Year, cl2Month),
        fallback: wtiTicker(cl3Year, cl3Month),
    };
}

function classifyRegime(spread: number): 'OVERSUPPLY' | 'NORMAL' | 'TIGHTENING' | 'STRESSED' | 'EXTREME' {
    if (spread > 16) return 'EXTREME';
    if (spread > 10) return 'STRESSED';
    if (spread > 5) return 'TIGHTENING';
    if (spread < -5) return 'OVERSUPPLY';
    return 'NORMAL';
}

async function fetchYahooHistory(ticker: string): Promise<Array<{ date: string; close: number }>> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=3mo`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } });
    if (!res.ok) throw new Error(`Yahoo HTTP ${res.status} for ${ticker}`);
    const json = await res.json() as any;
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error(`No chart result from Yahoo for ${ticker}`);

    const timestamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

    return timestamps
        .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().slice(0, 10), close: closes[i] ?? 0 }))
        .filter(r => r.close > 0)
        .sort((a, b) => b.date.localeCompare(a.date)); // newest first
}


serveIngest('ingest-oil-spread', async (_req: Request) => {

    if (_req.method === 'OPTIONS') return { ok: true, counts: {} };

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    try {
        console.log('[ingest-oil-spread] Starting oil spread ingestion via Yahoo Finance...');

        // ── 1. Fetch CL1 (front month continuous)
        const cl1Url = `https://query1.finance.yahoo.com/v8/finance/chart/CL%3DF?interval=1d&range=3mo`;
        const cl1Res = await fetch(cl1Url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } });
        if (!cl1Res.ok) throw new Error(`Yahoo HTTP ${cl1Res.status} for CL=F`);
        const cl1Json = await cl1Res.json() as any;
        const cl1Result = cl1Json?.chart?.result?.[0];
        if (!cl1Result) throw new Error(`No chart result from Yahoo for CL=F`);

        const cl1Timestamps: number[] = cl1Result.timestamp ?? [];
        const cl1Closes: (number | null)[] = cl1Result.indicators?.quote?.[0]?.close ?? [];
        const cl1Series = cl1Timestamps
            .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().slice(0, 10), close: cl1Closes[i] ?? 0 }))
            .filter(r => r.close > 0)
            .sort((a, b) => b.date.localeCompare(a.date));

        console.log(`[ingest-oil-spread] CL1 (CL=F): ${cl1Series.length} rows, latest ${cl1Series[0]?.date}`);

        if (cl1Series.length === 0) throw new Error('No CL1 data from Yahoo Finance (CL=F)');

        // ── 2. Resolve CL2 ticker dynamically, try fallback if primary 404s
        const shortName = cl1Result.meta?.shortName;
        const { ticker: cl2Primary, fallback: cl2Fallback } = getCL2Ticker(shortName);
        console.log(`[ingest-oil-spread] Trying CL2 tickers: ${cl2Primary}, fallback: ${cl2Fallback}`);

        let cl2Series: Array<{ date: string; close: number }> = [];
        let cl2TickerUsed = cl2Primary;
        try {
            cl2Series = await fetchYahooHistory(cl2Primary);
        } catch (_) {
            console.warn(`[ingest-oil-spread] ${cl2Primary} failed, trying ${cl2Fallback}`);
            try {
                cl2Series = await fetchYahooHistory(cl2Fallback);
                cl2TickerUsed = cl2Fallback;
            } catch (e2) {
                console.warn(`[ingest-oil-spread] Both CL2 tickers failed. Using synthetic CL2.`);
            }
        }

        console.log(`[ingest-oil-spread] CL2 (${cl2TickerUsed}): ${cl2Series.length} rows`);

        // ── 3. Align CL1 and CL2 by date
        let aligned: Array<{ date: string; cl1: number; cl2: number }>;

        if (cl2Series.length > 0) {
            const cl2Map = new Map(cl2Series.map(r => [r.date, r.close]));
            aligned = cl1Series
                .filter(r => cl2Map.has(r.date))
                .map(r => ({ date: r.date, cl1: r.close, cl2: cl2Map.get(r.date)! }));
        } else {
            // Synthetic CL2: CL1 adjusted by the historical WTI contango (~$0.50)
            aligned = cl1Series.map(r => ({ date: r.date, cl1: r.close, cl2: r.close - 0.50 }));
            cl2TickerUsed = 'synthetic';
        }

        if (aligned.length === 0) throw new Error('No overlapping dates between CL1 and CL2');
        console.log(`[ingest-oil-spread] Aligned: ${aligned.length} rows, latest: ${aligned[0].date}`);

        // ── 4. Build upsert rows
        const now = new Date().toISOString();
        const rows = aligned.map((d, i) => {
            const spread = d.cl1 - d.cl2;
            const prev = aligned[i + 1];
            const prev3 = aligned[i + 3];
            return {
                date: d.date,
                front_price: Math.round(d.cl1 * 100) / 100,
                next_price: Math.round(d.cl2 * 100) / 100,
                spread: Math.round(spread * 100) / 100,
                regime: classifyRegime(spread),
                change_1d: prev ? Math.round((spread - (prev.cl1 - prev.cl2)) * 100) / 100 : 0,
                change_3d: prev3 ? Math.round((spread - (prev3.cl1 - prev3.cl2)) * 100) / 100 : 0,
                computed_at: now,
                metadata: { source: 'Yahoo Finance', cl1_ticker: 'CL=F', cl2_ticker: cl2TickerUsed },
            };
        });

        // ── 5. Upsert in batches of 30
        let upserted = 0;
        for (let i = 0; i < rows.length; i += 30) {
            const { error } = await supabase
                .from('oil_market_spread')
                .upsert(rows.slice(i, i + 30), { onConflict: 'date' });
            if (error) throw error;
            upserted += Math.min(30, rows.length - i);
        }

        const latest = rows[0];
        console.log(`[ingest-oil-spread] Done. ${upserted} rows. Latest: ${latest.date} CL1=$${latest.front_price} CL2=$${latest.next_price} spread=${latest.spread >= 0 ? '+' : ''}${latest.spread}`);

        await supabase.from('ingestion_logs').insert({
            function_name: 'ingest-oil-spread', status: 'success',
            metadata: { rows_upserted: upserted, latest_date: latest.date, spread: latest.spread, regime: latest.regime, cl2_ticker: cl2TickerUsed },
            start_time: now,
        });

        return { ok: true, counts: {} };

    } catch (err: unknown) {
        const msg = (err as Error).message ?? String(err);
        console.error('[ingest-oil-spread] Fatal:', msg);
        await supabase.from('ingestion_logs').insert({
            function_name: 'ingest-oil-spread', status: 'FAILED',
            metadata: { error: msg }, start_time: new Date().toISOString(),
        });
        throw _;

    }
});
