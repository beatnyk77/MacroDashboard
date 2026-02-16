import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export interface IngestionContext {
    supabase: SupabaseClient;
    functionName: string;
    logId: number | null;
}

export async function logIngestionStart(
    supabase: SupabaseClient,
    functionName: string,
    metadata: any = {}
): Promise<number | null> {
    try {
        const { data, error } = await supabase
            .from('ingestion_logs')
            .insert({
                function_name: functionName,
                status: 'started',
                metadata: metadata,
                start_time: new Date().toISOString()
            })
            .select('id')
            .single()

        if (error) {
            console.error('Failed to create ingestion log:', error)
            return null
        }
        return data.id
    } catch (err) {
        console.error('Error creating ingestion log:', err)
        return null
    }
}

export async function logIngestionEnd(
    supabase: SupabaseClient,
    logId: number | null,
    status: 'success' | 'failed' | 'timeout',
    details: {
        error_message?: string,
        rows_inserted?: number,
        rows_updated?: number,
        metadata?: any
    }
) {
    if (!logId) return

    try {
        const updateData: any = {
            completed_at: new Date().toISOString(),
            status: status,
            ...details
        }

        const { error } = await supabase
            .from('ingestion_logs')
            .update(updateData)
            .eq('id', logId)

        if (error) {
            console.error('Failed to update ingestion log:', error)
        }
    } catch (err) {
        console.error('Error updating ingestion log:', err)
    }
}

/**
 * Robust wrapper for ingestion tasks.
 * Handles logging start, success, and failure automatically.
 */
export async function runIngestion(
    supabase: SupabaseClient,
    functionName: string,
    ingestFn: (ctx: IngestionContext) => Promise<{ rows_inserted?: number, rows_updated?: number, metadata?: any }>
): Promise<Response> {
    const logId = await logIngestionStart(supabase, functionName);
    const ctx: IngestionContext = { supabase, functionName, logId };

    try {
        const result = await ingestFn(ctx);
        await logIngestionEnd(supabase, logId, 'success', result);

        return new Response(
            JSON.stringify({ success: true, ...result }),
            { headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error(`Ingestion failed [${functionName}]:`, error);
        await logIngestionEnd(supabase, logId, 'failed', {
            error_message: error.message,
            metadata: { stack: error.stack }
        });

        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
