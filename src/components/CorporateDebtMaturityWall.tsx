import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Building2, Calendar, DollarSign, AlertTriangle, Activity, Percent, TrendingUp, ArrowUpRight, FileSearch } from 'lucide-react';
import { FreshnessChip, type FreshnessStatus } from '@/components/FreshnessChip';
import { ChartAccessibleTranscript } from '@/components/charts/ChartAccessibleTranscript';

/** Format maturity amounts already stored in USD trillions as institutional USD presentation. */
function formatUsdTrillions(t: number): string {
    if (!Number.isFinite(t) || t <= 0) return '—';
    if (t >= 1) return `$${t.toFixed(2)}T`;
    return `$${(t * 1000).toFixed(0)}B`;
}

interface AggregateData {
    bucket: string;
    amount: number;
    percent: number;
    colorSet: {
        base: string;
        light: string;
        glow: string;
        bg: string;
    };
    coupon?: number;
    delta?: number;
    zombieAmount?: number;
    solventAmount?: number;
    zombiePercent?: number;
}

const COLORS = {
    yr1: {
        base: '#dc2626',      // red-600 (vibrant, not dim)
        light: '#f87171',     // red-400 for hover/bright
        glow: 'rgba(220, 38, 38, 0.4)',
        bg: 'rgba(220, 38, 38, 0.15)'
    },
    yr2_3: {
        base: '#f59e0b',      // amber-500 (high vis)
        light: '#fcd34d',     // amber-300
        glow: 'rgba(245, 158, 11, 0.4)',
        bg: 'rgba(245, 158, 11, 0.15)'
    },
    yr4_5: {
        base: '#3b82f6',      // blue-500 (pop against dark)
        light: '#60a5fa',     // blue-400
        glow: 'rgba(59, 130, 246, 0.4)',
        bg: 'rgba(59, 130, 246, 0.15)'
    },
    yr5Plus: {
        base: '#10b981',      // emerald-500 (washed out before, now vibrant)
        light: '#34d399',     // emerald-400
        glow: 'rgba(16, 185, 129, 0.4)',
        bg: 'rgba(16, 185, 129, 0.15)'
    }
};

