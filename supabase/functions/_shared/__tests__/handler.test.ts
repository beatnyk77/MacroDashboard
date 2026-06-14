import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import type { IngestResult } from '../handler.ts';

// ─── Hoisted mock factories — must precede all imports ───────────────────────

const { mockLogIngestionStart, mockLogIngestionEnd, mockRunWithRetry, mockDenoEnvGet } =
  vi.hoisted(() => ({
    mockLogIngestionStart: vi.fn<unknown[], Promise<number | null>>(),
    mockLogIngestionEnd: vi.fn<unknown[], Promise<void>>(),
    mockRunWithRetry: vi.fn(),
    mockDenoEnvGet: vi.fn<[string], string | undefined>(),
  }));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({})),
}));

vi.mock('../logging.ts', () => ({
  logIngestionStart: mockLogIngestionStart,
  logIngestionEnd: mockLogIngestionEnd,
}));

vi.mock('../job-runner.ts', () => ({
  runWithRetry: mockRunWithRetry,
}));

// ─── Module under test ───────────────────────────────────────────────────────

import { serveIngest } from '../handler.ts';

// ─── Deno global stub ────────────────────────────────────────────────────────

const capturedHandlers: Array<(req: Request) => Promise<Response>> = [];

beforeAll(() => {
  (globalThis as Record<string, unknown>).Deno = {
    serve: vi.fn((handler: (req: Request) => Promise<Response>) => {
      capturedHandlers.push(handler);
    }),
    env: { get: mockDenoEnvGet },
  };
});

// ─── Shared test helpers ──────────────────────────────────────────────────────

function makeRequest(method = 'POST', headers: Record<string, string> = {}): Request {
  return new Request('https://test.supabase.co/functions/v1/test-job', { method, headers });
}

/**
 * Register a serveIngest handler and return the inner async function that
 * Deno.serve receives — allowing us to call it directly in tests.
 */
function buildHandler(
  jobFn: (req: Request) => Promise<IngestResult>,
  opts?: Parameters<typeof serveIngest>[2],
): (req: Request) => Promise<Response> {
  capturedHandlers.length = 0;
  serveIngest('test-job', jobFn, opts);
  if (capturedHandlers.length !== 1) throw new Error('Expected exactly one handler captured');
  return capturedHandlers[0];
}

// ─── Default mock behavior ───────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  // logIngestionStart returns a stable log id
  mockLogIngestionStart.mockResolvedValue(42);
  mockLogIngestionEnd.mockResolvedValue(undefined);

  // CRON_SECRET is unset by default
  mockDenoEnvGet.mockReturnValue(undefined);

  // runWithRetry default: call the wrapped fn once, propagate result or error
  mockRunWithRetry.mockImplementation(
    async (_name: string, wrappedFn: () => Promise<IngestResult>) => {
      try {
        const value = await wrappedFn();
        return { ok: true, value, attempts: 1, totalMs: 0 };
      } catch (e: unknown) {
        return { ok: false, error: (e as Error).message, attempts: 1, totalMs: 0 };
      }
    },
  );

  // Re-stub Deno.serve to reset captured handlers on each test
  (globalThis as Record<string, unknown>).Deno = {
    serve: vi.fn((handler: (req: Request) => Promise<Response>) => {
      capturedHandlers.push(handler);
    }),
    env: { get: mockDenoEnvGet },
  };
});

