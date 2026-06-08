import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface UKOTSFlow {
    id: string;
    hs_code: string;
    month_id: number;
    flow_type: 'Import' | 'Export';
    partner_country_iso: string | null;
    region_id: string | null;
    port_id: string | null;
    value_gbp: number | null;
    net_mass_kg: number | null;
    last_updated: string;
}

/**
 * Fetches the UK Overseas Trade Statistics (OTS) flows for a specific HS code.
 */
export function useUKTradeFlows(hsCode: string) {
    return useQuery({
        queryKey: ['uk_ots_flows', hsCode],
        queryFn: async () => {
            if (!hsCode) return [];

            const { data, error } = await supabase
                .from('uk_ots_flows')
                .select('*')
                .eq('hs_code', hsCode)
                .order('month_id', { ascending: false });

            if (error) {
                console.error("Error fetching UK OTS flows:", error);
                throw error;
            }

            // If no data, trigger ingestion
            if (!data || data.length === 0) {
                console.log(`No UK OTS flows found for HS ${hsCode}, triggering ingestion...`);
                const { error: invokeError } = await supabase.functions.invoke(
                    `ingest-uk-trade-ots?hsCode=${encodeURIComponent(hsCode)}`,
                    {
                        headers: { 'Content-Type': 'application/json' },
                        method: 'POST',
                    }
                );

                if (invokeError) {
                    console.error("Failed to ingest UK OTS flows:", invokeError);
                    return [];
                }

                const { data: retryData } = await supabase
                    .from('uk_ots_flows')
                    .select('*')
                    .eq('hs_code', hsCode)
                    .order('month_id', { ascending: false });

                return (retryData || []) as UKOTSFlow[];
            }

            return data as UKOTSFlow[];
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        enabled: !!hsCode,
    });
}
