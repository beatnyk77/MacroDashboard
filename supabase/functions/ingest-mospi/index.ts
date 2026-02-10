
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ==========================================
// MoSPI Client Class (Inlined)
// ==========================================

export interface MoSPIResponse {
    statusCode?: boolean;
    message?: string;
    data?: any;
    error?: string;
}

export class MoSPIClient {
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

        console.log(`[MoSPI] Requesting: ${url.toString()}`);

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
            console.error("[MoSPI] API Error:", error);
            throw error;
        }
    }

    // ==========================================
    // PLFS (Unemployment)
    // ==========================================
    async getPLFSData(params: {
        indicator_code?: number;
        frequency_code?: number;
        year?: string;
        month_code?: number;
        quarter_code?: number;
        state_code?: string;
        sector_code?: string;
    }) {
        return this.fetchAPI("/api/plfs/getData", params);
    }

    // ==========================================
    // CPI (Inflation)
    // ==========================================
    async getCPIData(params: {
        year: string;
        month: string;
        group_code?: string;
        sub_group_code?: string;
        state_code?: string;
        sector_code?: string;
    }) {
        return this.fetchAPI("/api/cpi/getCPIIndex", params);
    }

    // ==========================================
    // IIP (Industrial Production)
    // ==========================================
    async getIIPMonthly(params: {
        year: string;
        month: string;
        nic_code?: string;
        sector_code?: string;
    }) {
        return this.fetchAPI("/api/iip/getIIPMonthly", params);
    }

    async getIIPData(params: { year: string, month: string }) {
        return this.getIIPMonthly(params);
    }

    // ==========================================
    // NAS (GDP)
    // ==========================================
    async getNASData(params: {
        series?: string; // "Current" or "Back"
        year?: string;
        frequency_code?: number; // 1=Annual, 2=Quarterly
        indicator_code?: number;
        item_code?: string;
    }) {
        return this.fetchAPI("/api/nas/getNASData", params);
    }

    // ==========================================
    // Metadata Discovery
    // ==========================================
    async getPLFSIndicators(frequency_code: number = 2) {
        return this.fetchAPI("/api/plfs/getIndicatorListByFrequency", { frequency_code });
    }

    async getCPIFilters(base_year: string = "2012", level: string = "Group") {
        return this.fetchAPI("/api/cpi/getCpiFilterByLevelAndBaseYear", { base_year, level });
    }

    async getIIPFilters(base_year: string = "2011-12", frequency: string = "Monthly") {
        return this.fetchAPI("/api/iip/getIipFilter", { base_year, frequency });
    }

    // Note: Use getNaIndicatorList if getNasIndicatorList fails (typo in some docs)
    async getNASIndicators() {
        return this.fetchAPI("/api/nas/getNasIndicatorList");
    }
}

