import { SupabaseClient } from '@supabase/supabase-js'

export interface FallbackResult<T> {
    data: T;
    provenance: 'api_live' | 'fallback_snapshot' | 'mock_baseline';
    is_stale: boolean;
    last_verified?: string;
}

/**
 * Wraps an API call with a robust database fallback mechanism.
 * Priority: Live API -> Last Known Good (LKG) Database Value -> Mock Baseline.
 */
export async function withFallback<T>(
    supabase: SupabaseClient,
    metricId: string,
    apiCall: () => Promise<T>,
    options: {
        entityId?: string;
        maxStalenessDays?: number;
        customTableName?: string;
    } = {}
): Promise<FallbackResult<T>> {
    try {
        const data = await apiCall();
        return {
            data,
            provenance: 'api_live',
            is_stale: false,
            last_verified: new Date().toISOString()
        };
    } catch (error) {
        console.warn(`API call failed for ${metricId}: ${error.message}. Attempting database fallback...`);
        
        const tableName = options.customTableName || 'metric_observations';
        const query = supabase
            .from(tableName)
            .select('*');

        if (tableName === 'metric_observations') {
            query.eq('metric_id', metricId);
            if (options.entityId) query.eq('entity_id', options.entityId);
        }

        const { data: latestData, error: dbError } = await query
            .order('as_of_date', { ascending: false })
            .limit(tableName === 'metric_observations' ? 1 : 100);

        if (dbError || !latestData || (Array.isArray(latestData) && latestData.length === 0)) {
            console.error(`Fallback failed for ${metricId}: No historical data found in ${tableName}.`);
            throw error; 
        }

        const resultData = tableName === 'metric_observations' && !Array.isArray(latestData) ? (latestData as any).value : latestData;

        return {
            data: resultData as T,
            provenance: 'fallback_snapshot',
            is_stale: true,
            last_verified: (latestData as any).last_updated_at || (latestData as any)[0]?.last_updated_at
        };
    }
}
