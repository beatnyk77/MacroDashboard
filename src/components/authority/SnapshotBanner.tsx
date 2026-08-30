import React from 'react';
import { cn } from '@/lib/utils';
import { Info, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import type { AuthorityMetricSnapshot } from '@/lib/authority/metricContract';

interface SnapshotBannerProps {
    snapshot: AuthorityMetricSnapshot;
    className?: string;
}

export const SnapshotBanner: React.FC<SnapshotBannerProps> = ({ snapshot, className }) => {
    const isVerified = snapshot.data_status === 'verified';
    const isProvisional = snapshot.data_status === 'provisional';
    const isRevised = snapshot.data_status === 'revised';
    const isCorrected = snapshot.data_status === 'corrected';
    const isUnavailable = snapshot.data_status === 'unavailable';

    if (isVerified) return null; // No banner needed for normal verified state

    return (
        <div className={cn(
            "flex items-start gap-3 p-4 rounded-lg border",
            isProvisional ? "bg-amber-500/10 border-amber-500/20 text-amber-200" :
            isRevised ? "bg-blue-500/10 border-blue-500/20 text-blue-200" :
            isCorrected ? "bg-purple-500/10 border-purple-500/20 text-purple-200" :
            isUnavailable ? "bg-red-500/10 border-red-500/20 text-red-200" :
            "bg-white/5 border-white/10 text-white/70",
            className
        )}>
            <div className="mt-0.5">
                {isProvisional && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {isRevised && <Info className="w-5 h-5 text-blue-500" />}
                {isCorrected && <FileText className="w-5 h-5 text-purple-500" />}
                {isUnavailable && <AlertTriangle className="w-5 h-5 text-red-500" />}
            </div>
            
            <div className="flex-1 space-y-1">
                <h4 className="font-semibold text-sm">
                    {isProvisional && "Provisional Data"}
                    {isRevised && "Revised Snapshot"}
                    {isCorrected && "Corrected Snapshot"}
                    {isUnavailable && "Data Unavailable"}
                </h4>
                <div className="text-sm opacity-80 leading-relaxed">
                    {isProvisional && "This observation is provisional and may be revised by the source in future releases."}
                    {isRevised && "This snapshot has been revised from a previous publication due to a routine methodology or source update."}
                    {isCorrected && "This snapshot contains a material correction to a previously published value."}
                    {isUnavailable && "This metric is currently unavailable or its latest observation falls outside our verified freshness window."}
                </div>
            </div>
        </div>
    );
};
