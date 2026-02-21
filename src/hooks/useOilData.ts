import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface OilRefiningCapacity {
    country_code: string;
    country_name: string;
    capacity_mbpd: number;
    capacity_share_pct: number | null;
    as_of_year: number;
}

export interface OilImport {
    importer_country_code: string;
    exporter_country_code: string;
    exporter_country_name?: string;
    import_volume_mbbl: number;
    as_of_date: string;
    frequency: string;
    import_cost_usd?: number;
    import_cost_local_currency?: number;
    exchange_rate?: number;
    brent_price_usd?: number;
}

export interface MetricDefinition {
    id: string;
    name: string;
    description: string;
    display_frequency: string;
    metadata: any;
}

export interface OilData {
    capacityData: OilRefiningCapacity[];
    importData: OilImport[];
    sprData: { date: string; value: number }[];
    utilizationData: { date: string; value: number }[];
    euGasData: { date: string; value: number }[];
    powerMixData: { region: string; coal: number; renewable: number; other: number }[];
    powerMixLastUpdated?: string;
    metrics: MetricDefinition[];
    brentPriceData: { date: string; value: number }[];
}

export const useOilData = () => {
    const { data } = useSuspenseQuery({
        queryKey: ['oil_data'],
        queryFn: async (): Promise<OilData> => {
            // 1. Fetch Capacity (Latest Year)
            const { data: capData, error: capError } = await supabase
                .from('oil_refining_capacity')
                .select('*')
                .order('capacity_mbpd', { ascending: false });

            if (capError) console.warn('Refining Capacity fetch error:', capError);

            // 2. Fetch Imports (Last 12 months)
            const { data: impData, error: impError } = await supabase
                .from('oil_imports_by_origin')
                .select('*')
                .order('as_of_date', { ascending: false })
                .limit(500);

            if (impError) console.warn('Oil Imports fetch error:', impError);

            // 3. Fetch SPR Levels (Metric: OIL_SPR_LEVEL_US)
            const { data: sprObs, error: sprError } = await supabase
                .from('metric_observations')
                .select('as_of_date, value')
                .eq('metric_id', 'OIL_SPR_LEVEL_US')
                .order('as_of_date', { ascending: true });

            if (sprError) console.warn('SPR Levels fetch error:', sprError);

            // 4. Fetch Refinery Utilization (Metric: OIL_REFINERY_UTILIZATION_US)
            const { data: utilObs, error: utilError } = await supabase
                .from('metric_observations')
                .select('as_of_date, value')
                .eq('metric_id', 'OIL_REFINERY_UTILIZATION_US')
                .order('as_of_date', { ascending: true });

            if (utilError) console.warn('Refinery Utilization fetch error:', utilError);

            // 5. Fetch Power Mix Metrics (Lastest observations)
            const powerMetrics = [
                'US_POWER_COAL_PCT', 'US_POWER_RENEWABLE_PCT', 'US_POWER_OTHER_PCT',
                'EU_POWER_COAL_PCT', 'EU_POWER_RENEWABLE_PCT', 'EU_POWER_OTHER_PCT',
                'IN_POWER_COAL_PCT', 'IN_POWER_RENEWABLE_PCT', 'IN_POWER_OTHER_PCT',
                'CN_POWER_COAL_PCT', 'CN_POWER_RENEWABLE_PCT', 'CN_POWER_OTHER_PCT'
            ];

            const { data: powerObs, error: powerError } = await supabase
                .from('metric_observations')
                .select('metric_id, value, as_of_date')
                .in('metric_id', powerMetrics)
                .order('as_of_date', { ascending: false });

            if (powerError) console.warn('Power Mix fetch error:', powerError);

            // Group by region
            const regions = ['US', 'EU', 'India', 'China'];
            const regionPrefixes: Record<string, string> = { 'US': 'US', 'EU': 'EU', 'India': 'IN', 'China': 'CN' };

            const powerMixData = regions.map(region => {
                const prefix = regionPrefixes[region];
                const coal = powerObs?.find(o => o.metric_id === `${prefix}_POWER_COAL_PCT`)?.value || 0;
                const renewable = powerObs?.find(o => o.metric_id === `${prefix}_POWER_RENEWABLE_PCT`)?.value || 0;
                const other = powerObs?.find(o => o.metric_id === `${prefix}_POWER_OTHER_PCT`)?.value || 0;
                return { region, coal: Number(coal), renewable: Number(renewable), other: Number(other) };
            });

            const powerMixLastUpdated = powerObs && powerObs.length > 0 ? String(powerObs[0].as_of_date) : undefined;

            // 6. Fetch EU Gas Storage (Metric: EU_GAS_STORAGE_PCT)
            const { data: gasObs, error: gasError } = await supabase
                .from('metric_observations')
                .select('as_of_date, value')
                .eq('metric_id', 'EU_GAS_STORAGE_PCT')
                .order('as_of_date', { ascending: true });

            if (gasError) console.warn('EU Gas fetch error:', gasError);

            // 6.5. Fetch Brent Price (Metric: OIL_BRENT_PRICE_USD)
            const { data: brentObs, error: brentError } = await supabase
                .from('metric_observations')
                .select('as_of_date, value')
                .eq('metric_id', 'OIL_BRENT_PRICE_USD')
                .order('as_of_date', { ascending: true });

            if (brentError) console.warn('Brent Price fetch error:', brentError);

            // 7. Fetch Metric Definitions for context
            const { data: metData, error: metError } = await supabase
                .from('metrics')
                .select('*')
                .eq('category', 'energy');

            if (metError) console.warn('Metric Definitions fetch error:', metError);

            return {
                capacityData: (capData || []).map((d: any) => ({
                    ...d,
                    capacity_mbpd: Number(d.capacity_mbpd)
                })),
                importData: (impData as OilImport[]) || [],
                sprData: (sprObs || []).map((d: any) => ({
                    date: String(d.as_of_date),
                    value: Number(d.value)
                })),
                utilizationData: (utilObs || []).map((d: any) => ({
                    date: String(d.as_of_date),
                    value: Number(d.value)
                })),
                euGasData: (gasObs || []).map((d: any) => ({
                    date: String(d.as_of_date),
                    value: Number(d.value)
                })),
                powerMixData,
                powerMixLastUpdated,
                metrics: (metData as MetricDefinition[]) || [],
                brentPriceData: (brentObs || []).map((d: any) => ({
                    date: String(d.as_of_date),
                    value: Number(d.value)
                }))
            };
        },
        staleTime: 1000 * 60 * 60, // 1 hour
        retry: 2,
    });

    return { data };
};
