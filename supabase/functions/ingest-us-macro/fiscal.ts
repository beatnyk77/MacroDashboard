/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { SupabaseClient } from '@supabase/supabase-js';
import { withTimeout } from '../_shared/timeout-guard.ts';

async function fetchFredSeries(seriesId: string, apiKey: string): Promise<any[]> {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=250`;
    try {
        const response = await withTimeout(fetch(url), 15000, `FRED Fetch ${seriesId}`) as Response;
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`FRED API error for ${seriesId}: ${response.status} — ${errorText.slice(0, 100)}`);
        }
        const data = await response.json();
        return data.observations || [];
    } catch (err: any) {
        throw new Error(`Fetch failed for ${seriesId}: ${err.message}`);
    }
}

/**
 * Fetches and stores US fiscal stress data from FRED.
 *
 * FRED Series used:
 *   A091RC1Q027SBEA  — Federal government interest payments (quarterly, billions USD, NIPA)
 *   FGRECPT           — Federal government current tax receipts (quarterly, billions USD)
 *   W068RC1Q027SBEA  — Government social benefits to persons (quarterly, billions USD, NIPA)
 *   A074RC1Q027SBEA  — Personal taxes (quarterly, billions USD)
 *   W780RC1Q027SBEA  — Payroll taxes (quarterly, billions USD)
 *   GDP               — Nominal GDP (quarterly, billions USD)
 *
 * All FRED NIPA series are in BILLIONS of current dollars. NO unit conversion needed —
 * the component will display by dividing by 1000 to show Trillions.
 */
export async function processFiscal(supabase: SupabaseClient, fredApiKey: string) {
    try {
        const interest = await fetchFredSeries('A091RC1Q027SBEA', fredApiKey);
        const receipts = await fetchFredSeries('FGRECPT', fredApiKey);
        const entitlements = await fetchFredSeries('W068RC1Q027SBEA', fredApiKey);
        const personal = await fetchFredSeries('A074RC1Q027SBEA', fredApiKey);
        const payroll = await fetchFredSeries('W780RC1Q027SBEA', fredApiKey);
        const gdp = await fetchFredSeries('GDP', fredApiKey);

        const dateMap = new Map<string, any>();

        const processObservations = (obs: any[], key: string) => {
            obs.forEach((o: any) => {
                if (!dateMap.has(o.date)) {
                    dateMap.set(o.date, { date: o.date });
                }
                const val = parseFloat(o.value);
                if (!isNaN(val)) {
                    dateMap.get(o.date)[key] = val;
                }
            });
        };

        processObservations(interest, 'interest_expense');
        processObservations(receipts, 'total_receipts');
        processObservations(entitlements, 'entitlements');
        processObservations(personal, 'personal_taxes');
        processObservations(payroll, 'payroll_taxes');
        processObservations(gdp, 'gdp');

        const upsertData = Array.from(dateMap.values())
            .map(d => {
                // All values from FRED are in billions USD. Ratios are dimensionless.
                const interestExp: number = d.interest_expense ?? 0;
                const receiptsVal: number = d.total_receipts ?? 0;
                const entitlementsVal: number | undefined = d.entitlements;

                // (Interest + Entitlements) / Receipts × 100 — fiscal dominance ratio
                const numerator = entitlementsVal !== undefined
                    ? interestExp + entitlementsVal
                    : interestExp;
                const fiscal_dominance_ratio = receiptsVal > 0
                    ? (numerator / receiptsVal) * 100
                    : null;

                // Interest-only insolvency ratio (legacy)
                const insolvency_ratio = (interestExp && receiptsVal) ? (interestExp / receiptsVal) : null;

                const employment_tax_share = (d.personal_taxes && d.payroll_taxes && receiptsVal)
                    ? ((d.personal_taxes + d.payroll_taxes) / receiptsVal)
                    : null;

                const receipts_gdp = (receiptsVal && d.gdp) ? (receiptsVal / d.gdp) : null;

                return {
                    date: d.date,
                    interest_expense: interestExp || null,
                    total_receipts: receiptsVal || null,
                    entitlements: entitlementsVal ?? null,
                    personal_taxes: d.personal_taxes ?? null,
                    payroll_taxes: d.payroll_taxes ?? null,
                    gdp: d.gdp ?? null,
                    insolvency_ratio,
                    fiscal_dominance_ratio,
                    employment_tax_share,
                    receipts_gdp,
                    updated_at: new Date().toISOString()
                };
            })
            .filter(d => d.fiscal_dominance_ratio !== null || d.insolvency_ratio !== null);

        if (upsertData.length > 0) {
            const { error } = await supabase
                .from('us_fiscal_stress')
                .upsert(upsertData, { onConflict: 'date' });
            if (error) throw error;
        }

        return { success: true, count: upsertData.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
