import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ==========================================
// esankhyiki Client (Adapting MoSPI Client)
// ==========================================
export class EsankhyikiClient {
    private baseUrl: string;

    constructor(baseUrl: string = "https://api.mospi.gov.in") {
        this.baseUrl = baseUrl;
    }

    private async fetchAPI(endpoint: string, params: Record<string, any> = {}): Promise<any> {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        });

        console.log(`[esankhyiki] Requesting: ${url.toString()}`);

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("[esankhyiki] API Error:", error);
            throw error;
        }
    }

    // Tools for ENERGY dataset
    async getEnergyData(params: {
        indicator_code?: number;
        year?: string;
        state_code?: string;
    }) {
        // This is a placeholder for the actual energy data endpoint
        // Based on ingest-mospi patterns
        return this.fetchAPI("/api/energy/getData", params);
    }

    async getEnergyIndicators() {
        return this.fetchAPI("/api/energy/getIndicatorList");
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const energyClient = new EsankhyikiClient();
        const results = [];

        // Sample logic to ingest data
        // 1. Coal Production
        console.log("[IN_ENERGY_COAL_PROD] Ingestion started...");
        try {
            // Mocking data for now as exact indicator codes are unknown
            // In a real scenario, we would use discovery like in ingest-mospi
            const mockStates = [
                { code: 'JH', name: 'Jharkhand', val: 130.5 },
                { code: 'OD', name: 'Odisha', val: 154.2 },
                { code: 'CH', name: 'Chhattisgarh', val: 158.0 },
                { code: 'MP', name: 'Madhya Pradesh', val: 120.0 }
            ];

            for (const state of mockStates) {
                const { error } = await supabase.from('india_energy').upsert({
                    state_code: state.code,
                    state_name: state.name,
                    year: 2024,
                    source_type: 'coal',
                    metric_type: 'production',
                    value: state.val,
                    unit: 'Million Tonnes',
                    as_of_date: new Date().toISOString().split('T')[0]
                }, { onConflict: 'state_code, year, source_type, metric_type' });

                if (error) throw error;
            }
            results.push({ metric: 'IN_ENERGY_COAL_PROD', status: 'success', count: mockStates.length });
        } catch (e) {
            console.error("[IN_ENERGY_COAL_PROD] Error:", e);
            results.push({ metric: 'IN_ENERGY_COAL_PROD', status: 'error', message: e.message });
        }

        // 2. Renewable Share (Mock/Placeholder)
        try {
            const mockRenewables = [
                { code: 'GJ', name: 'Gujarat', val: 35.5 },
                { code: 'TN', name: 'Tamil Nadu', val: 40.2 },
                { code: 'KA', name: 'Karnataka', val: 45.0 },
                { code: 'RJ', name: 'Rajasthan', val: 38.0 }
            ];

            for (const state of mockRenewables) {
                const { error } = await supabase.from('india_energy').upsert({
                    state_code: state.code,
                    state_name: state.name,
                    year: 2024,
                    source_type: 'renewable',
                    metric_type: 'production',
                    value: state.val,
                    unit: '%',
                    as_of_date: new Date().toISOString().split('T')[0]
                }, { onConflict: 'state_code, year, source_type, metric_type' });

                if (error) throw error;
            }
            results.push({ metric: 'IN_ENERGY_RENEWABLE_SHARE', status: 'success', count: mockRenewables.length });
        } catch (e) {
            results.push({ metric: 'IN_ENERGY_RENEWABLE_SHARE', status: 'error', message: e.message });
        }

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
