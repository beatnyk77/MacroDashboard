import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SEOManager } from '@/components/SEOManager';
import { FreshnessChip, type FreshnessStatus } from '@/components/FreshnessChip';

interface IngestionRow {
    function_name: string;
    status_code: number | null;
    status: string | null;
    rows_inserted: number | null;
    start_time: string;
}

// Friendlier labels for well-known pipelines; everything else falls back to the
// cleaned function name. Purely cosmetic — the data below is live.
const SOURCE_META: Record<string, { name: string; sub: string }> = {
    'ingest-fred': { name: 'FRED', sub: 'Federal Reserve · US Macro' },
    'ingest-cofer': { name: 'IMF COFER', sub: 'Reserve Composition' },
    'ingest-bis-reer': { name: 'BIS', sub: 'Cross-border Banking' },
    'ingest-energy': { name: 'India Energy', sub: 'MoSPI · State Grid' },
    'ingest-asi': { name: 'MoSPI ASI', sub: 'India · eSankhyiki' },
    'ingest-china-macro': { name: 'NBS / PBOC', sub: 'China · Industrial' },
    'ingest-us-macro': { name: 'US Macro Pulse', sub: 'Treasury · BEA' },
    'ingest-commodity-terminal': { name: 'EIA', sub: 'Energy · Crude / SPR' },
};

const prettify = (fn: string) =>
    fn
        .replace(/^ingest-/, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

const daysSince = (iso: string, now: number): number =>
    (now - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);

const freshnessFor = (row: IngestionRow, now: number): FreshnessStatus => {
    const d = daysSince(row.start_time, now);
    if (d <= 7) return 'fresh';
    if (d <= 14) return 'lagged';
    return 'stale';
};

const relativeTime = (iso: string, now: number): string => {
    const ms = now - new Date(iso).getTime();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours < 1) return 'updated just now';
    if (hours < 24) return `updated ${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `updated ${days}d ago`;
};

export const DataHealthPublic: React.FC = () => {
    const [now] = React.useState(() => Date.now());

    const { data: ingestions } = useQuery({
        queryKey: ['public-data-health', 'ingestions'],
        queryFn: async (): Promise<IngestionRow[]> => {
            const { data, error } = await supabase
                .from('vw_latest_ingestions')
                .select('function_name, status_code, status, rows_inserted, start_time')
                .order('start_time', { ascending: false });
            if (error) throw error;
            return (data ?? []) as IngestionRow[];
        },
        refetchInterval: 300000, // 5 min
    });

    const { data: authenticity } = useQuery({
        queryKey: ['public-data-health', 'authenticity'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_authenticity_percentage_v2')
                .select('*')
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data as { authenticity_score: number } | null;
        },
        refetchInterval: 300000,
    });

    const rows = ingestions ?? [];
    const total = rows.length;
    const freshCount = rows.filter((r) => freshnessFor(r, now) === 'fresh').length;
    const lastSweep = rows[0]?.start_time;
    const authScore = authenticity?.authenticity_score;

    return (
        <div className="mx-auto w-full max-w-[1080px] px-4 py-20 sm:px-6 lg:px-12">
            <SEOManager
                title="Data Health & Provenance"
                description="Every metric on GraphiQuestor traces to an official source, ingested on a schedule, with an authenticity score. This board is live."
                keywords={['Data provenance', 'Data freshness', 'Macro data pipelines', 'Source authenticity']}
            />

            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-400/80">Live · Public</div>
            <h1 className="mb-1.5 mt-3.5 text-[26px] font-extrabold text-white">Data Health &amp; Provenance</h1>
            <p className="m-0 max-w-[620px] text-[14px] leading-relaxed text-white/50">
                Every metric on GraphiQuestor traces to an official source, ingested on a schedule, with an authenticity score. This board is live.
            </p>

            {/* Summary stats */}
            <div className="my-6 flex flex-wrap gap-2.5">
                <Stat label="Live Pipelines" value={total ? `${total} ✓` : '—'} accent />
                <Stat label="Fresh (<7d)" value={total ? `${freshCount} / ${total}` : '—'} />
                <Stat
                    label="Avg Authenticity"
                    value={authScore != null ? `${authScore}%` : '—'}
                    accent
                />
                <Stat label="Last Sweep" value={lastSweep ? relativeTime(lastSweep, now).replace('updated ', '') : '—'} small />
            </div>

            {/* Status-board card grid (D10) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((row) => {
                    const meta = SOURCE_META[row.function_name];
                    const status = freshnessFor(row, now);
                    const live = row.status_code === 200;
                    return (
                        <div
                            key={row.function_name}
                            className="rounded-[14px] border border-white/[0.08] bg-white/[0.02] p-4"
                        >
                            <div className="mb-3 flex items-center justify-between gap-2.5">
                                <div>
                                    <div className="text-[14px] font-extrabold text-white">
                                        {meta?.name ?? prettify(row.function_name)}
                                    </div>
                                    <div className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white/40">
                                        {meta?.sub ?? row.function_name}
                                    </div>
                                </div>
                                <FreshnessChip status={status} lastUpdated={row.start_time} />
                            </div>
                            <div className="flex justify-between font-mono text-[11px] text-white/50">
                                <span>{relativeTime(row.start_time, now)}</span>
                                <span className={live ? 'text-emerald-400' : 'text-amber-400'}>
                                    {live ? `api_live · ${row.status_code}` : (row.status_code ?? '—')}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {total === 0 && (
                <p className="mt-8 text-center text-[13px] italic text-white/30">Loading live pipeline telemetry…</p>
            )}
        </div>
    );
};

const Stat: React.FC<{ label: string; value: string; accent?: boolean; small?: boolean }> = ({
    label,
    value,
    accent,
    small,
}) => (
    <div className="min-w-[120px] flex-1 rounded-[14px] border border-white/[0.08] px-[18px] py-[13px]">
        <div className="mb-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/40">{label}</div>
        <div
            className={`font-mono font-extrabold ${small ? 'text-[16px]' : 'text-[22px]'} ${
                accent ? 'text-emerald-400' : 'text-white'
            }`}
        >
            {value}
        </div>
    </div>
);

export default DataHealthPublic;
