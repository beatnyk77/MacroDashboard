import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Clock } from 'lucide-react';
import snapshotJson from '@/data/terminal-snapshot.json';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { FreshnessChip } from '@/components/FreshnessChip';
import { getStaleness } from '@/hooks/useStaleness';
import { cn } from '@/lib/utils';

export interface SnapshotMetric {
    metricId: string;
    label: string;
    value: number;
    display: string;
    asOf: string | null;
    staleness: string | null;
    unit: string | null;
}

export interface TerminalSnapshot {
    generatedAt: string;
    source: string;
    available: boolean;
    reason: string | null;
    metrics: SnapshotMetric[];
}

const snapshot = snapshotJson as TerminalSnapshot;

/** Prefer live hydrate when available; fall back to build-time display string. */
function SnapshotCell({ m }: { m: SnapshotMetric }) {
    const { data: live } = useLatestMetric(m.metricId);
    const freshness = live ? getStaleness(live.lastUpdated, live.frequency) : null;

    const display =
        live?.value != null && Number.isFinite(Number(live.value))
            ? (() => {
                  const n = Number(live.value);
                  if (m.metricId.includes('GOLD') && n > 100) return `$${Math.round(n).toLocaleString()}`;
                  if (Math.abs(n) >= 1000 && (m.metricId.includes('BALANCE') || m.metricId === 'FED_BALANCE_SHEET'))
                      return `${(n / 1000).toFixed(2)}T`;
                  if (m.metricId.includes('YIELD') || m.metricId === 'VIX_INDEX' || m.metricId === 'DXY_INDEX')
                      return n.toFixed(2);
                  return m.display;
              })()
            : m.display;

    const asOf = live?.lastUpdated ?? m.asOf;

    return (
        <div className="min-w-[7.5rem] flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5">
            <div className="mb-1 text-[9px] font-black uppercase tracking-[0.15em] text-white/35">{m.label}</div>
            <div className="font-mono text-sm font-black tabular-nums text-white">{display}</div>
            <div className="mt-1 flex items-center gap-1.5 text-[9px] text-white/30">
                {asOf && <span className="truncate">{String(asOf).slice(0, 10)}</span>}
                {freshness && (
                    <FreshnessChip
                        status={freshness.state}
                        lastUpdated={asOf ?? undefined}
                        label={freshness.label}
                    />
                )}
            </div>
        </div>
    );
}

/**
 * E4 — crawlable key telemetry strip.
 * Build embeds snapshot JSON; client hydrates fresher values when Supabase is available.
 */
export const TerminalSnapshotStrip: React.FC<{ className?: string }> = ({ className }) => {
    const buildAsOf = snapshot.generatedAt?.slice(0, 10);
    const metrics = snapshot.metrics ?? [];

    return (
        <section
            className={cn(
                'mb-8 rounded-2xl border border-white/10 bg-slate-900/40 p-4 sm:p-5 backdrop-blur-xl',
                className
            )}
            aria-label="Terminal telemetry snapshot"
            data-seo-snapshot={snapshot.available ? 'live' : 'unavailable'}
        >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-emerald-400" />
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">
                        Key telemetry
                    </h2>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/35">
                    <Clock size={12} />
                    {snapshot.available ? (
                        <span>
                            Build snapshot {buildAsOf}
                            <span className="ml-1 text-white/25">· live hydrate when available</span>
                        </span>
                    ) : (
                        <span title={snapshot.reason ?? undefined}>Snapshot unavailable at build</span>
                    )}
                    <Link to="/api-docs/" className="text-blue-400/80 hover:text-blue-300">
                        API →
                    </Link>
                </div>
            </div>

            {metrics.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {metrics.slice(0, 8).map((m) => (
                        <SnapshotCell key={m.metricId} m={m} />
                    ))}
                </div>
            ) : (
                <p className="text-[12px] text-white/40">
                    Key series load client-side. Build snapshot empty
                    {snapshot.reason ? ` (${snapshot.reason})` : ''}. Open a metric page or API for
                    values.
                </p>
            )}

            {/* Always emit a crawlable text summary for AEO when numbers exist */}
            {metrics.length > 0 && (
                <p className="mt-3 text-[11px] leading-relaxed text-white/35">
                    As of build {buildAsOf}:{' '}
                    {metrics
                        .slice(0, 6)
                        .map((m) => `${m.label} ${m.display}${m.asOf ? ` (${String(m.asOf).slice(0, 10)})` : ''}`)
                        .join(' · ')}
                    .
                </p>
            )}
        </section>
    );
};
