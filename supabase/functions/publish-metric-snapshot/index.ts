import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { serveIngest, type IngestResult } from '../_shared/handler.ts';

type AuthorityMetricStatus =
  | 'verified'
  | 'provisional'
  | 'revised'
  | 'corrected'
  | 'unavailable'
  | 'superseded';

type AuthorityMetricStalenessFlag = 'fresh' | 'lagged' | 'very_lagged';

interface LatestMetricRow {
  metric_id: string;
  metric_name: string | null;
  unit: string | null;
  native_frequency: string | null;
  as_of_date: string | null;
  value: number | null;
  staleness_flag: AuthorityMetricStalenessFlag | null;
  source_name: string | null;
  source_ref: string | null;
  is_provisional: boolean | null;
}

interface ObservationRow {
  metric_id: string;
  as_of_date: string | null;
  value: number | null;
  source_ref: string | null;
  is_provisional: boolean | null;
  last_updated_at: string | null;
  provenance: string | null;
  metadata: Record<string, unknown> | null;
}

interface ExistingSnapshotRow {
  snapshot_id: string;
  data_status: AuthorityMetricStatus;
  observed_at: string | null;
  published_at: string;
  methodology_version: string;
  source_snapshot_hash: string | null;
  payload: Record<string, unknown> | null;
}

interface SnapshotInsertRow {
  metric_id: string;
  slug: string;
  payload: Record<string, unknown>;
  observed_at: string | null;
  published_at: string;
  methodology_version: string;
  source_snapshot_hash: string | null;
  data_status: Exclude<AuthorityMetricStatus, 'superseded'>;
  revision_of: string | null;
}

interface OperationalErrorRow {
  functionName: string;
  errorMessage: string;
  metadata: Record<string, unknown>;
  publishedAt: string;
}

export interface PublishMetricSnapshotInput {
  metricId: string;
  slug: string;
  methodologyVersion: string;
  label?: string;
  unit?: string;
  publishedAt?: string;
  correction?: {
    kind: 'corrected';
    reason: string;
  };
}

export interface PublishMetricSnapshotResult {
  snapshotId: string;
  status: Exclude<AuthorityMetricStatus, 'superseded'>;
}

export interface PublicationRepository {
  getLatestMetric(metricId: string): Promise<LatestMetricRow | null>;
  getLatestObservation(metricId: string): Promise<ObservationRow | null>;
  getCurrentSnapshot(metricId: string): Promise<ExistingSnapshotRow | null>;
  findSnapshotByIdempotency(args: {
    metricId: string;
    observedAt: string | null;
    methodologyVersion: string;
    sourceSnapshotHash: string | null;
  }): Promise<ExistingSnapshotRow | null>;
  insertSnapshot(row: SnapshotInsertRow): Promise<{
    snapshot_id: string;
    data_status: Exclude<AuthorityMetricStatus, 'superseded'>;
  }>;
  insertOperationalError(row: OperationalErrorRow): Promise<void>;
}

interface PublicationSource {
  source_name: string | null;
  source_ref: string | null;
  source_url: string | null;
  retrieved_at: string | null;
  raw_source_hash: string | null;
  source_snapshot_hash: string | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function normalizeValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value)) return value.map((item) => normalizeValue(item));

  if (typeof value === 'object') {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(input).sort()) {
      output[key] = normalizeValue(input[key]);
    }
    return output;
  }

  return value;
}

async function sha256Hex(value: unknown): Promise<string> {
  const payload = JSON.stringify(normalizeValue(value));
  const bytes = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((part) => part.toString(16).padStart(2, '0'))
    .join('');
}

function buildUnavailableReason(
  latestMetric: LatestMetricRow | null,
  latestObservation: ObservationRow | null,
): string {
  if (!latestMetric || !latestObservation) return 'No verified observation is available for publication.';
  if (latestMetric.value === null || latestObservation.value === null) return 'Latest observation has no published numeric value.';
  if (latestMetric.staleness_flag === 'very_lagged') return 'Latest verified observation is outside the allowed freshness window.';
  return 'Latest observation could not satisfy the authority publication rules.';
}

