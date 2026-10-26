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
      const jobs = [
        'compute-daily-macro-signal', 
        'ingest-market-pulse', 
        'ingest-fred', 
        'ingest-oil-spread',
        'generate-monthly-regime-digest'
      ];
      
      // serveIngest functions log to ingestion_logs; ingestion_runs has not been written since
      // 2026-08. One query per job so a frequently-running job cannot crowd the others out.
      const results = await Promise.all(jobs.map(async (job): Promise<IngestionRun | null> => {
        const { data, error } = await supabase
          .from('ingestion_logs')
          .select('completed_at')
          .eq('function_name', job)
          .eq('status', 'success')
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(1);

        if (error) {
          console.warn(`[useIngestionHealth] fetch failed for ${job}:`, error.message);
          return null;
        }
        const row = data?.[0];
        return row ? { job_name: job, status: 'success', finished_at: row.completed_at as string } : null;
      }));

      return results.filter((run): run is IngestionRun => run !== null);
    },
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    staleTime: 1000 * 60, // 1 minute
  });
}
