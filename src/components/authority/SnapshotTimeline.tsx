import React from 'react';
import { cn } from '@/lib/utils';
import type { AuthorityMetricSnapshot } from '@/lib/authority/metricContract';

interface SnapshotTimelineProps {
    snapshots: AuthorityMetricSnapshot[];
    currentSnapshotId?: string;
    className?: string;
}

export const SnapshotTimeline: React.FC<SnapshotTimelineProps> = ({ snapshots, currentSnapshotId, className }) => {
    if (!snapshots || snapshots.length === 0) return null;

    return (
        <div className={cn("space-y-4", className)}>
            <h3 className="text-sm font-medium text-white/80">Publication History</h3>
            <div className="relative border-l border-white/10 ml-3 space-y-6">
                {snapshots.map((snapshot, idx) => {
                    // We assume snapshots might not have snapshot_id in the interface, 
                    // but we might pass it as part of the payload or use published_at as key
                    const key = snapshot.published_at || String(idx);
                    const isCurrent = key === currentSnapshotId;
                    
                    return (
                        <div key={key} className="relative pl-6">
                            <div className={cn(
                                "absolute w-2.5 h-2.5 rounded-full -left-[5px] top-1.5 border-2",
                                isCurrent 
                                    ? "bg-emerald-500 border-emerald-900" 
                                    : "bg-white/20 border-black"
                            )} />
                            
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-sm font-medium",
                                        isCurrent ? "text-emerald-400" : "text-white/60"
                                    )}>
                                        {snapshot.published_at 
                                            ? new Date(snapshot.published_at).toLocaleDateString(undefined, { 
                                                year: 'numeric', month: 'short', day: 'numeric' 
                                              })
                                            : 'Draft'}
                                    </span>
                                    
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 uppercase tracking-wider">
                                        {snapshot.data_status}
                                    </span>
                                </div>
                                
                                <div className="text-sm text-white/40">
                                    Observed: {snapshot.observed_at ? new Date(snapshot.observed_at).toLocaleDateString() : 'N/A'}
                                </div>
                                
                                {snapshot.revision_of && (
                                    <div className="text-xs text-amber-500/80 mt-1">
                                        Revises previous snapshot
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
