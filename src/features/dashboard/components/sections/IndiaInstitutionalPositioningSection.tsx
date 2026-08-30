import React from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { useIndiaInstitutionalPositioning } from '@/hooks/useIndiaInstitutionalPositioning';
import { DataStatePanel } from '@/components/DataStatePanel';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { FreshnessChip } from '@/components/FreshnessChip';
import { indiaInstitutionalFreshness } from '@/lib/indiaInstitutionalFreshness';

const labels: Record<string, string> = { foreign_exit: 'Foreign exit pressure', absorption: 'Domestic absorption', flow_price: 'Flow / price divergence', sector_rotation: 'Sector rotation', market_confirmation: 'Market confirmation' };
const tone = (regime: string) => regime === 'Foreign Accumulation' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : regime === 'Synchronized Risk' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' : regime === 'Distribution' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-blue-300 border-blue-500/30 bg-blue-500/10';

export const IndiaInstitutionalPositioningSection: React.FC = () => {
  const { data, isLoading, error } = useIndiaInstitutionalPositioning();
  if (isLoading) return <div className="h-[420px] rounded-3xl bg-white/[0.02] animate-pulse" />;
  if (error || !data?.latest) return <DataStatePanel variant="empty" title="Institutional positioning unavailable" description="Validated NSE and NSDL observations are required before the India positioning regime can be published." height={260} />;
  const snapshot = data.latest;
  const freshness = indiaInstitutionalFreshness(snapshot.as_of_date, 'daily');
  const freshnessStatus = freshness === 'observed' ? 'fresh' : freshness === 'lagged' ? 'lagged' : freshness === 'historical' ? 'stale' : 'no_data';
  return <div className="space-y-8">
    <div className="flex items-start justify-between gap-6 flex-wrap">
      <div><div className="flex items-center gap-3 mb-3"><Activity className="text-blue-400" size={22} /><span className="text-xs font-black uppercase tracking-[0.18em] text-blue-400">India Institutional Positioning</span></div><h2 className="text-3xl font-black tracking-tight text-white">Capital allocation regime</h2><p className="mt-2 text-sm text-muted-foreground/60 max-w-2xl">A structural read for global macro allocators. Components retain their source coverage and calculation state.</p></div>
      <div className={`rounded-2xl border px-5 py-4 ${tone(snapshot.regime)}`}><div className="text-[10px] uppercase tracking-[0.18em] opacity-70">Current regime</div><div className="mt-1 text-lg font-black">{snapshot.regime}</div><div className="mt-1 text-xs opacity-70">As of {snapshot.as_of_date} · {snapshot.confidence}% coverage</div><div className="mt-2"><FreshnessChip status={freshnessStatus} lastUpdated={snapshot.as_of_date} label={freshness.toUpperCase()} sourceRef="computed:india-institutional-positioning" /></div></div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">Positioning score</div><div className="mt-2 text-2xl font-black text-white">{snapshot.score == null ? '—' : snapshot.score.toFixed(2)}</div></div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">Coverage</div><div className="mt-2 text-2xl font-black text-white">{snapshot.confidence}%</div></div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">Evidence domains</div><div className="mt-2 text-2xl font-black text-white">{snapshot.coverage_mask.length}/5</div></div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">Calculation</div><div className="mt-2 text-sm font-bold text-white">{snapshot.calculation_version}</div></div>
    </div>
    <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">{Object.entries(snapshot.components).map(([key, value]) => <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-white/70">{labels[key] ?? key}</span>{value.available ? (value.score != null && value.score >= 0 ? <ArrowUpRight className="text-emerald-400" size={14} /> : <ArrowDownRight className="text-rose-400" size={14} />) : <ShieldAlert className="text-amber-400" size={14} />}</div><div className="mt-4 text-2xl font-black text-white">{value.score == null ? 'Unavailable' : value.score.toFixed(2)}</div><div className="mt-2 text-[10px] text-muted-foreground/50">{value.inputs.join(' · ') || 'Coverage required'}</div></div>)}</div>
    <div className="flex items-center justify-between gap-3 flex-wrap"><DataProvenanceBadge source="NSE · NSDL" methodology="Derived signal" lastVerified={snapshot.as_of_date} size="sm" /><span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">Input dates: {(snapshot.input_dates?.daily?.length ?? 0) + (snapshot.input_dates?.sector?.length ?? 0)}</span></div>
    <div className="rounded-2xl border border-white/10 overflow-hidden"><div className="px-5 py-4 border-b border-white/10 text-xs font-black uppercase tracking-[0.16em] text-white/70">Recent regime observations</div><div className="divide-y divide-white/5">{data.history.slice(0, 10).map((row) => <div key={row.as_of_date} className="grid grid-cols-3 px-5 py-3 text-xs"><span className="text-muted-foreground/60">{row.as_of_date}</span><span className="text-white/80">{row.regime}</span><span className="text-right text-white/60">{row.score == null ? '—' : row.score.toFixed(2)}</span></div>)}</div></div>
  </div>;
};
