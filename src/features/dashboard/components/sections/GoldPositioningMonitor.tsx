import React, { useMemo } from 'react';
import { Box, Typography, Grid, alpha, useTheme, Tooltip as MuiTooltip } from '@mui/material';
import {
    Activity,
    ShieldAlert,
    Layers,
    Zap,
    Info
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, AreaChart, Area, CartesianGrid } from 'recharts';
import { useGoldPositioning } from '@/hooks/useGoldPositioning';
import { MotionCard } from '@/components/MotionCard';


export const GoldPositioningMonitor: React.FC = () => {
    const { data: historyData, isLoading } = useGoldPositioning();
    const theme = useTheme();

    if (isLoading || !historyData || historyData.length === 0) return null;

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

    // Build time series for Paper-Physical Basis Spread (last 90 days)
    const basisSeriesData = useMemo(() => {
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

    // Tooltip component for basis chart
    const BasisTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.[0]) return null;
        const value = payload[0].value;
        const isPositive = value >= 0;
        return (
            <Box sx={{
                p: 2,
                bgcolor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                    {label}
                </Typography>
                <Typography variant="body2" sx={{
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: isPositive ? '#34d399' : '#f43f5e'
                }}>
                    {isPositive ? '+' : ''}{value.toFixed(1)} bps
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block', mt: 0.5 }}>
                    {isPositive ? 'Physical Premium' : 'Paper Premium'}
                </Typography>
            </Box>
        );
    };

    // Color thresholds for basis spread
    const getBasisColor = (value: number) => {
        if (value > 10) return '#34d399'; // emerald - strong physical premium
        if (value < -10) return '#f43f5e'; // rose - strong paper premium
        return '#0ea5e9'; // sky - neutral
    };

    return (
        <Box sx={{ mb: 12 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b', borderRadius: 1 }}>
                    <Layers size={24} />
                </Box>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', textTransform: 'uppercase', tracking: -0.5 }}>
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
                                <span className="text-xs font-black uppercase tracking-uppercase text-muted-foreground/60 flex items-center gap-2">
                                    <Activity size={12} />
                                    <span>COT NET POSITION</span>
                                    <MuiTooltip title="CFTC Commitments of Traders net positions by trader classification. Positive = net long, Negative = net short." arrow placement="top">
                                        <Info size={10} className="text-muted-foreground/40 cursor-help" />
                                    </MuiTooltip>
                                </span>
                                <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase">
                                    CFTC WEEKLY
                                </span>
                            </div>

                            {/* Color legend */}
                            <div className="flex items-center justify-center gap-4 mb-3 text-[10px] text-muted-foreground/60">
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
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={sortedCotData}
                                        layout="vertical"
                                        margin={{ left: 20, right: 30, top: 4, bottom: 4 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
                                        <XAxis
                                            type="number"
                                            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                                            tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v}K`}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={110}
                                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                border: '1px solid rgba(255,255,255,0.12)',
                                                borderRadius: '8px',
                                                fontSize: '11px',
                                                fontFamily: 'monospace',
                                                padding: '8px 12px'
                                            }}
                                            formatter={(value: number) => [`${value.toLocaleString()} contracts`, 'Net Position']}
                                        />
                                        <ReferenceLine x={0} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
                                            {sortedCotData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.value >= 0 ? '#818cf8' : '#f43f5e'}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>

                            <div className="pt-2 border-t border-white/5 flex justify-between text-[10px]">
                                <span className="text-muted-foreground/40 font-mono">
                                    As of: {new Date(latest.as_of_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                <span className="text-muted-foreground/60">
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
                                <span className="text-xs font-black uppercase tracking-uppercase text-muted-foreground/60 flex items-center gap-2">
                                    <Layers size={12} />
                                    <span>PAPER-PHYSICAL BASIS SPREAD</span>
                                    <MuiTooltip title="Spread between paper gold (futures) and physical spot prices. Positive = physical premium (backwardation), Negative = paper premium (contango). Measured in basis points (bps)." arrow placement="top">
                                        <Info size={10} className="text-muted-foreground/40 cursor-help" />
                                    </MuiTooltip>
                                </span>
                                <div className="flex items-center gap-3 text-[10px]">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-sky-500" />
                                        <span className="text-muted-foreground/60">Basis (bps)</span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-emerald-400" />
                                        <span className="text-muted-foreground/60">Physical Premium</span>
                                    </span>
                                </div>
                            </div>

                            <Box sx={{ height: 280 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={basisSeriesData} margin={{ top: 4, right: 4, left: 0, bottom: 24 }}>
                                        <defs>
                                            <linearGradient id="basisGradientPositive" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="basisGradientNegative" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />

                                        {/* XAxis */}
                                        <XAxis
                                            dataKey="formattedDate"
                                            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                            tickLine={false}
                                            angle={-45}
                                            textAnchor="end"
                                            height={50}
                                            interval="preserveStartEnd"
                                        />

                                        {/* YAxis */}
                                        <YAxis
                                            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(v) => `${v} bps`}
                                            domain={['auto', 'auto']}
                                        />

                                        <Tooltip content={<BasisTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeDasharray: '2 2' }} />

                                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} strokeDasharray="3 3" />

                                        {/* Line for basis spread (on top) */}
                                        {basisSeriesData.length > 0 && (
                                            <Area
                                                type="monotone"
                                                dataKey="basisSpread"
                                                stroke="#0ea5e9"
                                                strokeWidth={2}
                                                fill="none"
                                                dot={false}
                                                activeDot={{ r: 4, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
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
                                </ResponsiveContainer>
                            </Box>

                            {/* Current value indicator */}
                            <div className="flex items-center justify-end gap-2 mt-2 text-[10px]">
                                <span className="text-muted-foreground/40">CURRENT:</span>
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
                    <Box sx={{ p: 2, bgcolor: 'rgba(255,215,0,0.02)', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Zap size={16} className="text-amber-500 mt-1 flex-shrink-0" />
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', fontWeight: 500 }}>
                            {latest.interpretation} — <span className="text-xs opacity-50 uppercase font-black tracking-heading">Verified @ {new Date(latest.as_of_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </Typography>
                    </Box>
                </MotionCard>
            </Box>
        </Box>
    );
};
