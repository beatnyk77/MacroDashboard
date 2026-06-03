import React from 'react';
import { AlertCircle, ShieldAlert, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDataIntegrity } from '@/hooks/useDataIntegrity';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export const DataHealthBanner: React.FC = () => {
    const { data: health, isLoading } = useDataIntegrity();

    if (isLoading || !health || health.status === 'healthy') {
        return null;
    }

    const lastIngestionMs = health.lastIngestionAt
        ? new Date(health.lastIngestionAt).getTime()
        : 0;
    const ingestionAgeMs = Date.now() - lastIngestionMs;
    const isOvernightStaleness = ingestionAgeMs < TWELVE_HOURS_MS;

    // Suppress banner for routine overnight staleness (< 12 h) or low stale count
    if (health.staleCount <= 30 || isOvernightStaleness) {
        return null;
    }

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

/** Subtle chip for the footer — shown when staleness is routine (< 12 h) */
export const DataFreshnessFooterChip: React.FC = () => {
    const { data: health, isLoading } = useDataIntegrity();

    if (isLoading || !health || health.staleCount === 0) return null;

    const lastIngestionMs = health.lastIngestionAt
        ? new Date(health.lastIngestionAt).getTime()
        : 0;
    const ingestionAgeMs = Date.now() - lastIngestionMs;
    const isOvernightStaleness = ingestionAgeMs < TWELVE_HOURS_MS;

    // Only show when banner is suppressed (routine staleness)
    if (!isOvernightStaleness && health.staleCount > 30) return null;

    const hoursAgo = Math.round(ingestionAgeMs / (60 * 60 * 1000));

    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400/60 text-[10px] font-bold uppercase tracking-[0.12em]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/40" />
            {health.staleCount} feed{health.staleCount !== 1 ? 's' : ''} lagged
            {lastIngestionMs > 0 && ` · ${hoursAgo}h ago`}
        </span>
    );
};
