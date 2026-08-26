import React from 'react';
import { Activity, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataDiagnosticsDisclosureProps {
    source: string;
    frequency: string;
    lastUpdated?: string | Date;
    status: string;
    sourceRef?: string | null;
    provenance?: string | null;
}

export const DataDiagnosticsDisclosure: React.FC<DataDiagnosticsDisclosureProps> = ({
    source,
    frequency,
    lastUpdated,
    status,
    sourceRef,
    provenance,
}) => (
    <details className="group text-xs">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-muted-foreground/50 transition-colors hover:border-white/20 hover:text-white/80">
            <Activity size={11} /> Diagnostics <ChevronDown size={11} className="transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-2 grid min-w-[220px] grid-cols-2 gap-x-4 gap-y-1 rounded-lg border border-white/10 bg-slate-950/95 p-2.5 text-[10px] shadow-xl" role="status">
            <span className="text-muted-foreground/45">Source</span><span className="truncate text-right text-white/70">{source || 'Not recorded'}</span>
            <span className="text-muted-foreground/45">Frequency</span><span className="text-right text-white/70">{frequency || 'Not recorded'}</span>
            <span className="text-muted-foreground/45">State</span><span className={cn('text-right uppercase', status === 'fresh' || status === 'safe' ? 'text-emerald-400' : status === 'lagged' || status === 'warning' ? 'text-amber-400' : 'text-rose-400')}>{status}</span>
            <span className="text-muted-foreground/45">Observed</span><span className="text-right text-white/70">{lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Unavailable'}</span>
            {sourceRef && <><span className="text-muted-foreground/45">Source ref</span><span className="truncate text-right text-white/70">{sourceRef}</span></>}
            {provenance && <><span className="text-muted-foreground/45">Provenance</span><span className="truncate text-right text-white/70">{provenance}</span></>}
        </div>
    </details>
);
