import { useEffect, useState } from 'react';
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

export const useOilData = () => {
    const [capacityData, setCapacityData] = useState<OilRefiningCapacity[]>([]);
    const [importData, setImportData] = useState<OilImport[]>([]);
    const [sprData, setSprData] = useState<{ date: string; value: number }[]>([]);
    const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Capacity (Latest Year)
                const { data: capData, error: capError } = await supabase
                    .from('oil_refining_capacity')
                    .select('*')
                    .order('capacity_mbpd', { ascending: false });

                if (capError) throw capError;

                // 2. Fetch Imports (Last 12 months)
                // We want to visualize flows, so getting recent data is key.
                const { data: impData, error: impError } = await supabase
                    .from('oil_imports_by_origin')
                    .select('*')
                    .order('as_of_date', { ascending: false })
                    .limit(500); // Guardrail

                if (impError) throw impError;

                // 3. Fetch SPR Levels (Metric: OIL_SPR_LEVEL_US)
                const { data: sprObs, error: sprError } = await supabase
                    .from('metric_observations')
                    .select('as_of_date, value')
                    .eq('metric_id', 'OIL_SPR_LEVEL_US')
                    .order('as_of_date', { ascending: true }); // Ascending for chart

                if (sprError) throw sprError;

                // 4. Fetch Metric Definitions for context
                const { data: metData, error: metError } = await supabase
                    .from('metrics')
                    .select('*')
                    .eq('category', 'energy');

                if (metError) throw metError;

                setCapacityData(capData || []);
                setImportData(impData || []);
                setSprData((sprObs || []).map(d => ({ date: String(d.as_of_date), value: Number(d.value) })));
                setMetrics(metData || []);
            } catch (err: any) {
                console.error('Error fetching oil data:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    return {
        capacityData,
        importData,
        sprData,
        metrics,
        isLoading,
        error
    };
};
