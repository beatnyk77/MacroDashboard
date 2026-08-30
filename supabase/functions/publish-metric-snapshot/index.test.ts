if (typeof (globalThis as Record<string, unknown>).Deno === 'undefined') {
  (globalThis as Record<string, unknown>).Deno = {
    serve: () => undefined,
    test: (_name: string, _fn: () => Promise<void> | void) => undefined,
    env: { get: (_key: string) => undefined },
  };
}

const { publishMetricSnapshot } = await import('./index.ts');
const denoTest = (globalThis as { Deno: { test(name: string, fn: () => Promise<void> | void): void } }).Deno.test;

function assertEquals(actual: unknown, expected: unknown): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`Expected ${right}, received ${left}`);
  }
}

function assertExists(value: unknown): void {
  if (value === null || value === undefined) {
    throw new Error('Expected value to exist.');
  }
}

async function assertRejects(
  fn: () => Promise<unknown>,
  errorClass: { new (message?: string): Error },
  message: string,
): Promise<void> {
  let thrown: unknown = null;
  try {
    await fn();
  } catch (error) {
    thrown = error;
  }

  if (!(thrown instanceof errorClass)) {
    throw new Error(`Expected ${errorClass.name} to be thrown.`);
  }
  if (!String((thrown as Error).message).includes(message)) {
    throw new Error(`Expected error message to include "${message}", received "${(thrown as Error).message}".`);
  }
}

type MockState = {
  latestMetric: Record<string, unknown> | null;
  latestObservation: Record<string, unknown> | null;
  currentSnapshot: Record<string, unknown> | null;
  idempotentSnapshot: Record<string, unknown> | null;
  inserted: Record<string, unknown>[];
  errors: Record<string, unknown>[];
};

function createRepository(state: MockState) {
  let nextSnapshotId = 1;

  return {
    async getLatestMetric() {
      return state.latestMetric as any;
    },
    async getLatestObservation() {
      return state.latestObservation as any;
    },
    async getCurrentSnapshot() {
      return state.currentSnapshot as any;
    },
    async findSnapshotByIdempotency() {
      return state.idempotentSnapshot as any;
    },
    async insertSnapshot(row: Record<string, unknown>) {
      const snapshot_id = `snapshot-${nextSnapshotId++}`;
      state.inserted.push({ snapshot_id, ...row });
      return {
        snapshot_id,
        data_status: row.data_status,
      } as any;
    },
    async insertOperationalError(row: Record<string, unknown>) {
      state.errors.push(row);
    },
  };
}

function baseState(overrides: Partial<MockState> = {}): MockState {
  return {
    latestMetric: {
      metric_id: 'net-liquidity',
      metric_name: 'Net Liquidity',
      unit: 'usd_bn',
      native_frequency: 'weekly',
      as_of_date: '2026-08-30T00:00:00.000Z',
      value: 123.45,
      staleness_flag: 'fresh',
      source_name: 'Federal Reserve',
      source_ref: 'live_api:fred:WALCL',
      is_provisional: false,
    },
    latestObservation: {
      metric_id: 'net-liquidity',
      as_of_date: '2026-08-30T00:00:00.000Z',
      value: 123.45,
      source_ref: 'live_api:fred:WALCL',
      is_provisional: false,
      last_updated_at: '2026-08-30T01:00:00.000Z',
      provenance: 'api_live',
      metadata: {
        source_name: 'Federal Reserve',
        source_hash: 'fred-payload-1',
        source_url: 'https://fred.stlouisfed.org/series/WALCL',
        native_frequency: 'weekly',
        retrieved_at: '2026-08-30T01:00:00.000Z',
      },
    },
    currentSnapshot: null,
    idempotentSnapshot: null,
    inserted: [],
    errors: [],
    ...overrides,
  };
}

denoTest('publishes a verified snapshot with source, freshness, methodology, and correction fields', async () => {
  const state = baseState();
  const repository = createRepository(state);

  const result = await publishMetricSnapshot({
    metricId: 'net-liquidity',
    slug: 'net-liquidity',
    methodologyVersion: '1.0.0',
  }, repository as any);

  assertEquals(result.status, 'verified');
  assertEquals(state.inserted.length, 1);
  const inserted = state.inserted[0];
  assertEquals(inserted.data_status, 'verified');
  assertExists(inserted.source_snapshot_hash);
  const payload = inserted.payload as Record<string, unknown>;
  assertEquals(payload.metric_id, 'net-liquidity');
  assertEquals(payload.staleness_flag, 'fresh');
  assertEquals((payload.methodology as Record<string, unknown>).version, '1.0.0');
  assertEquals((payload.correction as Record<string, unknown>).kind, null);
  assertExists((payload.publication as Record<string, unknown>).payload_hash);
});

denoTest('publishes provisional snapshots without promoting them to verified', async () => {
  const state = baseState({
    latestMetric: {
      ...baseState().latestMetric!,
      is_provisional: true,
    },
    latestObservation: {
      ...baseState().latestObservation!,
      is_provisional: true,
    },
  });
  const repository = createRepository(state);

  const result = await publishMetricSnapshot({
    metricId: 'net-liquidity',
    slug: 'net-liquidity',
    methodologyVersion: '1.0.0',
  }, repository as any);

  assertEquals(result.status, 'provisional');
  assertEquals(state.inserted[0].data_status, 'provisional');
});

