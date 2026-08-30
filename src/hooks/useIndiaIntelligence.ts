import { useQuery } from '@tanstack/react-query';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { supabase } from '@/lib/supabase';

export type IndiaEvidenceState = 'observed' | 'lagged' | 'historical' | 'unavailable';
export type IndiaDomainKey = 'growth' | 'inflation' | 'liquidity' | 'fiscal' | 'credit' | 'external' | 'market';

export interface IndiaEvidenceMetric {
    id: string;
    label: string;
    domain: IndiaDomainKey;
    unit: string;
    direction: 'positive' | 'negative';
    value: number | null;
    asOf: string | null;
    ingestedAt: string | null;
    frequency: string | null;
    source: string | null;
    sourceRef: string | null;
    provenance: string | null;
    isProvisional: boolean;
    state: IndiaEvidenceState;
    score: number | null;
    reason?: string;
}

export interface IndiaDomainResult {
    key: IndiaDomainKey;
    label: string;
    required: boolean;
    score: number | null;
    state: 'observed' | 'lagged' | 'unavailable';
    metrics: IndiaEvidenceMetric[];
}

const SOURCE_TOKENS = [
    'live_api:rbi', 'live_api:mospi', 'live_api:ingest-mospi', 'live_api:fred',
    'live_api:dbie', 'live_api:nse', 'live_api:bse',
];

const REGISTRY = [
    { id: 'IN_IIP_YOY', label: 'IIP growth', domain: 'growth' as const, unit: '%', direction: 'positive' as const },
    { id: MID.IN_GDP_GROWTH_YOY, label: 'GDP growth', domain: 'growth' as const, unit: '%', direction: 'positive' as const },
    { id: MID.IN_CPI_YOY, label: 'CPI inflation', domain: 'inflation' as const, unit: '%', direction: 'negative' as const },
    { id: MID.IN_WPI_YOY, label: 'WPI inflation', domain: 'inflation' as const, unit: '%', direction: 'negative' as const },
    { id: MID.IN_REPO_RATE, label: 'RBI repo rate', domain: 'liquidity' as const, unit: '%', direction: 'positive' as const },
    { id: MID.IN_FX_RESERVES, label: 'FX reserves', domain: 'external' as const, unit: 'USD bn', direction: 'positive' as const },
    { id: MID.IN_DEBT_GDP_PCT, label: 'Debt / GDP', domain: 'fiscal' as const, unit: '%', direction: 'negative' as const },
    { id: MID.IN_BANK_CREDIT_GROWTH_YOY, label: 'Bank credit growth', domain: 'credit' as const, unit: '%', direction: 'positive' as const },
    { id: MID.USD_INR_RATE, label: 'USD / INR', domain: 'market' as const, unit: 'INR', direction: 'negative' as const },
] as const;

const DOMAIN_LABELS: Record<IndiaDomainKey, string> = {
    growth: 'Growth', inflation: 'Inflation', liquidity: 'Liquidity', fiscal: 'Fiscal',
    credit: 'Credit', external: 'External', market: 'Market flows',
};

const acceptedSource = (sourceRef: unknown) => typeof sourceRef === 'string' && SOURCE_TOKENS.some(token => sourceRef === token || sourceRef.startsWith(`${token}:`));

const ageState = (row: any): IndiaEvidenceState => {
    if (!row?.as_of_date || new Date(row.as_of_date).getTime() > Date.now()) return 'unavailable';
    const ageDays = (Date.now() - new Date(row.as_of_date).getTime()) / 86_400_000;
    const frequency = String(row.native_frequency || row.display_frequency || '').toLowerCase();
    const thresholds = frequency.includes('quarter')
        ? { fresh: 120, lagged: 240 }
        : frequency.includes('month')
            ? { fresh: 45, lagged: 90 }
            : frequency.includes('week')
                ? { fresh: 9, lagged: 21 }
                : { fresh: 2, lagged: 7 };
    if (ageDays <= thresholds.fresh) return 'observed';
    if (ageDays <= thresholds.lagged) return 'lagged';
    return 'historical';
};

const scoreFromRow = (row: any, direction: 'positive' | 'negative', history: any[]) => {
    if (row?.percentile != null && Number.isFinite(Number(row.percentile))) {
        const percentile = direction === 'positive' ? Number(row.percentile) : 1 - Number(row.percentile);
        return Math.max(-1, Math.min(1, percentile * 2 - 1));
    }
    const values = history.map(item => Number(item.value)).filter(Number.isFinite).slice(-20);
    const value = Number(row?.value);
    if (!Number.isFinite(value) || values.length < 5) return null;
    const mean = values.reduce((sum, item) => sum + item, 0) / values.length;
    const variance = values.reduce((sum, item) => sum + (item - mean) ** 2, 0) / Math.max(1, values.length - 1);
    const z = variance > 0 ? (value - mean) / Math.sqrt(variance) : 0;
    const signed = direction === 'positive' ? z : -z;
    return Math.max(-1, Math.min(1, signed / 2));
};

