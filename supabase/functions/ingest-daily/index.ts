/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'
import { ingestFred } from './sources/fred.ts'
import { ingestFiscalData } from './sources/fiscalData.ts'
import { Logger } from './utils/logger.ts'

async function doIngest(supabase: ReturnType<typeof createClient>): Promise<IngestResult> {
    const runId = crypto.randomUUID()
    const logger = new Logger(runId)
    const start = performance.now()

    await logger.log('orchestrator', 'processing', 0, 'Starting daily ingestion run')

    // 1. FRED
    const fredKey = Deno.env.get('FRED_API_KEY')
    if (fredKey) {
        await ingestFred(supabase, logger, fredKey)
    } else {
        await logger.log('FRED', 'error', 0, 'Missing FRED_API_KEY')
    }

    // 2. Fiscal Data
    await ingestFiscalData(supabase, logger)

    const totalDuration = Math.round(performance.now() - start)
    await logger.log('orchestrator', 'success', 0, 'Ingestion run complete', totalDuration)

    return {
        ok: true,
        counts: { upserted: 0, skipped: 0 },
        meta: { runId, durationMs: totalDuration }
    }
}

serveIngest('ingest-daily', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    return doIngest(supabase)
}, { timeoutMs: 15 * 60 * 1000, retries: 3 })
