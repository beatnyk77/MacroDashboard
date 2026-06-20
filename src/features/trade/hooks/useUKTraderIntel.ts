import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface UKTraderIntelligence {
    id: string;
    hs_code: string;
    flow_type: 'Import' | 'Export';
    trader_id: number;
    company_name: string;
    postcode: string;
    month_id: number;
    value_gbp: number | null;
    last_updated: string;
    staleness_flag: 'fresh' | 'lagged' | 'very_lagged';
}

/**
 * Fetches the specific UK traders importing or exporting the given HS code.
 * Optionally triggers the ingestion edge function if data is missing or very stale.
 */
export function useUKTraderIntel(hsCode: string | null) {
    return useQuery({
        queryKey: ['uk_trader_intel', hsCode],
        queryFn: async () => {
            if (!hsCode) return [];

            // 1. Try to fetch from our database (vw_latest_uk_traders)
            const { data, error } = await supabase
                .from('vw_latest_uk_traders')
                .select('*')
                .eq('hs_code', hsCode)
                .order('flow_type')
                .order('company_name');

            if (error) {
                console.error("Error fetching UK trader intel:", error);
                throw error;
            }

            // 2. If no data found, dynamically invoke the edge function to fetch from the UK Trade Info API
            if (!data || data.length === 0) {
                console.log(`No UK trader intel found for HS ${hsCode}, triggering ingestion...`);
                const { error: invokeError } = await supabase.functions.invoke(
                    `ingest-uk-trade-traders?hsCode=${encodeURIComponent(hsCode)}`,
                    {
                        headers: { 'Content-Type': 'application/json' },
                        method: 'POST',
                    }
                );

                if (invokeError) {
                    console.error("Failed to ingest UK trader intel:", invokeError);
                    // Don't throw, just return empty to not break UI
                    return [];
                }

                // Try fetching again after ingestion
                const { data: retryData } = await supabase
                    .from('vw_latest_uk_traders')
                    .select('*')
                    .eq('hs_code', hsCode)
                    .order('flow_type')
                    .order('company_name');

                return (retryData || []) as UKTraderIntelligence[];
            }

            return data as UKTraderIntelligence[];
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        enabled: !!hsCode,
    });
}
