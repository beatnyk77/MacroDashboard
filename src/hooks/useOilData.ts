import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { METRIC_IDS as MID } from '@/constants/metricIds';

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
    exporter_country_name: string | null;
    import_volume_mbbl: number;
    as_of_date: string;
    frequency: string;
    import_cost_usd: number | null;
    import_cost_local_currency: number | null;
    exchange_rate: number | null;
    brent_price_usd: number | null;
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
    importLastUpdated?: string;
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

            // 2. Fetch Oil Import Flows
            const { data: impData, error: impError } = await supabase
                .from('oil_imports_by_origin')
                .select('*')
                .order('as_of_date', { ascending: false });

            if (impError) console.warn('Oil Import Flows fetch error:', impError);

            const importLastUpdated = impData && impData.length > 0
                ? String(impData[0].as_of_date)
                : undefined;

            // 3. Fetch SPR Levels (Metric: OIL_SPR_LEVEL_US)
            const { data: sprObs, error: sprError } = await supabase
                .from('metric_observations')
                .select('as_of_date, value')
                .eq('metric_id', MID.OIL_SPR_LEVEL_US)
                .order('as_of_date', { ascending: true });

            if (sprError) console.warn('SPR Levels fetch error:', sprError);

            // 4. Fetch Refinery Utilization (Metric: OIL_REFINERY_UTILIZATION_US)
            const { data: utilObs, error: utilError } = await supabase
                .from('metric_observations')
                .select('as_of_date, value')
                .eq('metric_id', MID.OIL_REFINERY_UTILIZATION_US)
                .order('as_of_date', { ascending: true });

            if (utilError) console.warn('Refinery Utilization fetch error:', utilError);

            // 5. Fetch Power Mix Metrics (Lastest observations)
            const powerMetrics = [
                MID.US_POWER_COAL_PCT, MID.US_POWER_RENEWABLE_PCT, MID.US_POWER_OTHER_PCT,
                MID.EU_POWER_COAL_PCT, MID.EU_POWER_RENEWABLE_PCT, MID.EU_POWER_OTHER_PCT,
                MID.IN_POWER_COAL_PCT, MID.IN_POWER_RENEWABLE_PCT, MID.IN_POWER_OTHER_PCT,
                MID.CN_POWER_COAL_PCT, MID.CN_POWER_RENEWABLE_PCT, MID.CN_POWER_OTHER_PCT,
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
                .eq('metric_id', MID.EU_GAS_STORAGE_PCT)
                .order('as_of_date', { ascending: true });

            if (gasError) console.warn('EU Gas fetch error:', gasError);

            // 6.5. Fetch Brent Price (Metric: BRENT_CRUDE_PRICE)
            const { data: brentObs, error: brentError } = await supabase
                .from('metric_observations')
                .select('as_of_date, value')
                .eq('metric_id', MID.BRENT_CRUDE_PRICE)
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
                importData: (impData || []).map((d) => ({
                    importer_country_code: d.importer_country_code,
                    exporter_country_code: d.exporter_country_code,
                    exporter_country_name: d.exporter_country_name,
                    import_volume_mbbl: Number(d.import_volume_mbbl),
                    as_of_date: d.as_of_date,
                    frequency: d.frequency,
                    import_cost_usd: d.import_cost_usd,
                    import_cost_local_currency: d.import_cost_local_currency,
                    exchange_rate: d.exchange_rate,
                    brent_price_usd: d.brent_price_usd,
                })),
                importLastUpdated,
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
                metrics: (metData as unknown as MetricDefinition[]) || [], // TODO(types)
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
