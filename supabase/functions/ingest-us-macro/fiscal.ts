/* eslint-disable @typescript-eslint/no-unused-vars */
import { SupabaseClient } from '@supabase/supabase-js';

async function fetchFredSeries(seriesId: string, apiKey: string): Promise<any[]> {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=250`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`FRED API error for ${seriesId}: ${response.status}`);
        }
        const data = await response.json();
        return data.observations || [];
    } catch (err: any) {
        throw new Error(`Fetch failed for ${seriesId}: ${err.message}`);
    }
}

export async function processFiscal(supabase: SupabaseClient, fredApiKey: string) {
    try {
        const [interest, receipts, personal, payroll, gdp] = await Promise.all([
            fetchFredSeries('A091RC1Q027SBEA', fredApiKey),
            fetchFredSeries('FGRECPT', fredApiKey),
            fetchFredSeries('A074RC1Q027SBEA', fredApiKey),
            fetchFredSeries('W780RC1Q027SBEA', fredApiKey),
            fetchFredSeries('GDP', fredApiKey)
        ]);

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
        processObservations(personal, 'personal_taxes');
        processObservations(payroll, 'payroll_taxes');
        processObservations(gdp, 'gdp');

        const upsertData = Array.from(dateMap.values())
            .map(d => {
                const insolvency_ratio = (d.interest_expense && d.total_receipts) ? (d.interest_expense / d.total_receipts) : null;
                const employment_tax_share = (d.personal_taxes && d.payroll_taxes && d.total_receipts) ? ((d.personal_taxes + d.payroll_taxes) / d.total_receipts) : null;
                const receipts_gdp = (d.total_receipts && d.gdp) ? (d.total_receipts / d.gdp) : null;

                return {
                    ...d,
                    insolvency_ratio,
                    employment_tax_share,
                    receipts_gdp,
                    updated_at: new Date().toISOString()
                };
            })
            .filter(d => d.insolvency_ratio !== null || d.employment_tax_share !== null || d.receipts_gdp !== null);

        if (upsertData.length > 0) {
            const { error } = await supabase.from('us_fiscal_stress').upsert(upsertData, { onConflict: 'date' });
            if (error) throw error;
        }

        return { success: true, count: upsertData.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
