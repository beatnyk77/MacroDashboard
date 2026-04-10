import { SupabaseClient } from '@supabase/supabase-js'

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
        status_code?: number,
        api_latency_ms?: number,
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
 * Institutional Data Integrity Ledger (SHA-256 Hashing)
 */
async function generateSHA256(payload: string | any): Promise<string> {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const msgUint8 = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function logPayloadHash(
    supabase: SupabaseClient,
    functionName: string,
    payload: string | any,
    details: { status_code?: number, api_latency_ms?: number }
) {
    try {
        const hash = await generateSHA256(payload);
        await supabase.from('ingestion_payload_hashes').insert({
            metric_id: functionName,
            payload_hash: hash,
            status_code: details.status_code,
            api_latency_ms: details.api_latency_ms
        });
    } catch (err) {
        console.error('Failed to log payload hash:', err);
    }
}

/**
 * Robust wrapper for ingestion tasks.
 * Handles logging start, success, and failure automatically.
 */
export async function runIngestion(
    supabase: SupabaseClient,
    functionName: string,
    ingestFn: (ctx: IngestionContext) => Promise<{ 
        rows_inserted?: number, 
        rows_updated?: number, 
        status_code?: number, 
        api_latency_ms?: number, 
        raw_payload?: string | any,
        metadata?: any 
    }>
): Promise<Response> {
    const start = Date.now();
    const logId = await logIngestionStart(supabase, functionName);
    const ctx: IngestionContext = { supabase, functionName, logId };

    try {
        const result = await ingestFn(ctx);
        const total_latency = Date.now() - start;
        
        await logIngestionEnd(supabase, logId, 'success', {
            ...result,
            api_latency_ms: result.api_latency_ms || total_latency
        });

        // 2.0 Feature: Log Cryptographic Proof if payload provided
        if (result.raw_payload) {
            await logPayloadHash(supabase, functionName, result.raw_payload, {
                status_code: result.status_code || 200,
                api_latency_ms: result.api_latency_ms || total_latency
            });
        }

        return new Response(
            JSON.stringify({ success: true, ...result, total_latency_ms: total_latency }),
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
