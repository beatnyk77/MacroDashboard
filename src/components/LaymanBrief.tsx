import React, { useState } from 'react';
import { useViewContext } from '@/context/ViewContext';
import { Lightbulb, ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LaymanBriefProps {
  title: string;
  analogy: string;
  realWorldImpact: string;
  signalsToWatch: string[];
  status?: 'normal' | 'caution' | 'danger';
  statusLabel?: string;
  className?: string;
}

export const LaymanBrief: React.FC<LaymanBriefProps> = ({
  title,
  analogy,
  realWorldImpact,
  signalsToWatch,
  status = 'normal',
  statusLabel,
  className,
}) => {
  const { isInstitutionalView } = useViewContext();
  // In Plain English mode, expand by default; in Institutional Pro mode, collapsed by default
  const [isOpen, setIsOpen] = useState(!isInstitutionalView);

  const getStatusConfig = () => {
    switch (status) {
      case 'danger':
        return {
          badgeBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          icon: <AlertOctagon size={13} className="text-rose-400" />,
          defaultLabel: 'HIGH SYSTEMIC RISK',
        };
      case 'caution':
        return {
          badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icon: <AlertTriangle size={13} className="text-amber-400" />,
          defaultLabel: 'MODERATE FRICTION',
        };
      case 'normal':
      default:
        return {
          badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: <ShieldCheck size={13} className="text-emerald-400" />,
          defaultLabel: 'HEALTHY / NORMAL',
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-300 backdrop-blur-xl overflow-hidden mb-8',
        isOpen
          ? 'bg-gradient-to-br from-cyan-950/25 via-slate-900/60 to-indigo-950/20 border-cyan-500/25 shadow-lg shadow-cyan-950/30'
          : 'bg-slate-900/40 border-white/5 hover:border-white/10',
        className
      )}
    >
      {/* Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-3.5 flex items-center justify-between cursor-pointer select-none group"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
            <Lightbulb size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider uppercase text-cyan-300">
                Plain-English Guide
              </span>
              <span className="text-[10px] font-mono text-muted-foreground/60">
                • {title}
              </span>
            </div>
            {!isOpen && (
              <p className="text-xs text-muted-foreground/80 line-clamp-1 mt-0.5 font-medium">
                {analogy}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={cn(
              'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border',
              statusConfig.badgeBg
            )}
          >
            {statusConfig.icon}
            <span>{statusLabel || statusConfig.defaultLabel}</span>
          </div>

          <button
            type="button"
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground group-hover:text-white transition-colors"
            aria-label={isOpen ? 'Collapse guide' : 'Expand guide'}
          >
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-cyan-500/15 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* 1. The Core Idea */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
                <HelpCircle size={13} />
                <span>What is happening?</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-normal">
                {analogy}
              </p>
            </div>

            {/* 2. Real World Impact */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                <AlertTriangle size={13} />
                <span>Why does this matter to you?</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-normal">
                {realWorldImpact}
              </p>
            </div>

            {/* 3. Signals to Watch */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-indigo-300 font-bold uppercase tracking-wider text-[11px]">
                <ShieldCheck size={13} />
                <span>What warning signs to watch</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 font-normal">
                {signalsToWatch.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-tight">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LaymanBrief;