const normalize = (definition: typeof REGISTRY[number], row: any, history: any[]): IndiaEvidenceMetric => {
    const numeric = row?.value == null ? null : Number(row.value);
    const hasValue = Number.isFinite(numeric) && row?.as_of_date && new Date(row.as_of_date).getTime() <= Date.now();
    const isHistorical = row?.provenance === 'verified_historical' || String(row?.source_ref || '').startsWith('verified_historical:');
    const approved = acceptedSource(row?.source_ref) && row?.provenance === 'api_live';
    const state = hasValue && (approved || isHistorical) ? ageState(row) : 'unavailable';
    const usable = state === 'observed' || state === 'lagged';
    const score = usable ? scoreFromRow(row, definition.direction, history) : null;
    return {
        ...definition,
        value: usable ? numeric : isHistorical && hasValue ? numeric : null,
        asOf: row?.as_of_date || null,
        ingestedAt: row?.last_updated_at || null,
        frequency: row?.native_frequency || row?.display_frequency || null,
        source: row?.source_name || null,
        sourceRef: row?.source_ref || null,
        provenance: row?.provenance || null,
        isProvisional: row?.is_provisional === true,
        state: isHistorical && hasValue ? 'historical' : state,
        score,
        reason: !row ? 'No observation is published.' : !approved && !isHistorical ? 'Provenance is not approved for current use.' : row?.is_provisional ? 'Observation is provisional.' : undefined,
    };
};

export function useIndiaIntelligence() {
    return useQuery({
        queryKey: ['india-intelligence-v1', REGISTRY.map(metric => metric.id)],
        queryFn: async () => {
            const ids = REGISTRY.map(metric => metric.id);
            const [{ data: latest, error: latestError }, { data: history, error: historyError }] = await Promise.all([
                supabase.from('vw_latest_metrics').select('metric_id, metric_name, value, as_of_date, last_updated_at, source_name, source_ref, provenance, is_provisional, native_frequency, display_frequency, percentile, z_score').in('metric_id', ids),
                supabase.from('metric_observations').select('metric_id, as_of_date, value').in('metric_id', ids).order('as_of_date', { ascending: true }),
            ]);
            if (latestError) throw latestError;
            if (historyError) throw historyError;
            const latestMap = new Map((latest || []).map((row: any) => [row.metric_id, row]));
            const historyMap = new Map<string, any[]>();
            (history || []).forEach((row: any) => historyMap.set(row.metric_id, [...(historyMap.get(row.metric_id) || []), row]));
            const metrics = REGISTRY.map(definition => normalize(definition, latestMap.get(definition.id), historyMap.get(definition.id) || []));
            const domains = (Object.keys(DOMAIN_LABELS) as IndiaDomainKey[]).map(key => {
                const domainMetrics = metrics.filter(metric => metric.domain === key);
                const scored = domainMetrics.filter(metric => metric.score != null && metric.state !== 'historical');
                const score = scored.length ? scored.reduce((sum, metric) => sum + (metric.score || 0), 0) / scored.length : null;
                return { key, label: DOMAIN_LABELS[key], required: key !== 'market', score, state: scored.length ? (scored.some(metric => metric.state === 'lagged') ? 'lagged' : 'observed') : 'unavailable', metrics: domainMetrics } as IndiaDomainResult;
            });
            const required = domains.filter(domain => domain.required);
            const complete = required.every(domain => domain.score != null);
            const overallScore = complete ? domains.filter(domain => domain.score != null).reduce((sum, domain) => sum + (domain.score || 0), 0) / domains.filter(domain => domain.score != null).length : null;
            return { metrics, domains, overallScore, overallRegime: !complete ? 'INSUFFICIENT COVERAGE' : overallScore! >= 0.35 ? 'IMPROVING' : overallScore! <= -0.35 ? 'DETERIORATING' : 'MIXED', observed: metrics.filter(metric => metric.state === 'observed').length, lagged: metrics.filter(metric => metric.state === 'lagged').length, historical: metrics.filter(metric => metric.state === 'historical').length, unavailable: metrics.filter(metric => metric.state === 'unavailable').length };
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}
