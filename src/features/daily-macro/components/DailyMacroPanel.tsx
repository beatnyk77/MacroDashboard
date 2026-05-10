/**
 * DailyMacroPanel
 * Top-level composite component for the Daily Macro Layer.
 * Placed once in Terminal.tsx before the Sovereign Compass section.
 *
 * Layout:
 *   Row 1: [RegimeOrb] [MacroBriefCard] [ContradictionAlert?]
 *   Row 2: [OvernightChanges?]
 */

import React from 'react';
import { useDailyMacroSignal } from '../hooks/useDailyMacroSignal';
import { useDailyChanges } from '../hooks/useDailyChanges';
import { useContradictions } from '../hooks/useContradictions';
import { RegimeOrb } from './RegimeOrb';
import { MacroBriefCard } from './MacroBriefCard';
import { OvernightChanges } from './OvernightChanges';
import { ContradictionAlert } from './ContradictionAlert';
import { useIngestionHealth } from '../hooks/useIngestionHealth';
import { SectionErrorBoundary } from './SectionErrorBoundary';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react';

// ─── Skeleton ──────────────────────────────────────────────────────────────

const PanelSkeleton = () => (
  <div
    className="rounded-2xl p-6 animate-pulse"
    style={{
      background: 'rgba(8,12,24,0.7)',
      border: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(12px)',
    }}
  >
    <div className="flex justify-between items-center mb-8">
      <div className="h-4 w-48 rounded bg-white/10" />
      <div className="h-4 w-24 rounded bg-white/10" />
    </div>
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-[220px] h-[220px] rounded-2xl bg-white/5" />
      <div className="flex-1 h-[220px] rounded-2xl bg-white/5" />
      <div className="hidden md:block w-[220px] h-[220px] rounded-2xl bg-white/5" />
    </div>
    <div className="mt-8 h-32 rounded-2xl bg-white/5" />
  </div>
);

// ─── Inner (data ready) ────────────────────────────────────────────────────

const DailyMacroPanelInner: React.FC = () => {
  const { data: signal, isLoading: signalLoading, refetch: refetchSignal } = useDailyMacroSignal();
  const { data: changes = [], isLoading: changesLoading, refetch: refetchChanges } = useDailyChanges();
  const { data: contradictions = [] } = useContradictions();
  const { data: health = [] } = useIngestionHealth();
  
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger the engine refresh
      const { error } = await supabase.functions.invoke('compute-daily-macro-signal');
      if (error) throw error;
      
      // Refetch queries
      await Promise.all([refetchSignal(), refetchChanges()]);
    } catch (err) {
      console.error('[DailyMacroPanel] Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (signalLoading || !signal) return <PanelSkeleton />;

  const signalHealth = health.find(h => h.job_name === 'compute-daily-macro-signal');
  const isStale = signal.is_stale;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(8,12,24,0.7)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header bar */}
      <div
        className="flex flex-wrap items-center justify-between px-5 py-3 gap-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-3">
          <Activity size={12} className="text-blue-400/50" />
          <span
            className="text-[10px] font-black uppercase tracking-[0.3em]"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Daily Macro Signal
          </span>
          <div
            className={`text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 ${
              isStale 
                ? 'bg-amber-500/10 text-amber-500/80 border border-amber-500/20' 
                : 'bg-emerald-500/10 text-emerald-500/80 border border-emerald-500/20'
            }`}
          >
            {isStale ? (
              <>
                <Clock size={10} />
                Historical Fallback
              </>
            ) : (
              <>
                <CheckCircle size={10} />
                Real-Time Fresh
              </>
            )}
          </div>

          {/* Pipeline Status */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/5">
            <div className={`w-1 h-1 rounded-full ${signalHealth ? 'bg-emerald-400' : 'bg-white/20'}`} />
            <span className="text-[8px] font-bold text-white/40 uppercase tracking-tighter">
              Pipeline: {signalHealth ? 'Active' : 'Offline'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div
              className="text-[9px] font-mono leading-none mb-1"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              DATA AS OF
            </div>
            <div className="text-[10px] font-mono font-bold text-white/70">
              {new Date(signal.signal_date).toLocaleDateString(undefined, { 
                month: 'short', day: 'numeric', year: 'numeric' 
              })}
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
              isRefreshing 
                ? 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-95'
            }`}
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="p-5">
        {/* Row 1: Orb + Brief + Contradictions */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Regime Orb */}
          <RegimeOrb
            regime={signal.regime}
            score={signal.score}
            confidence_pct={signal.confidence_pct}
            score_delta={signal.score_delta}
            regime_changed={signal.regime_changed}
          />

          {/* Morning Brief */}
          <MacroBriefCard signal={signal} />

          {/* Contradictions (Phase 2 — renders nothing if empty) */}
          {contradictions.length > 0 && (
            <div className="md:w-[220px] flex-shrink-0">
              <ContradictionAlert contradictions={contradictions} />
            </div>
          )}
        </div>

        {/* Row 2: Overnight Changes (Phase 2 — renders nothing if empty) */}
        <OvernightChanges changes={changes} isLoading={changesLoading} />
      </div>
    </div>
  );
};

// ─── Public export (with error boundary) ──────────────────────────────────

export const DailyMacroPanel: React.FC = () => {
  return (
    <SectionErrorBoundary title="Daily Macro Briefing">
      <DailyMacroPanelInner />
    </SectionErrorBoundary>
  );
};
