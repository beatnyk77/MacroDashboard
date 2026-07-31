/**
 * Unit tests for ingest-fred zero-observation failure handling.
 *
 * vitest.config.ts include is limited to `supabase/functions/_shared/__tests__/**`.
 * Run with an explicit path (may still work depending on Vitest version):
 *   npx vitest run supabase/functions/ingest-fred/index.test.ts
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

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

vi.mock('../_shared/logging.ts', () => ({
  logIngestionStart: mockLogIngestionStart,
  logIngestionEnd: mockLogIngestionEnd,
}));

vi.mock('../_shared/job-runner.ts', () => ({
  runWithRetry: mockRunWithRetry,
}));

const metricsUpdateEq = vi.fn().mockResolvedValue({ error: null });
const metricsUpdate = vi.fn().mockReturnValue({ eq: metricsUpdateEq });
const observationsUpsert = vi.fn().mockResolvedValue({ error: null });

type MetricRow = {
  id: string;
  metadata: Record<string, unknown>;
  updated_at: string | null;
};

function makeSupabaseMock(metrics: MetricRow[]) {
  const metricsListQuery: Record<string, unknown> = {};
  metricsListQuery.select = vi.fn(() => metricsListQuery);
  metricsListQuery.eq = vi.fn(() => metricsListQuery);
  metricsListQuery.order = vi.fn(() => metricsListQuery);
  metricsListQuery.then = (
    onFulfilled: (v: unknown) => unknown,
    onRejected?: (e: unknown) => unknown,
  ) =>
    Promise.resolve({ data: metrics, error: null }).then(onFulfilled, onRejected);

  const dataSourcesQuery: Record<string, unknown> = {};
  dataSourcesQuery.select = vi.fn(() => dataSourcesQuery);
  dataSourcesQuery.eq = vi.fn(() => dataSourcesQuery);
  dataSourcesQuery.single = vi.fn().mockResolvedValue({
    data: { id: 'src-fred' },
    error: null,
  });

  const fromSpy = vi.fn().mockImplementation((table: string) => {
    if (table === 'data_sources') return dataSourcesQuery;
    if (table === 'metrics') {
      return {
        select: metricsListQuery.select,
        update: metricsUpdate,
      };
    }
    if (table === 'metric_observations') {
      return { upsert: observationsUpsert };
    }
    return {};
  });

  return { from: fromSpy };
}

beforeAll(() => {
  (globalThis as Record<string, unknown>).Deno = {
    serve: vi.fn(),
    env: { get: mockDenoEnvGet },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  metricsUpdate.mockReturnValue({ eq: metricsUpdateEq });
  metricsUpdateEq.mockResolvedValue({ error: null });
  observationsUpsert.mockResolvedValue({ error: null });
  mockDenoEnvGet.mockReturnValue(undefined);
  (globalThis as Record<string, unknown>).Deno = {
    serve: vi.fn(),
    env: { get: mockDenoEnvGet },
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('doIngestFred — zero observations', () => {
  it('does not bump metrics.updated_at and reports soft failure when FRED returns empty observations', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ observations: [] }),
      text: async () => '',
    });
    vi.stubGlobal('fetch', fetchMock);

    const { doIngestFred } = await import('./index.ts');

    const supabase = makeSupabaseMock([
      {
        id: 'DEAD_SERIES',
        metadata: { fred_id: 'DEADSERIES' },
        updated_at: '2020-01-01T00:00:00.000Z',
      },
    ]);

    const result = await doIngestFred(supabase, 'test-fred-key');

    expect(metricsUpdate).not.toHaveBeenCalled();
    expect(observationsUpsert).not.toHaveBeenCalled();
    expect(result.meta?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metric: 'DEAD_SERIES',
          error: 'FRED returned zero observations',
        }),
      ]),
    );
    expect(result.meta?.successful).toBe(0);
    expect(result.counts?.upserted).toBe(0);
  });

  it('bumps updated_at when FRED returns parseable observations', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        observations: [{ date: '2024-06-01', value: '1.23' }],
      }),
      text: async () => '',
    });
    vi.stubGlobal('fetch', fetchMock);

    const { doIngestFred } = await import('./index.ts');

    const supabase = makeSupabaseMock([
      {
        id: 'LIVE_SERIES',
        metadata: { fred_id: 'LIVESERIES' },
        updated_at: '2020-01-01T00:00:00.000Z',
      },
    ]);

    const result = await doIngestFred(supabase, 'test-fred-key');

    expect(observationsUpsert).toHaveBeenCalled();
    expect(metricsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ updated_at: expect.any(String) }),
    );
    expect(metricsUpdateEq).toHaveBeenCalledWith('id', 'LIVE_SERIES');
    expect(result.meta?.successful).toBe(1);
    expect(result.counts?.upserted).toBe(1);
  });
});
