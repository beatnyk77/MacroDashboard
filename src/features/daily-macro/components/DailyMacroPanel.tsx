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
import { RefreshCw, Activity, AlertTriangle } from 'lucide-react';
import { FreshnessChip } from '@/components/FreshnessChip';
import { useStaleness } from '@/hooks/useStaleness';

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
      <div className="flex-1 space-y-4">
        <div className="h-4 w-full rounded bg-white/10" />
        <div className="h-4 w-3/4 rounded bg-white/10" />
        <div className="h-4 w-1/2 rounded bg-white/10" />
        <div className="pt-4 space-y-2">
          <div className="h-2 w-full rounded bg-white/5" />
          <div className="h-2 w-full rounded bg-white/5" />
        </div>
      </div>
      <div className="hidden md:block w-[220px] h-[220px] rounded-2xl bg-white/5" />
    </div>
    <div className="mt-8 h-32 rounded-2xl bg-white/5" />
  </div>
);

// ─── Inner (data ready) ────────────────────────────────────────────────────

const DailyMacroPanelInner: React.FC = () => {
  const { data: signal, isLoading: signalLoading, isError: signalError, refetch: refetchSignal } = useDailyMacroSignal();
  const { data: changes = [], isLoading: changesLoading, refetch: refetchChanges } = useDailyChanges(signal?.signal_date);
  const { data: contradictions = [] } = useContradictions(signal?.signal_date);
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

  const staleness = useStaleness(signal?.computed_at, 'daily');
  // Use date-equality check (signal.is_stale) as the primary gate — catches a missed cron
  // on the same day. useStaleness alone would not show a warning for 48h.
  const isStale = !!signal?.is_stale || staleness.state !== 'fresh';

  if (signalError) {
    return (
      <div
        className="rounded-2xl p-8 flex flex-col items-center justify-center text-center border border-white/10"
        style={{
          background: 'rgba(8,12,24,0.7)',
          backdropFilter: 'blur(12px)',
          minHeight: '260px'
        }}
      >
        <AlertTriangle className="text-red-500 mb-3" size={28} />
        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">
          Daily Macro Signal Temporarily Unavailable
        </h3>
        <p className="text-xs text-white/60 max-w-md mb-6 leading-relaxed">
          The macro intelligence engine is currently unable to retrieve the latest signals. Our engineering team has been notified.
        </p>
        <button
          onClick={() => refetchSignal()}
          className="text-[10px] font-black uppercase tracking-widest px-5 py-2.5 bg-white/5 border border-white/15 hover:bg-white/10 active:scale-95 rounded-lg transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (signalLoading || !signal) return <PanelSkeleton />;

  const signalHealth = health.find(h => h.job_name === 'compute-daily-macro-signal');

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'rgba(8,12,24,0.7)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
        opacity: isRefreshing ? 0.7 : 1,
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
          
          <FreshnessChip 
            status={staleness.state} 
            lastUpdated={signal.computed_at}
          />

          {/* Pipeline Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/5">
            <div className={`w-1 h-1 rounded-full ${signalHealth ? 'bg-emerald-400' : 'bg-white/20'}`} />
            <span className="text-[8px] font-bold text-white/40 uppercase tracking-tighter">
              Pipeline: {signalHealth ? 'Active' : 'Offline'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div
              className="text-[9px] font-mono leading-none mb-1 uppercase tracking-widest opacity-30"
            >
              Last Computed
            </div>
            <div className="text-[10px] font-mono font-bold text-white/70">
              {new Date(signal.computed_at).toLocaleTimeString(undefined, { 
                hour: '2-digit', minute: '2-digit'
              })}
              <span className="mx-1 opacity-20">|</span>
              {new Date(signal.signal_date).toLocaleDateString(undefined, { 
                month: 'short', day: 'numeric'
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
            <span className="text-[10px] font-black uppercase tracking-wider">
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>
        </div>
      </div>

      {/* Stale Warning Banner */}
      {isStale && (
        <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={14} className="text-amber-500" />
            <span className="text-[11px] font-bold text-amber-500/80 uppercase tracking-tight">
              Intelligence may be delayed. Showing last known good signal.
            </span>
          </div>
          <button 
            onClick={handleRefresh}
            className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-amber-500 text-black rounded hover:bg-amber-400 transition-colors"
          >
            Update Now
          </button>
        </div>
      )}

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
            refreshing={isRefreshing}
          />

          {/* Morning Brief */}
          <MacroBriefCard signal={signal} refreshing={isRefreshing} />

          {/* Contradictions (Phase 2 — renders nothing if empty) */}
          {contradictions.length > 0 && (
            <div className={`md:w-[220px] flex-shrink-0 transition-opacity duration-300 ${isRefreshing ? 'opacity-40' : 'opacity-100'}`}>
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

