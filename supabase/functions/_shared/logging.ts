import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

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
                metadata: metadata
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
    status: 'success' | 'failed',
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