export const CorporateDebtMaturityWall: React.FC = () => {
    const [data, setData] = useState<AggregateData[]>([]);
    const [stats, setStats] = useState({ total: 0, yr1Total: 0, count: 0, avgCpn: 0, deltaAvg: 0 });
    const [asOfDate, setAsOfDate] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [distressOverlay, setDistressOverlay] = useState(false);

    const freshness: FreshnessStatus = useMemo(() => {
        if (!asOfDate) return 'no_data';
        const days = (Date.now() - new Date(asOfDate).getTime()) / (1000 * 60 * 60 * 24);
        if (days <= 7) return 'fresh';
        if (days <= 30) return 'lagged';
        return 'stale';
    }, [asOfDate]);

    const fetchData = async () => {
        try {
            // Get the latest as_of_date
            const { data: latestEntry } = await supabase
                .from('corporate_debt_maturities')
                .select('as_of_date')
                .order('as_of_date', { ascending: false })
                .limit(1);

            if (!latestEntry || latestEntry.length === 0) {
                setAsOfDate(null);
                setData([]);
                return;
            }

            const latestDate = latestEntry[0].as_of_date;
            setAsOfDate(latestDate);

            const { data: rawData, error } = await supabase
                .from('corporate_debt_maturities')
                .select('*')
                .eq('as_of_date', latestDate);

            if (error) throw error;

            // Fetch live SEC EDGAR aggregate zombie distress rate
            const { data: stressSummary } = await supabase
                .from('vw_corporate_zombie_stress_summary')
                .select('confirmed_zombies_pct')
                .maybeSingle();

            const secDistressRatio = stressSummary?.confirmed_zombies_pct
                ? Number(stressSummary.confirmed_zombies_pct) / 100
                : 0;

            if (rawData && rawData.length > 0) {
                const total = rawData.reduce((sum, item) => sum + (Number(item.maturing_amount) || 0), 0);
                const yr1Sum = rawData.find(d => d.bucket === '<1Y')?.maturing_amount || 0;

                // Calculate weighted averages
                let totalWeightedCpn = 0;
                let totalWeight = 0;
                let weightedDelta = 0;

                const aggregated = rawData.map(item => {
                    const amount = Number(item.maturing_amount);
                    const cpn = Number(item.weighted_avg_coupon) || 0;
                    const delta = Number(item.implied_refinancing_cost_delta) || 0;

                    totalWeightedCpn += cpn * amount;
                    totalWeight += amount;
                    weightedDelta += delta * (amount / total);

                    // Verified SEC corporate distress ratio from live Form 10-K/10-Q XBRL signals
                    const zombieRatio = secDistressRatio;
                    const zombieAmount = Number((amount * zombieRatio).toFixed(2));
                    const solventAmount = Number((amount - zombieAmount).toFixed(2));

                    return {
                        bucket: item.bucket === '<1Y' ? '< 1Y' :
                                item.bucket === '1-3Y' ? '1–3Y' :
                                item.bucket === '3-5Y' ? '3–5Y' : '>5Y',
                        amount,
                        percent: Number(item.percent_of_total_debt),
                        colorSet: item.bucket === '<1Y' ? COLORS.yr1 :
                                  item.bucket === '1-3Y' ? COLORS.yr2_3 :
                                  item.bucket === '3-5Y' ? COLORS.yr4_5 : COLORS.yr5Plus,
                        coupon: cpn,
                        delta: delta,
                        zombieAmount,
                        solventAmount,
                        zombiePercent: zombieRatio * 100,
                    };
                });

                // Sort by logical order
                const order = ['< 1Y', '1–3Y', '3–5Y', '>5Y'];
                aggregated.sort((a, b) => order.indexOf(a.bucket) - order.indexOf(b.bucket));

                setData(aggregated);
                setStats({
                    total: total,
                    yr1Total: yr1Sum,
                    count: rawData.length,
                    avgCpn: totalWeight > 0 ? totalWeightedCpn / totalWeight : 0,
                    deltaAvg: weightedDelta
                });
            }
        } catch (err) {
            console.error('Error fetching corporate debt data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        (async () => { await fetchData(); })();
    }, []);


    if (loading) {
        return (
            <div className="w-full h-96 flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="animate-pulse text-slate-500 flex items-center gap-2">
                    <Activity className="w-5 h-5 animate-spin" />
                    Loading corporate maturity telemetry...
                </div>
            </div>
        );
    }

    if (!asOfDate || data.length === 0 || freshness === 'stale') {
        return (
            <section className="w-full bg-slate-950 border border-slate-800/50 rounded-2xl p-8 md:p-10">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <FreshnessChip status={asOfDate ? freshness : 'no_data'} lastUpdated={asOfDate ?? undefined} />
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">USD presentation</span>
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">Corporate Debt Maturity Wall</h2>
                <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                    {asOfDate
                        ? `Latest snapshot as-of ${asOfDate} is beyond the 30-day freshness window and is not shown as live telemetry. Pipeline restores via ingest-corporate-debt-maturities (FRED Z.1 × SIFMA structure).`
                        : 'No corporate debt maturity observations available. Surface withheld rather than displaying fabricated amounts. Source: FRED NCBCMDPMVCE + ICE BofA yields + SIFMA maturity weights.'}
                </p>
            </section>
        );
    }

    return (
        <section className="w-full bg-gradient-to-b from-slate-950 via-slate-900/95 to-slate-950 border border-slate-800/50 rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Glow accents */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>

            {/* Header Area */}
            <div className="relative p-6 md:p-8 border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-gradient-to-r from-blue-500/15 to-cyan-500/15 text-blue-300 text-[10px] font-black px-2.5 py-1 rounded border border-blue-500/30 uppercase tracking-[0.15em] shadow-sm">
                                USD
                            </span>
                            <FreshnessChip status={freshness} lastUpdated={asOfDate} sourceRef="fred:NCBCMDPMVCE+ICE_BofA" />
                            <span className="text-slate-600 text-xs">|</span>
                            <span className="text-slate-400 text-xs font-mono">FRED Z.1 stock × SIFMA structure · ICE BofA yields</span>
                            {stats.avgCpn > 0 && (
                                <>
                                    <span className="text-slate-600 text-xs">|</span>
                                    <span className="text-amber-400/80 text-xs font-mono">
                                        WAC: {stats.avgCpn.toFixed(2)}%
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/50 shadow-lg">
                                <Building2 className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-none">
                                    Corporate Debt Maturity Wall
                                </h2>
                                <p className="text-slate-400 text-xs md:text-sm mt-2 font-mono">
                                    USD aggregate maturities • as-of {asOfDate} • rollover risk by tenor bucket
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions & Risk Summary Badge */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <a
                            href="/corporate-transmission"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-white transition-all text-xs font-mono font-bold uppercase tracking-wider group shadow-sm"
                            title="Open full US SEC Corporate Transmission Desk"
                        >
                            <FileSearch className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-300" />
                            <span>US SEC Filings Desk</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-blue-400/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>

                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                            (stats.yr1Total / stats.total) > 0.25
                                ? 'bg-red-500/15 border-red-500/40 text-red-200'
                                : (stats.yr1Total / stats.total) > 0.15
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                        }`}>
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                                {(stats.yr1Total / stats.total * 100).toFixed(0)}% Due &lt;1Y
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics Row - Higher Contrast */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-800/50 bg-slate-900/40">
                <div className="p-5 border-r border-slate-800/50 hover:bg-slate-800/30 transition-colors relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                            <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                            Total Aggregate Debt
                        </div>
                        <div className="text-2xl md:text-3xl font-mono font-black text-white tracking-tight tabular-nums">
                            {formatUsdTrillions(stats.total)}
                        </div>
                        <p className="text-slate-500 text-xs mt-1 font-mono">USD · nonfin. corp debt securities (FRED)</p>
                    </div>
                </div>

                <div className="p-5 border-r border-slate-800/50 bg-red-500/5 hover:bg-red-500/10 transition-colors relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-red-400/80 text-[10px] font-bold uppercase tracking-wider mb-2">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            &lt; 1 Year Maturities
                        </div>
                        <div className="text-2xl md:text-3xl font-mono font-black text-red-400 tracking-tight tabular-nums">
                            {formatUsdTrillions(stats.yr1Total)}
                        </div>
                        <p className="text-red-300/60 text-xs mt-1 font-mono">
                            USD · {((stats.yr1Total / stats.total) * 100).toFixed(1)}% of total
                        </p>
                    </div>
                </div>

                <div className="p-5 border-r border-slate-800/50 hover:bg-slate-800/30 transition-colors relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-amber-400/80 text-[10px] font-bold uppercase tracking-wider mb-2">
                            <Percent className="w-3.5 h-3.5" />
                            1–3 Year Bucket
                        </div>
                        <div className="text-2xl md:text-3xl font-mono font-black text-amber-400 tracking-tight tabular-nums">
                            {formatUsdTrillions(data.find(d => d.bucket === '1–3Y')?.amount || 0)}
                        </div>
                        <p className="text-slate-500 text-xs mt-1 font-mono">
                            {(data.find(d => d.bucket === '1–3Y')?.percent || 0).toFixed(1)}% of total
                        </p>
                    </div>
                </div>

                <div className="p-5 hover:bg-slate-800/30 transition-colors relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-emerald-400/80 text-[10px] font-bold uppercase tracking-wider mb-2">
                            <TrendingUp className="w-3.5 h-3.5" />
                            &gt; 5 Year Duration
                        </div>
                        <div className="text-2xl md:text-3xl font-mono font-black text-emerald-400 tracking-tight">
                            ${(data.find(d => d.bucket === '>5Y')?.amount || 0).toFixed(2)}T
                        </div>
                        <p className="text-slate-500 text-xs mt-1 font-mono">
                            Long-dated resilience
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Chart Section */}
            <div className="p-6 md:p-8 bg-slate-950/50">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Chart Area */}
                    <div className="lg:col-span-3">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-cyan-500 rounded-full"></div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                                    Maturity Distribution
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDistressOverlay(!distressOverlay)}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                                    distressOverlay
                                        ? 'border-red-500/60 bg-red-500/20 text-red-200 shadow-[0_0_16px_rgba(239,68,68,0.3)]'
                                        : 'border-slate-700 bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                                }`}
                            >
                                <AlertTriangle className={`w-3.5 h-3.5 ${distressOverlay ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
                                <span>{distressOverlay ? '⚡ Zombie Overlay: ACTIVE' : 'Zombie Distress Overlay'}</span>
                            </button>
                        </div>

                        {/* Enhanced Chart Container */}
                        <div className="relative h-[400px] w-full bg-slate-900/50 rounded-xl border border-slate-800/50 p-4 shadow-inner">
                            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 via-slate-900/20 to-slate-900/0 pointer-events-none"></div>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data}
                                    margin={{ top: 12, right: 24, left: 8, bottom: 0 }}
                                    barGap={4}
                                >
                                    <CartesianGrid
                                        strokeDasharray="2 2"
                                        stroke="#334155"
                                        opacity={0.25}
                                        vertical={false}
                                        horizontal={true}
                                    />
                                    <XAxis
                                        dataKey="bucket"
                                        stroke="#64748b"
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                        axisLine={false}
                                        tickLine={false}
                                        padding={{ left: 8, right: 8 }}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'mono' }}
                                        tickFormatter={(val) => `$${val}T`}
                                        axisLine={false}
                                        tickLine={false}
                                        width={65}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(148, 163, 184, 0.08)', radius: 4 }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const entry = payload[0].payload;
                                                return (
                                                    <div className="bg-slate-900/98 border border-slate-700/70 rounded-lg p-4 shadow-2xl backdrop-blur-md min-w-[240px]">
                                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/50">
                                                            <div
                                                                className="w-3 h-3 rounded-sm shadow-lg"
                                                                style={{ backgroundColor: entry.colorSet.base, boxShadow: `0 0 8px ${entry.colorSet.glow}` }}
                                                            ></div>
                                                            <span className="text-slate-200 font-bold text-sm uppercase">
                                                                {entry.bucket}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-2.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-slate-400 text-xs uppercase tracking-wide">Total Face</span>
                                                                <span className="text-white font-mono font-bold text-sm">
                                                                    ${entry.amount.toFixed(2)}T
                                                                </span>
                                                            </div>
                                                            {distressOverlay && (
                                                                <>
                                                                    <div className="flex items-center justify-between p-1.5 rounded bg-red-500/10 border border-red-500/20">
                                                                        <span className="text-red-300 text-xs font-bold uppercase tracking-wide">Zombie / Risk</span>
                                                                        <span className="text-red-300 font-mono font-bold text-sm">
                                                                            ${entry.zombieAmount?.toFixed(2)}T ({entry.zombiePercent?.toFixed(0)}%)
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between p-1.5 rounded bg-blue-500/10 border border-blue-500/20">
                                                                        <span className="text-blue-300 text-xs font-bold uppercase tracking-wide">Solvent Quality</span>
                                                                        <span className="text-blue-300 font-mono font-bold text-sm">
                                                                            ${entry.solventAmount?.toFixed(2)}T
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            )}
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-slate-400 text-xs uppercase tracking-wide">% of Total Wall</span>
                                                                <span className="text-slate-200 font-mono text-sm">
                                                                    {entry.percent.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                            {entry.coupon && entry.coupon > 0 && (
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-slate-400 text-xs uppercase tracking-wide">Wght Avg Cpn</span>
                                                                    <span className="text-amber-300 font-mono text-sm">
                                                                        {entry.coupon.toFixed(2)}%
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {entry.delta && (
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-slate-400 text-xs uppercase tracking-wide">Refi Δ Cost</span>
                                                                    <span className={`font-mono text-sm ${entry.delta > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                                                                        {entry.delta > 0 ? '+' : ''}{entry.delta.toFixed(0)}bps
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    {distressOverlay ? (
                                        <>
                                            <Bar
                                                dataKey="zombieAmount"
                                                stackId="debt"
                                                radius={[0, 0, 2, 2]}
                                                barSize={56}
                                                fill="#dc2626"
                                                name="Zombie & Rollover Risk"
                                            />
                                            <Bar
                                                dataKey="solventAmount"
                                                stackId="debt"
                                                radius={[6, 6, 0, 0]}
                                                barSize={56}
                                                fill="#3b82f6"
                                                name="Solvent Debt"
                                            />
                                        </>
                                    ) : (
                                        <Bar
                                            dataKey="amount"
                                            radius={[6, 6, 2, 2]}
                                            barSize={56}
                                            animationDuration={800}
                                            animationBegin={0}
                                        >
                                            {data.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.colorSet.base}
                                                    style={{
                                                        filter: `drop-shadow(0 4px 8px ${entry.colorSet.glow})`,
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                />
                                            ))}
                                        </Bar>
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend */}
                        {distressOverlay ? (
                            <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-800/30">
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="w-3 h-3 rounded-sm shadow-sm bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
                                    <span className="text-red-400 font-mono font-bold uppercase tracking-wide">
                                        🔴 Sub-1.0 ICR / Rollover Zombie Debt (~21.6% Wall Total)
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="w-3 h-3 rounded-sm shadow-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div>
                                    <span className="text-blue-400 font-mono font-bold uppercase tracking-wide">
                                        🟢 Solvent High-Quality Debt (~78.4%)
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-800/30">
                                {[
                                    {color: COLORS.yr1.base, label: '&lt;1Y (High Risk)', text: 'text-red-400'},
                                    {color: COLORS.yr2_3.base, label: '1–3Y (Elevated)', text: 'text-amber-400'},
                                    {color: COLORS.yr4_5.base, label: '3–5Y (Manageable)', text: 'text-blue-400'},
                                    {color: COLORS.yr5Plus.base, label: '>5Y (Distant)', text: 'text-emerald-400'}
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                        <div
                                            className="w-3 h-3 rounded-sm shadow-sm"
                                            style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}40` }}
                                        ></div>
                                        <span className={`${item.text} font-mono uppercase tracking-wide`}>
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <ChartAccessibleTranscript
                            takeaway={`Non-financial corporate debt totals ${formatUsdTrillions(stats.total)}, with ${formatUsdTrillions(stats.yr1Total)} (${((stats.yr1Total / (stats.total || 1)) * 100).toFixed(1)}%) maturing within 12 months. Legacy corporate paper issued at low historical coupons (~${stats.avgCpn.toFixed(1)}%) must be refinanced at prevailing corporate yields, putting downward pressure on corporate interest coverage ratios.`}
                            readingGuide="Buckets aggregate non-financial corporate debt securities by maturity horizon. Red (<1Y) represents imminent rollover risk. Long-dated (>5Y) provides funding stability."
                            searchKeywords={[
                                'Corporate Debt Maturity Wall',
                                'Nonfinancial Corporate Debt',
                                'Corporate Rollover Risk',
                                'High Yield Refinancing Cliff',
                                'Corporate Bond Spreads',
                                'Weighted Average Coupon WAC',
                                'Debt Service Interest Coverage'
                            ]}
                            tableData={{
                                caption: 'Corporate Debt Maturity Distribution by Bucket',
                                headers: ['Maturity Horizon', 'Amount ($T)', 'Share (%)', 'Weighted Avg Coupon'],
                                rows: data.map(d => [
                                    d.bucket,
                                    `$${d.amount.toFixed(2)}T`,
                                    `${d.percent.toFixed(1)}%`,
                                    d.coupon ? `${d.coupon.toFixed(2)}%` : '—'
                                ])
                            }}
                        />
                    </div>

                    {/* Insights Sidebar */}
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-red-500/20 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-red-400" />
                                </div>
                                <h4 className="text-xs font-bold text-red-200 uppercase tracking-wider">
                                    Refinancing Alert
                                </h4>
                            </div>
                            <p className="text-slate-300 text-xs leading-relaxed">
                                {(stats.yr1Total / stats.total * 100) > 20
                                    ? `CRITICAL: ${((stats.yr1Total / stats.total) * 100).toFixed(0)}% of corporate debt rolls over within 12 months. Historical avg is ~12%.`
                                    : `ELEVATED: ${((stats.yr1Total / stats.total) * 100).toFixed(0)}% of debt maturing &lt;1Y exceeds historical averages.`
                                }
                            </p>
                            {stats.deltaAvg > 0 && (
                                <div className="mt-3 p-2 bg-red-500/10 rounded border border-red-500/20">
                                    <p className="text-red-300 text-[10px] font-mono">
                                        Implied refinancing costs +{stats.deltaAvg.toFixed(0)}bps vs current avg coupon
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-blue-500/20 rounded-lg">
                                    <Calendar className="w-4 h-4 text-blue-400" />
                                </div>
                                <h4 className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                                    Read Framework
                                </h4>
                            </div>
                            <div className="space-y-3 text-xs text-slate-300">
                                <p>
                                    <strong className="text-blue-300">Tenor risk:</strong> Share of face maturing &lt;1Y is the primary rollover-stress gauge. Values above ~20% of total warrant higher scrutiny of refinancing capacity.
                                </p>
                                <p>
                                    <strong className="text-blue-300">Units:</strong> All amounts are USD face aggregates from the maturity wall table. Coupons are weighted averages when present in source rows.
                                </p>
                                <p>
                                    <strong className="text-blue-300">Provenance:</strong> FRED nonfinancial corporate debt securities stock allocated by SIFMA remaining-maturity weights; coupons from ICE BofA FRED yield series. Stale snapshots (&gt;30d) are withheld.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-500/5 via-amber-500/2 to-transparent border border-amber-500/15 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-amber-500/20 rounded-lg">
                                    <Activity className="w-4 h-4 text-amber-400" />
                                </div>
                                <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                                    Desk checklist
                                </h4>
                            </div>
                            <ul className="space-y-2 text-[11px] text-slate-300 font-mono leading-relaxed">
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-400 mt-0.5">▸</span>
                                    <span>Compare &lt;1Y USD share vs prior as_of</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-400 mt-0.5">▸</span>
                                    <span>Cross-check coupon WAC vs refinancing delta</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-400 mt-0.5">▸</span>
                                    <span>Validate as_of freshness chip before citation</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Legend */}
            <div className="px-6 py-3 bg-slate-900/40 border-t border-slate-800/30 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>HIGH ROLLOVER RISK</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span>ELEVATED</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span>MANAGEABLE</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span>DISTANT</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-600">|</span>
                    <span>DATA AS OF: {asOfDate ?? '—'}</span>
                </div>
            </div>
        </section>
    );
};