function buildSourceDescriptor(
  latestMetric: LatestMetricRow | null,
  latestObservation: ObservationRow | null,
): PublicationSource {
  const metadata = asRecord(latestObservation?.metadata);
  const sourceName = asString(metadata?.source_name) ?? latestMetric?.source_name ?? null;
  const sourceRef = latestObservation?.source_ref ?? latestMetric?.source_ref ?? null;
  const sourceUrl = asString(metadata?.source_url)
    ?? asStringArray(metadata?.source_urls)[0]
    ?? null;
  const retrievedAt = asString(metadata?.retrieved_at) ?? latestObservation?.last_updated_at ?? null;
  const rawSourceHash = asString(metadata?.source_hash);

  return {
    source_name: sourceName,
    source_ref: sourceRef,
    source_url: sourceUrl,
    retrieved_at: retrievedAt,
    raw_source_hash: rawSourceHash,
    source_snapshot_hash: null,
  };
}

function requireValidPublicationInputs(args: {
  latestMetric: LatestMetricRow | null;
  latestObservation: ObservationRow | null;
  source: PublicationSource;
  status: Exclude<AuthorityMetricStatus, 'superseded'>;
  input: PublishMetricSnapshotInput;
}): string | null {
  const { latestMetric, latestObservation, source, status, input } = args;
  if (status === 'unavailable') return null;
  if (!latestMetric || !latestObservation) return 'Cannot publish a metric snapshot without a current observation.';
  if (latestMetric.as_of_date === null || latestObservation.as_of_date === null) return 'Current observation is missing observed_at.';
  if (latestMetric.value === null || latestObservation.value === null) return 'Current observation has no numeric value.';
  if (!source.source_name) return 'Current observation is missing source_name.';
  if (!source.source_ref) return 'Current observation is missing source_ref.';
  if (!input.methodologyVersion) return 'methodologyVersion is required.';
  return null;
}

async function writeOperationalError(
  repository: PublicationRepository,
  input: PublishMetricSnapshotInput,
  message: string,
  metadata: Record<string, unknown>,
  publishedAt: string,
): Promise<never> {
  await repository.insertOperationalError({
    functionName: 'publish-metric-snapshot',
    errorMessage: message,
    metadata: {
      metric_id: input.metricId,
      slug: input.slug,
      methodology_version: input.methodologyVersion,
      ...metadata,
    },
    publishedAt,
  });
  throw new Error(message);
}

function deriveStatus(args: {
  input: PublishMetricSnapshotInput;
  latestMetric: LatestMetricRow | null;
  latestObservation: ObservationRow | null;
  currentSnapshot: ExistingSnapshotRow | null;
  sourceSnapshotHash: string | null;
}): { status: Exclude<AuthorityMetricStatus, 'superseded'>; revisionOf: string | null } {
  const { input, latestMetric, latestObservation, currentSnapshot, sourceSnapshotHash } = args;

  if (input.correction?.kind === 'corrected') {
    return {
      status: 'corrected',
      revisionOf: currentSnapshot?.snapshot_id ?? null,
    };
  }

  if (!latestMetric || !latestObservation || latestMetric.value === null || latestObservation.value === null) {
    return { status: 'unavailable', revisionOf: null };
  }

  if (latestMetric.staleness_flag === 'very_lagged') {
    return { status: 'unavailable', revisionOf: null };
  }

  if (latestMetric.is_provisional === true || latestObservation.is_provisional === true) {
    return { status: 'provisional', revisionOf: null };
  }

  if (
    currentSnapshot &&
    (
      currentSnapshot.observed_at !== latestMetric.as_of_date ||
      currentSnapshot.methodology_version !== input.methodologyVersion ||
      currentSnapshot.source_snapshot_hash !== sourceSnapshotHash
    )
  ) {
    return { status: 'revised', revisionOf: currentSnapshot.snapshot_id };
  }

  return { status: 'verified', revisionOf: null };
}

