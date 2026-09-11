import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ShieldCheck, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataDiagnosticsDisclosureProps {
    source: string;
    frequency: string;
    lastUpdated?: string | Date;
    status: string;
    sourceRef?: string | null;
    provenance?: string | null;
    laymanSummary?: string;
    analogy?: string;
    mainStreetImpact?: string;
    thresholds?: string;
}

export const DataDiagnosticsDisclosure: React.FC<DataDiagnosticsDisclosureProps> = ({
    source,
    frequency,
    lastUpdated,
    status,
    sourceRef,
    provenance,
    laymanSummary,
    analogy,
    mainStreetImpact,
    thresholds,
}) => {
    const hasConcept = Boolean(laymanSummary || analogy || mainStreetImpact);
    const [activeTab, setActiveTab] = useState<'concept' | 'telemetry'>(hasConcept ? 'concept' : 'telemetry');

    return (
        <details className="group text-xs relative">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded border border-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 transition-colors hover:border-sky-500/40 hover:text-sky-300">
                <Lightbulb size={10} className="text-sky-400" />
                <span>Concept & Telemetry</span>
                <ChevronDown size={10} className="transition-transform group-open:rotate-180" />
            </summary>

            <div
                className="mt-2 w-[280px] max-w-[90vw] rounded-lg border border-sky-500/20 bg-slate-950/95 p-3 text-[10px] shadow-2xl backdrop-blur-xl z-30"
                role="status"
            >
                {/* Dual Tabs Header */}
                <div className="flex items-center gap-3 border-b border-slate-800 pb-1.5 mb-2.5">
                    {hasConcept && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                setActiveTab('concept');
                            }}
                            className={cn(
                                'flex items-center gap-1 pb-0.5 text-[10px] font-bold tracking-wide uppercase transition-colors',
                                activeTab === 'concept'
                                    ? 'text-sky-400 border-b-2 border-sky-400'
                                    : 'text-slate-400 hover:text-slate-200'
                            )}
                        >
                            <Lightbulb size={11} /> Concept
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab('telemetry');
                        }}
                        className={cn(
                            'flex items-center gap-1 pb-0.5 text-[10px] font-bold tracking-wide uppercase transition-colors',
                            activeTab === 'telemetry' || !hasConcept
                                ? 'text-emerald-400 border-b-2 border-emerald-400'
                                : 'text-slate-400 hover:text-slate-200'
                        )}
                    >
                        <Database size={11} /> Telemetry
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'concept' && hasConcept ? (
                    <div className="space-y-2 text-slate-300">
                        {/* Analogy / Plain English */}
                        {(analogy || laymanSummary) && (
                            <div className="space-y-0.5">
                                <div className="text-[9px] font-bold uppercase tracking-wider text-sky-400/80">
                                    The Mental Model
                                </div>
                                <p className="text-[10px] leading-relaxed text-slate-300 font-normal">
                                    {analogy || laymanSummary}
                                </p>
                            </div>
                        )}

                        {/* Main Street / Portfolio Impact */}
                        {mainStreetImpact && (
                            <div className="space-y-0.5 pt-1 border-t border-slate-900">
                                <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/80 flex items-center gap-1">
                                    <ShieldCheck size={10} /> Main Street Impact
                                </div>
                                <p className="text-[10px] leading-relaxed text-slate-300 font-normal">
                                    {mainStreetImpact}
                                </p>
                            </div>
                        )}

                        {/* Watch Thresholds */}
                        {thresholds && (
                            <div className="space-y-0.5 pt-1 border-t border-slate-900 text-[9px]">
                                <span className="font-bold uppercase tracking-wider text-amber-400/80">Watch Signal: </span>
                                <span className="text-slate-300">{thresholds}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Telemetry Tab */
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                        <span className="text-muted-foreground/60 font-medium">Source</span>
                        <span className="truncate text-right text-slate-200 font-mono">{source || 'Not recorded'}</span>

                        <span className="text-muted-foreground/60 font-medium">Frequency</span>
                        <span className="text-right text-slate-200 font-mono">{frequency || 'Not recorded'}</span>

                        <span className="text-muted-foreground/60 font-medium">State</span>
                        <span
                            className={cn(
                                'text-right uppercase font-mono font-bold',
                                status === 'fresh' || status === 'safe'
                                    ? 'text-emerald-400'
                                    : status === 'lagged' || status === 'warning'
                                    ? 'text-amber-400'
                                    : 'text-rose-400'
                            )}
                        >
                            {status}
                        </span>

                        <span className="text-muted-foreground/60 font-medium">Observed</span>
                        <span className="text-right text-slate-200 font-mono text-[9px]">
                            {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'Unavailable'}
                        </span>

                        {sourceRef && (
                            <>
                                <span className="text-muted-foreground/60 font-medium">Source Ref</span>
                                <span className="truncate text-right text-slate-200 font-mono text-[9px]">{sourceRef}</span>
                            </>
                        )}

                        {provenance && (
                            <>
                                <span className="text-muted-foreground/60 font-medium">Provenance</span>
                                <span className="truncate text-right text-emerald-400 font-mono text-[9px]">{provenance}</span>
                            </>
                        )}
                    </div>
                )}
            </div>
        </details>
    );
};