// ==========================================
// Main Edge Function Logic
// ==========================================

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const mospi = new MoSPIClient();
        const results = [];

        // Helper to upsert data
        const upsertMetric = async (metricId: string, value: number, date: string, source: string) => {
            if (isNaN(value) || value === null) {
                console.warn(`[Upsert] Skipping NaN/Null value for ${metricId}`);
                return false;
            }

            const { error } = await supabase.from('metric_observations').upsert({
                metric_id: metricId,
                as_of_date: date,
                value: value,
                last_updated_at: new Date().toISOString()
            }, { onConflict: 'metric_id, as_of_date' });

            if (error) throw error;
            return true;
        };

        // 1. PLFS (Unemployment, Wages, Participation, Hours)
        // ==================================================================
        try {
            console.log("[PLFS] Discovery started...");

            // A. Quarterly Metrics (UR, LFPR by Sector)
            const plfsQuarterly = await mospi.getPLFSIndicators(2);
            const qConfigs = [
                { id: 'IN_UNEMPLOYMENT_RATE', keywords: ['unemployment rate'], label: 'Unemployment', sector: '3' },
                { id: 'IN_LFPR', keywords: ['labor force participation', 'lfpr'], label: 'LFPR', sector: '3' },
                { id: 'IN_PLFS_UR_URBAN', keywords: ['unemployment rate'], label: 'Urban UR', sector: '2' },
                { id: 'IN_PLFS_UR_RURAL', keywords: ['unemployment rate'], label: 'Rural UR', sector: '1' },
                { id: 'IN_PLFS_LFPR_URBAN', keywords: ['labor force participation'], label: 'Urban LFPR', sector: '2' },
                { id: 'IN_PLFS_LFPR_RURAL', keywords: ['labor force participation'], label: 'Rural LFPR', sector: '1' }
            ];

            for (const config of qConfigs) {
                const indicator = plfsQuarterly.data?.find((i: any) =>
                    config.keywords.some(k => i.description?.toLowerCase?.().includes(k))
                );

                if (indicator) {
                    console.log(`[PLFS-Q] Found ${config.label}: ${indicator.indicator_code}`);
                    const data = await mospi.getPLFSData({ indicator_code: indicator.indicator_code, frequency_code: 2, sector_code: config.sector });
                    if (data?.data?.length > 0) {
                        const latest = data.data.sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0];
                        const value = parseFloat(latest.value || latest.Value || 0);
                        if (await upsertMetric(config.id, value, latest.date || new Date().toISOString(), 'MoSPI')) {
                            results.push({ metric: config.id, status: 'success', value, date: latest.date });
                        }
                    }
                }
            }

            // B. Annual Metrics (Wages, Hours)
            const plfsAnnual = await mospi.getPLFSIndicators(1);
            const aConfigs = [
                { id: 'IN_WAGE_GROWTH', code: 6, label: 'Wage Growth' }, // Avg wage/salary earnings
                { id: 'IN_HOURS_WORKED', keywords: ['hours worked', 'average hours'], label: 'Hours Worked' }
            ];

            for (const config of aConfigs) {
                const indicator = config.code ?
                    plfsAnnual.data?.find((i: any) => i.indicator_code === config.code) :
                    plfsAnnual.data?.find((i: any) => config.keywords?.some(k => i.description?.toLowerCase?.().includes(k)));

                if (indicator) {
                    console.log(`[PLFS-A] Found ${config.label}: ${indicator.indicator_code}`);
                    const data = await mospi.getPLFSData({ indicator_code: indicator.indicator_code, frequency_code: 1 });
                    if (data?.data?.length > 0) {
                        const latest = data.data.sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0];
                        const value = parseFloat(latest.value || latest.Value || 0);
                        if (await upsertMetric(config.id, value, latest.date || new Date().toISOString(), 'MoSPI')) {
                            results.push({ metric: config.id, status: 'success', value, date: latest.date });
                        }
                    }
                } else {
                    results.push({ metric: config.id, status: 'skipped', reason: `${config.label} indicator not found` });
                }
            }
        } catch (e) {
            console.error("[PLFS] Error", e);
            results.push({ metric: 'PLFS_GROUP', status: 'error', message: e instanceof Error ? e.message : String(e) });
        }

        // ==================================================================
        // 2. CPI (Inflation + Fuel)
        // ==================================================================
        try {
            console.log("[CPI] Discovery started...");

            const cpiConfigs = [
                { id: 'IN_CPI_YOY', group: "0", keywords: ['general', 'combined'], label: 'Headline CPI' },
                { id: 'IN_CPI_FUEL_YOY', group: "5", keywords: ['fuel'], label: 'Fuel & Light' }
            ];

            for (const config of cpiConfigs) {
                let cpiItem: any = null;
                let qYear = "";
                let qMonth = "";

                // Try last 6 months
                outer: for (let i = 1; i <= 6; i++) {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    qYear = d.getFullYear().toString();
                    qMonth = (d.getMonth() + 1).toString();

                    const cpiData = await mospi.getCPIData({ year: qYear, month: qMonth, group_code: config.group });
                    if (cpiData?.data?.length > 0) {
                        cpiItem = cpiData.data.find((d: any) => {
                            const desc = (d.description || d.row_name || d.Item_Name || d.subgroup_name || d.group_name || "").toLowerCase();
                            // If group is general, match general or combined
                            // If group is 5, match fuel
                            return config.keywords.some(k => desc.includes(k));
                        }) || cpiData.data[0]; // Fallback to first if only one item per group

                        if (cpiItem) break outer;
                    }
                }

                if (cpiItem) {
                    const value = parseFloat(cpiItem.value || cpiItem.Value || 0);
                    const dateStr = `${qYear}-${qMonth.padStart(2, '0')}-01`;
                    if (await upsertMetric(config.id, value, dateStr, 'MoSPI')) {
                        results.push({ metric: config.id, status: 'success', value, date: dateStr });
                    }
                } else {
                    results.push({ metric: config.id, status: 'skipped', reason: `No ${config.label} found` });
                }
            }
        } catch (e) {
            results.push({ metric: 'CPI_GROUP', status: 'error', message: e.message });
        }

        // ==================================================================
        // 3. IIP (Industrial Production)
        // ==================================================================
        try {
            console.log("[IN_IIP_YOY] Discovery started...");

            let iipItem: any = null;
            let queryYear = "";
            let queryMonth = "";

            // Try last 4 months for IIP (usually 2 month lag)
            for (let i = 2; i <= 5; i++) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                queryYear = d.getFullYear().toString();
                queryMonth = (d.getMonth() + 1).toString();

                console.log(`[IN_IIP_YOY] Trying ${queryYear}-${queryMonth}...`);
                const iipData = await mospi.getIIPData({ year: queryYear, month: queryMonth });

                if (iipData && iipData.data && iipData.data.length > 0) {
                    console.log(`[IN_IIP_YOY] Received ${iipData.data.length} rows. Samples:`, iipData.data.slice(0, 3).map((d: any) => d.sector_name || d.Item_Name || d.description));
                    iipItem = iipData.data.find((d: any) => {
                        const sector = (d.sector_name || d.Item_Name || d.description || "").toLowerCase();
                        return sector === 'general' || sector === 'all industries' || sector.includes('general index');
                    });
                    if (iipItem) break;
                }
            }

            if (iipItem) {
                const rawVal = iipItem.value || iipItem.Value || 0;
                const value = parseFloat(rawVal);
                const dateStr = `${queryYear}-${queryMonth.padStart(2, '0')}-01`;

                console.log(`[IN_IIP_YOY] Found: ${iipItem.sector_name}, Value: ${value}, Date: ${dateStr}`);

                if (await upsertMetric('IN_IIP_YOY', value, dateStr, 'MoSPI')) {
                    results.push({ metric: 'IN_IIP_YOY', status: 'success', value, date: dateStr });
                }
            } else {
                results.push({ metric: 'IN_IIP_YOY', status: 'skipped', reason: 'No data found in last 5 months' });
            }
        } catch (e) {
            results.push({ metric: 'IN_IIP_YOY', status: 'error', message: e.message });
        }

        // ==================================================================
        // 4. GDP (Quarterly)
        // ==================================================================
        try {
            console.log("[NAS] Discovery started...");
            const nasMeta = await mospi.getNASIndicators();
            const nasConfigs = [
                { id: 'IN_GDP_GROWTH_YOY', code: 22, label: 'GDP Growth %' },
                { id: 'IN_GDP_CONSTANT_LEVEL', code: 5, label: 'GDP Constant Level' }
            ];

            for (const config of nasConfigs) {
                const indicator = config.code ?
                    nasMeta.data?.indicator?.find((i: any) => i.indicator_code === config.code) :
                    nasMeta.data?.indicator?.find((i: any) => (i.description || "").toLowerCase().includes('growth') && (i.description || "").toLowerCase().includes('constant'));

                if (indicator) {
                    console.log(`[NAS] Found ${config.label}: ${indicator.indicator_code}`);

                    let nasItem: any = null;
                    const years = [new Date().getFullYear().toString(), (new Date().getFullYear() - 1).toString()];

                    for (const yr of years) {
                        const data = await mospi.getNASData({ indicator_code: indicator.indicator_code, frequency_code: 2, year: yr });
                        if (data?.data?.length > 0) {
                            nasItem = data.data.sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0];
                            if (nasItem) break;
                        }
                    }

                    if (nasItem) {
                        const value = parseFloat(nasItem.value || nasItem.Value || 0);
                        if (await upsertMetric(config.id, value, nasItem.date || new Date().toISOString(), 'MoSPI')) {
                            results.push({ metric: config.id, status: 'success', value, date: nasItem.date });
                        }
                    } else {
                        results.push({ metric: config.id, status: 'skipped', reason: `No data found for ${config.label}` });
                    }
                }
            }
        } catch (e) {
            console.error("[NAS] Error", e);
            results.push({ metric: 'NAS_GROUP', status: 'error', message: e.message });
        }


        return new Response(JSON.stringify({
            success: true,
            results,
            debug: {
                plfs_annual: (await mospi.getPLFSIndicators(1))?.data?.slice(0, 10),
                cpi_combined: (await mospi.getCPIData({ year: (new Date().getFullYear() - 1).toString(), month: "12", group_code: "Combined" }))?.data?.slice(0, 5),
                nas_indicators: (await mospi.getNASIndicators())?.data?.indicator?.slice(0, 30)
            }
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
