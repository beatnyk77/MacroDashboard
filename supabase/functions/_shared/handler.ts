/*
 * handler.ts — serveIngest() unified ingest harness.
 *
 * Every ingest Edge Function becomes a thin config wrapper around this. The harness
 * owns: CORS preflight, optional cron-secret auth, ingestion_logs lifecycle, retry
 * orchestration via runWithRetry, and the stable HTTP response contract below.
 *
 * Response body contract (stable — parsed by admin dashboard and system-health pages):
 *   success: { ok: true, counts?: Record<string, number>, meta?: Record<string, unknown> }
 *   failure: { ok: false, error: string }
 */

import { createClient } from '@supabase/supabase-js';
import { logIngestionStart, logIngestionEnd } from './logging.ts';
import { runWithRetry } from './job-runner.ts';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface IngestResult {
  ok: boolean;
  /** e.g. { upserted: 42, skipped: 3 } — surfaced directly in the success body */
  counts?: Record<string, number>;
  /** populated only on ok: false; becomes the error field in the 500 body */
  error?: string;
  /** arbitrary metadata forwarded unchanged in the success body */
  meta?: Record<string, unknown>;
}

// ─── Internal constants ───────────────────────────────────────────────────────

// Matches the CORS headers used in all existing Edge Functions — do not change.
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

// ─── serveIngest ──────────────────────────────────────────────────────────────

/**
 * Registers a Deno.serve handler that wraps the supplied jobFn with:
 *  1. CORS preflight
 *  2. Optional cron-secret auth (enabled when CRON_SECRET env var is set)
 *  3. Ingestion log lifecycle (start → success/failed)
 *  4. Retry orchestration via runWithRetry
 *  5. Stable { ok, counts?, error? } HTTP contract
 *
 * The freshness/updated_at bump on the metrics table is intentionally NOT
 * performed here — only individual jobFns that successfully upsert data
 * should bump freshness.
 */
export function serveIngest(
  name: string,
  jobFn: (req: Request) => Promise<IngestResult>,
  opts?: {
    /** Per-attempt wall-clock timeout passed to runWithRetry. Default: 45 min. */
    timeoutMs?: number;
    /** Total attempts (first try + retries) passed to runWithRetry. Default: 3. */
    retries?: number;
    /**
     * Reserved: future hook for callers that need to force-enable auth even
     * without a CRON_SECRET env var. Currently the env var is the sole control.
     */
    requireCronSecret?: boolean;
  },
): void {
  // Access Deno through globalThis so this file can be imported in Node/Vitest tests
  // (where `Deno` is mocked) without triggering "Deno is not defined" at module load.
  const deno = (globalThis as any).Deno as typeof Deno;

  deno.serve(async (req: Request): Promise<Response> => {
    // ── 1. CORS preflight ────────────────────────────────────────────────────
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: CORS_HEADERS });
    }

    // ── 2. Cron auth — non-breaking rollout ──────────────────────────────────
    // Guard is skipped entirely when CRON_SECRET is not set in the environment,
    // so the secret can be wired up in cron definitions (Task 1.4) before the
    // env var is deployed — zero breakage for existing unprotected invocations.
    const cronSecret = deno.env.get('CRON_SECRET');
    if (cronSecret) {
      const provided = req.headers.get('x-cron-secret');
      if (provided !== cronSecret) {
        console.warn(`[${name}] 401 Unauthorized: x-cron-secret mismatch`);
        return new Response(
          JSON.stringify({ ok: false, error: 'Unauthorized' }),
          { status: 401, headers: JSON_HEADERS },
        );
      }
    }

    // ── 3. Bootstrap Supabase client + log start ─────────────────────────────
    const supabase = createClient(
      deno.env.get('SUPABASE_URL') ?? '',
      deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const logId = await logIngestionStart(supabase, name);
    const startMs = Date.now();

    // ── 4. Execute through runWithRetry ──────────────────────────────────────
    // { ok: false } returns are converted to throws so the retry logic fires
    // for both thrown errors and soft failures.
    const jobResult = await runWithRetry<IngestResult>(
      name,
      async () => {
        const r = await jobFn(req);
        if (!r.ok) throw new Error(r.error ?? 'Job returned ok: false');
        return r;
      },
      {
        timeoutMs: opts?.timeoutMs,
        maxRetries: opts?.retries,
      },
    );

    const durationMs = Date.now() - startMs;

    // ── 5. Failure path ──────────────────────────────────────────────────────
    // NOTE: never bump metrics.updated_at here — only successful upserts
    // in the jobFn itself should advance freshness timestamps.
    if (!jobResult.ok) {
      const errorMsg = jobResult.error ?? 'Unknown error';
      await logIngestionEnd(supabase, logId, 'failed', {
        error_message: errorMsg,
        api_latency_ms: durationMs,
      });
      return new Response(
        JSON.stringify({ ok: false, error: errorMsg }),
        { status: 500, headers: JSON_HEADERS },
      );
    }

    // ── 6. Success path ──────────────────────────────────────────────────────
    const result = jobResult.value!;
    await logIngestionEnd(supabase, logId, 'success', {
      rows_inserted: result.counts?.upserted,
      api_latency_ms: durationMs,
    });

    return new Response(
      JSON.stringify({ ok: true, counts: result.counts, meta: result.meta }),
      { status: 200, headers: JSON_HEADERS },
    );
  });
}

// ─── Migration template (copy into supabase/functions/<name>/index.ts) ───────
//
// import { createClient } from '@supabase/supabase-js';
// import { serveIngest, type IngestResult } from '../_shared/handler.ts';
//
// async function doIngest(supabase: ReturnType<typeof createClient>): Promise<IngestResult> {
//   // 1. Fetch upstream data (use fetchWithRetry from ingest_utils.ts for HTTP)
//   // 2. Validate numerics before upsert (validateNumericData)
//   // 3. Upsert idempotently (onConflict keys — never delete-then-insert)
//   // 4. Bump metrics.updated_at ONLY on successful upsert — never in catch/finally
//   // 5. Return { ok: true, counts: { upserted: N } } or throw / { ok: false, error }
// }
//
// serveIngest('<function-name>', async (_req: Request): Promise<IngestResult> => {
//   const supabase = createClient(
//     Deno.env.get('SUPABASE_URL') ?? '',
//     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
//   );
//   return doIngest(supabase);
// }, { timeoutMs: 45 * 60 * 1000, retries: 3 });
//
// Cron header (add to net.http_post in migrations — see 20260613000000_canonical_crons.sql):
//   'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets
//                      WHERE name = 'CRON_SECRET' LIMIT 1)
// Enforcement is inert until CRON_SECRET env var is set on the function.
//
// Codemod for raw Deno.serve wrappers: npx tsx scripts/migrate-to-harness.ts [--dry-run]
