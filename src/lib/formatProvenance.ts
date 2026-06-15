/** Human-readable label for metric_observations.source_ref tags. */
export function formatSourceRef(sourceRef?: string | null): string {
    if (!sourceRef) return 'Source unverified';

    const [kind, ...rest] = sourceRef.split(':');
    const detail = rest.join(':');

    const kindLabels: Record<string, string> = {
        live_api: 'Live API',
        fallback: 'Fallback dataset',
        seed: 'Seed migration',
        manual: 'Manual entry',
    };

    const prefix = kindLabels[kind] ?? kind;
    return detail ? `${prefix} · ${detail}` : prefix;
}

/** Legacy provenance enum (provenance column) → display string. */
export function formatProvenanceTag(provenance?: string | null): string | null {
    if (!provenance) return null;

    const map: Record<string, string> = {
        api_live: 'Verified live API',
        fallback_snapshot: 'Fallback snapshot',
        manual_seed: 'Manual seed',
        verified_historical: 'Verified historical',
    };

    return map[provenance] ?? provenance.replace(/_/g, ' ');
}