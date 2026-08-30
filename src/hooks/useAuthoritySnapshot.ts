import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AuthorityMetricSnapshot } from '@/lib/authority/metricContract';

export function useAuthoritySnapshot(metricId?: string, snapshotId?: string) {
    return useQuery({
        queryKey: ['authority-snapshot', metricId, snapshotId],
        enabled: !!metricId && !!snapshotId,
        staleTime: 1000 * 60 * 60 * 24, // Snapshots are immutable, cache for 24 hours
        queryFn: async (): Promise<AuthorityMetricSnapshot | null> => {
            if (!metricId || !snapshotId) return null;
            
            const { data, error } = await supabase
                .from('vw_metric_publication_snapshots_public')
                .select('payload')
                .eq('snapshot_id', snapshotId)
                .eq('metric_id', metricId)
                .maybeSingle();
                
            if (error) throw error;
            if (!data || !data.payload) return null;
            
            return data.payload as unknown as AuthorityMetricSnapshot;
        }
    });
}

export function useAuthorityHistory(metricId?: string) {
    return useQuery({
        queryKey: ['authority-history', metricId],
        enabled: !!metricId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: async (): Promise<AuthorityMetricSnapshot[]> => {
            if (!metricId) return [];
            
            const { data, error } = await supabase
                .from('vw_metric_publication_snapshots_public')
                .select('payload')
                .eq('metric_id', metricId)
                .order('published_at', { ascending: false })
                .limit(50);
                
            if (error) throw error;
            if (!data) return [];
            
            return data.map(row => row.payload as unknown as AuthorityMetricSnapshot);
        }
    });
}