denoTest('publishes stale very-lagged inputs as unavailable without fabricating a value', async () => {
  const state = baseState({
    latestMetric: {
      ...baseState().latestMetric!,
      staleness_flag: 'very_lagged',
    },
  });
  const repository = createRepository(state);

  const result = await publishMetricSnapshot({
    metricId: 'net-liquidity',
    slug: 'net-liquidity',
    methodologyVersion: '1.0.0',
  }, repository as any);

  assertEquals(result.status, 'unavailable');
  const payload = state.inserted[0].payload as Record<string, unknown>;
  assertEquals(payload.value, null);
  assertEquals((payload.correction as Record<string, unknown>).kind, 'unavailable');
});

denoTest('publishes explicit unavailable snapshots when no verified observation exists', async () => {
  const state = baseState({
    latestMetric: null,
    latestObservation: null,
  });
  const repository = createRepository(state);

  const result = await publishMetricSnapshot({
    metricId: 'net-liquidity',
    slug: 'net-liquidity',
    methodologyVersion: '1.0.0',
  }, repository as any);

  assertEquals(result.status, 'unavailable');
  const payload = state.inserted[0].payload as Record<string, unknown>;
  assertEquals(payload.value, null);
  assertEquals(payload.observed_at, null);
});

denoTest('publishes revised snapshots when the verified source snapshot changes', async () => {
  const state = baseState({
    currentSnapshot: {
      snapshot_id: 'snapshot-current',
      data_status: 'verified',
      observed_at: '2026-08-23T00:00:00.000Z',
      published_at: '2026-08-23T06:00:00.000Z',
      methodology_version: '1.0.0',
      source_snapshot_hash: 'previous-source-hash',
      payload: { value: 100 },
    },
  });
  const repository = createRepository(state);

  const result = await publishMetricSnapshot({
    metricId: 'net-liquidity',
    slug: 'net-liquidity',
    methodologyVersion: '1.0.0',
  }, repository as any);

  assertEquals(result.status, 'revised');
  assertEquals(state.inserted[0].revision_of, 'snapshot-current');
});

denoTest('publishes corrected snapshots when a current snapshot is explicitly corrected', async () => {
  const state = baseState({
    currentSnapshot: {
      snapshot_id: 'snapshot-current',
      data_status: 'verified',
      observed_at: '2026-08-30T00:00:00.000Z',
      published_at: '2026-08-30T06:00:00.000Z',
      methodology_version: '1.0.0',
      source_snapshot_hash: 'existing-hash',
      payload: { value: 123.45 },
    },
  });
  const repository = createRepository(state);

  const result = await publishMetricSnapshot({
    metricId: 'net-liquidity',
    slug: 'net-liquidity',
    methodologyVersion: '1.0.0',
    correction: {
      kind: 'corrected',
      reason: 'Corrected source citation URL.',
    },
  }, repository as any);

  assertEquals(result.status, 'corrected');
  assertEquals(state.inserted[0].revision_of, 'snapshot-current');
  const payload = state.inserted[0].payload as Record<string, unknown>;
  assertEquals((payload.correction as Record<string, unknown>).reason, 'Corrected source citation URL.');
});

denoTest('returns the existing snapshot for an idempotent publish request', async () => {
  const state = baseState({
    idempotentSnapshot: {
      snapshot_id: 'snapshot-existing',
      data_status: 'verified',
      observed_at: '2026-08-30T00:00:00.000Z',
      published_at: '2026-08-30T06:00:00.000Z',
      methodology_version: '1.0.0',
      source_snapshot_hash: 'same-hash',
      payload: {},
    },
  });
  const repository = createRepository(state);

  const result = await publishMetricSnapshot({
    metricId: 'net-liquidity',
    slug: 'net-liquidity',
    methodologyVersion: '1.0.0',
  }, repository as any);

  assertEquals(result, {
    snapshotId: 'snapshot-existing',
    status: 'verified',
  });
  assertEquals(state.inserted.length, 0);
});

denoTest('rejects invalid publication input, keeps the previous verified snapshot current, and records an operational error', async () => {
  const state = baseState({
    latestMetric: {
      ...baseState().latestMetric!,
      source_name: null,
      source_ref: null,
    },
    latestObservation: {
      ...baseState().latestObservation!,
      source_ref: null,
      metadata: {
        native_frequency: 'weekly',
      },
    },
    currentSnapshot: {
      snapshot_id: 'snapshot-current',
      data_status: 'verified',
      observed_at: '2026-08-23T00:00:00.000Z',
      published_at: '2026-08-23T06:00:00.000Z',
      methodology_version: '1.0.0',
      source_snapshot_hash: 'previous-source-hash',
      payload: { value: 100 },
    },
  });
  const repository = createRepository(state);

  await assertRejects(
    () => publishMetricSnapshot({
      metricId: 'net-liquidity',
      slug: 'net-liquidity',
      methodologyVersion: '1.0.0',
    }, repository as any),
    Error,
    'Current observation is missing source_name.',
  );

  assertEquals(state.inserted.length, 0);
  assertEquals(state.currentSnapshot?.snapshot_id, 'snapshot-current');
  assertEquals(state.errors.length, 1);
  assertEquals(state.errors[0].functionName, 'publish-metric-snapshot');
});
