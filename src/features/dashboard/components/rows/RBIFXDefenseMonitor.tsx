import React, { useMemo } from 'react';
import {
    ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS } from '@/constants/chartDefaults';
import { Shield, ArrowRightLeft, Activity, Globe, TrendingUp, TrendingDown } from 'lucide-react';
import { useRBIFXDefense } from '@/hooks/useRBIFXDefense';
import { TerminalChartTooltip, type TerminalChartTooltipProps } from '@/components/charts/TerminalChartTooltip';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

export const RBIFXDefenseMonitor: React.FC = () => {
    const { data: rawData, loading } = useRBIFXDefense();

    const chartData = useMemo(() => {
        if (!rawData) return [];
        return rawData.map(d => ({
            ...d,
            formattedDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            // Create a derived metric for REER premium over NEER
            valuation_premium: Number(d.reer_40 || 0) - Number(d.neer_40 || 0)
        }));
    }, [rawData]);

    const latest = useMemo(() => chartData[chartData.length - 1], [chartData]);
    const previous = useMemo(() => chartData[chartData.length - 2], [chartData]);

    if (loading || !latest) {
        return <div className="h-96 w-full bg-card border border-border rounded-xl animate-pulse" />;
    }

    const reservesDelta = Number(latest.fx_reserves_bn || 0) - Number(previous?.fx_reserves_bn || latest.fx_reserves_bn || 0);
    const isAccumulating = reservesDelta > 0;

    // Logic for analyst insight based on recent data
    let analystInsight = "";
    if ((latest.forward_book_net_bn || 0) < 0 && isAccumulating) {
        analystInsight = "RBI is actively accumulating spot reserves while drawing down the net forward book to manage liquidity and absorb inflows without immediate spot market distortion.";
    } else if ((latest.valuation_premium || 0) > 5) {
        analystInsight = "Rupee remains significantly overvalued on a REER basis compared to NEER, putting pressure on export competitiveness and necessitating careful RBI intervention management.";
    } else {
        analystInsight = "RBI maintaining a balanced defense posture. Intervention focus shifting dynamically between spot accumulation and forward book management based on daily volatility.";
    }

    return (
        <section className="w-full bg-card rounded-xl border border-border overflow-hidden shadow-sm font-sans relative text-card-foreground">
            {/* Header Area */}
            <div className="p-8 pb-6 border-b border-border bg-muted/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Live Signal</span>
                            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider ml-2 border-l border-border pl-2">Source: RBI DBIE</span>
                        </div>
                        <h2 className="text-3xl font-bold text-foreground tracking-heading leading-none">
                            FX Defense & Currency War Monitor
                        </h2>
                    </div>
                </div>
            </div>

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border border-b border-border bg-muted/40">
                <MetricCard
                    title="Headline FX Reserves"
                    value={`$${(latest.fx_reserves_bn || 0).toFixed(1)}B`}
                    delta={`${reservesDelta > 0 ? '+' : ''}${reservesDelta.toFixed(1)}B`}
                    trend={reservesDelta > 0 ? 'up' : 'down'}
                    icon={<Shield className="w-5 h-5 text-emerald-400" />}
                    colorClass="text-emerald-400"
                />
                <MetricCard
                    title="Net Forward Book"
                    value={`$${(latest.forward_book_net_bn || 0).toFixed(1)}B`}
                    subtext={(latest.forward_book_net_bn || 0) < 0 ? "Net Short (Selling)" : "Net Long (Buying)"}
                    icon={<ArrowRightLeft className="w-5 h-5 text-cyan-400" />}
                    colorClass={(latest.forward_book_net_bn || 0) < 0 ? "text-rose-400" : "text-cyan-400"}
                />
                <MetricCard
                    title="REER Valuation Premium"
                    value={`${(latest.valuation_premium || 0).toFixed(1)} pts`}
                    subtext={`REER: ${(latest.reer_40 || 0).toFixed(1)} | NEER: ${(latest.neer_40 || 0).toFixed(1)}`}
                    icon={<Globe className="w-5 h-5 text-fuchsia-400" />}
                    colorClass="text-fuchsia-400"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 relative">
                {/* Main Charts Area */}
                <div className="lg:col-span-9 p-6 relative">
                    {/* Background glow behind charts */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-fuchsia-500/5 pointer-events-none" />

                    <MacroChartContainer height={CHART_HEIGHTS.tall}>
                            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} className="text-border" opacity={0.5} vertical={false} />
                                <XAxis
                                    {...DEFAULT_XAXIS_PROPS}
                                    dataKey="formattedDate"
                                    axisLine={false}
                                    className="text-muted-foreground"
                                    minTickGap={20}
                                />

                                {/* Left Y-Axis for Reserves & Forward Book */}
                                <YAxis
                                    {...DEFAULT_YAXIS_PROPS}
                                    width={60}
                                    yAxisId="left"
                                    axisLine={false}
                                    className="text-muted-foreground"
                                    tickFormatter={(val) => `$${val}B`}
                                    domain={['auto', 'auto']}
                                />

                                {/* Right Y-Axis for REER/NEER */}
                                <YAxis
                                    {...DEFAULT_YAXIS_PROPS}
                                    width={60}
                                    yAxisId="right"
                                    orientation="right"
                                    axisLine={false}
                                    className="text-muted-foreground"
                                    domain={[90, 110]}
                                />

                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', opacity: 0.05 }} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 600 }} className="text-muted-foreground" />

                                {/* FX Reserves Area */}
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="fx_reserves_bn"
                                    name="Spot FX Reserves"
                                    fill="url(#colorReserves)"
                                    stroke={CHART_COLORS.expansion}
                                    strokeWidth={3}
                                    fillOpacity={0.2}
                                />
                                <defs>
                                    <linearGradient id="colorReserves" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.expansion} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={CHART_COLORS.expansion} stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                {/* Net Forward Book Bars */}
                                <Bar
                                    yAxisId="left"
                                    dataKey="forward_book_net_bn"
                                    name="Net Forward Book"
                                    fill={CHART_COLORS.west} // Default positive color
                                    radius={[4, 4, 0, 0]}
                                    // Make negative bars red
                                    shape={(props: any) => {
                                        const { x, y, width, height, payload } = props;
                                        const fill = payload.forward_book_net_bn < 0 ? CHART_COLORS.east : CHART_COLORS.west;
                                        return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} ry={4} opacity={0.8} />;
                                    }}
                                />

                                {/* REER vs NEER Lines */}
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="reer_40"
                                    name="REER (40-Curr)"
                                    stroke={CHART_COLORS.violet}
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="neer_40"
                                    name="NEER (40-Curr)"
                                    stroke={CHART_COLORS.gold}
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    dot={false}
                                />
                            </ComposedChart>
                    </MacroChartContainer>
                </div>

                {/* Right/Bottom Sidebar: Analyst Insights */}
                <div className="lg:col-span-3 bg-muted/20 border-t lg:border-t-0 lg:border-l border-border p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-blue-400" />
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Analyst Insight</h3>
                    </div>
                    <div className="relative">
                        <div className="absolute -left-1 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-fuchsia-500 rounded-full" />
                        <p className="pl-4 text-sm text-muted-foreground leading-relaxed font-medium">
                            {analystInsight}
                        </p>
                    </div>

                    <div className="mt-8 space-y-4">
                        <div className="bg-card rounded-xl p-4 border border-border">
                            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Defense Stance</div>
                            <div className="text-foreground font-bold text-sm">
                                {reservesDelta > 0 && (latest.forward_book_net_bn || 0) < 0 ? "Asymmetric (Spot Buy, Forward Sell)" : "Symmetrical Accumulation"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Sub-components

const MetricCard = ({ title, value, delta, subtext, icon, colorClass, trend }: any) => (
    <div className="p-6 bg-transparent hover:bg-muted/30 transition-colors group">
        <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">{title}</span>
            <div className="p-2 rounded-lg bg-muted border border-border">
                {icon}
            </div>
        </div>
        <div className="flex items-end gap-3">
            <span className={`text-4xl font-bold tracking-heading leading-none ${colorClass}`}>{value}</span>
            {delta && (
                <span className={`flex items-center text-sm font-bold mb-1 ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {delta}
                </span>
            )}
        </div>
        {subtext && (
            <div className="mt-2 text-xs font-medium text-muted-foreground">{subtext}</div>
        )}
    </div>
);

const CustomTooltip = (props: TerminalChartTooltipProps) => (
    <TerminalChartTooltip
        {...props}
        valueFormatter={(value, name) =>
            name.includes('REER') || name.includes('NEER') ? Number(value || 0).toFixed(1) : `$${Number(value || 0).toFixed(1)}B`
        }
    />
);
