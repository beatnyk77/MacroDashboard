import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface GlobalRefiningFacility {
    id: string;
    as_of_date: string;
    country: string;
    region: string;
    facility_name: string;
    capacity_mbpd: number;
    utilization_pct: number;
    historical_median_pct: number;
    status: 'Expansion' | 'Conversion' | 'Closure' | 'Operating';
    latitude: number;
    longitude: number;
    import_dependency_correlation: number;
    is_top_10: boolean;
}

export interface RegionalImbalance {
    region: string;
    total_capacity: number;
    avg_utilization: number;
    expansion_count: number;
    closure_count: number;
}

export interface GlobalRefiningData {
    facilities: GlobalRefiningFacility[];
    regionalImbalance: RegionalImbalance[];
    lastUpdated: string;
}

export const useGlobalRefiningData = () => {
    const { data } = useSuspenseQuery({
        queryKey: ['global_refining_data'],
        queryFn: async (): Promise<GlobalRefiningData> => {
            // 1. Fetch latest facilities data
            const { data: facilities, error: facilityError } = await supabase
                .from('global_refining_capacity')
                .select('*')
                .order('as_of_date', { ascending: false });

            if (facilityError) throw facilityError;

            // Get the latest date available
            const latestDate = facilities?.[0]?.as_of_date;
            const latestFacilities = (facilities || []).filter(f => f.as_of_date === latestDate) as GlobalRefiningFacility[];

            // 2. Compute Regional Imbalance
            const regions = ['West', 'East', 'Middle East', 'Other'];
            const regionalImbalance: RegionalImbalance[] = regions.map(region => {
                const regionFacilities = latestFacilities.filter(f => f.region === region);
                const total_capacity = regionFacilities.reduce((sum, f) => sum + Number(f.capacity_mbpd), 0);
                const avg_utilization = regionFacilities.length > 0
                    ? regionFacilities.reduce((sum, f) => sum + Number(f.utilization_pct), 0) / regionFacilities.length
                    : 0;
                const expansion_count = regionFacilities.filter(f => f.status === 'Expansion').length;
                const closure_count = regionFacilities.filter(f => f.status === 'Closure').length;

                return {
                    region,
                    total_capacity,
                    avg_utilization,
                    expansion_count,
                    closure_count
                };
            });

            return {
                facilities: latestFacilities.map(f => ({
                    ...f,
                    capacity_mbpd: Number(f.capacity_mbpd),
                    utilization_pct: Number(f.utilization_pct),
                    historical_median_pct: Number(f.historical_median_pct),
                    latitude: Number(f.latitude),
                    longitude: Number(f.longitude),
                    import_dependency_correlation: Number(f.import_dependency_correlation)
                })),
                regionalImbalance,
                lastUpdated: latestDate || new Date().toISOString().split('T')[0]
            };
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    return { data };
};