function buildPayload(args: {
  input: PublishMetricSnapshotInput;
  latestMetric: LatestMetricRow | null;
  latestObservation: ObservationRow | null;
  source: PublicationSource;
  status: Exclude<AuthorityMetricStatus, 'superseded'>;
  revisionOf: string | null;
  publishedAt: string;
}): Record<string, unknown> {
  const { input, latestMetric, latestObservation, source, status, revisionOf, publishedAt } = args;
  const unavailableReason = status === 'unavailable'
    ? buildUnavailableReason(latestMetric, latestObservation)
    : null;
  const label = input.label ?? latestMetric?.metric_name ?? input.metricId;
  const unit = input.unit ?? latestMetric?.unit ?? 'value';
  const observedAt = latestMetric?.as_of_date ?? latestObservation?.as_of_date ?? null;
  const value = status === 'unavailable' ? null : latestMetric?.value ?? latestObservation?.value ?? null;

  return {
    correction: {
      kind: status === 'revised' || status === 'corrected' ? status : status === 'unavailable' ? 'unavailable' : null,
      reason: input.correction?.reason ?? unavailableReason,
      revision_of: revisionOf,
    },
    data_status: status,
    freshness: {
      is_provisional: latestMetric?.is_provisional ?? latestObservation?.is_provisional ?? null,
      last_updated_at: latestObservation?.last_updated_at ?? null,
      provenance: latestObservation?.provenance ?? null,
      staleness_flag: latestMetric?.staleness_flag ?? null,
    },
    label,
    methodology: {
      version: input.methodologyVersion,
    },
    methodology_version: input.methodologyVersion,
    metric_id: input.metricId,
    native_frequency: latestMetric?.native_frequency ?? asString(asRecord(latestObservation?.metadata)?.native_frequency),
    observed_at: observedAt,
    published_at: publishedAt,
    revision_of: revisionOf,
    slug: input.slug,
    source,
    staleness_flag: latestMetric?.staleness_flag ?? null,
    unit,
    value,
  };
}

export async function publishMetricSnapshot(
  input: PublishMetricSnapshotInput,
  repository: PublicationRepository,
): Promise<PublishMetricSnapshotResult> {
  const publishedAt = input.publishedAt ?? new Date().toISOString();
  const [latestMetric, latestObservation, currentSnapshot] = await Promise.all([
    repository.getLatestMetric(input.metricId),
    repository.getLatestObservation(input.metricId),
    repository.getCurrentSnapshot(input.metricId),
  ]);

  const source = buildSourceDescriptor(latestMetric, latestObservation);
  source.source_snapshot_hash = await sha256Hex({
    correction_kind: input.correction?.kind ?? null,
    correction_reason: input.correction?.reason ?? null,
    raw_source_hash: source.raw_source_hash,
    retrieved_at: source.retrieved_at,
    source_name: source.source_name,
    source_ref: source.source_ref,
    source_url: source.source_url,
  });

  const { status, revisionOf } = deriveStatus({
    input,
    latestMetric,
    latestObservation,
    currentSnapshot,
    sourceSnapshotHash: source.source_snapshot_hash,
  });

  if (status === 'corrected' && !revisionOf) {
    await writeOperationalError(
      repository,
      input,
      'A corrected publication requires a current snapshot to replace.',
      { requested_status: status },
      publishedAt,
    );
  }

  const validationError = requireValidPublicationInputs({
    latestMetric,
    latestObservation,
    source,
    status,
    input,
  });
  if (validationError) {
    await writeOperationalError(
      repository,
      input,
      validationError,
      {
        requested_status: status,
        current_snapshot_id: currentSnapshot?.snapshot_id ?? null,
        latest_observed_at: latestMetric?.as_of_date ?? latestObservation?.as_of_date ?? null,
        staleness_flag: latestMetric?.staleness_flag ?? null,
      },
      publishedAt,
    );
  }

  const observedAt = latestMetric?.as_of_date ?? latestObservation?.as_of_date ?? null;
  const existing = await repository.findSnapshotByIdempotency({
    metricId: input.metricId,
    observedAt,
    methodologyVersion: input.methodologyVersion,
    sourceSnapshotHash: source.source_snapshot_hash,
  });
  if (existing) {
    return {
      snapshotId: existing.snapshot_id,
      status: existing.data_status as Exclude<AuthorityMetricStatus, 'superseded'>,
    };
  }

  const basePayload = buildPayload({
    input,
    latestMetric,
    latestObservation,
    source,
    status,
    revisionOf,
    publishedAt,
  });
  const payloadHash = await sha256Hex(basePayload);
  const payload = {
    ...basePayload,
    publication: {
      payload_hash: payloadHash,
    },
  };

  const inserted = await repository.insertSnapshot({
    metric_id: input.metricId,
    slug: input.slug,
    payload,
    observed_at: observedAt,
    published_at: publishedAt,
    methodology_version: input.methodologyVersion,
    source_snapshot_hash: source.source_snapshot_hash,
    data_status: status,
    revision_of: revisionOf,
  });

  return {
    snapshotId: inserted.snapshot_id,
    status: inserted.data_status,
  };
}

