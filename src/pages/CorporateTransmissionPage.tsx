import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Download,
  FileSearch,
  FileText,
  Flame,
  Percent,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { DataProvenanceBadge } from '@/components/DataProvenanceBadge';
import { FreshnessChip, type FreshnessStatus } from '@/components/FreshnessChip';
import { SEOManager } from '@/components/SEOManager';
import {
  useCorporateTransmission,
  useCorporateTransmissionSummary,
  useCorporateZombieScreener,
  type ZombieScreenerRow,
} from '@/hooks/useCorporateTransmission';

function displayFreshness(status: string | null | undefined): FreshnessStatus {
  if (status === 'fresh' || status === 'lagged') return status;
  if (status === 'very_lagged') return 'overdue';
  return 'no_data';
}

function formatMillions(val: number | null): string {
  if (val === null || !Number.isFinite(val)) return '—';
  if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(1)}B`;
  return `$${val.toFixed(0)}M`;
}

export const CorporateTransmissionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'zombie' | 'signals'>('zombie');
  const [refiRate, setRefiRate] = useState<number>(0.07); // 7.00% benchmark
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [themeFilter, setThemeFilter] = useState<string>('All');

  const summary = useCorporateTransmissionSummary();
  const summaryRow = summary.data;

  // Signal feed for the disclosures tab
  const signalFilters = themeFilter === 'All' ? {} : { theme: themeFilter };
  const rawSignalsQuery = useCorporateTransmission(signalFilters);
  const signalRows = rawSignalsQuery.data ?? [];

  // Zombie Screener hook with real-time rate shock re-calculation
  const { screener, isLoading: isScreenerLoading } = useCorporateZombieScreener(
    refiRate,
    searchQuery,
    selectedTier
  );

  const { stats, issuers } = screener;

  // Export visible screener rows as CSV
  const handleExportCsv = () => {
    if (issuers.length === 0) return;
    const headers = ['Ticker', 'CIK', 'Issuer Name', 'Sector', 'EBIT ($M)', 'Total Debt ($M)', 'Implied Coupon (%)', 'Current ICR', 'Pro-Forma Refi ICR', 'Cash Runway (Qtrs)', 'Tier', 'SEC Filing URL'];
    const csvRows = [
      headers.join(','),
      ...issuers.map((i: ZombieScreenerRow) => [
        `"${i.ticker}"`,
        `"${i.cik}"`,
        `"${i.issuerName.replace(/"/g, '""')}"`,
        `"${i.sector}"`,
        i.ebit ?? '',
        i.totalDebt ?? '',
        i.existingCouponPct ? i.existingCouponPct.toFixed(2) : '',
        i.currentIcr ? i.currentIcr.toFixed(2) : '',
        i.proFormaIcr ? i.proFormaIcr.toFixed(2) : '',
        i.cashRunwayQuarters ? i.cashRunwayQuarters.toFixed(1) : '',
        `"${i.tier}"`,
        `"${i.documentUrl ?? ''}"`,
      ].join(',')),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sec_edgar_zombie_stress_${(refiRate * 100).toFixed(1)}pct_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <SEOManager
        title="Corporate Rollover Risk & Zombie Scanner"
        description="SEC EDGAR corporate debt transmission telemetry with refinancing shock analysis, interest coverage, cash runway, and issuer-level evidence."
        canonical="/corporate-transmission/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Dataset',
          name: 'Corporate Rollover Risk & Zombie Scanner',
          description: 'SEC EDGAR corporate debt transmission telemetry and refinancing shock analysis.',
          url: 'https://graphiquestor.com/corporate-transmission/',
          creator: { '@type': 'Organization', name: 'GraphiQuestor' },
          isAccessibleForFree: true,
        }}
      />
      <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Top Header & Telemetry Status Bar */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-400 font-mono">
              <span>INTELLIGENCE DESK</span>
              <span className="text-muted-foreground/40">/</span>
              <span>US SEC TRANSMISSION</span>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-500 animate-pulse" />
                ZOMBIE &amp; REFINANCING SHOCK
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground uppercase font-sans">
              Corporate Rollover Risk &amp; Zombie Scanner
            </h1>
            <p className="mt-1.5 max-w-3xl text-xs md:text-sm text-muted-foreground font-mono">
              Real-time SEC EDGAR XBRL telemetry · Trailing ICR vs. Pro-Forma Refinancing Shock · 10-K/10-Q GAAP Fact Verification
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <FreshnessChip status="fresh" lastUpdated={summaryRow?.latest_observed_at ?? undefined} sourceRef="SEC:EDGAR" />
            <DataProvenanceBadge source="SEC EDGAR" methodology="SEC-native v1" lastVerified={summaryRow?.latest_observed_at} size="sm" />
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-card hover:bg-muted text-xs font-mono font-bold text-foreground transition-all shadow-sm"
              title="Export filtered dataset to CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>EXPORT CSV</span>
            </button>
          </div>
        </header>

        {/* Main Desk Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('zombie')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === 'zombie'
                ? 'border border-red-500/50 bg-red-500/15 text-red-700 dark:text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                : 'border border-border bg-card text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${activeTab === 'zombie' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`} />
            <span>Zombie &amp; Rollover Scanner</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-700 dark:text-red-300 font-mono">
              {stats.confirmed + stats.rollover} AT RISK
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('signals')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === 'signals'
                ? 'border border-cyan-500/50 bg-cyan-500/15 text-cyan-700 dark:text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'border border-border bg-card text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>All SEC Filings &amp; Signals</span>
          </button>

          <a
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border hover:border-border bg-card text-xs font-mono text-muted-foreground hover:text-foreground transition-all shadow-sm"
          >
            <span>← Macro Maturity Wall</span>
          </a>
        </div>

        {activeTab === 'zombie' ? (
          <>
            {/* Macro Telemetry Bento Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Confirmed Zombies */}
              <div className="rounded-xl border border-red-500/30 bg-card dark:bg-gradient-to-br dark:from-red-500/10 dark:via-slate-900/90 dark:to-slate-950 p-5 shadow-sm dark:shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider mb-2 font-mono">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    CONFIRMED ZOMBIES (ICR &lt; 1.0)
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-700 dark:text-red-300 text-[9px] font-bold">CRITICAL</span>
                </div>
                <div className="text-3xl font-mono font-black text-foreground tracking-tight tabular-nums">
                  {stats.total > 0 ? `${((stats.confirmed / stats.total) * 100).toFixed(1)}%` : isScreenerLoading ? '…' : '—'}
                </div>
                <p className="text-muted-foreground text-xs mt-1.5 font-mono">
                  {stats.confirmed} of {stats.total} tracked filers cannot service existing debt from EBIT
                </p>
              </div>

              {/* Card 2: Rollover Zombie Shock */}
              <div className="rounded-xl border border-amber-500/30 bg-card dark:bg-gradient-to-br dark:from-amber-500/10 dark:via-slate-900/90 dark:to-slate-950 p-5 shadow-sm dark:shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider mb-2 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    ROLLOVER SHOCK ZOMBIES
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-bold">CLIFF EDGE</span>
                </div>
                <div className="text-3xl font-mono font-black text-amber-700 dark:text-amber-400 tracking-tight tabular-nums">
                  {stats.rollover} FIRMS
                </div>
                <p className="text-muted-foreground text-xs mt-1.5 font-mono">
                  Solvent today (ICR &gt; 1.0), but pro-forma ICR flips &lt; 1.0 when refi rolls over
                </p>
              </div>

              {/* Card 3: Debt Burden at Risk */}
              <div className="rounded-xl border border-rose-500/30 bg-card dark:bg-gradient-to-br dark:from-rose-500/10 dark:via-slate-900/90 dark:to-slate-950 p-5 shadow-sm dark:shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 text-[10px] font-black uppercase tracking-wider mb-2 font-mono">
                  <span className="flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    TOTAL DEBT AT RISK
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-200 text-[9px] font-bold font-mono">
                    {(refiRate * 100).toFixed(1)}% REFI
                  </span>
                </div>
                <div className="text-3xl font-mono font-black text-foreground tracking-tight tabular-nums">
                  {stats.debtAtRisk > 0 ? `$${(stats.debtAtRisk / 1000).toFixed(2)}B` : stats.total > 0 ? '$0M' : isScreenerLoading ? '…' : '—'}
                </div>
                <p className="text-muted-foreground text-xs mt-1.5 font-mono">
                  Cumulative debt obligations held by confirmed &amp; rollover zombie issuers
                </p>
              </div>

              {/* Card 4: Median Cash Runway */}
              <div className="rounded-xl border border-cyan-500/30 bg-card dark:bg-gradient-to-br dark:from-cyan-500/10 dark:via-slate-900/90 dark:to-slate-950 p-5 shadow-sm dark:shadow-lg relative overflow-hidden group">
                <div className="flex items-center justify-between text-cyan-700 dark:text-cyan-400 text-[10px] font-black uppercase tracking-wider mb-2 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    MEDIAN CASH RUNWAY
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-[9px] font-bold">LIQUIDITY</span>
                </div>
                <div className="text-3xl font-mono font-black text-cyan-700 dark:text-cyan-300 tracking-tight tabular-nums">
                  {stats.medianRunway !== null ? `${stats.medianRunway.toFixed(1)} QTRS` : isScreenerLoading ? '…' : '—'}
                </div>
                <p className="text-muted-foreground text-xs mt-1.5 font-mono">
                  Quarters until liquidity depletion based on trailing quarterly operating cash burn
                </p>
              </div>
            </section>

            {/* Interactive Refinancing Rate Shock Simulation Bar */}
            {/* Interactive Refinancing Rate Shock Simulation Bar */}
            <section className="rounded-xl border border-border bg-card p-5 backdrop-blur-sm shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-foreground font-mono">
                      Interactive Refinancing Rate-Shock Simulation
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    Slide benchmark refinancing rate (SOFR + Spread) to observe pro-forma interest coverage contraction in real time.
                  </p>
                </div>

                {/* Preset Buttons & Slider Controls */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5 bg-muted/60 dark:bg-slate-950/80 p-1 rounded-lg border border-border">
                    {[
                      { label: '5.50% SOFR Baseline', value: 0.055 },
                      { label: '7.00% BBB/HY Active', value: 0.07 },
                      { label: '8.50% Severe Squeeze', value: 0.085 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setRefiRate(preset.value)}
                        className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                          Math.abs(refiRate - preset.value) < 0.001
                            ? 'bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-md'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 bg-muted/60 dark:bg-slate-950/80 px-4 py-2 rounded-lg border border-border">
                    <span className="text-xs font-mono text-muted-foreground">Rate:</span>
                    <input
                      type="range"
                      min="0.04"
                      max="0.11"
                      step="0.0025"
                      value={refiRate}
                      onChange={(e) => setRefiRate(parseFloat(e.target.value))}
                      className="w-32 accent-cyan-500 cursor-pointer"
                    />
                    <span className="font-mono text-sm font-black text-cyan-700 dark:text-cyan-300 w-14 text-right">
                      {(refiRate * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Shock Readout */}
              <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                <div className="flex items-center gap-2 text-foreground">
                  <span className="text-amber-700 dark:text-amber-400 font-bold">⚡ Simulation Output:</span>
                  <span>
                    Annual Interest Drag: <strong className="text-red-700 dark:text-red-300 font-bold">+${stats.incrementalDrag.toFixed(1)}M</strong>
                  </span>
                  <span className="text-muted-foreground/40">|</span>
                  <span>
                    Rollover Shock Flips: <strong className="text-amber-700 dark:text-amber-300 font-bold">{stats.rollover} issuers</strong>
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Formula: (Total Debt - Maturing) × Existing Coupon + Maturing × {(refiRate * 100).toFixed(2)}% Refi
                </div>
              </div>
            </section>

            {/* Faceted Screener & Evidence Table */}
            <section className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              {/* Filter Strip */}
              <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-muted/40">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'All', label: `All (${stats.total})`, color: 'text-foreground' },
                    { id: 'confirmed_zombie', label: `🔴 Confirmed Zombies (${stats.confirmed})`, color: 'text-red-600 dark:text-red-400' },
                    { id: 'rollover_zombie', label: `🟠 Rollover Risk (${stats.rollover})`, color: 'text-amber-600 dark:text-amber-400' },
                    { id: 'vulnerable', label: `🟡 Vulnerable (${stats.vulnerable})`, color: 'text-yellow-600 dark:text-yellow-400' },
                    { id: 'solvent', label: `🟢 Solvent (${stats.solvent})`, color: 'text-emerald-600 dark:text-emerald-400' },
                  ].map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedTier(tier.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                        selectedTier === tier.id
                          ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-800 dark:text-white shadow-sm'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className={tier.color}>{tier.label}</span>
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Ticker, CIK, or Issuer..."
                    className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-4">Issuer &amp; Ticker</th>
                      <th className="py-3 px-3">Sector</th>
                      <th className="py-3 px-3 text-right">EBIT (TTM)</th>
                      <th className="py-3 px-3 text-right">Total Debt</th>
                      <th className="py-3 px-3 text-right">Impl. Coupon</th>
                      <th className="py-3 px-3 text-center">Current ICR</th>
                      <th className="py-3 px-3 text-center">Refi ICR ({(refiRate * 100).toFixed(0)}%)</th>
                      <th className="py-3 px-3 text-right">Cash Runway</th>
                      <th className="py-3 px-4 text-center">SEC EDGAR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isScreenerLoading ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-muted-foreground font-mono">
                          Loading SEC EDGAR XBRL observations…
                        </td>
                      </tr>
                    ) : issuers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-muted-foreground font-mono">
                          No corporate issuers found matching the specified filters.
                        </td>
                      </tr>
                    ) : (
                      issuers.map((row: ZombieScreenerRow) => (
                        <tr key={row.issuerId} className="hover:bg-muted/40 transition-colors group">
                          {/* Issuer & Ticker */}
                          <td className="py-3.5 px-4 font-sans">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-foreground text-xs bg-muted/70 px-2 py-0.5 rounded border border-border">
                                {row.ticker || '—'}
                              </span>
                              <span className="font-semibold text-foreground text-xs truncate max-w-[200px]" title={row.issuerName}>
                                {row.issuerName}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground block mt-0.5">CIK: {row.cik}</span>
                          </td>

                          {/* Sector */}
                          <td className="py-3.5 px-3 text-muted-foreground text-xs">
                            <span className="truncate block max-w-[140px]" title={row.sector}>
                              {row.sector}
                            </span>
                          </td>

                          {/* EBIT */}
                          <td className="py-3.5 px-3 text-right tabular-nums">
                            <span className={row.ebit !== null && row.ebit < 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-foreground'}>
                              {formatMillions(row.ebit)}
                            </span>
                          </td>

                          {/* Total Debt */}
                          <td className="py-3.5 px-3 text-right tabular-nums text-foreground">
                            {formatMillions(row.totalDebt)}
                          </td>

                          {/* Implied Coupon */}
                          <td className="py-3.5 px-3 text-right tabular-nums text-muted-foreground">
                            {row.existingCouponPct ? `${row.existingCouponPct.toFixed(2)}%` : '—'}
                          </td>

                          {/* Current ICR */}
                          <td className="py-3.5 px-3 text-center">
                            {row.currentIcr !== null ? (
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-bold font-mono inline-block min-w-[52px] ${
                                  row.currentIcr < 1.0
                                    ? 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                                    : row.currentIcr < 1.75
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {row.currentIcr.toFixed(2)}x
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </td>

                          {/* Pro-Forma Refi ICR */}
                          <td className="py-3.5 px-3 text-center">
                            {row.proFormaIcr !== null ? (
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-bold font-mono inline-flex items-center gap-1 min-w-[56px] justify-center ${
                                  row.proFormaIcr < 1.0
                                    ? 'bg-red-600/20 text-red-700 dark:text-red-200 border border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
                                    : row.proFormaIcr < 1.75
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {row.currentIcr !== null && row.currentIcr >= 1.0 && row.proFormaIcr < 1.0 && (
                                  <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                )}
                                {row.proFormaIcr.toFixed(2)}x
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </td>

                          {/* Cash Runway */}
                          <td className="py-3.5 px-3 text-right tabular-nums">
                            {row.cashRunwayQuarters !== null ? (
                              <span className={row.cashRunwayQuarters < 4 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-foreground'}>
                                {row.cashRunwayQuarters.toFixed(1)} Q
                              </span>
                            ) : (
                              <span className="text-muted-foreground">CFO Positive</span>
                            )}
                          </td>

                          {/* SEC EDGAR Link */}
                          <td className="py-3.5 px-4 text-center">
                            {row.documentUrl ? (
                              <a
                                href={row.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 hover:underline font-mono"
                                title="Open SEC EDGAR 10-K / 10-Q filing"
                              >
                                <span>Notes</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Pagination Info */}
              <div className="p-3 bg-muted/40 border-t border-border text-[11px] font-mono text-muted-foreground flex items-center justify-between">
                <span>Showing {issuers.length} of {stats.total} tracked corporate filers</span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Institutional observation mode · No synthetic defaults</span>
                </span>
              </div>
            </section>
          </>
        ) : (
          /* Disclosures & General Signals Tab */
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {['All', 'corporate_stress', 'industrial_cycle'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setThemeFilter(item)}
                  className={`rounded border px-3 py-1.5 text-xs font-mono font-bold transition-all ${
                    themeFilter === item
                      ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>

            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="grid grid-cols-[1.3fr_1fr_1fr_0.8fr_0.8fr] gap-3 border-b border-border bg-muted/40 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground font-mono">
                <span>Issuer</span>
                <span>Signal</span>
                <span>Theme</span>
                <span>State</span>
                <span>Severity</span>
              </div>
              {rawSignalsQuery.isLoading ? (
                <p className="p-6 text-sm text-muted-foreground font-mono">Loading SEC evidence…</p>
              ) : signalRows.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground font-mono">No current signals available for this filter.</p>
              ) : (
                signalRows.map((row) => (
                  <article
                    key={row.id}
                    className="grid grid-cols-[1.3fr_1fr_1fr_0.8fr_0.8fr] gap-3 border-b border-border px-4 py-4 text-sm last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-foreground font-sans">{row.issuer_name ?? 'Unknown issuer'}</p>
                      <p className="text-xs text-muted-foreground font-mono">{row.ticker ?? row.cik}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground font-mono text-xs">{row.signal_id}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {row.numeric_value !== null ? row.numeric_value.toFixed(2) : '—'} {row.unit ?? ''}
                      </p>
                      {row.evidence_text ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{row.evidence_text}</p>
                      ) : null}
                      {row.document_url ? (
                        <a
                          className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-300 hover:underline font-mono"
                          href={row.document_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span>Open SEC filing</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground font-mono text-xs">{row.macro_theme ?? '—'}</p>
                    <p className="text-muted-foreground font-mono text-xs">{row.state ?? '—'}</p>
                    <div>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold uppercase font-mono ${
                          row.severity === 'high'
                            ? 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                            : row.severity === 'elevated'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {row.severity ?? '—'}
                      </span>
                      <div className="mt-2">
                        <FreshnessChip
                          status={displayFreshness(row.freshness_status)}
                          lastUpdated={row.observed_at ?? undefined}
                        />
                      </div>
                    </div>
                  </article>
                ))
              )}
            </section>
          </div>
        )}

        {/* Institutional Desk Footer */}
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <FileSearch className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>SEC EDGAR XBRL companyfacts API</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Deterministic ICR calculation</span>
            </span>
          </div>
          <div>
            <span>PROPRIETARY TELEMETRY DESK · GRAPHIQUESTOR</span>
          </div>
        </footer>

      </div>
      </main>
    </>
  );
};
