import React, { useMemo } from 'react';
import { Box, Typography, Grid, alpha, Tooltip as MuiTooltip } from '@mui/material';
import {
    Activity,
    Layers,
    Zap,
    Info
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, AreaChart, Area, CartesianGrid, Cell } from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_TOOLTIP_ITEM_STYLE, DEFAULT_TOOLTIP_LABEL_STYLE, DEFAULT_TOOLTIP_STYLE, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_COLORS, WHITE_ALPHA } from '@/constants/chartDefaults';
import { useGoldPositioning } from '@/hooks/useGoldPositioning';
import { MotionCard } from '@/components/MotionCard';
import { DataStatePanel } from '@/components/DataStatePanel';
import { TerminalTooltipShell, TerminalTooltipLabel, TerminalTooltipRow } from '@/components/charts/TerminalChartTooltip';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

// Custom tooltip component for basis chart
interface BasisTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
}

const BasisTooltip: React.FC<BasisTooltipProps> = ({ active, payload, label }) => {
    if (!active || !payload?.[0]) return null;
    const value = payload[0].value;
    const isPositive = value >= 0;
    return (
        <TerminalTooltipShell>
            <TerminalTooltipLabel>{label}</TerminalTooltipLabel>
            <TerminalTooltipRow label="Basis" valueClassName={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                {isPositive ? '+' : ''}{value.toFixed(1)} bps
            </TerminalTooltipRow>
            <div className="mt-1 text-[11px] text-terminal-dim">
                {isPositive ? 'Physical Premium' : 'Paper Premium'}
            </div>
        </TerminalTooltipShell>
    );
};

export const GoldPositioningMonitor: React.FC = () => {
    const { data: historyData, isLoading } = useGoldPositioning();

    // Build time series for Paper-Physical Basis Spread (last 90 days)
    // Must be before conditional return to obey Rules of Hooks
    const basisSeriesData = useMemo(() => {
        if (!historyData || historyData.length === 0) return [];
        const raw = historyData
            .slice(0, 90)
            .reverse()
            .map(entry => {
                const ratio = entry.paper_vs_physical_ratio;
                const basisBps = (ratio - 1) * 10000;
                return {
                    date: new Date(entry.as_of_date),
                    formattedDate: new Date(entry.as_of_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    basisSpread: basisBps
                };
            })
            .filter(d => !isNaN(d.basisSpread));
        // Add positive/negative split for coloring
        return raw.map(d => ({
            ...d,
            positiveBasis: d.basisSpread >= 0 ? d.basisSpread : 0,
            negativeBasis: d.basisSpread < 0 ? d.basisSpread : 0
        }));
    }, [historyData]);

    if (isLoading) return null;
    if (!historyData || historyData.length === 0) {
        return (
            <DataStatePanel
                variant="empty"
                title="Gold positioning data unavailable"
                description="CFTC COT positioning and paper/physical basis data has not reported for the requested window."
                accentColor="amber"
                height={300}
            />
        );
    }

    // Latest snapshot (most recent date)
    const latest = historyData[0];

    // COT positioning data for current week
    const cotData = [
        { name: 'Managed Money', value: latest.cot_managed_money_net },
        { name: 'Swap Dealers', value: latest.cot_swap_dealer_net },
        { name: 'Producers', value: latest.cot_producer_net }
    ];

    // Sort COT data by absolute value for better visualization
    const sortedCotData = [...cotData].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));


    return (
        <Box sx={{ mb: 12 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, bgcolor: alpha(CHART_COLORS.gold, 0.1), color: CHART_COLORS.gold, borderRadius: 1 }}>
                    <Layers size={24} />
                </Box>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', tracking: -0.5 }}>
                        Gold Derivatives & Physical Arbitrage Monitor
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', tracking: 1 }}>
                        COT Net Position × Basis Spread × Liquidity Stress
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* 1. COT Positioning - Horizontal Bars */}
                <Grid item xs={12} md={3} lg={3}>
                    <MotionCard>
                        <Box sx={{ p: 3, height: '100%' }}>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Activity size={12} />
                                    <span>COT NET POSITION</span>
                                    <MuiTooltip title="CFTC Commitments of Traders net positions by trader classification. Positive = net long, Negative = net short." arrow placement="top">
                                        <Info size={10} className="text-terminal-dim cursor-help" />
                                    </MuiTooltip>
                                </span>
                                <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold uppercase">
                                    CFTC WEEKLY
                                </span>
                            </div>

                            {/* Color legend */}
                            <div className="flex items-center justify-center gap-4 mb-3 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                                    <span>Long</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                                    <span>Short</span>
                                </span>
                            </div>

                            <Box sx={{ height: 220, mb: 2 }}>
                                <MacroChartContainer height="fill">
                                    <BarChart
                                        data={sortedCotData}
                                        layout="vertical"
                                        margin={{ left: 20, right: 30, top: 4, bottom: 4 }}
                                    >
                                        <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} horizontal={false} />
                                        <XAxis
                                            {...DEFAULT_XAXIS_PROPS}
                                            type="number"
                                            tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v}K`}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            {...DEFAULT_YAXIS_PROPS}
                                            dataKey="name"
                                            type="category"
                                            width={110}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={DEFAULT_TOOLTIP_STYLE}
                                            labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE}
                                            itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE}
                                            cursor={{ fill: WHITE_ALPHA.ghost }}
                                            formatter={(value: number) => [`${value.toLocaleString()} contracts`, 'Net Position']}
                                        />
                                        <ReferenceLine x={0} stroke={WHITE_ALPHA.soft} strokeWidth={1.5} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
                                            {sortedCotData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.value >= 0 ? CHART_COLORS.indigo : CHART_COLORS.east}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </MacroChartContainer>
                            </Box>

                            <div className="pt-2 border-t border-border flex justify-between text-[11px]">
                                <span className="text-terminal-dim font-mono">
                                    As of: {new Date(latest.as_of_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                <span className="text-muted-foreground">
                                    Latest CFTC report
                                </span>
                            </div>
                        </Box>
                    </MotionCard>
                </Grid>

                {/* 2. Paper-Physical Basis Spread Time Series */}
                <Grid item xs={12} md={9} lg={9}>
                    <MotionCard>
                        <Box sx={{ p: 3, height: '100%' }}>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Layers size={12} />
                                    <span>PAPER-PHYSICAL BASIS SPREAD</span>
                                    <MuiTooltip title="Spread between paper gold (futures) and physical spot prices. Positive = physical premium (backwardation), Negative = paper premium (contango). Measured in basis points (bps)." arrow placement="top">
                                        <Info size={10} className="text-terminal-dim cursor-help" />
                                    </MuiTooltip>
                                </span>
                                <div className="flex items-center gap-3 text-[11px]">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-sky-500" />
                                        <span className="text-muted-foreground">Basis (bps)</span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-emerald-400" />
                                        <span className="text-muted-foreground">Physical Premium</span>
                                    </span>
                                </div>
                            </div>

                            <Box sx={{ height: 280 }}>
                                <MacroChartContainer height="fill">
                                    <AreaChart data={basisSeriesData} margin={{ top: 4, right: 4, left: 0, bottom: 24 }}>
                                        <defs>
                                            <linearGradient id="basisGradientPositive" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={CHART_COLORS.expansion} stopOpacity={0.3} />
                                                <stop offset="100%" stopColor={CHART_COLORS.expansion} stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="basisGradientNegative" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={CHART_COLORS.east} stopOpacity={0.3} />
                                                <stop offset="100%" stopColor={CHART_COLORS.east} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} vertical={false} />

                                        {/* XAxis */}
                                        <XAxis
                                            {...DEFAULT_XAXIS_PROPS}
                                            dataKey="formattedDate"
                                            axisLine={{ stroke: WHITE_ALPHA.line }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={50}
                                            interval="preserveStartEnd"
                                        />

                                        {/* YAxis */}
                                        <YAxis
                                            {...DEFAULT_YAXIS_PROPS}
                                            width={60}
                                            axisLine={false}
                                            tickFormatter={(v) => `${v} bps`}
                                            domain={['auto', 'auto']}
                                        />

                                        <Tooltip content={<BasisTooltip />} cursor={{ stroke: WHITE_ALPHA.line, strokeDasharray: '2 2' }} />

                                        <ReferenceLine y={0} stroke={WHITE_ALPHA.soft} strokeWidth={1.5} strokeDasharray="3 3" />

                                        {/* Line for basis spread (on top) */}
                                        {basisSeriesData.length > 0 && (
                                            <Area
                                                type="monotone"
                                                dataKey="basisSpread"
                                                stroke={CHART_COLORS.west}
                                                strokeWidth={2}
                                                fill="none"
                                                dot={false}
                                                activeDot={{ r: 4, fill: CHART_COLORS.west, stroke: '#fff', strokeWidth: 2 }}
                                            />
                                        )}
                                        {/* Positive area fill */}
                                        {basisSeriesData.length > 0 && (
                                            <Area
                                                type="monotone"
                                                dataKey="positiveBasis"
                                                stroke="none"
                                                fill="url(#basisGradientPositive)"
                                            />
                                        )}
                                        {/* Negative area fill */}
                                        {basisSeriesData.length > 0 && (
                                            <Area
                                                type="monotone"
                                                dataKey="negativeBasis"
                                                stroke="none"
                                                fill="url(#basisGradientNegative)"
                                            />
                                        )}
                                    </AreaChart>
                                </MacroChartContainer>
                            </Box>

                            {/* Current value indicator */}
                            <div className="flex items-center justify-end gap-2 mt-2 text-[11px]">
                                <span className="text-terminal-dim">CURRENT:</span>
                                <span className={`font-mono font-bold ${basisSeriesData.length > 0 && basisSeriesData[basisSeriesData.length-1].basisSpread >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                    {basisSeriesData.length > 0 ? (basisSeriesData[basisSeriesData.length-1].basisSpread >= 0 ? '+' : '') + basisSeriesData[basisSeriesData.length-1].basisSpread.toFixed(1) : 'N/A'} bps
                                </span>
                            </div>
                        </Box>
                    </MotionCard>
                </Grid>
            </Grid>

            {/* Interpretation Footer */}
            <Box sx={{ mt: 3 }}>
                <MotionCard>
                    <Box sx={{ p: 2, bgcolor: alpha(CHART_COLORS.gold, 0.02), display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Zap size={16} className="text-amber-500 mt-1 flex-shrink-0" />
                        <Typography variant="body2" sx={{ color: WHITE_ALPHA.strong, fontStyle: 'italic', fontWeight: 500 }}>
                            {latest.interpretation} — <span className="text-xs opacity-50 uppercase font-semibold tracking-heading">Verified @ {new Date(latest.as_of_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </Typography>
                    </Box>
                </MotionCard>
            </Box>
        </Box>
    );
};
