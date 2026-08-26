import { serveIngest, IngestResult } from '../_shared/handler.ts'

/** Fail closed until direct RBI/NPCI adapters replace the former synthetic proxy. */
serveIngest('ingest-india-digitization', async (_req: Request): Promise<IngestResult> => {
    throw new Error('India digitization ingestion is paused until direct RBI/NPCI source adapters are configured.')
}, { timeoutMs: 20 * 60 * 1000, retries: 3 })
