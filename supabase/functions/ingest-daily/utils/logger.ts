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
        // Always log to console for realtime debugging
        const message = `[${source}] ${status} - Rows: ${rowsUpserted} ${errorMessage ? `- Error: ${errorMessage}` : ''} (${durationMs}ms)`
        if (status === 'error') {
            console.error(message)
            // TODO: ALERTING STUB
            // Send to Slack/Discord/Email
            // await fetch('https://hooks.slack.com/...', { method: 'POST', body: JSON.stringify({ text: message }) })
        } else {
            console.log(message)
        }

        // Write to DB
        try {
            await this.client.from('ingestion_logs').insert({
                run_id: this.runId,
                source,
                status,
                rows_upserted: rowsUpserted,
                error_message: errorMessage,
                duration_ms: durationMs,
            })
        } catch (err) {
            console.error('Failed to write log to DB:', err)
        }
    }
}
