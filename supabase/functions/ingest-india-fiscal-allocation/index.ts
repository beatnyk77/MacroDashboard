import { serveIngest, IngestResult } from '../_shared/handler.ts'

/** Fail closed until a verified public fiscal allocation source is configured. */
serveIngest('ingest-india-fiscal-allocation', async (_req: Request): Promise<IngestResult> => {
    throw new Error('India fiscal allocation ingestion is paused until a verified source adapter is configured.')
}, { timeoutMs: 20 * 60 * 1000, retries: 3 })
