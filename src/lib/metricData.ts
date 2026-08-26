import { resolveMetricDelta } from '@/lib/metricDelta';

export interface MetricData {
    value: number;
    delta: number | null;
    deltaPeriod: string;
    trend: 'up' | 'down' | 'neutral';
    history: { date: string; value: number }[];
    status: 'safe' | 'warning' | 'danger' | 'neutral';
    lastUpdated: string;
    zScore?: number;
    percentile?: number;
    source?: string;
    sourceRef?: string | null;
    provenance?: string | null;
    isProvisional?: boolean;
    frequency?: string;
    methodology?: string;
}

const STATUS_MAP: Record<string, MetricData['status']> = {
    fresh: 'safe',
    lagged: 'warning',
    very_lagged: 'danger',
};

export function mapLatestMetric(
    latest: Record<string, unknown>,
    historyRows: { as_of_date: string; value: number }[] = [],
): MetricData {
    const resolvedDelta = resolveMetricDelta(
        latest.delta_mom as number | null,
        latest.delta_wow as number | null,
        latest.display_frequency as string | null,
    );

    return {
        value: Number(latest.value),
        delta: resolvedDelta.value,
        deltaPeriod: resolvedDelta.period,
        trend: resolvedDelta.trend,
        history: historyRows.map((h) => ({ date: String(h.as_of_date), value: Number(h.value) })).reverse(),
        status: STATUS_MAP[String(latest.staleness_flag ?? '')] ?? 'neutral',
        lastUpdated: String(latest.as_of_date ?? ''),
        zScore: latest.z_score != null ? Number(latest.z_score) : undefined,
        percentile: latest.percentile != null ? Number(latest.percentile) : undefined,
        source: String(latest.source_name ?? 'Internal Analytics'),
        sourceRef: (latest.source_ref as string | null) ?? null,
        provenance: (latest.provenance as string | null) ?? null,
        isProvisional: latest.is_provisional === true,
        frequency: (latest.native_frequency as string | undefined) ?? undefined,
        methodology: 'Rolling 252-day Z-Score',
    };
}
