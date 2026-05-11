import { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from './timeout-guard.ts'

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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    ingestFn: (ctx: IngestionContext) => Promise<any>,
    corsHeaders: Record<string, string> = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
): Promise<Response> {
    const start = Date.now();
    const logId = await logIngestionStart(supabase, functionName);
    const ctx: IngestionContext = { supabase, functionName, logId };

    let attemptsCount = 1;
    let finalStatus: 'success' | 'failed' | 'timeout' = 'success';
    let finalErrorMessage: string | null = null;
    let finalMetadata: any = {};

    try {
        // 28 minute global safety cap — ensures the DB log is always finalized even if the
        // platform kills the execution, preventing permanent "started" status leaks.
        // Individual ingest functions should use a shorter internal runtimeBudget (e.g. 25 min).
        const rawResult: any = await withTimeout(
            ingestFn(ctx), 
            28 * 60 * 1000, 
            functionName
        );
        const total_latency = Date.now() - start;

        const isJobResult = rawResult && typeof rawResult.ok === 'boolean' && typeof rawResult.attempts === 'number';
        if (isJobResult) {
            attemptsCount = rawResult.attempts;
            if (!rawResult.ok) {
                throw new Error(rawResult.error || 'Job failed after all retries');
            }
        }
        
        const result = isJobResult ? rawResult.value : rawResult;
        finalMetadata = result?.metadata || {};
        
        await logIngestionEnd(supabase, logId, 'success', {
            ...result,
            api_latency_ms: result?.api_latency_ms || total_latency
        });

        // 2.0 Feature: Log Cryptographic Proof if payload provided
        if (result?.raw_payload) {
            await logPayloadHash(supabase, functionName, result.raw_payload, {
                status_code: result.status_code || 200,
                api_latency_ms: result.api_latency_ms || total_latency
            });
        }

        return new Response(
            JSON.stringify({ success: true, ok: true, ...result, total_latency_ms: total_latency }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error(`Ingestion failed [${functionName}]:`, error);
        
        const isTimeout = error.message.includes('timed out');
        finalStatus = isTimeout ? 'timeout' : 'failed';
        finalErrorMessage = error.message;

        await logIngestionEnd(supabase, logId, finalStatus, {
            error_message: error.message,
            metadata: { stack: error.stack, is_timeout: isTimeout }
        });

        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } finally {
        const total_latency = Date.now() - start;
        // Log to ingestion_runs table for historical record
        await supabase.from('ingestion_runs').insert({
            job_name: functionName,
            status: finalStatus,
            attempts: attemptsCount,
            error_message: finalErrorMessage,
            started_at: new Date(start).toISOString(),
            finished_at: new Date().toISOString(),
            duration_ms: total_latency,
            metadata: finalMetadata
        });
    }
}
