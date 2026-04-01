import React from 'react';
import { Box, Grid, alpha, Typography } from '@mui/material';
import {
    Activity, Globe, Shield,
    BarChart3, GitCompare, Zap, ChevronUp, ChevronDown, Minus
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend, PieChart, Pie
} from 'recharts';
import { useSmartMoneyHoldings } from '@/hooks/useSmartMoneyHoldings';
import { MotionCard } from '@/components/MotionCard';
import { SectionErrorBoundary } from './SectionErrorBoundary';
import { formatNumber } from '@/utils/formatNumber';
import TradeTape from './TradeTape';

// Color palette consistent with terminal theme
const COLORS = {
    equity: '#0df259',   // Green
    bond: '#fbbf24',     // Amber
    gold: '#818cf8',     // Indigo
    other: '#94a3b8',    // Slate
    bull: '#0df259',
    bear: '#f87171',
    neutral: '#22d3ee'
};

// Styled gauge for regime (similar to SmartMoneyFlowMonitor)
const RegimeGauge: React.FC<{ score: number; label: string }> = ({ score, label }) => {
    // Normalize score to 0-100 gauge
    const normalized = Math.min(Math.max((score + 100) / 2, 0), 100);
    const color = score > 30 ? COLORS.bull : score < -30 ? COLORS.bear : COLORS.neutral;

    return (
        <Box sx={{ width: '100%', height: 220, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={[{ value: 100 }]}
                        cx="50%"
                        cy="75%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius="65%"
                        outerRadius="90%"
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                    >
                        <Cell fill="rgba(255,255,255,0.05)" />
                    </Pie>
                    <Pie
                        data={[{ value: normalized }, { value: 100 - normalized }]}
                        cx="50%"
                        cy="75%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius="65%"
                        outerRadius="90%"
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                    >
                        <Cell fill={color} />
                        <Cell fill="transparent" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <Box sx={{
                position: 'absolute',
                bottom: '22%',
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center'
            }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'monospace', fontSize: '3rem', lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {score > 0 ? '+' : ''}{score.toFixed(0)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.1em', mt: 0.5 }}>
                    {label}
                </Typography>
            </Box>
        </Box>
    );
};

// Institution Card with sparkline
const InstitutionCard: React.FC<{ data: any; history: any[] }> = ({ data, history }) => {
    const latestEquity = data.asset_class_allocation.equity_pct;
    const trend = history.length >= 2 ? (latestEquity - history[history.length - 2].equity_pct) : 0;

    return (
        <MotionCard delay={0.1} className="h-full p-5 bg-[rgba(15,23,42,0.4)] border border-[rgba(255,255,255,0.05)]">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 800, fontSize: '1rem', lineHeight: 1.3, mb: 0.5 }}>
                        {data.fund_name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', fontWeight: 500 }}>
                        {data.fund_type}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'monospace', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                        {formatNumber(data.total_aum, { notation: 'compact' })}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                        AUM
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
                {[
                    { label: 'EQUITY', value: latestEquity, color: COLORS.equity },
                    { label: 'BOND', value: data.asset_class_allocation.bond_pct, color: COLORS.bond },
                    { label: 'GOLD', value: data.asset_class_allocation.gold_pct, color: COLORS.gold },
                    { label: 'OTHER', value: data.asset_class_allocation.other_pct, color: COLORS.other }
                ].map(item => (
                    <Box key={item.label} sx={{ textAlign: 'center', py: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.5 }}>
                            {item.label}
                        </Typography>
                        <Typography variant="h6" sx={{ color: item.color, fontWeight: 900, fontFamily: 'monospace', fontSize: '1.25rem', lineHeight: 1 }}>
                            {item.value.toFixed(1)}%
                        </Typography>
                    </Box>
                ))}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {trend > 0.5 ? <ChevronUp size={18} color={COLORS.bull} strokeWidth={2.5} /> : trend < -0.5 ? <ChevronDown size={18} color={COLORS.bear} strokeWidth={2.5} /> : <Minus size={18} color={COLORS.neutral} strokeWidth={2.5} />}
                    <Typography variant="body2" sx={{ color: trend > 0.5 ? COLORS.bull : trend < -0.5 ? COLORS.bear : COLORS.neutral, fontWeight: 800, fontSize: '0.9rem' }}>
                        {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                    </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    vs 8Q avg
                </Typography>
            </Box>
        </MotionCard>
    );
};

// Sector Heatmap Cell with directional arrow
const SectorCell: React.FC<{ allocation: number; max: number; delta?: number }> = ({ allocation, max, delta }) => {
    const intensity = Math.min(allocation / max, 1);
    const bgColor = `rgba(59, 130, 246, ${0.15 + intensity * 0.85})`;
    const textColor = intensity > 0.5 ? '#ffffff' : '#cbd5e1';
    const showArrow = delta !== undefined && Math.abs(delta) > 0.5;
    const arrowColor = delta && delta > 0 ? '#0df259' : delta && delta < 0 ? '#f87171' : textColor;

    return (
        <Box
            sx={{
                p: 1.5,
                bgcolor: bgColor,
                border: intensity > 0.7 ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 0.75,
                textAlign: 'center',
                minHeight: 52,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                    bgcolor: `rgba(59, 130, 246, ${0.25 + intensity * 0.75})`,
                    borderColor: 'rgba(59,130,246,0.5)',
                    transform: 'scale(1.02)'
                }
            }}
        >
            {showArrow && (
                <Typography component="span" sx={{ mr: 0.5, color: arrowColor, fontWeight: 900, fontSize: '0.875rem', lineHeight: 1 }}>
                    {delta! > 0 ? '↑' : '↓'}
                </Typography>
            )}
            <Typography variant="body2" sx={{ color: textColor, fontWeight: 800, fontSize: '0.875rem', fontFamily: 'monospace', letterSpacing: '-0.01em' }}>
                {allocation.toFixed(1)}%
            </Typography>
        </Box>
    );
};

const InstitutionalHoldingsWall: React.FC = () => {
    const {
        institutions,
        collective,
        institutionCards,
        aggregatedTopHoldings,
        sectorsList,
        heatmapData,
        collectiveHistory,
        formatAUM
    } = useSmartMoneyHoldings();

    if (!collective) return null;

    const regimeScore = collective.avg_regime_z * 10; // Scale to -100/100 roughly
    const regimeLabel = collective.regime_label;
    const riskSignal = collective.risk_signal;

    // Stacked area chart data preparation
    const stackedData = collectiveHistory.map(point => ({
        quarter: point.quarter.slice(0, 7), // "YYYY-MM"
        equity: point.equity_pct,
        bond: point.bond_pct,
        gold: point.gold_pct,
        other: point.other_pct
    }));

    // Max sector allocation for heatmap scaling (now sectors have {allocation, delta})
    const maxSectorPct = Math.max(...heatmapData.flatMap(d => Object.values(d.sectors).map((s: any) => s.allocation)), 1);

    return (
        <Box sx={{ mb: 6 }}>
            {/* Trade Tape */}
            <Box sx={{ mb: 4 }}>
                <TradeTape />
            </Box>

            {/* Disclaimers */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600, fontStyle: 'italic' }}>
                    Inferred from latest 13-F filings (quarterly, ~45-day lag)
                </Typography>
            </Box>

            {/* Header */}
            <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ p: 1.5, bgcolor: alpha(COLORS.equity, 0.15), color: COLORS.equity, borderRadius: 1, display: 'flex' }}>
                    <Activity size={28} />
                </Box>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em', fontSize: '1.75rem', lineHeight: 1.2 }}>
                        SMART MONEY 13-F TRACKER
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.05em' }}>
                        INSTITUTIONAL ALLOCATION TELEMETRY • SEC 13-F CONSOLIDATED
                    </Typography>
                </Box>
                <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                        Total Monitored
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.equity, fontFamily: 'monospace', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                        {formatAUM(collective.total_aum)}
                    </Typography>
                </Box>
            </Box>

            {/* Row 1: Collective Regime + Stacked Allocation History */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <MotionCard className="h-full">
                        <Box sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 800, mb: 3, fontSize: '1rem', letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
                                Smart Money Regime
                            </Typography>
                            <RegimeGauge score={regimeScore} label={regimeLabel} />
                            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <Zap size={16} color={riskSignal === 'RISK_ON' ? COLORS.bull : riskSignal === 'RISK_OFF' ? COLORS.bear : COLORS.neutral} />
                                <Typography variant="body2" sx={{ fontWeight: 900, color: riskSignal === 'RISK_ON' ? COLORS.bull : riskSignal === 'RISK_OFF' ? COLORS.bear : COLORS.neutral, fontSize: '0.9rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    {riskSignal}
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2, fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace' }}>
                                Z: {regimeScore.toFixed(1)} | Institutions: {collective.institution_count}
                            </Typography>
                        </Box>
                    </MotionCard>
                </Grid>
                <Grid item xs={12} md={8}>
                    <MotionCard delay={0.1} className="h-full">
                        <Box sx={{ p: 4 }}>
                            <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 800, mb: 2.5, fontSize: '1rem', letterSpacing: '-0.01em' }}>
                                Asset Allocation Trend (8 Quarters)
                            </Typography>
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={stackedData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                                    <defs>
                                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.equity} stopOpacity={0.85}/>
                                            <stop offset="95%" stopColor={COLORS.equity} stopOpacity={0.15}/>
                                        </linearGradient>
                                        <linearGradient id="colorBond" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.bond} stopOpacity={0.85}/>
                                            <stop offset="95%" stopColor={COLORS.bond} stopOpacity={0.15}/>
                                        </linearGradient>
                                        <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.gold} stopOpacity={0.85}/>
                                            <stop offset="95%" stopColor={COLORS.gold} stopOpacity={0.15}/>
                                        </linearGradient>
                                        <linearGradient id="colorOther" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.other} stopOpacity={0.85}/>
                                            <stop offset="95%" stopColor={COLORS.other} stopOpacity={0.15}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="quarter" tick={{ fill: '#cbd5e1', fontSize: 12.5, fontFamily: 'monospace', fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#cbd5e1', fontSize: 12.5, fontFamily: 'monospace', fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                                    <Tooltip
                                        contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, fontFamily: 'monospace', fontSize: 12, padding: '12px 14px' }}
                                        formatter={(value: number, name: string) => [`<span style="color:${COLORS.equity};font-weight:800">${value.toFixed(1)}%</span>`, name.toUpperCase()]}
                                    />
                                    <Area type="monotone" dataKey="equity" stackId="1" stroke={COLORS.equity} strokeWidth={2} fill="url(#colorEquity)" />
                                    <Area type="monotone" dataKey="bond" stackId="1" stroke={COLORS.bond} strokeWidth={2} fill="url(#colorBond)" />
                                    <Area type="monotone" dataKey="gold" stackId="1" stroke={COLORS.gold} strokeWidth={2} fill="url(#colorGold)" />
                                    <Area type="monotone" dataKey="other" stackId="1" stroke={COLORS.other} strokeWidth={2} fill="url(#colorOther)" />
                                    <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, paddingTop: '12px', letterSpacing: '0.02em' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </MotionCard>
                </Grid>
            </Grid>

            {/* Row 2: Institution Cards + Top Holdings + Sector Heatmap */}
            <Grid container spacing={4} sx={{ mb: 4 }}>
                {/* Col 1: Institution Cards */}
                <Grid item xs={12} lg={4}>
                    <MotionCard delay={0.2} className="h-full">
                        <Box sx={{ p: 4 }}>
                            <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 800, mb: 3, fontSize: '1rem', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Activity size={18} className="text-emerald-500" /> Key Institutions
                            </Typography>
                            <Grid container spacing={2}>
                                {institutionCards.map(inst => {
                                    const history = institutions.find(i => i.cik === inst.cik)?.historical_allocation || [];
                                    return (
                                        <Grid item xs={12} key={inst.cik}>
                                            <InstitutionCard data={inst} history={history} />
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Box>
                    </MotionCard>
                </Grid>

                {/* Col 2: Top Holdings Concentration */}
                <Grid item xs={12} lg={4}>
                    <MotionCard delay={0.3} className="h-full">
                        <Box sx={{ p: 4 }}>
                            <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 800, mb: 3, fontSize: '1rem', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <BarChart3 size={18} className="text-amber-500" /> Top Holdings Concentration
                            </Typography>
                            <Box sx={{ height: 380 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={aggregatedTopHoldings.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 90, left: 10, bottom: 5 }}>
                                        <XAxis
                                            type="number"
                                            tick={{ fill: '#cbd5e1', fontSize: 12.5, fontFamily: 'monospace', fontWeight: 700 }}
                                            tickFormatter={(v) => `$${(v/1e9).toFixed(1)}B`}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="ticker"
                                            tick={{ fill: '#cbd5e1', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}
                                            width={85}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, fontFamily: 'monospace', fontSize: 12.5, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                                            formatter={(value: number, _name: string, props: any) => [
                                                <span style={{ color: '#0df259', fontWeight: 800 }}>$${(value/1e9).toFixed(2)}B</span>,
                                                <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                                                    {props.payload.name || props.payload.ticker} ({props.payload.concentration_contribution.toFixed(1)}%)
                                                </span>
                                            ]}
                                            labelStyle={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 4, fontSize: '12px' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                            {aggregatedTopHoldings.slice(0, 10).map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={`hsl(${210 + (index * 12)}, 75%, 62%)`} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Box>
                    </MotionCard>
                </Grid>

                {/* Col 3: Sector Flow Heatmap */}
                <Grid item xs={12} lg={4}>
                    <MotionCard delay={0.4} className="h-full">
                        <Box sx={{ p: 4 }}>
                            <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 800, mb: 3, fontSize: '1rem', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Globe size={18} className="text-blue-500" /> Sector Flow Heatmap
                            </Typography>
                            <Box sx={{ overflowX: 'auto' }}>
                                <Box sx={{ minWidth: 500, mb: 2 }}>
                                    {/* Header row */}
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '140px repeat(auto-fit, minmax(90px, 1fr))', gap: 1, mb: 1.5 }}>
                                        <Box sx={{ p: 1, textAlign: 'right' }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                INSTITUTION
                                            </Typography>
                                        </Box>
                                        {sectorsList.map(sector => (
                                            <Box key={sector} sx={{ p: 1 }}>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.8125rem', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.3, letterSpacing: '0.02em' }}>
                                                    {sector}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                    {/* Data rows */}
                                    {heatmapData.map((row) => (
                                        <Box key={row.fund} sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'nowrap' }}>
                                            <Box sx={{ width: 140, p: 1, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderRight: '1px solid rgba(255,255,255,0.06)', pr: 2 }}>
                                                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 800, fontSize: '0.8125rem', fontFamily: 'monospace', letterSpacing: '-0.01em', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                                                    {row.fund.length > 15 ? row.fund.slice(0, 14) + '…' : row.fund}
                                                </Typography>
                                            </Box>
                                            {sectorsList.map(sector => {
                                                const cellData = row.sectors[sector] || { allocation: 0, delta: 0 };
                                                const value = cellData.allocation;
                                                const delta = cellData.delta;
                                                return (
                                                    <SectorCell key={`${row.fund}-${sector}`} allocation={value} max={maxSectorPct} delta={delta} />
                                                );
                                            })}
                                        </Box>
                                    ))}
                                </Box>
                                {/* Legend */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600 }}>LOW</Typography>
                                    <Box sx={{ width: 120, height: 8, bgcolor: 'rgba(59,130,246,0.15)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                                        <Box sx={{ width: '30%', height: '100%', bgcolor: 'rgba(59,130,246,0.3)' }} />
                                        <Box sx={{ width: '30%', height: '100%', bgcolor: 'rgba(59,130,246,0.6)' }} />
                                        <Box sx={{ width: '40%', height: '100%', bgcolor: 'rgba(59,130,246,0.9)' }} />
                                    </Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600 }}>HIGH</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </MotionCard>
                </Grid>
            </Grid>

            {/* Row 3: Benchmark Comparisons & Signals */}
            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <MotionCard delay={0.5} className="h-full">
                        <Box sx={{ p: 4 }}>
                            <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 800, mb: 3.5, fontSize: '1rem', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <GitCompare size={18} className="text-cyan-500" /> Benchmark Relative Performance (Avg QoQ)
                            </Typography>
                            <Grid container spacing={2.5}>
                                {[
                                    { label: 'S&P 500', value: collective ? institutions.reduce((sum, i) => sum + i.spy_comparison, 0) / institutions.length : 0, color: COLORS.equity },
                                    { label: 'TLT (Bonds)', value: collective ? institutions.reduce((sum, i) => sum + i.tlt_comparison, 0) / institutions.length : 0, color: COLORS.bond },
                                    { label: 'Gold (GLD)', value: collective ? institutions.reduce((sum, i) => sum + i.gld_comparison, 0) / institutions.length : 0, color: COLORS.gold }
                                ].map(bench => (
                                    <Grid item xs={12} sm={4} key={bench.label}>
                                        <Box sx={{
                                            textAlign: 'center',
                                            p: 2.5,
                                            bgcolor: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            borderRadius: 2,
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                bgcolor: 'rgba(255,255,255,0.04)',
                                                borderColor: 'rgba(255,255,255,0.1)',
                                                transform: 'translateY(-2px)'
                                            }
                                        }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', mb: 1 }}>
                                                {bench.label}
                                            </Typography>
                                            <Typography variant="h5" sx={{ color: bench.color, fontWeight: 900, fontFamily: 'monospace', fontSize: '1.5rem', letterSpacing: '-0.02em', lineHeight: 1.2, mb: 0.5 }}>
                                                {bench.value > 0 ? '+' : ''}{bench.value.toFixed(2)}%
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                                                vs Avg Inst.
                                            </Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </MotionCard>
                </Grid>
                <Grid item xs={12} md={6}>
                    <MotionCard delay={0.6} className="h-full">
                        <Box sx={{
                            p: 4,
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(riskSignal === 'RISK_ON' ? COLORS.bull : riskSignal === 'RISK_OFF' ? COLORS.bear : COLORS.neutral, 0.08),
                            border: '1px solid',
                            borderColor: alpha(riskSignal === 'RISK_ON' ? COLORS.bull : riskSignal === 'RISK_OFF' ? COLORS.bear : COLORS.neutral, 0.2),
                            transition: 'all 0.3s ease'
                        }}>
                            <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, mb: 2, display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                                    COLLECTIVE RISK SIGNAL
                                </Typography>
                                <Typography variant="h2" sx={{
                                    fontWeight: 900,
                                    color: riskSignal === 'RISK_ON' ? COLORS.bull : riskSignal === 'RISK_OFF' ? COLORS.bear : COLORS.neutral,
                                    fontFamily: 'monospace',
                                    textTransform: 'uppercase',
                                    fontSize: { xs: '2rem', md: '2.5rem' },
                                    letterSpacing: '-0.02em',
                                    mb: 2,
                                    lineHeight: 1.1
                                }}>
                                    {riskSignal}
                                </Typography>
                                <Typography variant="body1" sx={{
                                    color: 'text.secondary',
                                    mt: 1,
                                    maxWidth: 500,
                                    mx: 'auto',
                                    fontSize: '0.9375rem',
                                    lineHeight: 1.6,
                                    fontWeight: 500
                                }}>
                                    {riskSignal === 'RISK_ON' ? 'Smart Money collectively favoring risk assets. Equity allocation above 65%.' :
                                     riskSignal === 'RISK_OFF' ? 'Defensive reallocation detected. Smart Money rotating into bonds/gold.' :
                                     'Balanced posture across tracked institutions.'}
                                </Typography>
                            </Box>
                        </Box>
                    </MotionCard>
                </Grid>
            </Grid>

            {/* Metadata Bar */}
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Shield size={14} className="text-emerald-500" />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8125rem', letterSpacing: '0.05em' }}>
                        DATA: SEC 13-F EDGAR • ALPHA VANTAGE ENRICHMENT
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600 }}>
                        AS OF: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} UTC
                    </Typography>
                    <Box sx={{ width: 140, height: 5, bgcolor: 'rgba(59,130,246,0.1)', borderRadius: 2.5, overflow: 'hidden' }}>
                        <Box sx={{
                            width: '75%',
                            height: '100%',
                            bgcolor: COLORS.equity,
                            animation: 'pulse 3s infinite',
                            boxShadow: `0 0 10px ${COLORS.equity}40`
                        }} />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

const WrappedInstitutionalHoldingsWall: React.FC = () => (
    <SectionErrorBoundary name="13-F Institutional Holdings Monitor">
        <InstitutionalHoldingsWall />
    </SectionErrorBoundary>
);

export default WrappedInstitutionalHoldingsWall;
