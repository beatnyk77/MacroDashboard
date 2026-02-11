import React from 'react';
import { AlertCircle, ShieldAlert, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDataIntegrity } from '@/hooks/useDataIntegrity';

export const DataHealthBanner: React.FC = () => {
    const { data: health, isLoading } = useDataIntegrity();

    if (isLoading || !health || health.status === 'healthy') {
        return null;
    }

    const isCritical = health.status === 'critical' || health.staleCount > 10;

    return (
        <div
            className={cn(
                "sticky top-0 z-[100] w-full py-2 px-6 flex items-center justify-between border-b transition-all duration-500",
                isCritical
                    ? "bg-red-500/10 border-red-500/20 text-red-400 backdrop-blur-md"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-400 backdrop-blur-md"
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

                <span className="text-[11px] font-medium opacity-80">
                    {health.staleCount} of {health.totalHighFrequency} tracked feeds delayed
                    {isCritical && " — refresh recommended"}
                </span>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                    <RefreshCcw className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Refresh Data</span>
                </button>

                <a
                    href="#health"
                    className="text-[10px] font-bold uppercase tracking-wider underline underline-offset-4 opacity-60 hover:opacity-100"
                >
                    Details
                </a>
            </div>
        </div>
    );
};
