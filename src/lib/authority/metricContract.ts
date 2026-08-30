import type { AuthorityMetricStatus } from '@/lib/dataStatus';

export type AuthorityMetricStalenessFlag = 'fresh' | 'lagged' | 'very_lagged';

export const AUTHORITY_METRIC_STALENESS_VALUES = [
    'fresh',
    'lagged',
    'very_lagged',
] as const satisfies readonly AuthorityMetricStalenessFlag[];

export interface AuthorityMetricSource {
    source_name: string | null;
    source_ref: string | null;
}

export interface AuthorityMetricSnapshot {
    metric_id: string;
    slug: string;
    label: string;
    value: number | null;
    unit: string;
    observed_at: string | null;
    published_at: string | null;
    source: AuthorityMetricSource;
    native_frequency: string | null;
    staleness_flag: AuthorityMetricStalenessFlag | null;
    data_status: AuthorityMetricStatus;
    methodology_version: string | null;
    revision_of: string | null;
}

export interface AuthorityMetricRecord extends Omit<AuthorityMetricSnapshot, 'source'>, AuthorityMetricSource {}

const CSV_COLUMNS = [
    'metric_id',
    'slug',
    'label',
    'value',
    'unit',
    'observed_at',
    'published_at',
    'source_name',
    'source_ref',
    'native_frequency',
    'staleness_flag',
    'data_status',
    'methodology_version',
    'revision_of',
] as const;

type AuthorityMetricInput = AuthorityMetricRecord | AuthorityMetricSnapshot;

function isSnapshot(record: AuthorityMetricInput): record is AuthorityMetricSnapshot {
    return 'source' in record;
}

function flattenAuthorityMetric(record: AuthorityMetricInput): AuthorityMetricRecord {
    if (!isSnapshot(record)) {
        return record;
    }

    const { source, ...rest } = record;
    return {
        ...rest,
        source_name: source.source_name,
        source_ref: source.source_ref,
    };
}

function normalizeValue(value: unknown): unknown {
    if (value === undefined) return null;
    if (value === null) return null;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map((item) => normalizeValue(item));

    if (typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>)
            .sort(([left], [right]) => compareStrings(left, right))
            .map(([key, entry]) => [key, normalizeValue(entry)] as const);

        return entries.reduce<Record<string, unknown>>((accumulator, [key, entry]) => {
            accumulator[key] = entry;
            return accumulator;
        }, {});
    }

    return value;
}

function compareStrings(left: string, right: string): number {
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
}

function normalizeRecord(record: AuthorityMetricInput): Record<string, unknown> {
    return normalizeValue(flattenAuthorityMetric(record)) as Record<string, unknown>;
}

function compareTimestamp(left: string | null, right: string | null): number {
    const normalizedLeft = left ?? '\uffff';
    const normalizedRight = right ?? '\uffff';
    return compareStrings(normalizedLeft, normalizedRight);
}

function compareRecords(left: AuthorityMetricInput, right: AuthorityMetricInput): number {
    const leftFlat = flattenAuthorityMetric(left);
    const rightFlat = flattenAuthorityMetric(right);

    return (
        compareTimestamp(leftFlat.observed_at, rightFlat.observed_at) ||
        compareTimestamp(leftFlat.published_at, rightFlat.published_at) ||
        compareStrings(leftFlat.metric_id, rightFlat.metric_id) ||
        compareStrings(leftFlat.slug, rightFlat.slug) ||
        compareStrings(leftFlat.label, rightFlat.label)
    );
}

function toCsvCell(value: unknown): string {
    if (value === null || value === undefined) return '';
    const text = String(value);
    if (/["\n,]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

export function serializeAuthorityMetric(record: AuthorityMetricInput): string {
    return JSON.stringify(normalizeRecord(record));
}

export function toAuthorityMetricCsv(records: AuthorityMetricInput[]): string {
    const header = CSV_COLUMNS.join(',');
    const rows = [...records].sort(compareRecords).map((record) => {
        const flat = flattenAuthorityMetric(record);
        return CSV_COLUMNS.map((column) => toCsvCell(flat[column as keyof AuthorityMetricRecord])).join(',');
    });

    return [header, ...rows].join('\n');
}
