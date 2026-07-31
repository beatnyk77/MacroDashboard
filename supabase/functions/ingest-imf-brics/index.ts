/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { serveIngest, IngestResult } from '../_shared/handler.ts';

// This function previously wrote hardcoded BRICS-bloc aggregate values and
// per-country gold reserves, restamped as live monthly data. Removed
// 2026-08-01 per the project's "no fabricated data" rule. BRICS_* metrics
// are deactivated in migration 20260801000004. A real fix requires either
// a genuine BRICS-aggregate data source or computing these from real
// country-level series — tracked as a follow-up, not attempted here.
serveIngest('ingest-imf-brics', async (_req: Request): Promise<IngestResult> => {
    return { ok: true, counts: { upserted: 0, skipped: 0 }, meta: { note: 'Disabled: source was fabricated. See migration 20260801000004.' } };
});
