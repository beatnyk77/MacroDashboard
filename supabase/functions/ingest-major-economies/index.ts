/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { serveIngest, IngestResult } from '../_shared/handler.ts';

// This function previously wrote ~32 hardcoded macroData values (GDP/PPP/growth/
// policy rates/CPI for major economies) plus 15 hardcoded reservesData rows into
// country_reserves, restamped with new Date() as live monthly data.
// Removed 2026-08-01 per the project's "no fabricated data" / "pull until real" rule.
//
// Verified FRED redirects live in migration 20260801000005 (ingest-fred picks them
// up via metadata.fred_id). Remaining metrics without a clean single-series path
// are deactivated there. Reserves write path is gone (no free live API this pass).
serveIngest('ingest-major-economies', async (_req: Request): Promise<IngestResult> => {
    return {
        ok: true,
        counts: { upserted: 0, skipped: 0 },
        meta: { note: 'Disabled: source was fabricated. See migration 20260801000005.' },
    };
});
