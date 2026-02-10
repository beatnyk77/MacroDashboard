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
    import_volume_mbbl: number;
    as_of_date: string;
    frequency: string;
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
    metrics: MetricDefinition[];
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

            if (capError) throw capError;

            // 2. Fetch Imports (Last 12 months)
            const { data: impData, error: impError } = await supabase
                .from('oil_imports_by_origin')
                .select('*')
                .order('as_of_date', { ascending: false })
                .limit(500);

            if (impError) throw impError;

            // 3. Fetch SPR Levels (Metric: OIL_SPR_LEVEL_US)
            const { data: sprObs, error: sprError } = await supabase
                .from('metric_observations')
                .select('as_of_date, value')
                .eq('metric_id', 'OIL_SPR_LEVEL_US')
                .order('as_of_date', { ascending: true });

            if (sprError) throw sprError;

            // 4. Fetch Refinery Utilization (Metric: OIL_REFINERY_UTILIZATION_US)
            const { data: utilObs, error: utilError } = await supabase
                .from('metric_observations')
                .select('as_of_date, value')
                .eq('metric_id', 'OIL_REFINERY_UTILIZATION_US')
                .order('as_of_date', { ascending: true });

            if (utilError) throw utilError;

            // 5. Fetch Metric Definitions for context
            const { data: metData, error: metError } = await supabase
                .from('metrics')
                .select('*')
                .eq('category', 'energy');

            if (metError) throw metError;

            return {
                capacityData: (capData as OilRefiningCapacity[]) || [],
                importData: (impData as OilImport[]) || [],
                sprData: (sprObs || []).map((d: any) => ({
                    date: String(d.as_of_date),
                    value: Number(d.value)
                })),
                utilizationData: (utilObs || []).map((d: any) => ({
                    date: String(d.as_of_date),
                    value: Number(d.value)
                })),
                metrics: (metData as MetricDefinition[]) || []
            };
        },
        staleTime: 1000 * 60 * 60, // 1 hour
        retry: 2,
    });

    return { data };
};
