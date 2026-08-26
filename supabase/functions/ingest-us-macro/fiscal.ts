/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { SupabaseClient } from '@supabase/supabase-js';
import { withTimeout } from '../_shared/timeout-guard.ts';
import { upsertObservations } from '../_shared/ingest_utils.ts';

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

/** Convert a FRED response into canonical quarterly metric observations. */
export function toMetricObservations(seriesId: string, observations: any[], fetchedAt: string) {
    const metricIdBySeries: Record<string, string> = {
        FDEFX: 'US_DEFENSE_SPENDING',
        A091RC1Q027SBEA: 'US_FEDERAL_INTEREST_PAYMENTS',
        FGRECPT: 'US_TAX_RECEIPTS',
        W068RC1Q027SBEA: 'US_MAJOR_ENTITLEMENTS',
        A074RC1Q027SBEA: 'US_PERSONAL_TAX_RECEIPTS',
        W780RC1Q027SBEA: 'US_PAYROLL_TAX_RECEIPTS',
    };
    const metricId = metricIdBySeries[seriesId];
    if (!metricId) throw new Error(`Unsupported fiscal FRED series: ${seriesId}`);

    return observations
        .map((observation: any) => ({
            metric_id: metricId,
            as_of_date: observation.date,
            value: parseFloat(observation.value),
            last_updated_at: fetchedAt,
        }))
        .filter((observation) => (
            typeof observation.as_of_date === 'string'
            && !isNaN(observation.value)
        ));
}

export function toFiscalCapacityObservations(rows: any[], fetchedAt: string) {
    return rows.flatMap((row) => {
        const interest = Number(row.interest_expense);
        const receipts = Number(row.total_receipts);
        const entitlements = Number(row.entitlements);
        const gdp = Number(row.gdp);
        const derived: Array<[string, number]> = [];

        if (Number.isFinite(interest) && receipts > 0) {
            derived.push(['US_FISCAL_INTEREST_TO_RECEIPTS_PCT', (interest / receipts) * 100]);
        }
        if (Number.isFinite(interest) && gdp > 0) {
            derived.push(['US_FISCAL_INTEREST_TO_GDP_PCT', (interest / gdp) * 100]);
        }
        if (Number.isFinite(interest) && Number.isFinite(entitlements) && receipts > 0) {
            derived.push(['US_FISCAL_MANDATORY_TO_RECEIPTS_PCT', ((interest + entitlements) / receipts) * 100]);
        }
        if (Number.isFinite(entitlements) && receipts > 0) {
            derived.push(['US_FISCAL_ENTITLEMENTS_TO_RECEIPTS_PCT', (entitlements / receipts) * 100]);
        }
        const personalTaxes = Number(row.personal_taxes);
        const payrollTaxes = Number(row.payroll_taxes);
        if (Number.isFinite(personalTaxes) && Number.isFinite(payrollTaxes) && receipts > 0) {
            derived.push(['US_FISCAL_EMPLOYMENT_TAX_SHARE_PCT', ((personalTaxes + payrollTaxes) / receipts) * 100]);
        }

        return derived.map(([metric_id, value]) => ({
            metric_id,
            as_of_date: row.date,
            value,
            last_updated_at: fetchedAt,
        }));
    });
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
        const fetchedAt = new Date().toISOString();
        const defense = await fetchFredSeries('FDEFX', fredApiKey);
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

        // Keep the comparison chart on the canonical time-series path. FRED
        // publishes both source series at quarterly frequency in USD billions.
        const fiscalCapacityObservations = [
            ...toMetricObservations('FDEFX', defense, fetchedAt),
            ...toMetricObservations('A091RC1Q027SBEA', interest, fetchedAt),
            ...toMetricObservations('FGRECPT', receipts, fetchedAt),
            ...toMetricObservations('W068RC1Q027SBEA', entitlements, fetchedAt),
            ...toMetricObservations('A074RC1Q027SBEA', personal, fetchedAt),
            ...toMetricObservations('W780RC1Q027SBEA', payroll, fetchedAt),
            ...toFiscalCapacityObservations(upsertData, fetchedAt),
        ];
        const fiscalCapacityResult = await upsertObservations(supabase, fiscalCapacityObservations, {
            source_ref: 'live_api:fred',
            is_provisional: false,
        });

        return { success: true, count: upsertData.length + fiscalCapacityResult.count };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
