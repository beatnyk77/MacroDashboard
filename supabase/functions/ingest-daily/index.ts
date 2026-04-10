import { createAdminClient } from './utils/supabaseClient.ts'
import { Logger } from './utils/logger.ts'
import { ingestFred } from './sources/fred.ts'
import { ingestFiscalData } from './sources/fiscalData.ts'
import { ingestYahoo } from './sources/yahoo.ts'

Deno.serve(async (req) => {
    // 1. Basic Auth or Secret Check (Optional but recommended for Cron)
    // For now, we rely on Supabase's internal invoke protections or a shared secret header if needed.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response('Unauthorized', { status: 401 })
    }

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

        // 3. Yahoo
        await ingestYahoo(client, logger)

        const totalDuration = Math.round(performance.now() - start)
        await logger.log('orchestrator', 'success', 0, 'Ingestion run complete', totalDuration)

        return new Response(JSON.stringify({
            message: 'Ingestion complete',
            runId
        }), {
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (err: any) {
        console.error('Fatal orchestration error:', err)
        await logger.log('orchestrator', 'error', 0, `Fatal: ${err.message}`)

        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
})
