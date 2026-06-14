import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry } from '../ingest_utils.ts';

// Helper: minimal Response-shaped object that fetchWithRetry inspects
function mockResponse(status: number, body = '') {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    text: vi.fn().mockResolvedValue(body),
  };
}

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns the response immediately on HTTP 200', async () => {
    const resp = mockResponse(200);
    vi.mocked(fetch).mockResolvedValue(resp as unknown as Response);

    const resultPromise = fetchWithRetry('https://example.com/api', { maxRetries: 2 });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBe(resp);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries on 5xx and eventually throws after all retries are exhausted', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(503) as unknown as Response);

    // Attach rejection handler BEFORE running timers to avoid unhandled-rejection warnings
    const assertion = expect(
      fetchWithRetry('https://example.com/api', { maxRetries: 2, timeoutMs: 60_000 }),
    ).rejects.toThrow(/HTTP 503/);

    await vi.runAllTimersAsync();
    await assertion;

    // maxRetries=2 → loop runs i=0,1,2 → 3 total fetch calls
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('retries on 5xx and returns on eventual success', async () => {
    const successResp = mockResponse(200);
    vi.mocked(fetch)
      .mockResolvedValueOnce(mockResponse(500) as unknown as Response)
      .mockResolvedValueOnce(successResp as unknown as Response);

    const resultPromise = fetchWithRetry('https://example.com/api', {
      maxRetries: 2,
      timeoutMs: 60_000,
    });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBe(successResp);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('characterization: 4xx is also retried (loop catches the thrown error and continues)', async () => {
    // The current implementation catches 4xx throws the same way as 5xx —
    // both set lastError and continue the loop. 4xx is NOT short-circuited.
    vi.mocked(fetch).mockResolvedValue(mockResponse(400, 'Bad Request') as unknown as Response);

    // Attach rejection handler first
    const assertion = expect(
      fetchWithRetry('https://example.com/api', { maxRetries: 1, timeoutMs: 60_000 }),
    ).rejects.toThrow(/HTTP 400/);

    await vi.runAllTimersAsync();
    await assertion;

    // maxRetries=1 → loop runs i=0,1 → 2 total fetch calls (both 400)
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('applies exponential backoff delay between retries', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(500) as unknown as Response);

    // Attach rejection handler first
    const assertion = expect(
      fetchWithRetry('https://example.com/api', { maxRetries: 2, timeoutMs: 60_000 }),
    ).rejects.toThrow();

    // Advance time in steps to observe delay structure:
    // i=0: no delay, fetch → 500
    // i=1: delay = 2^1 * 1000 + jitter, fetch → 500
    // i=2: delay = 2^2 * 1000 + jitter, fetch → 500
    // Advancing 10 seconds covers i=1 delay but NOT i=2
    await vi.advanceTimersByTimeAsync(3_500);
    // After 3.5s: i=0 done (no delay), i=1 delay (~2-3s) done, i=1 fetch may have run
    // At this point fetch should have been called at least twice
    const callsAt3s = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(callsAt3s).toBeGreaterThanOrEqual(2);

    // Advance remaining time to exhaust all retries
    await vi.runAllTimersAsync();
    await assertion;

    // All 3 attempts ran
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('throws with a timeout message when the request exceeds timeoutMs', async () => {
    // fetch never resolves; AbortController fires after timeoutMs
    vi.mocked(fetch).mockImplementation(
      (_url, init) =>
        new Promise((_, reject) => {
          (init as RequestInit).signal?.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
          );
        }),
    );

    const assertion = expect(
      fetchWithRetry('https://example.com/api', { maxRetries: 0, timeoutMs: 1_000 }),
    ).rejects.toThrow(/timed out/i);

    await vi.runAllTimersAsync();
    await assertion;
  });
});
