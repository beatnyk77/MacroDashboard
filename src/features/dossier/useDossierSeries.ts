import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DossierSource } from './dossierRegistry';
import { realMonthly, ratioMonthly, scaleSeries, spreadMonthly, yoyMonthly, type SeriesPoint } from './dossierStats';

/** PostgREST caps responses at 1,000 rows; dossiers need full history. */
const PAGE = 1000;

type Table = 'metric_observations' | 'vw_net_liquidity';

async function fetchAll(table: Table, column: 'value' | 'z_score', metricId?: string): Promise<SeriesPoint[]> {
    // Untyped builder: the two tables share as_of_date but differ in value columns.
    const from = (): any => (table === 'vw_net_liquidity' ? supabase.from('vw_net_liquidity') : supabase.from('metric_observations'));
    const scoped = (q: any) => (metricId ? q.eq('metric_id', metricId) : q);
    const { count, error: countError } = await scoped(from().select('as_of_date', { count: 'exact', head: true }));
    if (countError) throw countError;
    const pages = Array.from({ length: Math.ceil((count ?? 0) / PAGE) }, (_, i) => i);
    const results = await Promise.all(
        pages.map(async (i) => {
            const { data, error } = await scoped(from().select(`as_of_date, ${column}`))
                .order('as_of_date', { ascending: true })
                .range(i * PAGE, i * PAGE + PAGE - 1);
            if (error) throw error;
            return (data ?? []) as Record<string, unknown>[];
        }),
    );
    return results
        .flat()
        .filter((r) => r[column] != null)
        .map((r) => ({ date: String(r.as_of_date ?? '').slice(0, 10), value: Number(r[column]) }))
        .filter((p) => p.date && Number.isFinite(p.value));
}

const observations = (metricId: string) => fetchAll('metric_observations', 'value', metricId);

export interface DossierSeries {
    points: SeriesPoint[];
    /** Input observations dropped by an explicit unit floor (see DossierSource.minNumerator) */
    excluded: number;
}

export async function loadDossierSeries(source: DossierSource): Promise<DossierSeries> {
    let raw: SeriesPoint[];
    let excluded = 0;
    switch (source.kind) {
        case 'observations':
            raw = scaleSeries(await observations(source.metricId), source.scale ?? 1);
            break;
        case 'netLiquidity':
            raw = await fetchAll('vw_net_liquidity', source.field);
            break;
        case 'ratio': {
            const [num, den] = await Promise.all([observations(source.numerator), observations(source.denominator)]);
            const floor = source.minNumerator;
            const numInUnit = floor === undefined ? num : num.filter((p) => p.value >= floor);
            excluded = num.length - numInUnit.length;
            raw = ratioMonthly(numInUnit, den);
            break;
        }
        case 'real': {
            const [nominal, deflator] = await Promise.all([observations(source.metricId), observations(source.deflator)]);
            raw = realMonthly(nominal, deflator);
            break;
        }
        case 'realRate': {
            const [rate, index] = await Promise.all([observations(source.rate), observations(source.priceIndex)]);
            raw = spreadMonthly(rate, yoyMonthly(index));
            break;
        }
    }
    return { points: dedupeByDate(raw), excluded };
}

/** Keep the last value per date; inputs from paginated reads can overlap. */
function dedupeByDate(points: SeriesPoint[]): SeriesPoint[] {
    const m = new Map<string, number>();
    for (const p of points) m.set(p.date, p.value);
    return [...m.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([date, value]) => ({ date, value }));
}

export function useDossierSeries(id: string, source: DossierSource) {
    return useQuery({
        queryKey: ['dossier-series', id],
        staleTime: 1000 * 60 * 30,
        queryFn: () => loadDossierSeries(source),
    });
}
