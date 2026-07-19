/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createAdminClient } from './utils/supabaseClient.ts'
import { Logger } from './utils/logger.ts'
import { ingestFred } from './sources/fred.ts'
import { ingestFiscalData } from './sources/fiscalData.ts'
import { serveIngest } from '../_shared/handler.ts';

serveIngest('ingest-daily', async (req) => {

    // 1. Basic Auth or Secret Check (Optional but recommended for Cron)
    // For now, we rely on Supabase's internal invoke protections or a shared secret header if needed.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        throw new Error('Unauthorized');}

    const runId = crypto.randomUUID()
    const client = createAdminClient()
    const logger = new Logger(runId)

    await logger.log('orchestrator', 'processing', 0, 'Starting daily ingestion run')
    const start = performance.now()

    try {
        // Parallel or Serial? Serial is safer for rate limits and memory

        // 1. FRED
        const fredKey = Deno.env.get('FRED_API_KEY')
        if (fredKey) {
            await ingestFred(client, logger, fredKey)
        } else {
            await logger.log('FRED', 'error', 0, 'Missing FRED_API_KEY')
        }

        // 2. Fiscal Data
        await ingestFiscalData(client, logger)

        const totalDuration = Math.round(performance.now() - start)
        await logger.log('orchestrator', 'success', 0, 'Ingestion run complete', totalDuration)

        return { ok: true, counts: { upserted: 0 }, meta: { duration_ms: totalDuration } };
    } catch (err: any) {
        console.error('Fatal orchestration error:', err)
        await logger.log('orchestrator', 'error', 0, `Fatal: ${err.message}`)

        throw err;
}
})
