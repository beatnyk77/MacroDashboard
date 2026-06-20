import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ShieldAlert, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDataIntegrity } from '@/hooks/useDataIntegrity';
import {
    getExpectedLagHours,
    isMarketWeekend,
    nextMondayRefreshLabel,
} from '@/lib/marketFreshness';

// ---------------------------------------------------------------------------
// DataHealthBanner — sticky top banner for genuine failures only
// ---------------------------------------------------------------------------

export const DataHealthBanner: React.FC = () => {
    const { data: health, isLoading } = useDataIntegrity();
    const [now] = React.useState(() => Date.now());

    if (isLoading || !health || health.status === 'healthy') {
        return null;
    }
    const lastIngestionMs = health.lastIngestionAt
        ? new Date(health.lastIngestionAt).getTime()
        : 0;
    const ingestionAgeMs = now - lastIngestionMs;
    const hoursSinceLastRefresh = ingestionAgeMs / (60 * 60 * 1000);
    const expectedLag = getExpectedLagHours();

    // Suppress banner when staleness is within expected bounds for the time of week,
    // or when the absolute stale count is low enough to be noise.
    const shouldShowBanner =
        health.staleCount > 30 &&
        hoursSinceLastRefresh > expectedLag;

    if (!shouldShowBanner) return null;

    // Only flag critical after a full weekday business day of silence
    const isCritical = health.status === 'critical' || health.staleCount > 10;

    return (
        <div
            role="alert"
            className={cn(
                "sticky top-0 z-[100] w-full py-2.5 px-4 md:px-8 flex flex-wrap gap-x-6 gap-y-3 items-center justify-between border-b transition-all duration-500 shadow-lg",
                isCritical
                    ? "bg-red-500/15 border-red-500/30 text-red-400 backdrop-blur-xl"
                    : "bg-amber-500/15 border-amber-500/30 text-amber-400 backdrop-blur-xl"
            )}
        >
            <div className="flex items-center gap-3">
                {isCritical ? (
                    <ShieldAlert className="w-4 h-4 animate-pulse" />
                ) : (
                    <AlertCircle className="w-4 h-4" />
                )}

                <span className="text-xs font-bold uppercase tracking-[0.15em]">
                    {isCritical ? "Data Sync Delayed" : "Data Latency Detected"}
                </span>

                <div className="h-3 w-[1px] bg-white/10 mx-1" />

                <span className="text-xs font-medium opacity-80">
                    {health.staleCount} of {health.totalHighFrequency} tracked feeds delayed
                    {isCritical && " — refresh recommended"}
                </span>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/12 transition-colors"
                >
                    <RefreshCcw className="w-3 h-3" />
                    <span className="text-xs font-bold uppercase tracking-uppercase">Refresh Data</span>
                </button>

                <a
                    href="#health"
                    className="text-xs font-bold uppercase tracking-uppercase underline underline-offset-4 opacity-60 hover:opacity-100"
                >
                    Details
                </a>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// DataFreshnessFooterChip — contextual, weekend-aware footer indicator
// ---------------------------------------------------------------------------

export const DataFreshnessFooterChip: React.FC = () => {
    const { data: health, isLoading } = useDataIntegrity();
    const [now] = React.useState(() => Date.now());

    if (isLoading || !health) return null;
    const lastIngestionMs = health.lastIngestionAt
        ? new Date(health.lastIngestionAt).getTime()
        : 0;
    const ingestionAgeMs = now - lastIngestionMs;
    const hoursSinceRefresh = ingestionAgeMs / (60 * 60 * 1000);
    const expectedLag = getExpectedLagHours();
    const weekend = isMarketWeekend();

    // ── Case 1: All feeds fresh ──────────────────────────────────────────
    if (health.staleCount === 0) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/70 text-[10px] font-bold uppercase tracking-[0.12em]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 animate-pulse" />
                All feeds live
            </span>
        );
    }

    // ── Case 2: Weekend — lag is normal, show subtle scheduled refresh ──
    if (weekend) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/30 text-[10px] font-bold uppercase tracking-[0.12em]">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                Weekend · Next refresh {nextMondayRefreshLabel()}
            </span>
        );
    }

    // ── Case 3: Weekday, within expected lag window ──────────────────────
    if (hoursSinceRefresh <= expectedLag) {
        const lastLabel = lastIngestionMs > 0
            ? new Date(lastIngestionMs).toUTCString().replace(':00 GMT', ' UTC').slice(0, -4).split(' ').slice(-2).join(' ')
            : 'recently';
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/15 text-blue-400/50 text-[10px] font-bold uppercase tracking-[0.12em]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400/40 animate-pulse" />
                Refreshing · Last update {lastLabel}
            </span>
        );
    }

    // ── Case 4: Weekday genuine staleness (>expected but <24 h) — amber ──
    const hoursAgo = Math.round(hoursSinceRefresh);
    if (hoursSinceRefresh <= 24) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-[0.12em]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
                {health.staleCount} feed{health.staleCount !== 1 ? 's' : ''} lagged · {hoursAgo}h ago
            </span>
        );
    }

    // ── Case 5: Critical failure — >24 h on a weekday ───────────────────
    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-[0.12em]">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400/70 animate-pulse" />
            {health.staleCount} feeds stale · {hoursAgo}h ago
        </span>
    );
};

// Alias — the refactor renamed this; kept so existing imports don't break
export const DataFreshnessStatusChip = DataFreshnessFooterChip;

// Header variant — wraps the chip in a router link to the data-health page
export const DataHealthHeaderChip: React.FC = () => (
    <Link to="/data-health" aria-label="Data feed status">
        <DataFreshnessFooterChip />
    </Link>
);
