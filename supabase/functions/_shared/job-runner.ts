/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
/**
 * job-runner.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable job-level timeout + retry wrapper for all ingestion Edge Functions.
 *
 * Design goals:
 *  - Simple: one function to wrap any async job.
 *  - Safe: always resolves (never throws), so the caller can always log status.
 *  - Composable: wraps the entire job, not individual HTTP calls (those use
 *    fetchWithRetry from ingest_utils.ts for per-request resilience).
 *
 * Usage:
 *   import { runWithRetry } from '../_shared/job-runner.ts'
 *
 *   const result = await runWithRetry('ingest-fred', myJobFn, {
 *     timeoutMs:  45 * 60 * 1000,  // 45 minutes max per attempt
 *     maxRetries: 3,                // up to 3 total attempts
 *     backoffMs:  30 * 1000,        // 30s base, doubles each retry
 *   });
 *
 *   if (!result.ok) {
 *     console.error('Job failed after all retries:', result.error);
 *   }
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface JobOptions {
  /**
   * Hard wall-clock timeout for a single attempt.
   * Default: 45 minutes.
   */
  timeoutMs?: number;

  /**
   * Total number of attempts (first try + retries).
   * Default: 3.
   */
  maxRetries?: number;

  /**
   * Base delay between retries in ms. Doubles on each subsequent retry.
   * Attempt 1 fails → wait backoffMs
   * Attempt 2 fails → wait backoffMs * 2
   * Default: 30,000ms (30 seconds).
   */
  backoffMs?: number;
}

export interface JobResult<T> {
  /** true if at least one attempt succeeded */
  ok: boolean;
  /** the value returned by the job fn on success */
  value?: T;
  /** the last error message if all attempts failed */
  error?: string;
  /** which attempt succeeded (1-indexed) or total attempts made */
  attempts: number;
  /** total elapsed ms across all attempts + backoff delays */
  totalMs: number;
}

/**
 * Runs `jobFn` with per-attempt timeout and automatic exponential-backoff
 * retry. Returns a JobResult — never throws.
 *
 * @param jobName  - Label used in log messages (e.g. 'ingest-fred')
 * @param jobFn    - Async function containing the full ingestion logic
 * @param options  - Optional overrides for timeout, retries, and backoff
 */
export async function runWithRetry<T>(
  jobName: string,
  jobFn: () => Promise<T>,
  options: JobOptions = {}
): Promise<JobResult<T>> {
  const {
    timeoutMs  = 45 * 60 * 1000,   // 45 minutes
    maxRetries = 3,
    backoffMs  = 30_000,            // 30 seconds base
  } = options;

  const wallStart = Date.now();
  let lastError = 'Unknown error';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[${jobName}] Attempt ${attempt}/${maxRetries} starting…`);
    const attemptStart = Date.now();

    try {
      // Race the job against the per-attempt timeout clock
      const value = await Promise.race([
        jobFn(),
        _rejectAfter(timeoutMs, `${jobName} attempt ${attempt} timed out after ${timeoutMs / 60_000} min`),
      ]);

      const attemptMs = Date.now() - attemptStart;
      console.log(`[${jobName}] Attempt ${attempt} succeeded in ${attemptMs}ms`);

      return {
        ok: true,
        value: value as T,
        attempts: attempt,
        totalMs: Date.now() - wallStart,
      };

    } catch (err: any) {
      lastError = err?.message ?? String(err);
      const attemptMs = Date.now() - attemptStart;
      console.warn(`[${jobName}] Attempt ${attempt} failed after ${attemptMs}ms: ${lastError}`);

      // No sleep after the final attempt — we're done
      if (attempt < maxRetries) {
        const delay = backoffMs * Math.pow(2, attempt - 1);
        console.log(`[${jobName}] Retrying in ${delay / 1000}s…`);
        await _sleep(delay);
      }
    }
  }

  return {
    ok: false,
    error: lastError,
    attempts: maxRetries,
    totalMs: Date.now() - wallStart,
  };
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _rejectAfter<T>(ms: number, message: string): Promise<T> {
  return new Promise<T>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(message));
    }, ms);
  });
}

function _sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