function createPublicationRepository(supabase: SupabaseClient): PublicationRepository {
  return {
    async getLatestMetric(metricId) {
      const { data, error } = await supabase
        .from('vw_latest_metrics')
        .select('metric_id, metric_name, unit, native_frequency, as_of_date, value, staleness_flag, source_name, source_ref, is_provisional')
        .eq('metric_id', metricId)
        .maybeSingle();

      if (error) throw error;
      return data as LatestMetricRow | null;
    },

    async getLatestObservation(metricId) {
      const { data, error } = await supabase
        .from('metric_observations')
        .select('metric_id, as_of_date, value, source_ref, is_provisional, last_updated_at, provenance, metadata')
        .eq('metric_id', metricId)
        .order('as_of_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as ObservationRow | null) ?? null;
    },

    async getCurrentSnapshot(metricId) {
      const { data, error } = await supabase
        .from('vw_metric_publication_snapshots_public')
        .select('snapshot_id, data_status, observed_at, published_at, methodology_version, source_snapshot_hash, payload')
        .eq('metric_id', metricId)
        .eq('is_current', true)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as ExistingSnapshotRow | null) ?? null;
    },

    async findSnapshotByIdempotency(args) {
      let query = supabase
        .from('metric_publication_snapshots')
        .select('snapshot_id, data_status, observed_at, published_at, methodology_version, source_snapshot_hash, payload')
        .eq('metric_id', args.metricId)
        .eq('methodology_version', args.methodologyVersion);

      query = args.observedAt === null
        ? query.is('observed_at', null)
        : query.eq('observed_at', args.observedAt);

      query = args.sourceSnapshotHash === null
        ? query.is('source_snapshot_hash', null)
        : query.eq('source_snapshot_hash', args.sourceSnapshotHash);

      const { data, error } = await query
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as ExistingSnapshotRow | null) ?? null;
    },

    async insertSnapshot(row) {
      const { data, error } = await supabase
        .from('metric_publication_snapshots')
        .insert(row)
        .select('snapshot_id, data_status')
        .single();

      if (error) throw error;
      return data as {
        snapshot_id: string;
        data_status: Exclude<AuthorityMetricStatus, 'superseded'>;
      };
    },

    async insertOperationalError(row) {
      const { error } = await supabase
        .from('ingestion_logs')
        .insert({
          function_name: row.functionName,
          status: 'failed',
          start_time: row.publishedAt,
          completed_at: row.publishedAt,
          error_message: row.errorMessage,
          metadata: row.metadata,
        });

      if (error) throw error;
    },
  };
}

async function handlePublishMetricSnapshot(req: Request): Promise<IngestResult> {
  const body = await req.json() as PublishMetricSnapshotInput;
  const deno = (globalThis as { Deno?: { env: { get(key: string): string | undefined } } }).Deno;
  const supabase = createClient(
    deno?.env.get('SUPABASE_URL') ?? '',
    deno?.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const result = await publishMetricSnapshot(body, createPublicationRepository(supabase));
  return {
    ok: true,
    counts: { upserted: 1 },
    meta: {
      snapshotId: result.snapshotId,
      status: result.status,
    },
  };
}

serveIngest('publish-metric-snapshot', handlePublishMetricSnapshot, {
  timeoutMs: 10 * 60 * 1000,
  retries: 1,
});
