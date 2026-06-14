/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

declare const Deno: any;

// Parse EIA Weekly Petroleum Status Report CSV (table2.csv)
async function fetchEIAWeeklyStatus(): Promise<{
    utilizationPct: number;
    capacityKbpd: number;
    reportDate: string;
} | null> {
    try {
        const res = await fetch('https://ir.eia.gov/wpsr/table2.csv', {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' },
            signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) throw new Error(`EIA CSV HTTP ${res.status}`);
        const text = await res.text();
        const lines = text.split('\n').map(l => l.trim());

        const header = lines[0];
        const headerCols = header.split(',').map(c => c.replace(/"/g, '').trim());

        const rawDate = headerCols[2];
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

            if (cols[1]?.toLowerCase().includes('percent utilization') && cols[2]) {
                const val = parseFloat(cols[2]);
                if (!isNaN(val)) utilizationPct = val;
            }

            if (cols[1]?.toLowerCase().includes('operable capacity') && !cols[1].toLowerCase().includes('padd') && cols[2]) {
                const val = parseFloat(cols[2].replace(/,/g, ''));
                if (!isNaN(val) && val > 1000) capacityKbpd = val;
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

serveIngest('ingest-oil-eia', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const counts: Record<string, number> = { capacity: 0, utilization: 0, brent: 0 };
    let skipped = 0;
    const now = new Date().toISOString();

    // ── A. US Refinery Utilization & Capacity via EIA Weekly Status Report CSV
    console.log('[ingest-oil-eia] Fetching EIA Weekly Petroleum Status Report...');
    const eiaStatus = await fetchEIAWeeklyStatus();

    if (eiaStatus) {
        const { utilizationPct, capacityKbpd, reportDate } = eiaStatus;

        const { error: utilErr } = await supabase.from('metric_observations').upsert({
            metric_id: 'OIL_REFINERY_UTILIZATION_US',
            as_of_date: reportDate,
            value: utilizationPct,
            last_updated_at: now,
        }, { onConflict: 'metric_id, as_of_date' });
        if (utilErr) {
            console.error('[ingest-oil-eia] utilization upsert error:', utilErr.message);
            skipped++;
        } else {
            counts.utilization = 1;
        }

        const asOfYear = parseInt(reportDate.slice(0, 4));
        const capacityMbpd = Math.round((capacityKbpd / 1000) * 100) / 100;
        const { error: capErr } = await supabase.from('oil_refining_capacity').upsert({
            country_code: 'US',
            country_name: 'United States',
            capacity_mbpd: capacityMbpd,
            as_of_year: asOfYear,
            last_updated_at: now,
        }, { onConflict: 'country_code, as_of_year' });
        if (capErr) {
            console.error('[ingest-oil-eia] capacity upsert error:', capErr.message);
            skipped++;
        } else {
            counts.capacity = 1;
        }

        console.log(`[ingest-oil-eia] Stored: utilization=${utilizationPct}%, capacity=${capacityMbpd} MBPD for ${reportDate}`);
    } else {
        console.warn('[ingest-oil-eia] Could not fetch EIA Weekly Status Report');
        skipped++;
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
        if (error) {
            console.error('[ingest-oil-eia] Brent upsert error:', error.message);
            skipped++;
        } else {
            counts.brent = rows.length;
        }
    } else {
        skipped++;
    }

    const totalUpserted = counts.utilization + counts.capacity + counts.brent;
    console.log('[ingest-oil-eia] Done:', JSON.stringify(counts));

    return {
        ok: true,
        counts: { upserted: totalUpserted, skipped, ...counts },
        meta: { latest: eiaStatus as any },
    };
})
