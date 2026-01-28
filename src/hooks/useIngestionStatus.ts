import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface IngestionStatus {
    last_ingestion_at: string;
    time_since_ingestion: string;
}

export function useIngestionStatus() {
    return useQuery({
        queryKey: ['ingestion-status'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_latest_ingestion')
                .select('*')
                .single();

            if (error) throw error;
            return data as IngestionStatus;
        },
        refetchInterval: 60000, // Refresh every minute
    });
}
