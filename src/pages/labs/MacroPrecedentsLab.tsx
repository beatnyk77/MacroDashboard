import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    History,
    TrendingUp,
    Info,
    CheckCircle2,
    Coins,
    Scale,
    ShieldAlert
} from 'lucide-react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    CartesianGrid,
    ReferenceLine
} from 'recharts';
import { SEOManager } from '@/components/SEOManager';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { MACRO_PRECEDENTS, MacroPrecedent } from '@/config/precedentsConfig';
import { useHistoricalPrecedents } from '@/hooks/useHistoricalPrecedents';
import { useMacroBenchmarks } from '@/hooks/useMacroBenchmarks';
import { BENCHMARK_METRICS, CohortGroup } from '@/config/benchmarksConfig';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS } from '@/constants/chartDefaults';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const MacroPrecedentsLab: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Active Precedent Selection
    const urlPrecedentId = searchParams.get('precedent');
    const defaultPrecedent = MACRO_PRECEDENTS.find(p => p.id === urlPrecedentId) || MACRO_PRECEDENTS[0];
    const [selectedPrecedent, setSelectedPrecedent] = useState<MacroPrecedent>(defaultPrecedent);

    // Active Metric Selection
    const urlMetricId = searchParams.get('metric');
    const initialMetricId = selectedPrecedent.applicableMetrics.some(m => m.metricId === urlMetricId)
        ? (urlMetricId as string)
        : selectedPrecedent.applicableMetrics[0]?.metricId || 'UST_10Y_YIELD';
    const [selectedMetricId, setSelectedMetricId] = useState<string>(initialMetricId);

    // Benchmark Cohort State
    const [selectedCohort, setSelectedCohort] = useState<CohortGroup>('G20');
    const [selectedBenchmarkMetric, setSelectedBenchmarkMetric] = useState<string>('debtGdpPct');

    // Chart Mode: Indexed (Base 100) vs Nominal Level
    const [isIndexed, setIsIndexed] = useState<boolean>(true);

    // Active Cycle Anchor State
    const [currentCycleAnchor, setCurrentCycleAnchor] = useState<'2022-03-16' | '2020-03-23'>('2022-03-16');

    // Data Hooks
    const { data: comparisonData, isLoading: isComparisonLoading } = useHistoricalPrecedents(
        selectedMetricId,
        selectedPrecedent.id,
        currentCycleAnchor
    );

    const { distributions, isLoading: isBenchmarkLoading } = useMacroBenchmarks(selectedCohort);
    const activeDistribution = distributions[selectedBenchmarkMetric];

    const activeMetricMeta = selectedPrecedent.applicableMetrics.find(m => m.metricId === selectedMetricId);

    const handlePrecedentChange = (p: MacroPrecedent) => {
        setSelectedPrecedent(p);
        const newMetricId = p.applicableMetrics[0]?.metricId || 'UST_10Y_YIELD';
        setSelectedMetricId(newMetricId);
        setSearchParams({ precedent: p.id, metric: newMetricId });
    };

    const handleMetricChange = (mId: string) => {
        setSelectedMetricId(mId);
        setSearchParams({ precedent: selectedPrecedent.id, metric: mId });
    };

    return (
        <div className="space-y-8 pb-16">
            <SEOManager
                title="Macro Historical Precedents & Peer Benchmarks | GraphiQuestor"
                description="Comparative macro intelligence lab: Relativize current monetary and sovereign trajectories against canonical historical precedents and G20 peer cohorts."
                keywords={['macro precedents', 'taper tantrum analog', 'g20 peer benchmarks', 'macro regime comparisons', 'normalized t=0 trajectories']}
            />

            {/* Header / Institutional Framing */}
            <div className="border-b border-border/40 pb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Institutional Research Desk
                            </span>
                            <span className="text-xs text-muted-foreground/60">• T=0 Trajectory Relativization</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-heading text-white">
                            Macro Precedents & Sovereign Benchmarks
                        </h1>
                        <p className="text-sm text-muted-foreground/80 mt-1 max-w-3xl">
                            Contextualize active policy and liquidity trajectories against canonical historical stress regimes.
                            Every precedent is anchored at shock onset (<code className="text-xs bg-white/5 px-1 py-0.5 rounded font-mono text-white/90">T=0</code>)
                            to surface structural divergence without speculative forecasting.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant={isIndexed ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsIndexed(true)}
                            className="text-xs font-mono"
                        >
                            Indexed (Base 100)
                        </Button>
                        <Button
                            variant={!isIndexed ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsIndexed(false)}
                            className="text-xs font-mono"
                        >
                            Nominal Level
                        </Button>
                    </div>
                </div>
            </div>

            {/* Section 1: Precedents Selector & T=0 Overlay */}
            <SectionErrorBoundary title="Historical Precedents Overlay">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Column: Precedents Catalog */}
                    <div className="lg:col-span-1 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/80 uppercase tracking-uppercase mb-2">
                            <History size={14} className="text-blue-400" />
                            <span>Canonical Episodes</span>
                        </div>
                        <div className="space-y-2">
                            {MACRO_PRECEDENTS.map(p => {
                                const isSelected = p.id === selectedPrecedent.id;
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => handlePrecedentChange(p)}
                                        className={cn(
                                            "w-full text-left p-3 rounded-xl border transition-all",
                                            isSelected
                                                ? "bg-blue-500/10 border-blue-500/40 text-white shadow-lg shadow-blue-500/5"
                                                : "bg-secondary/20 border-border/40 hover:bg-secondary/40 text-muted-foreground hover:text-white"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold font-mono text-blue-400">T=0: {p.tZeroDate}</span>
                                            {isSelected && <CheckCircle2 size={12} className="text-blue-400" />}
                                        </div>
                                        <div className="font-bold text-sm leading-snug">{p.name}</div>
                                        <div className="text-[11px] text-muted-foreground/70 line-clamp-2 mt-1">
                                            {p.summary}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Columns: Trajectory Chart & Context */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Metric Sub-Tabs */}
                        <div className="flex flex-wrap items-center gap-2 bg-secondary/20 p-1.5 rounded-xl border border-border/40">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 px-2">
                                Indicator:
                            </span>
                            {selectedPrecedent.applicableMetrics.map(m => (
                                <button
                                    key={m.metricId}
                                    type="button"
                                    onClick={() => handleMetricChange(m.metricId)}
                                    className={cn(
                                        "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                                        m.metricId === selectedMetricId
                                            ? "bg-blue-600 text-white shadow"
                                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {/* Trajectory Overlay Chart */}
                        <div className="bg-card/40 border border-border/60 rounded-2xl p-5 shadow-xl">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                <div>
                                    <h3 className="font-black text-lg text-white">
                                        {activeMetricMeta?.label || selectedMetricId}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Normalized comparison from shock onset (<code className="font-mono text-white/80">T=0</code>) across elapsed calendar days.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                                    <div className="flex items-center gap-1.5 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                        <div className="w-2.5 h-2.5 bg-blue-400 rounded-full" />
                                        <span className="text-white">Active Cycle:</span>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentCycleAnchor(currentCycleAnchor === '2022-03-16' ? '2020-03-23' : '2022-03-16')}
                                            className="underline text-blue-300 hover:text-white font-bold"
                                        >
                                            {currentCycleAnchor === '2022-03-16' ? '2022 Fed Tightening (T=0: 2022-03-16)' : '2020 COVID Shock (T=0: 2020-03-23)'}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                                        <div className="w-2.5 h-0.5 bg-amber-400 border-dashed rounded-full" />
                                        <span className="text-amber-300 font-bold">{selectedPrecedent.shortLabel}</span>
                                        <span className="text-muted-foreground/80">(T=0: {selectedPrecedent.tZeroDate})</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-[320px] w-full">
                                {isComparisonLoading ? (
                                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground/40 uppercase tracking-wider animate-pulse">
                                        Aligning Historical Observation Trajectories...
                                    </div>
                                ) : !comparisonData?.hasSufficientData ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-secondary/10 rounded-xl border border-dashed border-border/40">
                                        <Info size={24} className="text-muted-foreground/60 mb-2" />
                                        <div className="text-sm font-bold text-white">Historical Data Coverage Unavailable</div>
                                        <p className="text-xs text-muted-foreground mt-1 max-w-md">
                                            The series for <code>{selectedMetricId}</code> does not have observed records during the {selectedPrecedent.name} ({selectedPrecedent.startDate} to {selectedPrecedent.endDate}).
                                            In accordance with our methodology, missing telemetry is not simulated.
                                        </p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={comparisonData.alignedPoints}
                                            margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                                        >
                                            <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
                                            <XAxis
                                                {...DEFAULT_XAXIS_PROPS}
                                                dataKey="dayOffset"
                                                tickFormatter={(v) => `T${v >= 0 ? `+${v}d` : `${v}d`}`}
                                            />
                                            <YAxis
                                                {...DEFAULT_YAXIS_PROPS}
                                                tickFormatter={(val) => isIndexed ? `${Math.round(val)}` : `${val}`}
                                                domain={['auto', 'auto']}
                                            />
                                            <ReferenceLine x={0} stroke="#64748b" strokeDasharray="3 3" label={{ value: 'T=0', fill: '#94a3b8', fontSize: 10 }} />
                                            <RechartsTooltip
                                                content={({ active, payload }) => {
                                                    if (!active || !payload || !payload.length) return null;
                                                    const pt = payload[0].payload;
                                                    return (
                                                        <div className="bg-slate-950/95 border border-white/12 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[200px] text-xs">
                                                            <div className="font-bold text-white mb-1.5 border-b border-white/5 pb-1">
                                                                Offset: T{pt.dayOffset >= 0 ? `+${pt.dayOffset}` : pt.dayOffset} days
                                                            </div>
                                                            <div className="space-y-1 font-mono">
                                                                <div className="flex justify-between items-center text-blue-400">
                                                                    <span>Active ({pt.dateCurrent || 'N/A'}):</span>
                                                                    <span className="font-bold">
                                                                        {isIndexed ? `${pt.currentIndexed?.toFixed(1)} (base 100)` : pt.currentValue?.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-amber-400">
                                                                    <span>Analog ({pt.datePrecedent || 'N/A'}):</span>
                                                                    <span className="font-bold">
                                                                        {isIndexed ? `${pt.precedentIndexed?.toFixed(1)} (base 100)` : pt.precedentValue?.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey={isIndexed ? "currentIndexed" : "currentValue"}
                                                name="Current Cycle"
                                                stroke="#38bdf8"
                                                strokeWidth={2.5}
                                                dot={false}
                                                activeDot={{ r: 4, fill: '#38bdf8' }}
                                                connectNulls
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey={isIndexed ? "precedentIndexed" : "precedentValue"}
                                                name={selectedPrecedent.shortLabel}
                                                stroke="#fbbf24"
                                                strokeWidth={2}
                                                strokeDasharray="4 4"
                                                dot={false}
                                                activeDot={{ r: 4, fill: '#fbbf24' }}
                                                connectNulls
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Structural Divergence Card */}
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <Info size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
                                        Structural Reality vs. Historical Analogy
                                    </h4>
                                    <p className="text-xs text-muted-foreground/90 leading-relaxed">
                                        {selectedPrecedent.structuralDivergence}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionErrorBoundary>

            {/* Section 1.5: Structural Macro Telemetry vs Precedents */}
            <SectionErrorBoundary title="Structural Macro Benchmarks vs Historical Regimes">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Scale size={16} className="text-amber-400" />
                        <h2 className="text-xl font-bold text-white tracking-heading">
                            Structural Macro Coordinates vs Historical Baselines
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Card 1: Debt to GDP Benchmark */}
                        <div className="bg-card/40 border border-border/60 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert size={16} className="text-rose-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sovereign Debt / GDP</span>
                                </div>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    92nd Percentile
                                </span>
                            </div>
                            <div className="text-2xl font-black font-mono text-white mb-1">
                                122.4% <span className="text-xs text-muted-foreground font-normal">(US) / 81.3% (IN)</span>
                            </div>
                            <div className="text-xs text-muted-foreground leading-relaxed mt-2 mb-3">
                                <strong>Historical Precedent (2008 GFC):</strong> US Debt/GDP was only <strong>64.8%</strong>; Post-WWII peak was 118% (1946). Today represents peacetime record leverage.
                            </div>
                            <div className="w-full bg-secondary/60 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-rose-500 h-full rounded-full" style={{ width: '92%' }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground/60 font-mono mt-1">
                                <span>2008: 64%</span>
                                <span>2019: 106%</span>
                                <span className="text-rose-400 font-bold">Now: 122%</span>
                            </div>
                        </div>

                        {/* Card 2: M2 to Gold Ratio */}
                        <div className="bg-card/40 border border-border/60 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Coins size={16} className="text-amber-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">M2 / Gold Fair Value</span>
                                </div>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    Compressing
                                </span>
                            </div>
                            <div className="text-2xl font-black font-mono text-amber-300 mb-1">
                                108.2 <span className="text-xs text-muted-foreground font-normal">(Historical Mean: 100)</span>
                            </div>
                            <div className="text-xs text-muted-foreground leading-relaxed mt-2 mb-3">
                                <strong>Historical Precedent (2020 COVID):</strong> Spiked to <strong>148.0</strong> (+48% over fair value). Compressing back toward 100 as gold structurally outpaces M2 expansion.
                            </div>
                            <div className="w-full bg-secondary/60 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-amber-400 h-full rounded-full" style={{ width: '60%' }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground/60 font-mono mt-1">
                                <span>2011 Low: 72</span>
                                <span className="text-amber-300 font-bold">Now: ~108</span>
                                <span>2020 Peak: 148</span>
                            </div>
                        </div>

                        {/* Card 3: External Liquidity & FX Defense */}
                        <div className="bg-card/40 border border-border/60 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <History size={16} className="text-blue-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">EM FX Reserve Cover</span>
                                </div>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Safe Buffer
                                </span>
                            </div>
                            <div className="text-2xl font-black font-mono text-emerald-400 mb-1">
                                11.2 Mo <span className="text-xs text-muted-foreground font-normal">(India RBI Import Cover)</span>
                            </div>
                            <div className="text-xs text-muted-foreground leading-relaxed mt-2 mb-3">
                                <strong>Historical Precedent (2013 Taper Tantrum):</strong> Stood at just <strong>6.5 months</strong> cover with 4.8% CAD. Today external balance sheets provide ~1.7x stronger cushion.
                            </div>
                            <div className="w-full bg-secondary/60 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground/60 font-mono mt-1">
                                <span>2013: 6.5 Mo</span>
                                <span>Min Threshold: 3.0 Mo</span>
                                <span className="text-emerald-400 font-bold">Now: 11.2 Mo</span>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionErrorBoundary>

            {/* Section 2: G20 Sovereign & Macro Peer Benchmarking */}
            <SectionErrorBoundary title="G20 Sovereign Cohort Benchmarks">
                <div className="bg-card/30 border border-border/60 rounded-2xl p-6 shadow-xl space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp size={16} className="text-purple-400" />
                                <h2 className="text-xl font-bold text-white tracking-heading">
                                    Cross-Country Cohort Benchmarks
                                </h2>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Relativize sovereign metrics against international peer medians and percentile distributions.
                            </p>
                        </div>

                        {/* Cohort Toggle */}
                        <div className="flex items-center gap-2">
                            {(['G20', 'G7', 'BRICS', 'EM'] as CohortGroup[]).map(cohort => (
                                <button
                                    key={cohort}
                                    type="button"
                                    onClick={() => setSelectedCohort(cohort)}
                                    className={cn(
                                        "px-2.5 py-1 rounded text-xs font-bold font-mono transition-all",
                                        selectedCohort === cohort
                                            ? "bg-purple-600 text-white"
                                            : "bg-secondary/40 text-muted-foreground hover:text-white"
                                    )}
                                >
                                    {cohort}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Benchmark Metric Tabs */}
                    <div className="flex flex-wrap gap-2">
                        {BENCHMARK_METRICS.map(bm => (
                            <button
                                key={bm.id}
                                type="button"
                                onClick={() => setSelectedBenchmarkMetric(bm.id)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                    selectedBenchmarkMetric === bm.id
                                        ? "bg-purple-500/10 border-purple-500/40 text-purple-300"
                                        : "bg-secondary/20 border-border/30 text-muted-foreground hover:bg-secondary/40"
                                )}
                            >
                                {bm.label}
                            </button>
                        ))}
                    </div>

                    {/* Benchmark Ranked Table / Distribution */}
                    {isBenchmarkLoading ? (
                        <div className="h-48 flex items-center justify-center text-xs text-muted-foreground/40 animate-pulse">
                            Computing Cohort Percentiles...
                        </div>
                    ) : activeDistribution ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-secondary/15 rounded-xl border border-border/30 text-center">
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground/60">Cohort Median</div>
                                    <div className="text-lg font-black font-mono text-white mt-0.5">
                                        {activeDistribution.median.toFixed(1)} {BENCHMARK_METRICS.find(m => m.id === selectedBenchmarkMetric)?.unit}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground/60">25th Percentile</div>
                                    <div className="text-lg font-black font-mono text-white/80 mt-0.5">
                                        {activeDistribution.p25.toFixed(1)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground/60">75th Percentile</div>
                                    <div className="text-lg font-black font-mono text-white/80 mt-0.5">
                                        {activeDistribution.p75.toFixed(1)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground/60">Sample Size</div>
                                    <div className="text-lg font-black font-mono text-purple-400 mt-0.5">
                                        {activeDistribution.count} Sovereigns
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-border/40 text-muted-foreground/70 font-mono text-[11px]">
                                            <th className="py-2.5 px-3">Rank</th>
                                            <th className="py-2.5 px-3">Sovereign</th>
                                            <th className="py-2.5 px-3 text-right">Observed Value</th>
                                            <th className="py-2.5 px-3 text-right">Percentile</th>
                                            <th className="py-2.5 px-3">Distribution Relative to Cohort Median</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20 font-mono">
                                        {activeDistribution.rankings.map((item, idx) => {
                                            const diff = item.value - activeDistribution.median;
                                            return (
                                                <tr key={item.code} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="py-2 px-3 text-muted-foreground/50">#{idx + 1}</td>
                                                    <td className="py-2 px-3">
                                                        <div className="flex items-center gap-2 font-sans font-semibold text-white">
                                                            <span>{item.flag}</span>
                                                            <span>{item.name}</span>
                                                            <span className="text-[10px] text-muted-foreground/60 font-mono">({item.code})</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-bold text-white">
                                                        {item.value.toFixed(1)}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-bold">
                                                        <span className={cn(
                                                            "px-1.5 py-0.5 rounded text-[10px]",
                                                            item.percentile >= 75 ? "bg-rose-500/10 text-rose-400" :
                                                            item.percentile <= 25 ? "bg-emerald-500/10 text-emerald-400" : "text-muted-foreground"
                                                        )}>
                                                            {item.percentile}%
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-purple-500/70 rounded-full"
                                                                    style={{ width: `${Math.min(100, Math.max(5, item.percentile))}%` }}
                                                                />
                                                            </div>
                                                            <span className={cn(
                                                                "text-[10px]",
                                                                diff > 0 ? "text-amber-400/80" : "text-emerald-400/80"
                                                            )}>
                                                                {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} vs med
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-xs text-muted-foreground">
                            No cohort observations available for this selection.
                        </div>
                    )}
                </div>
            </SectionErrorBoundary>
        </div>
    );
};