afterEach(() => {
  capturedHandlers.length = 0;
});

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('serveIngest', () => {
  // ── CORS preflight ─────────────────────────────────────────────────────────

  it('OPTIONS request → CORS preflight response with Access-Control-Allow-Origin: *', async () => {
    const handler = buildHandler(vi.fn());
    const resp = await handler(makeRequest('OPTIONS'));

    expect(resp.status).toBe(200);
    expect(resp.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(resp.headers.get('Access-Control-Allow-Headers')).toContain('authorization');
  });

  it('OPTIONS request → does NOT invoke jobFn or log anything', async () => {
    const jobFn = vi.fn();
    const handler = buildHandler(jobFn);
    await handler(makeRequest('OPTIONS'));

    expect(jobFn).not.toHaveBeenCalled();
    expect(mockLogIngestionStart).not.toHaveBeenCalled();
  });

  // ── Success path ───────────────────────────────────────────────────────────

  it('success → 200 with { ok: true, counts }', async () => {
    const jobFn = vi.fn().mockResolvedValue({
      ok: true,
      counts: { upserted: 42, skipped: 3 },
    } satisfies IngestResult);

    const handler = buildHandler(jobFn);
    const resp = await handler(makeRequest());

    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.ok).toBe(true);
    expect(body.counts).toEqual({ upserted: 42, skipped: 3 });
  });

  it('success → logIngestionEnd called with status "success"', async () => {
    const jobFn = vi.fn().mockResolvedValue({ ok: true } satisfies IngestResult);
    const handler = buildHandler(jobFn);
    await handler(makeRequest());

    expect(mockLogIngestionEnd).toHaveBeenCalledWith(
      expect.anything(),
      42, // logId returned by mockLogIngestionStart
      'success',
      expect.any(Object),
    );
  });

  // ── Failure: jobFn throws ──────────────────────────────────────────────────

  it('jobFn throws → 500 with { ok: false, error }', async () => {
    const jobFn = vi.fn().mockRejectedValue(new Error('network timeout'));
    const handler = buildHandler(jobFn);

    const resp = await handler(makeRequest());

    expect(resp.status).toBe(500);
    const body = await resp.json();
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/network timeout/i);
  });

  it('jobFn throws → failure log row written (assert mockLogIngestionEnd called)', async () => {
    const jobFn = vi.fn().mockRejectedValue(new Error('upstream 503'));
    const handler = buildHandler(jobFn);
    await handler(makeRequest());

    expect(mockLogIngestionEnd).toHaveBeenCalledWith(
      expect.anything(),
      42,
      'failed',
      expect.objectContaining({ error_message: expect.stringContaining('upstream 503') }),
    );
  });

  // ── Failure: jobFn returns { ok: false } ──────────────────────────────────

  it('jobFn returns { ok: false } → 500 with { ok: false }', async () => {
    const jobFn = vi.fn().mockResolvedValue({
      ok: false,
      error: 'no data available',
    } satisfies IngestResult);

    const handler = buildHandler(jobFn);
    const resp = await handler(makeRequest());

    expect(resp.status).toBe(500);
    const body = await resp.json();
    expect(body.ok).toBe(false);
  });

  it('jobFn returns { ok: false } → failure log written', async () => {
    const jobFn = vi.fn().mockResolvedValue({
      ok: false,
      error: 'no data available',
    } satisfies IngestResult);

    const handler = buildHandler(jobFn);
    await handler(makeRequest());

    expect(mockLogIngestionEnd).toHaveBeenCalledWith(
      expect.anything(),
      42,
      'failed',
      expect.objectContaining({ error_message: expect.stringContaining('no data available') }),
    );
  });

  // ── Cron auth: CRON_SECRET set ────────────────────────────────────────────

  it('CRON_SECRET set + wrong x-cron-secret → 401', async () => {
    mockDenoEnvGet.mockImplementation((key: string) => {
      if (key === 'CRON_SECRET') return 'real-secret';
      return undefined;
    });
    (globalThis as Record<string, unknown>).Deno = {
      serve: vi.fn((handler: (req: Request) => Promise<Response>) => {
        capturedHandlers.push(handler);
      }),
      env: { get: mockDenoEnvGet },
    };

    const handler = buildHandler(vi.fn());
    const resp = await handler(makeRequest('POST', { 'x-cron-secret': 'wrong-secret' }));

    expect(resp.status).toBe(401);
    const body = await resp.json();
    expect(body.ok).toBe(false);
  });

  it('CRON_SECRET set + missing x-cron-secret header → 401', async () => {
    mockDenoEnvGet.mockImplementation((key: string) =>
      key === 'CRON_SECRET' ? 'real-secret' : undefined,
    );
    (globalThis as Record<string, unknown>).Deno = {
      serve: vi.fn((handler: (req: Request) => Promise<Response>) => {
        capturedHandlers.push(handler);
      }),
      env: { get: mockDenoEnvGet },
    };

    const handler = buildHandler(vi.fn());
    const resp = await handler(makeRequest('POST')); // no x-cron-secret

    expect(resp.status).toBe(401);
  });

  it('CRON_SECRET set + correct x-cron-secret → passes through to jobFn', async () => {
    mockDenoEnvGet.mockImplementation((key: string) => {
      if (key === 'CRON_SECRET') return 'real-secret';
      return undefined;
    });
    (globalThis as Record<string, unknown>).Deno = {
      serve: vi.fn((handler: (req: Request) => Promise<Response>) => {
        capturedHandlers.push(handler);
      }),
      env: { get: mockDenoEnvGet },
    };

    const jobFn = vi.fn().mockResolvedValue({ ok: true } satisfies IngestResult);
    const handler = buildHandler(jobFn);
    const resp = await handler(makeRequest('POST', { 'x-cron-secret': 'real-secret' }));

    expect(resp.status).toBe(200);
    expect(jobFn).toHaveBeenCalled();
  });

  // ── Cron auth: CRON_SECRET unset ──────────────────────────────────────────

  it('CRON_SECRET unset → no auth check, jobFn called regardless of headers', async () => {
    // mockDenoEnvGet returns undefined by default (from beforeEach)

    const jobFn = vi.fn().mockResolvedValue({ ok: true } satisfies IngestResult);
    const handler = buildHandler(jobFn);
    const resp = await handler(makeRequest('POST')); // no x-cron-secret header

    expect(resp.status).toBe(200);
    expect(jobFn).toHaveBeenCalled();
  });

  // ── Logging contract ──────────────────────────────────────────────────────

  it('logIngestionStart is called with the function name before jobFn executes', async () => {
    const callOrder: string[] = [];
    mockLogIngestionStart.mockImplementation(async () => {
      callOrder.push('logStart');
      return 42;
    });
    const jobFn = vi.fn().mockImplementation(async () => {
      callOrder.push('jobFn');
      return { ok: true } as IngestResult;
    });

    const handler = buildHandler(jobFn);
    await handler(makeRequest());

    expect(mockLogIngestionStart).toHaveBeenCalledWith(
      expect.anything(), // supabase client
      'test-job',
    );
    expect(callOrder.indexOf('logStart')).toBeLessThan(callOrder.indexOf('jobFn'));
  });
});
