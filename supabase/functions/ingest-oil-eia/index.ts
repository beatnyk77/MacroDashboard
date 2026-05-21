/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
// Use full ESM URLs to avoid Deno bundling issues
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

declare const Deno: any;

// Parse EIA Weekly Petroleum Status Report CSV (table2.csv)
// Returns { utilizationPct, capacityKbpd, reportDate }
async function fetchEIAWeeklyStatus(): Promise<{
    utilizationPct: number;
    capacityKbpd: number;
    reportDate: string; // YYYY-MM-DD
} | null> {
    try {
        const res = await fetch('https://ir.eia.gov/wpsr/table2.csv', {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' },
            signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) throw new Error(`EIA CSV HTTP ${res.status}`);
        const text = await res.text();
        const lines = text.split('\n').map(l => l.trim());

        // First line has dates: "STUB_1","STUB_2","5/8/26","5/1/26",...
        const header = lines[0];
        const headerCols = header.split(',').map(c => c.replace(/"/g, '').trim());

        // Parse the report date from column index 2 (most recent week)
        const rawDate = headerCols[2]; // e.g. "5/8/26"
        let reportDate = '';
        if (rawDate) {
            const parts = rawDate.split('/');
            if (parts.length === 3) {
                const month = parts[0].padStart(2, '0');
                const day = parts[1].padStart(2, '0');
                const year = `20${parts[2]}`;
                reportDate = `${year}-${month}-${day}`;
            }
        }

        let utilizationPct: number | null = null;
        let capacityKbpd: number | null = null;

        for (const line of lines) {
            if (!line) continue;
            const cols = line.split(',').map(c => c.replace(/"/g, '').trim());

            // Row with "Percent Utilization" — col[2] = latest week value
            if (cols[1]?.toLowerCase().includes('percent utilization') && cols[2]) {
                const val = parseFloat(cols[2]);
                if (!isNaN(val)) utilizationPct = val;
            }

            // Row with "Operable Capacity" — col[2] = latest week value (kbpd)
            if (cols[1]?.toLowerCase().includes('operable capacity') && !cols[1].toLowerCase().includes('padd') && cols[2]) {
                const val = parseFloat(cols[2].replace(/,/g, ''));
                if (!isNaN(val) && val > 1000) capacityKbpd = val; // sanity check: should be ~18000 kbpd
            }
        }

        if (utilizationPct === null || !reportDate) return null;

        console.log(`[ingest-oil-eia] EIA CSV: date=${reportDate} utilization=${utilizationPct}% capacity=${capacityKbpd}kbpd`);
        return { utilizationPct, capacityKbpd: capacityKbpd ?? 18162, reportDate };
    } catch (e: any) {
        console.error('[ingest-oil-eia] EIA CSV fetch error:', e.message);
        return null;
    }
}

async function safeYahoo(ticker: string, range = '3mo'): Promise<Array<{ date: string; close: number }>> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=${range}`;
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' }, signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
        const json = await res.json() as any;
        const result = json?.chart?.result?.[0];
        if (!result) return [];
        const timestamps: number[] = result.timestamp ?? [];
        const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
        return timestamps
            .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().slice(0, 10), close: closes[i] ?? 0 }))
            .filter(r => r.close > 0);
    } catch (e: any) {
        console.error(`[ingest-oil-eia] Yahoo ${ticker} error:`, e.message);
        return [];
    }
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const summary: Record<string, number> = { capacity: 0, utilization: 0, brent: 0 };
    const now = new Date().toISOString();

    // ── A. US Refinery Utilization & Capacity via EIA Weekly Status Report CSV
    console.log('[ingest-oil-eia] Fetching EIA Weekly Petroleum Status Report...');
    const eiaStatus = await fetchEIAWeeklyStatus();

    if (eiaStatus) {
        const { utilizationPct, capacityKbpd, reportDate } = eiaStatus;

        // Upsert utilization
        const { error: utilErr } = await supabase.from('metric_observations').upsert({
            metric_id: 'OIL_REFINERY_UTILIZATION_US',
            as_of_date: reportDate,
            value: utilizationPct,
            last_updated_at: now,
        }, { onConflict: 'metric_id, as_of_date' });
        if (utilErr) console.error('[ingest-oil-eia] utilization upsert error:', utilErr.message);
        else summary.utilization = 1;

        // Upsert capacity into oil_refining_capacity table
        const asOfYear = parseInt(reportDate.slice(0, 4));
        const capacityMbpd = Math.round((capacityKbpd / 1000) * 100) / 100;
        const { error: capErr } = await supabase.from('oil_refining_capacity').upsert({
            country_code: 'US',
            country_name: 'United States',
            capacity_mbpd: capacityMbpd,
            as_of_year: asOfYear,
            last_updated_at: now,
        }, { onConflict: 'country_code, as_of_year' });
        if (capErr) console.error('[ingest-oil-eia] capacity upsert error:', capErr.message);
        else summary.capacity = 1;

        console.log(`[ingest-oil-eia] Stored: utilization=${utilizationPct}%, capacity=${capacityMbpd} MBPD for ${reportDate}`);
    } else {
        console.warn('[ingest-oil-eia] Could not fetch EIA Weekly Status Report');
    }

    // ── B. Brent Crude Price via Yahoo Finance (BZ=F) — 3 months
    console.log('[ingest-oil-eia] Fetching Brent from Yahoo Finance (BZ=F)...');
    const brentData = await safeYahoo('BZ=F', '3mo');
    if (brentData.length > 0) {
        const rows = brentData.map(o => ({
            metric_id: 'OIL_BRENT_PRICE_USD',
            as_of_date: o.date,
            value: Math.round(o.close * 100) / 100,
            last_updated_at: now,
        }));
        const { error } = await supabase.from('metric_observations').upsert(rows, { onConflict: 'metric_id, as_of_date' });
        if (error) console.error('[ingest-oil-eia] Brent upsert error:', error.message);
        else summary.brent = rows.length;
    }

    console.log('[ingest-oil-eia] Done:', JSON.stringify(summary));
    await supabase.from('ingestion_logs').insert({
        function_name: 'ingest-oil-eia', status: 'success',
        metadata: summary, start_time: now,
    });

    return new Response(JSON.stringify({ ok: true, ...summary, latest: eiaStatus }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
});
