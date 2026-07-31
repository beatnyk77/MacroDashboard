/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { serveIngest, IngestResult } from '../_shared/handler.ts';

// This function previously wrote hardcoded "mock" current-account-%-GDP
// values for India/China/Brazil/Turkey, restamped as live data. Removed
// 2026-08-01 per the project's "no fabricated data" rule — CA_GDP_PCT_IN/
// CN/BR/TR are deactivated in migration 20260801000004 until a real IMF/
// World Bank data source is integrated (tracked as a follow-up).
serveIngest('ingest-imf-current-account', async (_req: Request): Promise<IngestResult> => {
    return { ok: true, counts: { upserted: 0, skipped: 4 }, meta: { note: 'Disabled: source was fabricated. See migration 20260801000004.' } };
});
