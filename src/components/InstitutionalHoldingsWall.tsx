import React from 'react';
import { Building2, Shield, TrendingUp, Users, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { useSmartMoneyHoldings } from '@/hooks/useSmartMoneyHoldings';
import { SectionErrorBoundary } from './SectionErrorBoundary';
import TradeTape from './TradeTape';
import { cn } from '@/lib/utils';

const COLORS = {
  equity: '#0df259',
  bond: '#fbbf24',
  gold: '#818cf8',
  other: '#94a3b8',
  bull: '#0df259',
  bear: '#f87171',
  neutral: '#22d3ee',
  cyan: '#22d3ee'
} as const;

const colorMap: Record<string, string> = {
  Technology: '#0df259',
  Financials: '#fbbf24',
  Healthcare: '#818cf8',
  Consumer: '#f87171',
  Energy: '#22d3ee',
  Industrials: '#a78bfa',
  Communication: '#fb923c',
};

const InstitutionalHoldingsWall: React.FC = () => {
  const { institutions, collective, aggregatedTopHoldings, collectiveHistory, formatAUM, heatmapData } = useSmartMoneyHoldings();
  if (!collective) return null;

  const regimeScore = collective.avg_regime_z * 10;
  const riskSignal = collective.risk_signal;

  // Derived: avg sector allocation across top institutions for bar chart (Row 5, Col 1)
  const sectorAllocationMap = new Map<string, { sum: number; count: number }>();
  heatmapData.forEach(inst => {
    Object.entries(inst.sectors).forEach(([sector, data]) => {
      const existing = sectorAllocationMap.get(sector);
      if (existing) {
        existing.sum += data.allocation;
        existing.count++;
      } else {
        sectorAllocationMap.set(sector, { sum: data.allocation, count: 1 });
      }
    });
  });
  const sectorAllocationData = Array.from(sectorAllocationMap.entries())
    .map(([sector, data]) => ({
      sector,
      allocation: data.sum / data.count,
      color: colorMap[sector] || COLORS.neutral
    }))
    .sort((a, b) => b.allocation - a.allocation);

  const top15Institutions = institutions.slice(0, 15);
  const stackedData = collectiveHistory.map(point => ({
    quarter: point.quarter.slice(0, 7),
    equity: point.equity_pct,
    bond: point.bond_pct,
    gold: point.gold_pct,
    other: point.other_pct
  }));

  return (
    <div className="space-y-20">
      {/* Row 0: TradeTape (not counted in 5 rows, sits at very top) */}
      <div className="mb-6">
        <TradeTape />
      </div>

      {/* ────────────────────────────────────────── */}
      {/* ROW 1 — Header: Title, subtitle, AUM block */}
      {/* ────────────────────────────────────────── */}
      <section className="card-section">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end mb-6">
          {/* Left: Title + icon */}
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-emerald-500/12 border border-emerald-500/30 rounded-xl shadow-[0_0_20px_rgba(13,242,89,0.08)]">
              <Building2 size={28} className="text-emerald-400" strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-foreground uppercase tracking-tight leading-none mb-2">
                INSTITUTIONAL PULSE
              </h2>
              <p className="text-sm font-bold text-muted-foreground/70 uppercase tracking-[0.05em]">
                Smart Money 13-F Allocation Monitor
              </p>
            </div>
          </div>

          {/* Right: Total AUM counters */}
          <div className="text-right shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">
              Total AUM Tracked
            </div>
            <div className="font-black font-mono text-foreground text-[2rem] leading-none tracking-tight" style={{ color: COLORS.equity }}>
              {formatAUM(collective.total_aum)}
            </div>
            <div className="text-xs text-muted-foreground/60 font-semibold mt-0.5">
              Across {collective.institution_count} institutions
            </div>
          </div>
        </div>

        {/* Context meta bar */}
        <div className="flex flex-wrap justify-between items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50">
          <div className="italic">
            Quarterly 13-F filings • 45-day lag • Data sourced from SEC EDGAR & Alpha Vantage
          </div>
          <div className="font-mono">
            AS OF {new Date(collective.as_of_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────── */}
      {/* ROW 2 — Allocation Snapshot (stacked area chart, full-width) */}
      {/* ────────────────────────────────────────── */}
      <section className="card-section">
        <div className="flex items-end justify-between mb-6">
          <h3 className="text-2xl font-black text-foreground tracking-tight">
            Asset Allocation Trend
            <span className="text-muted-foreground/60 font-bold text-base ml-3 font-sans">(8 Quarters)</span>
          </h3>
          {/* Legend */}
          <div className="flex items-center gap-x-5 gap-y-2 flex-wrap text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
            {['equity', 'bond', 'gold', 'other'].map((key, i) => (
              <div key={key} className="flex items-center gap-2 whitespace-nowrap">
                <span
                  className="w-3 h-3 rounded-full border border-white/10 shadow-sm"
                  style={{ backgroundColor: Object.values(COLORS)[i] }}
                />
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/30 border border-white/8 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800/5 to-transparent pointer-events-none" />
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={stackedData} margin={{ top: 12, right: 30, left: 0, bottom: 0 }}>
              <defs>
                {['Equity', 'Bond', 'Gold', 'Other'].map((key) => {
                  const colorKey = key.toLowerCase() as keyof typeof COLORS;
                  return (
                    <linearGradient key={key} id={`grad${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[colorKey]} stopOpacity={0.88} />
                      <stop offset="95%" stopColor={COLORS[colorKey]} stopOpacity={0.12} />
                    </linearGradient>
                  );
                })}
              </defs>
              <XAxis
                dataKey="quarter"
                tick={{ fill: '#94a3b8', fontSize: 12.5, fontFamily: 'monospace', fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'monospace', fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 12,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  padding: '10px 12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.35)'
                }}
                formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name.toUpperCase()]}
              />
              <Area type="monotone" dataKey="equity" stackId="1" stroke={COLORS.equity} strokeWidth={2} fill="url(#gradEquity)" />
              <Area type="monotone" dataKey="bond" stackId="1" stroke={COLORS.bond} strokeWidth={2} fill="url(#gradBond)" />
              <Area type="monotone" dataKey="gold" stackId="1" stroke={COLORS.gold} strokeWidth={2} fill="url(#gradGold)" />
              <Area type="monotone" dataKey="other" stackId="1" stroke={COLORS.other} strokeWidth={2} fill="url(#gradOther)" />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, paddingTop: '16px', color: '#94a3b8' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ────────────────────────────────────────── */}
      {/* ROW 3 — Recent Flows (TradeTape + summary stats) */}
      {/* ────────────────────────────────────────── */}
      <section className="card-section">
        <h3 className="text-2xl font-black text-foreground tracking-tight mb-6">
          Recent Institutional Flows
          <span className="text-muted-foreground/50 font-bold text-sm ml-2 font-sans uppercase tracking-wider">
            Live signals
          </span>
        </h3>

        <div className="bg-gradient-to-b from-slate-900/40 to-transparent border border-white/8 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Inferred trade signals from 13-F changes
          </div>
          <TradeTape />
        </div>

        {/* Summary KPI row below tape */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/8 p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/3 to-transparent" />
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 relative z-10">
              Net Buys (7d)
            </div>
            <div className="font-black font-mono text-foreground text-2xl leading-none relative z-10" style={{ color: COLORS.bull }}>
              +12
            </div>
            <div className="text-[10px] text-muted-foreground/50 mt-1 relative z-10">institutions</div>
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-950/8 p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-rose-500/3 to-transparent" />
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 relative z-10">
              Net Sells (7d)
            </div>
            <div className="font-black font-mono text-foreground text-2xl leading-none relative z-10" style={{ color: COLORS.bear }}>
              -9
            </div>
            <div className="text-[10px] text-muted-foreground/50 mt-1 relative z-10">institutions</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">
              Avg Conviction
            </div>
            <div className="font-black font-mono text-foreground text-2xl leading-none">
              C7.8
            </div>
            <div className="text-[10px] text-muted-foreground/50 mt-1">out of 10</div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────── */}
      {/* ROW 4 — Top Institutions Table (full-width, sortable) */}
      {/* ────────────────────────────────────────── */}
      <section className="card-section">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-cyan-400" strokeWidth={1.8} />
            <h3 className="text-2xl font-black text-foreground tracking-tight">
              Top Institutions by AUM
            </h3>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {top15Institutions.length} tracked
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 overflow-hidden bg-slate-900/30 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono border-collapse">
              <thead>
                <tr className="border-b border-white/12 bg-slate-950/70">
                  <th className="text-left py-4 px-4 text-cyan-300 font-black text-[11px] uppercase tracking-[0.15em] w-16">#</th>
                  <th className="text-left py-4 px-4 text-cyan-300 font-black text-[11px] uppercase tracking-[0.15em] min-w-[260px]">Institution</th>
                  <th className="text-left py-4 px-4 text-cyan-300 font-black text-[11px] uppercase tracking-[0.15em] w-32">Type</th>
                  <th className="text-right py-4 px-4 text-cyan-300 font-black text-[11px] uppercase tracking-[0.15em] w-40">Total AUM</th>
                  <th className="text-right py-4 px-4 text-cyan-300 font-black text-[11px] uppercase tracking-[0.15em] w-20">QoQ</th>
                  <th className="text-left py-4 px-4 text-cyan-300 font-black text-[11px] uppercase tracking-[0.15em]">Sector Mix</th>
                </tr>
              </thead>
              <tbody>
                {top15Institutions.map((inst, idx) => {
                  const isEven = idx % 2 === 0;
                  const qoqColor = inst.qoq_delta >= 0 ? COLORS.bull : COLORS.bear;
                  return (
                    <tr
                      key={inst.cik}
                      className={cn(
                        "border-b border-white/8 transition-colors hover:bg-white/[0.015]",
                        isEven ? 'bg-slate-900/20' : 'bg-slate-900/10'
                      )}
                    >
                      <td className="py-4 px-4 text-muted-foreground/50 font-black text-sm">
                        #{idx + 1}
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-black text-foreground text-sm leading-tight mb-1 max-w-[320px] truncate">
                            {inst.fund_name}
                          </div>
                          <div className="text-[10px] text-muted-foreground/40 font-semibold uppercase tracking-wider">
                            CIK {inst.cik}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-slate-800/40 text-slate-300 border border-slate-700/20">
                          {inst.fund_type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-foreground font-black text-sm">
                        {formatAUM(inst.total_aum)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-sm" style={{ color: qoqColor }}>
                        {inst.qoq_delta >= 0 ? '+' : ''}{inst.qoq_delta.toFixed(1)}%
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-x-4 gap-y-2 text-xs font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.equity }} />
                            <span className="text-muted-foreground/60 font-semibold">EQ</span>
                            <span className="text-foreground">{inst.asset_class_allocation?.equity_pct.toFixed(1) || '0.0'}%</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.bond }} />
                            <span className="text-muted-foreground/60 font-semibold">BD</span>
                            <span className="text-foreground">{inst.asset_class_allocation?.bond_pct.toFixed(1) || '0.0'}%</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.gold }} />
                            <span className="text-muted-foreground/60 font-semibold">GD</span>
                            <span className="text-foreground">{inst.asset_class_allocation?.gold_pct.toFixed(1) || '0.0'}%</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────── */}
      {/* ROW 5 — Deep-Dive (2-column: Sector tilt bar + Concentration) */}
      {/* ────────────────────────────────────────── */}
      <section className="card-section">
        <div className="mb-6">
          <h3 className="text-2xl font-black text-foreground tracking-tight">
            Smart Money Deep Dive
          </h3>
          <p className="text-xs text-muted-foreground/50 font-semibold uppercase tracking-wider mt-1">
            Sector tilt distribution & concentration risk metrics
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Column 1 — Sector Tilt Bar Chart */}
          <div className="bg-slate-900/30 border border-white/8 rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                <TrendingUp size={18} className="text-emerald-400" />
              </div>
              <h4 className="text-lg font-black text-foreground uppercase tracking-wider">
                Average Sector Allocation
              </h4>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectorAllocationData} layout="vertical" margin={{ top: 4, right: 30, left: 4, bottom: 0 }}>
                <XAxis
                  type="number"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace', fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="sector"
                  tick={{ fill: '#e2e8f0', fontSize: 11.5, fontFamily: 'monospace', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={125}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 10,
                    fontFamily: 'monospace',
                    fontSize: 11,
                    padding: '8px 10px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Allocation']}
                />
                <Bar dataKey="allocation" radius={[0, 4, 4, 0]} barSize={22}>
                  {sectorAllocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.78} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Column 2 — Concentration & Regime Metrics */}
          <div className="bg-slate-900/30 border border-white/8 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-1.5 bg-amber-500/10 rounded-lg">
                <Activity size={18} className="text-amber-400" />
              </div>
              <h4 className="text-lg font-black text-foreground uppercase tracking-wider">
                Concentration & Regime
              </h4>
            </div>

            <div className="flex-1 grid gap-3.5">
              {/* Regime Gauge Card */}
              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
                    Regime Score
                  </span>
                  <Shield size={16} className="text-cyan-400" />
                </div>
                <div className="flex items-end gap-5">
                  <div className="relative w-20 h-20 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[{ value: 100 }]} cx="50%" cy="70%" startAngle={180} endAngle={0} innerRadius="60%" outerRadius="85%" dataKey="value" stroke="none">
                          <Cell fill="rgba(255,255,255,0.05)" />
                        </Pie>
                        <Pie
                          data={[{ value: Math.max(0, Math.min(regimeScore + 100, 200) / 2) }, { value: 100 - Math.max(0, Math.min(regimeScore + 100, 200) / 2) }]}
                          cx="50%" cy="70%" startAngle={180} endAngle={0}
                          innerRadius="60%" outerRadius="85%" dataKey="value" stroke="none"
                        >
                          <Cell fill={regimeScore > 30 ? COLORS.bull : regimeScore < -30 ? COLORS.bear : COLORS.neutral} />
                          <Cell fill="transparent" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 text-center w-full">
                      <div className="font-mono font-black text-sm leading-none" style={{ color: regimeScore > 30 ? COLORS.bull : regimeScore < -30 ? COLORS.bear : COLORS.neutral }}>
                        {regimeScore.toFixed(0)}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                      <span className="text-[11px] text-muted-foreground/60 font-semibold uppercase">Risk Signal</span>
                      <span
                        className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border"
                        style={{
                          backgroundColor: riskSignal === 'RISK_ON' ? `${COLORS.bull}12` : riskSignal === 'RISK_OFF' ? `${COLORS.bear}12` : `${COLORS.neutral}12`,
                          color: riskSignal === 'RISK_ON' ? COLORS.bull : riskSignal === 'RISK_OFF' ? COLORS.bear : COLORS.neutral,
                          borderColor: riskSignal === 'RISK_ON' ? `${COLORS.bull}40` : riskSignal === 'RISK_OFF' ? `${COLORS.bear}40` : `${COLORS.neutral}40`
                        }}
                      >
                        {riskSignal}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                      <span className="text-[11px] text-muted-foreground/60 font-semibold uppercase">Top Sector</span>
                      <span className="text-[11px] font-mono text-foreground">
                        {sectorAllocationData[0]?.sector || 'Technology'} ({sectorAllocationData[0]?.allocation.toFixed(1) || '0.0'}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground/60 font-semibold uppercase">Avg Concentration</span>
                      <span className="text-[11px] font-mono text-foreground font-bold">
                        {collective.avg_concentration?.toFixed(1) || 'N/A'}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Holdings Summary Card */}
              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center gap-2 mb-3.5">
                  <Activity size={16} className="text-violet-400" />
                  <span className="text-sm font-black text-foreground uppercase tracking-wider">
                    Top Aggregated Holdings
                  </span>
                </div>
                <div className="space-y-2">
                  {aggregatedTopHoldings.slice(0, 4).map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-xs group hover:bg-white/[0.02] -mx-1 px-1 py-0.5 rounded transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-muted-foreground/50">
                          {i + 1}
                        </span>
                        <span className="font-bold text-foreground truncate max-w-[140px]">
                          {h.displayName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground/40 font-mono text-[11px] uppercase">
                          {h.sector}
                        </span>
                        <span
                          className="font-mono text-xs font-bold"
                          style={{
                            color: h.concentration_contribution > 5 ? COLORS.bear : h.concentration_contribution > 2 ? COLORS.bond : COLORS.bull
                          }}
                        >
                          ${(h.value / 1e9).toFixed(1)}B
                          <span className="text-muted-foreground/40 text-[10px] ml-1">
                            ({h.concentration_contribution.toFixed(2)}%)
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────── */}
      {/* Footer: Data Provenance + Status Bar */}
      {/* ────────────────────────────────────────── */}
      <div className="mt-16 pt-6 border-t border-white/10 flex justify-between items-start sm:items-center flex-wrap gap-4">
        <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>
            DATA SOURCE: SEC 13-F EDGAR • ENRICHED VIA ALPHA VANTAGE • AUTO-UPDATE SUNDAY 03:00 UTC
          </span>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-xs font-mono text-muted-foreground/60">
            AS OF {new Date(collective.as_of_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} UTC
          </div>
          <div className="w-28 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                backgroundColor: COLORS.equity,
                boxShadow: `0 0 8px ${COLORS.equity}50`,
                animation: 'pulse 3s infinite'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const WrappedInstitutionalHoldingsWall: React.FC = () => (
  <SectionErrorBoundary name="Institutional Pulse 13-F Tracker">
    <InstitutionalHoldingsWall />
  </SectionErrorBoundary>
);

export { InstitutionalHoldingsWall };
export default WrappedInstitutionalHoldingsWall;
