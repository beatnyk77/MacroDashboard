import { useState } from 'react';
import { AlertTriangle, FileText, ShieldCheck } from 'lucide-react';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { FreshnessChip, type FreshnessStatus } from '@/components/FreshnessChip';
import { useCorporateTransmission, useCorporateTransmissionSummary } from '@/hooks/useCorporateTransmission';

const themes = ['All', 'corporate_stress', 'industrial_cycle'];

function displayFreshness(status: string | null | undefined): FreshnessStatus {
  if (status === 'fresh' || status === 'lagged') return status;
  if (status === 'very_lagged') return 'overdue';
  return 'no_data';
}

export const CorporateTransmissionPage = () => {
  const [theme, setTheme] = useState('All');
  const filters = theme === 'All' ? {} : { theme };
  const signals = useCorporateTransmission(filters);
  const summary = useCorporateTransmissionSummary();
  const summaryRow = summary.data;
  const signalRows = signals.data ?? [];

  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Corporate Transmission</p>
          <h1 className="text-2xl font-black tracking-tight">Strategic Exposure &amp; Stress Monitor</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Observed corporate disclosures linked to liquidity, industrial-cycle, and strategic supply-chain transmission.</p>
        </div>
        <DataProvenanceBadge source="SEC EDGAR" methodology="SEC-native v1" lastVerified={summaryRow?.latest_observed_at} size="sm" />
      </header>

      {summary.isError || signals.isError ? <div className="mb-6 rounded border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200"><AlertTriangle className="mr-2 inline h-4 w-4" />Corporate transmission data is unavailable.</div> : null}
      <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Active issuers', summaryRow?.active_issuers],
          ['Current signals', summaryRow?.total_signals],
          ['Changed', summaryRow?.changed_signals],
          ['High severity', summaryRow?.high_signals],
        ].map(([label, value]) => <div key={String(label)} className="rounded border border-white/10 bg-white/[0.03] p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-white">{value ?? '—'}</p></div>)}
      </section>

      <div className="mb-5 flex flex-wrap gap-2">{themes.map((item) => <button key={item} type="button" onClick={() => setTheme(item)} className={`rounded border px-3 py-1.5 text-xs font-bold ${theme === item ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200' : 'border-white/10 text-slate-400'}`}>{item.replace('_', ' ')}</button>)}</div>
      <section className="overflow-hidden rounded border border-white/10 bg-white/[0.02]">
        <div className="grid grid-cols-[1.3fr_1fr_1fr_0.8fr_0.8fr] gap-3 border-b border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500"><span>Issuer</span><span>Signal</span><span>Theme</span><span>State</span><span>Severity</span></div>
        {signals.isLoading ? <p className="p-6 text-sm text-slate-500">Loading SEC evidence…</p> : signalRows.length === 0 ? <p className="p-6 text-sm text-slate-500">No current signals available.</p> : signalRows.map((row) => <article key={row.id} className="grid grid-cols-[1.3fr_1fr_1fr_0.8fr_0.8fr] gap-3 border-b border-white/5 px-4 py-4 text-sm last:border-0"><div><p className="font-bold text-white">{row.issuer_name ?? 'Unknown issuer'}</p><p className="text-xs text-slate-500">{row.ticker ?? row.cik}</p></div><div><p className="font-semibold text-slate-200">{row.signal_id}</p><p className="text-xs text-slate-500">{row.numeric_value ?? '—'} {row.unit ?? ''}</p>{row.evidence_text ? <p className="mt-2 line-clamp-2 text-xs text-slate-500">{row.evidence_text}</p> : null}{row.document_url ? <a className="mt-1 inline-block text-xs text-cyan-300 hover:underline" href={row.document_url} target="_blank" rel="noreferrer">Open SEC filing ↗</a> : null}</div><p className="text-slate-400">{row.macro_theme ?? '—'}</p><p className="text-slate-400">{row.state ?? '—'}</p><div><span className="rounded bg-white/5 px-2 py-1 text-xs font-bold uppercase text-amber-200">{row.severity ?? '—'}</span><div className="mt-2"><FreshnessChip status={displayFreshness(row.freshness_status)} lastUpdated={row.observed_at ?? undefined} /></div></div></article>)}
      </section>
      <footer className="mt-5 flex flex-wrap gap-4 text-xs text-slate-500"><span><FileText className="mr-1 inline h-3 w-3" />Evidence-linked observations</span><span><ShieldCheck className="mr-1 inline h-3 w-3 text-emerald-400" />No directional recommendation</span></footer>
    </div>
  </main>;
};
