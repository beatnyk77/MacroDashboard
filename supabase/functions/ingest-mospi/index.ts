
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';
import { MoSPIClient } from './mospi-client.ts';
import { runIngestion, IngestionContext } from '../_shared/logging.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    return runIngestion(supabase, 'ingest-mospi', async (ctx: IngestionContext) => {
        const mospi = new MoSPIClient();
        const results = [];
        let totalUpserted = 0;

        // Helper to upsert metric observations (Aggregates)
        const upsertMetric = async (metricId: string, value: number, date: string) => {
            if (isNaN(value) || value === null) return false;
            const { error } = await ctx.supabase.from('metric_observations').upsert({
                metric_id: metricId,
                as_of_date: date,
                value: value,
                last_updated_at: new Date().toISOString()
            }, { onConflict: 'metric_id, as_of_date' });
            if (error) throw error;
            totalUpserted++;
            return true;
        };

        // Helper to upsert state energy data
        const upsertEnergyData = async (payload: any) => {
            const { error } = await ctx.supabase.from('india_energy').upsert(payload, {
                onConflict: 'state_code, year, source_type, metric_type'
            });
            if (error) throw error;
            totalUpserted++;
        };

        // Helper to upsert state ASI data
        const upsertASIData = async (payload: any) => {
            const { error } = await ctx.supabase.from('india_asi').upsert(payload, {
                onConflict: 'state_code, year, sector'
            });
            if (error) throw error;
            totalUpserted++;
        };

        // 1. ENERGY INGESTION (State-level)
        // ==========================================
        try {
            console.log("[ENERGY] Starting ingestion...");
            const stateCodes = [
                "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
                "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
                "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
                "31", "32", "33", "34", "35"
            ];

            for (const sc of stateCodes) {
                const energyResponse = await mospi.getEnergyData({
                    indicator_code: 1, // KToE
                    use_of_energy_balance_code: 1, // Supply
                    state_code: sc
                });

                if (energyResponse?.data?.length > 0) {
                    for (const row of energyResponse.data) {
                        if (row.use_of_energy_balance === 'Supply' && (row.energy_commodities === 'Coal' || row.energy_commodities === 'Renewables')) {
                            const val = parseFloat(row.value);
                            const yearString = String(row.year || "");
                            const year = parseInt(yearString.split('-')[0]) || new Date().getFullYear();
                            await upsertEnergyData({
                                state_code: sc,
                                state_name: row.state || 'India',
                                year: year,
                                source_type: row.energy_commodities.toLowerCase().includes('coal') ? 'coal' : 'renewable',
                                metric_type: 'production',
                                value: val,
                                unit: 'KToE',
                                as_of_date: `${year}-01-01`,
                                last_updated_at: new Date().toISOString()
                            });
                        }
                    }
                }
            }
            results.push({ metric: 'INDIA_ENERGY', status: 'success' });
        } catch (e: any) {
            console.error("[ENERGY] Error", e);
            results.push({ metric: 'INDIA_ENERGY', status: 'error', message: e.message });
        }

        // 2. ASI INGESTION (State-level)
        // ==========================================
        try {
            console.log("[ASI] Starting ingestion...");
            const stateCodes = [
                "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
                "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
                "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
                "31", "32", "33", "34", "35"
            ];
            for (const sc of stateCodes) {
                const asiResponse = await mospi.getASIData({
                    classification_year: '2008',
                    state_code: sc
                });

                if (asiResponse?.data?.length > 0) {
                    const grouped: any = {};
                    for (const row of asiResponse.data) {
                        const key = `${row.year}_${row.sector}`;
                        if (!grouped[key]) grouped[key] = {
                            state_code: sc,
                            state_name: row.state,
                            year: parseInt(String(row.year).split('-')[0]) || new Date().getFullYear(),
                            sector: String(row.sector || "").toLowerCase(),
                            gva_crores: 0,
                            employment_thousands: 0,
                            fixed_capital_crores: 0
                        };

                        const val = parseFloat(row.value);
                        if (row.indicator === 'Gross Value Added') grouped[key].gva_crores = val;
                        else if (row.indicator === 'Total Number of Persons Engaged') grouped[key].employment_thousands = val / 1000;
                        else if (row.indicator === 'Fixed Capital') grouped[key].fixed_capital_crores = val;
                    }

                    for (const payload of Object.values(grouped)) {
                        await upsertASIData(payload);
                    }
                }
            }
            results.push({ metric: 'INDIA_ASI', status: 'success' });
        } catch (e: any) {
            console.error("[ASI] Error", e);
            results.push({ metric: 'INDIA_ASI', status: 'error', message: e.message });
        }

        return {
            rows_inserted: totalUpserted,
            metadata: { results }
        };
    });
});
