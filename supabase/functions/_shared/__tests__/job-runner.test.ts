import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runWithRetry } from '../job-runner.ts';

describe('runWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('resolves { ok: true } on first-try success', async () => {
    const jobFn = vi.fn().mockResolvedValue(42);

    const resultPromise = runWithRetry('test-job', jobFn, {
      maxRetries: 3,
      timeoutMs: 60_000,
      backoffMs: 1_000,
    });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.ok).toBe(true);
    expect(result.value).toBe(42);
    expect(result.attempts).toBe(1);
    expect(typeof result.totalMs).toBe('number');
    expect(jobFn).toHaveBeenCalledTimes(1);
  });

  it('retries on transient failure then resolves { ok: true } on second attempt', async () => {
    let calls = 0;
    const jobFn = vi.fn().mockImplementation(() => {
      calls++;
      if (calls < 2) return Promise.reject(new Error('transient'));
      return Promise.resolve('recovered');
    });

    const resultPromise = runWithRetry('test-job', jobFn, {
      maxRetries: 3,
      timeoutMs: 60_000,
      backoffMs: 1_000,
    });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.ok).toBe(true);
    expect(result.value).toBe('recovered');
    expect(result.attempts).toBe(2);
    expect(jobFn).toHaveBeenCalledTimes(2);
  });

  it('returns { ok: false, error } after exhausting all retries — never throws', async () => {
    const jobFn = vi.fn().mockRejectedValue(new Error('always fails'));

    const resultPromise = runWithRetry('test-job', jobFn, {
      maxRetries: 3,
      timeoutMs: 60_000,
      backoffMs: 100,
    });
    await vi.runAllTimersAsync();

    // Must resolve, not reject — the never-throws contract
    const result = await resultPromise;

    expect(result.ok).toBe(false);
    expect(result.error).toBe('always fails');
    expect(result.attempts).toBe(3);
    expect(jobFn).toHaveBeenCalledTimes(3);
  });

  it('cuts off a jobFn that never resolves and returns { ok: false } with timeout message', async () => {
    const jobFn = vi.fn().mockImplementation(() => new Promise(() => {})); // never resolves

    const resultPromise = runWithRetry('test-job', jobFn, {
      maxRetries: 1,
      timeoutMs: 5_000,
      backoffMs: 100,
    });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/timed out/i);
  });

  it('uses exponential backoff: base delay doubles on each subsequent retry', async () => {
    const sleepSpy = vi.spyOn(globalThis, 'setTimeout');
    const jobFn = vi.fn().mockRejectedValue(new Error('fail'));

    const resultPromise = runWithRetry('test-job', jobFn, {
      maxRetries: 3,
      timeoutMs: 60_000,
      backoffMs: 1_000,
    });
    await vi.runAllTimersAsync();
    await resultPromise;

    // setTimeout is called for: timeouts (one per attempt) + sleeps (between failed attempts)
    // Backoff sleeps: attempt1→wait 1000ms, attempt2→wait 2000ms (backoffMs * 2^(attempt-1))
    const delays = sleepSpy.mock.calls.map(([, ms]) => ms as number);
    const backoffDelays = delays.filter(d => d !== undefined && d >= 1_000 && d <= 60_000);
    // First backoff is 1000ms (backoffMs * 2^0), second is 2000ms (backoffMs * 2^1)
    expect(backoffDelays).toContain(1_000);
    expect(backoffDelays).toContain(2_000);
  });
});
