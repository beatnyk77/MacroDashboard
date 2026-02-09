import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ==========================================
// ASI Client Class (Adapted from MoSPIClient)
// ==========================================

export interface ASIResponse {
    statusCode?: boolean;
    message?: string;
    data?: any;
    error?: string;
}

export class ASIClient {
    private baseUrl: string;

    constructor(baseUrl: string = "https://api.mospi.gov.in") {
        this.baseUrl = baseUrl;
    }

    private async fetchAPI(endpoint: string, params: Record<string, any> = {}): Promise<any> {
        const url = new URL(`${this.baseUrl}${endpoint}`);

        // Clean params and append to URL
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        });

        console.log(`[ASI] Requesting: ${url.toString()}`);

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("[ASI] API Error:", error);
            throw error;
        }
    }

    // ==========================================
    // ASI Data Methods
    // ==========================================
    async getASIData(params: {
        year?: string;
        state_code?: string;
        sector_code?: string;
        indicator_code?: number;
    }) {
        return this.fetchAPI("/api/asi/getData", params);
    }

    async getASISectors() {
        return this.fetchAPI("/api/asi/getSectorList");
    }

    async getASIStates() {
        return this.fetchAPI("/api/asi/getStateList");
    }

    async getASIIndicators() {
        return this.fetchAPI("/api/asi/getIndicatorList");
    }
}

// ==========================================
// Main Edge Function Logic
// ==========================================

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const asiClient = new ASIClient();
        const results = [];

        // Helper to upsert ASI data
        const upsertASIData = async (record: {
            state_code: string;
            state_name: string;
            year: number;
            sector: string;
            gva_crores?: number;
            employment_thousands?: number;
            capacity_utilization_rate?: number;
            fixed_capital_crores?: number;
            output_crores?: number;
            as_of_date: string;
        }) => {
            const { error } = await supabase.from('india_asi').upsert(record, {
                onConflict: 'state_code, year, sector'
            });

            if (error) throw error;
            return true;
        };

        // ==================================================================
        // Mock Data Ingestion (Replace with actual API calls)
        // ==================================================================
        // Note: The actual esankhyiki ASI API endpoints may differ
        // This is a template structure - adjust based on actual API response

        try {
            console.log("[ASI] Starting data ingestion...");

            // For now, we'll use mock data structure
            // In production, replace with actual API calls like:
            // const asiData = await asiClient.getASIData({ year: "2022" });

            const currentYear = new Date().getFullYear() - 2; // ASI data typically lags 2 years
            const mockStates = [
                { code: 'MH', name: 'Maharashtra' },
                { code: 'GJ', name: 'Gujarat' },
                { code: 'TN', name: 'Tamil Nadu' },
                { code: 'KA', name: 'Karnataka' },
                { code: 'UP', name: 'Uttar Pradesh' },
                { code: 'MP', name: 'Madhya Pradesh' },
                { code: 'RJ', name: 'Rajasthan' },
                { code: 'WB', name: 'West Bengal' },
            ];

            const sectors = ['manufacturing', 'mining', 'electricity', 'all_industries'];

            // Mock ingestion loop
            for (const state of mockStates) {
                for (const sector of sectors) {
                    const mockRecord = {
                        state_code: state.code,
                        state_name: state.name,
                        year: currentYear,
                        sector: sector,
                        gva_crores: Math.random() * 500000 + 100000, // Mock GVA
                        employment_thousands: Math.random() * 5000 + 500, // Mock Employment
                        capacity_utilization_rate: Math.random() * 30 + 60, // 60-90%
                        fixed_capital_crores: Math.random() * 300000 + 50000,
                        output_crores: Math.random() * 800000 + 200000,
                        as_of_date: `${currentYear}-12-31`,
                    };

                    await upsertASIData(mockRecord);
                }
            }

            results.push({
                metric: 'ASI_DATA',
                status: 'success',
                message: `Ingested data for ${mockStates.length} states, ${sectors.length} sectors`,
                year: currentYear
            });

            console.log("[ASI] Data ingestion completed successfully");

        } catch (e: unknown) {
            const error = e as Error;
            console.error("[ASI] Ingestion Error:", error);
            results.push({
                metric: 'ASI_DATA',
                status: 'error',
                message: error.message
            });
        }

        // ==================================================================
        // Update Aggregate Metrics
        // ==================================================================
        try {
            // Calculate all-India aggregates
            const { data: aggregates } = await supabase
                .from('india_asi')
                .select('gva_crores, employment_thousands, capacity_utilization_rate')
                .eq('sector', 'all_industries')
                .order('year', { ascending: false })
                .limit(1);

            if (aggregates && aggregates.length > 0) {
                const latest = aggregates[0];
                const currentYear = new Date().getFullYear() - 2;
                const dateStr = `${currentYear}-12-31`;

                // Upsert to metric_observations
                const metricsToUpdate = [
                    { metric_id: 'IN_ASI_GVA_TOTAL', value: latest.gva_crores },
                    { metric_id: 'IN_ASI_EMPLOYMENT_TOTAL', value: latest.employment_thousands },
                    { metric_id: 'IN_ASI_CAPACITY_UTIL', value: latest.capacity_utilization_rate },
                ];

                for (const metric of metricsToUpdate) {
                    if (metric.value) {
                        await supabase.from('metric_observations').upsert({
                            metric_id: metric.metric_id,
                            as_of_date: dateStr,
                            value: metric.value,
                            last_updated_at: new Date().toISOString()
                        }, { onConflict: 'metric_id, as_of_date' });
                    }
                }

                results.push({
                    metric: 'ASI_AGGREGATES',
                    status: 'success',
                    message: 'Updated aggregate metrics'
                });
            }

        } catch (e: unknown) {
            const error = e as Error;
            console.error("[ASI] Aggregate update error:", error);
            results.push({
                metric: 'ASI_AGGREGATES',
                status: 'error',
                message: error.message
            });
        }

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: unknown) {
        const err = error as Error;
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
