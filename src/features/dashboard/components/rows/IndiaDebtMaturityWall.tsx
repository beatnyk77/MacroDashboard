import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS, CHART_RAMPS } from '@/constants/chartDefaults';
import {
    Calendar, AlertTriangle, TrendingUp, Info, Scale,
    ArrowRightLeft, Building2, Globe
} from 'lucide-react';
// No motion needed for now, can add back later if animations are required.
import { useIndiaDebtMaturities } from '@/hooks/useIndiaDebtMaturities';
import { supabase } from '@/lib/supabase';
import { TOOLTIP_SHELL_CLASS } from '@/components/charts/chartTooltipFormat';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

// Define the shape of US data from the existing implementation for comparison
interface USData {
    bucket: string;
    amount: number;
}

const BUCKET_ORDER = ['<1Y', '1-3Y', '3-5Y', '5-10Y', '10-20Y', '20Y+'];

const COLORS = {
    central: CHART_COLORS.west, // blue-500
    state: CHART_COLORS.violet,   // violet-500
    us: CHART_COLORS.stress,      // red-500 (matching US wall theme)
    grid: 'hsl(var(--border))',
    text: 'hsl(var(--muted-foreground))'
};

export const IndiaDebtMaturityWall: React.FC = () => {
    const { data: indiaData, loading: indiaLoading } = useIndiaDebtMaturities();
    const [view, setView] = useState<'central' | 'combined' | 'comparison'>('central');
    const [usData, setUsData] = useState<USData[]>([]);

    // Fetch US data if Comparison view is selected
    React.useEffect(() => {
        if (view === 'comparison' && usData.length === 0) {
            const fetchUsData = async () => {
                try {
                    const { data } = await supabase
                        .from('us_debt_maturities')
                        .select('bucket, amount')
                        .order('date', { ascending: false })
                        .limit(8);

                    if (data) {
                        // Aggregate US buckets to match India simplified buckets
                        const aggregated = data.reduce((acc: Record<string, number>, row: any) => {
                            let bucket = row.bucket;
                            if (['<1M', '1-3M', '3-6M', '6-12M'].includes(bucket)) bucket = '<1Y';
                            if (['1-2Y'].includes(bucket)) bucket = '1-3Y';
                            if (['2-5Y'].includes(bucket)) bucket = '3-5Y';
                            if (['5-10Y'].includes(bucket)) bucket = '5-10Y';
                            if (['10Y+'].includes(bucket)) bucket = '10-20Y'; // Approximation

                            const amt = parseFloat(row.amount) / 1000000; // Trillions for US
                            acc[bucket] = (acc[bucket] || 0) + amt;
                            return acc;
                        }, {});

                        const formatted = BUCKET_ORDER.map(b => ({
                            bucket: b,
                            amount: aggregated[b] || 0
                        }));
                        setUsData(formatted);
                    }
                } catch (err) {
                    console.error('Error fetching US data:', err);
                }
            };
            fetchUsData();
        }
    }, [view, usData.length]);

    const chartData = useMemo(() => {
        if (indiaData.length === 0) return [];

        return BUCKET_ORDER.map(bucket => {
            const central = indiaData.find(d => d.bucket === bucket && d.type === 'central');
            const state = indiaData.find(d => d.bucket === bucket && d.type === 'state');
            const us = usData.find(d => d.bucket === bucket);

            return {
                bucket,
                central: central ? central.amount_crore / 100000 : 0, // In Lakh Crore
                state: state ? state.amount_crore / 100000 : 0,     // In Lakh Crore
                combined: ((central?.amount_crore || 0) + (state?.amount_crore || 0)) / 100000,
                us: us ? us.amount : 0 // In $ Trillion (Different scale, noted in UI)
            };
        });
    }, [indiaData, usData]);

    const stats = useMemo(() => {
        if (indiaData.length === 0) return null;

        const currentIndia = indiaData.filter(d =>
            view === 'combined' ? true : (view === 'central' ? d.type === 'central' : d.type === 'central')
        );

        const total = currentIndia.reduce((sum, d) => sum + d.amount_crore, 0);
        const next1Y = currentIndia.find(d => d.bucket === '<1Y')?.amount_crore || 0;
        const next1YPercent = (next1Y / total) * 100;

        return {
            total: (total / 100000).toFixed(2),
            next1Y: (next1Y / 100000).toFixed(2),
            next1YPercent: next1YPercent.toFixed(1)
        };
    }, [indiaData, view]);

    if (indiaLoading) {
        return <div className="h-96 w-full bg-card animate-pulse rounded-xl border border-border" />;
    }

    return (
        <section className="w-full bg-card bg-gradient-to-br from-slate-900 via-slate-900 to-black rounded-xl border border-border shadow-sm shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[100px] -z-10" />

            {/* Header Area */}
            <div className="p-8 md:p-10 border-b border-border">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Scale className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-heading">
                                INDIA DEBT <span className="text-primary">MATURITY WALL</span>
                            </h2>
                        </div>
                        <p className="text-muted-foreground text-lg max-w-xl font-medium leading-tight">
                            Redemption profile of Sovereign Dated Securities (G-Sec) and State Development Loans (SDL).
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 p-1 bg-white/5 rounded-xl backdrop-blur-md border border-border">
                        {[
                            { id: 'central', label: 'Central G-Sec', icon: <Building2 className="w-4 h-4" /> },
                            { id: 'combined', label: 'Central + States', icon: <Scale className="w-4 h-4" /> },
                            { id: 'comparison', label: 'US Comparison', icon: <Globe className="w-4 h-4" /> }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => setView(btn.id as any)}
                                className={`
                                    flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300
                                    ${view === btn.id
                                        ? 'bg-primary text-primary-foreground shadow-md'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'}
                                `}
                            >
                                {btn.icon}
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 md:p-10 bg-muted/10">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <span className="text-muted-foreground text-sm font-semibold uppercase tracking-wider">Total Outstanding</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-foreground">₹{stats?.total}</span>
                        <span className="text-muted-foreground text-lg font-bold">Lakh Cr</span>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <span className="text-muted-foreground text-sm font-semibold uppercase tracking-wider">Next 12M Maturing</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-foreground">₹{stats?.next1Y}</span>
                        <span className="text-muted-foreground text-lg font-bold">Lakh Cr</span>
                    </div>
                    <div className="mt-2 text-amber-500 text-xs font-bold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {stats?.next1YPercent}% of total debt stock
                    </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <Info className="w-5 h-5 text-primary" />
                            <span className="text-muted-foreground text-sm font-semibold uppercase tracking-wider">Rollover Status</span>
                        </div>
                        <p className="text-sm text-foreground font-medium leading-relaxed">
                            {Number(stats?.next1YPercent) > 15
                                ? "High localized pressure in short-end buckets. RBI likely to focus on switch operations."
                                : "Maturity wall is well-distributed. Historical bias towards 10Y+ duration persists."}
                        </p>
                    </div>
                    <div className="absolute -bottom-6 -right-6 text-primary/10">
                        <Activity className="w-32 h-32" />
                    </div>
                </div>
            </div>

            {/* Main Visual Section */}
            <MacroChartContainer height={CHART_HEIGHTS.hero} className="p-8 md:p-10">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ left: 40, right: 40 }}
                    >
                        <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} opacity={0.6} horizontal={false} />
                        <XAxis
                            {...DEFAULT_XAXIS_PROPS}
                            type="number"
                            stroke={COLORS.text}
                            fontSize={12}
                            tickFormatter={(v) => view === 'comparison' ? `${v}T/$T` : `₹${v}L Cr`}
                        />
                        <YAxis
                            {...DEFAULT_YAXIS_PROPS}
                            width={60}
                            dataKey="bucket"
                            type="category"
                            stroke={COLORS.text}
                            fontSize={12}
                            fontWeight="bold"
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className={`${TOOLTIP_SHELL_CLASS} z-50`}>
                                            <p className="text-slate-100 font-semibold border-b border-border pb-2">{payload[0].payload.bucket} Maturity</p>
                                            <div className="space-y-1">
                                                {view === 'comparison' ? (
                                                    <>
                                                        <div className="flex justify-between gap-8">
                                                            <span className="text-blue-500 text-xs font-bold">India (Lakh Cr)</span>
                                                            <span className="text-slate-100 font-mono">₹{payload[0].payload.combined.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-8">
                                                            <span className="text-rose-500 text-xs font-bold">US ($ Trillion)</span>
                                                            <span className="text-slate-100 font-mono">${payload[0].payload.us.toFixed(2)}</span>
                                                        </div>
                                                    </>
                                                ) : view === 'combined' ? (
                                                    <>
                                                        <div className="flex justify-between gap-8">
                                                            <span className="text-blue-500 text-xs font-bold">Central G-Sec</span>
                                                            <span className="text-slate-100 font-mono">₹{payload[0].payload.central.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-8">
                                                            <span className="text-violet-500 text-xs font-bold">States (SDL)</span>
                                                            <span className="text-slate-100 font-mono">₹{payload[0].payload.state.toFixed(2)}</span>
                                                        </div>
                                                        <div className="border-t border-border pt-2 flex justify-between gap-8">
                                                            <span className="text-slate-100 text-xs font-semibold">Total</span>
                                                            <span className="text-slate-100 font-mono font-semibold">₹{payload[0].payload.combined.toFixed(2)}</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex justify-between gap-8">
                                                        <span className="text-blue-500 text-xs font-bold">Central G-Sec</span>
                                                        <span className="text-slate-100 font-mono">₹{payload[0].payload.central.toFixed(2)}L Cr</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        {view === 'combined' && (
                            <>
                                <Bar dataKey="central" name="Central G-Sec" stackId="a" fill={COLORS.central} radius={[0, 0, 0, 0]} />
                                <Bar dataKey="state" name="States (SDL)" stackId="a" fill={COLORS.state} radius={[0, 8, 8, 0]} />
                            </>
                        )}
                        {view === 'central' && (
                            <Bar dataKey="central" name="Central G-Sec" fill={COLORS.central} radius={[0, 8, 8, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.bucket === '<1Y' ? CHART_COLORS.west : CHART_RAMPS.blue[1]} />
                                ))}
                            </Bar>
                        )}
                        {view === 'comparison' && (
                            <>
                                <Bar dataKey="combined" name="India (₹ Lakh Cr)" fill={COLORS.central} radius={[0, 8, 8, 0]} />
                                <Bar dataKey="us" name="US ($ Trillion)" fill={COLORS.us} radius={[0, 8, 8, 0]} />
                            </>
                        )}
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{ paddingTop: '20px' }}
                            formatter={(value) => <span className="text-slate-400 text-xs font-semibold uppercase">{value}</span>}
                        />
                    </BarChart>
            </MacroChartContainer>

            {/* Educational Footnote */}
            <div className="px-8 md:px-10 pb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-terminal-dim text-xs font-semibold uppercase tracking-wider">
                    <span>Source: RBI DBIE / Handbook of Statistics</span>
                    <div className="w-1 h-1 rounded-full bg-secondary" />
                    <span>Updated Monthly</span>
                </div>
                {view === 'comparison' && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
                        <ArrowRightLeft className="w-3 h-3 text-red-400" />
                        <span className="text-red-400 text-xs font-semibold uppercase tracking-heading">Dual Scale View: Indian ₹ Lakh Cr vs US $ Trillion</span>
                    </div>
                )}
            </div>
        </section>
    );
};

const Activity = (props: any) => (
    <svg
        {...props}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);
