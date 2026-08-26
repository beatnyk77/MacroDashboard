import { useQuery } from '@tanstack/react-query';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { supabase } from '@/lib/supabase';
import { getStaleness } from '@/hooks/useStaleness';
import type { FreshnessStatus } from '@/components/FreshnessChip';

export type CockpitMetricState = 'observed' | 'lagged' | 'unavailable';

export interface FiscalCockpitMetric {
    id: string;
    label: string;
    unit: string;
    value: number | null;
    asOf: string | null;
    lastUpdated: string | null;
    frequency: string | null;
    source: string | null;
    sourceRef: string | null;
    provenance: string | null;
    isProvisional: boolean;
    state: CockpitMetricState;
    freshness: FreshnessStatus;
    unavailableReason?: string;
}

const METRICS = [
    { id: MID.TGA_BALANCE_BN, label: 'Treasury General Account', unit: 'USD bn', group: 'Liquidity' },
    { id: MID.RRP_BALANCE_BN, label: 'Overnight Reverse Repo', unit: 'USD bn', group: 'Liquidity' },
    { id: MID.SRF_USAGE, label: 'Standing Repo Facility', unit: 'USD bn', group: 'Liquidity' },
    { id: MID.FX_SWAP_LINES, label: 'Fed FX Swap Lines', unit: 'USD bn', group: 'Liquidity' },
    { id: MID.US_DEBT_MATURING_12M_TN, label: 'Debt maturing within 12 months', unit: 'USD tn', group: 'Fiscal' },
    { id: MID.US_FEDERAL_INTEREST_PAYMENTS, label: 'Federal interest payments', unit: 'USD bn', group: 'Fiscal' },
    { id: MID.US_FISCAL_INTEREST_TO_RECEIPTS_PCT, label: 'Interest / receipts', unit: '%', group: 'Fiscal' },
    { id: MID.US_FISCAL_INTEREST_TO_GDP_PCT, label: 'Interest / GDP', unit: '%', group: 'Fiscal' },
    { id: MID.UST_10Y_YIELD, label: '10-year Treasury yield', unit: '%', group: 'Market' },
    { id: MID.UST_10Y_2Y_SPREAD, label: '10y minus 2y spread', unit: 'bps', group: 'Market' },
] as const;

const ACCEPTED_SOURCE_REFS = [
    'live_api:fred',
    'live_api:fiscaldata',
    'live_api:treasury',
    'live_api:nyfed',
    'live_api:fed',
    'verified_historical:',
];

const isAcceptedSource = (sourceRef: unknown) => (
    typeof sourceRef === 'string' && ACCEPTED_SOURCE_REFS.some(prefix => sourceRef.startsWith(prefix))
);

const freshnessFromRow = (row: any): FreshnessStatus => {
    if (!row?.as_of_date || row?.value == null || !Number.isFinite(Number(row.value))) return 'no_data';
    if (new Date(row.as_of_date).getTime() > Date.now()) return 'no_data';
    const derived = getStaleness(row.last_updated_at || row.as_of_date, row.native_frequency || row.display_frequency);
    if (derived.state === 'fresh') return 'fresh';
    if (derived.state === 'lagged') return 'lagged';
    return derived.state;
};

const normalizeMetric = (definition: typeof METRICS[number], row: any): FiscalCockpitMetric => {
    const numericValue = row?.value == null ? null : Number(row.value);
    const hasValue = Number.isFinite(numericValue) && row?.as_of_date && new Date(row.as_of_date).getTime() <= Date.now();
    const accepted = isAcceptedSource(row?.source_ref);
    const provisional = row?.is_provisional === true;
    const freshness = freshnessFromRow(row);
    const unavailableReason = !row
        ? 'No observation is published for this metric.'
        : !hasValue
            ? 'The latest record has no numeric observation.'
            : !accepted
                ? 'The latest record has no approved live or verified provenance.'
                : provisional
                    ? 'The latest record is marked provisional.'
                    : undefined;
    const usable = Boolean(hasValue && accepted && !provisional);

    return {
        id: definition.id,
        label: definition.label,
        unit: definition.unit,
        value: usable ? numericValue : null,
        asOf: row?.as_of_date || null,
        lastUpdated: row?.last_updated_at || null,
        frequency: row?.native_frequency || row?.display_frequency || null,
        source: row?.source_name || null,
        sourceRef: row?.source_ref || null,
        provenance: row?.provenance || null,
        isProvisional: provisional,
        state: usable ? (freshness === 'fresh' ? 'observed' : 'lagged') : 'unavailable',
        freshness: usable ? freshness : 'no_data',
        unavailableReason,
    };
};

export function useFiscalCockpit() {
    return useQuery({
        queryKey: ['us-fiscal-cockpit', METRICS.map(metric => metric.id)],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_latest_metrics')
                .select('metric_id, metric_name, value, as_of_date, last_updated_at, source_name, source_ref, provenance, is_provisional, native_frequency, display_frequency, staleness_flag')
                .in('metric_id', METRICS.map(metric => metric.id));
            if (error) throw error;

            const rows = new Map((data || []).map((row: any) => [row.metric_id, row]));
            const metrics = METRICS.map(definition => normalizeMetric(definition, rows.get(definition.id)));
            const observed = metrics.filter(metric => metric.state === 'observed').length;
            const lagged = metrics.filter(metric => metric.state === 'lagged').length;

            return {
                metrics,
                observed,
                lagged,
                unavailable: metrics.length - observed - lagged,
            };
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}
