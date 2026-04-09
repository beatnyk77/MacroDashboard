import { SupabaseClient } from '@supabase/supabase-js'

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
}

/**
 * Fetch with exponential backoff retry logic and timeout
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeoutMs = 15000, maxRetries = 3, ...fetchOptions } = options;
  let lastError: Error | null = null;

  for (let i = 0; i <= maxRetries; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      if (i > 0) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      if (response.ok) return response;

      const errorText = await response.text();
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        lastError = new Error(`Request timed out after ${timeoutMs}ms`);
      } else {
        lastError = error;
      }
    } finally {
      clearTimeout(id);
    }
  }
  throw lastError || new Error(`Failed to fetch ${url}`);
}

/**
 * Validates that an object has expected numeric values for given keys
 */
export function validateNumericData(data: any, keys: string[]): boolean {
  return keys.every(key => {
    const val = data[key];
    return typeof val === 'number' && !isNaN(val);
  });
}

/**
 * Upserts observations to metric_observations table with standard columns
 */
export async function upsertObservations(
  supabase: SupabaseClient,
  observations: any[]
) {
  if (observations.length === 0) return { count: 0 };

  const { error } = await supabase
    .from('metric_observations')
    .upsert(observations, { onConflict: 'metric_id, as_of_date' });

  if (error) throw error;
  
  // Update the 'updated_at' timestamp on the parent metrics
  const uniqueMetricIds = [...new Set(observations.map(o => o.metric_id))];
  await Promise.all(
    uniqueMetricIds.map(id => 
      supabase
        .from('metrics')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id)
    )
  );

  return { count: observations.length };
}

/**
 * Helper to get active metrics for a specific source
 */
export async function getActiveMetricsBySource(
  supabase: SupabaseClient,
  sourceName: string
) {
  const { data: source } = await supabase
    .from('data_sources')
    .select('id')
    .eq('name', sourceName)
    .single();

  if (!source) throw new Error(`Source ${sourceName} not found`);

  const { data: metrics, error } = await supabase
    .from('metrics')
    .select('id, metadata, updated_at')
    .eq('source_id', source.id)
    .eq('is_active', true)
    .order('updated_at', { ascending: true, nullsFirst: true });

  if (error) throw error;
  return metrics || [];
}
