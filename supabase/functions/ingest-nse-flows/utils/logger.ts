
import { createAdminClient } from './supabaseClient.ts'

export type LogLevel = 'info' | 'warn' | 'error'

export class Logger {
    private client = createAdminClient()
    private runId: string

    constructor(runId: string) {
        this.runId = runId
    }

    async log(
        source: string,
        status: 'success' | 'error' | 'info' | 'warn' | 'processing',
        rowsUpserted: number = 0,
        errorMessage?: string,
        durationMs?: number
    ) {
        const message = `[${source}] ${status} - Rows: ${rowsUpserted} ${errorMessage ? `- Error: ${errorMessage}` : ''} (${durationMs}ms)`
        if (status === 'error' || status === 'failed') {
            console.error(message)
        } else {
            console.log(message)
        }

        // Map internal status to standard status
        const dbStatus = status === 'processing' ? 'started' : (status === 'error' ? 'failed' : status);

        try {
            await this.client.from('ingestion_logs').insert({
                function_name: source,
                status: dbStatus,
                rows_inserted: rowsUpserted,
                error_message: errorMessage,
                metadata: { run_id: this.runId, duration_ms: durationMs },
                start_time: new Date().toISOString()
            })
        } catch (err) {
            console.error('Failed to write log to DB:', err)
        }
    }
}
