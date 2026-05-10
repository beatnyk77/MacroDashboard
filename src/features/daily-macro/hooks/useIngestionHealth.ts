import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface IngestionRun {
  job_name: string;
  status: 'success' | 'failed' | 'timeout';
  finished_at: string;
}

export function useIngestionHealth() {
  return useQuery({
    queryKey: ['ingestion-health'],
    queryFn: async () => {
      const jobs = ['compute-daily-macro-signal', 'ingest-market-pulse', 'ingest-fred', 'ingest-oil-spread'];
      
      const { data, error } = await supabase
        .from('ingestion_runs')
        .select('job_name, status, finished_at')
        .in('job_name', jobs)
        .order('finished_at', { ascending: false });

      if (error) {
        console.warn('[useIngestionHealth] fetch failed:', error.message);
        return [];
      }

      // Get latest success per job
      const latestSuccess: Record<string, IngestionRun> = {};
      data.forEach((run) => {
        if (run.status === 'success' && !latestSuccess[run.job_name]) {
          latestSuccess[run.job_name] = run;
        }
      });

      return Object.values(latestSuccess);
    },
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    staleTime: 1000 * 60, // 1 minute
  });
}
