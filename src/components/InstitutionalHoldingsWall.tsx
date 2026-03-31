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
        <Box sx={{ width: '100%', height: 200, position: 'relative' }}>
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
                bottom: '20%',
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center'
            }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'monospace', fontSize: '2.5rem' }}>
                    {score > 0 ? '+' : ''}{score.toFixed(0)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>
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
        <MotionCard delay={0.1} className="h-full p-[2.5rem] bg-[rgba(15,23,42,0.4)] border border-[rgba(255,255,255,0.05)]">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {data.fund_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                        {data.fund_type}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: 'monospace', fontSize: '1rem' }}>
                        {formatNumber(data.total_aum, { notation: 'compact' })}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem' }}>
                        AUM
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mb: 2 }}>
                {[
                    { label: 'EQUITY', value: latestEquity, color: COLORS.equity },
                    { label: 'BOND', value: data.asset_class_allocation.bond_pct, color: COLORS.bond },
                    { label: 'GOLD', value: data.asset_class_allocation.gold_pct, color: COLORS.gold },
                    { label: 'OTHER', value: data.asset_class_allocation.other_pct, color: COLORS.other }
                ].map(item => (
                    <Box key={item.label} sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', display: 'block', textTransform: 'uppercase' }}>
                            {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: item.color, fontWeight: 800, fontFamily: 'monospace', fontSize: '0.9rem' }}>
                            {item.value.toFixed(1)}%
                        </Typography>
                    </Box>
                ))}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {trend > 0.5 ? <ChevronUp size={14} color={COLORS.bull} /> : trend < -0.5 ? <ChevronDown size={14} color={COLORS.bear} /> : <Minus size={14} color={COLORS.neutral} />}
                    <Typography variant="caption" sx={{ color: trend > 0.5 ? COLORS.bull : trend < -0.5 ? COLORS.bear : COLORS.neutral, fontWeight: 700, fontSize: '0.75rem' }}>
                        {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                    </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    vs 8Q avg
                </Typography>
            </Box>
        </MotionCard>
    );
};

// Sector Heatmap Cell
const SectorCell: React.FC<{ value: number; max: number }> = ({ value, max }) => {
    const intensity = Math.min(value / max, 1);
    const bgColor = `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`;
    const textColor = intensity > 0.6 ? '#fff' : '#94a3b8';
    return (
        <Box
            sx={{
                p: 1,
                bgcolor: bgColor,
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 0.5,
                textAlign: 'center',
                minHeight: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Typography variant="caption" sx={{ color: textColor, fontWeight: 700, fontSize: '0.7rem', fontFamily: 'monospace' }}>
                {value.toFixed(1)}%
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

    // Max sector allocation for heatmap scaling
    const maxSectorPct = Math.max(...heatmapData.flatMap(d => Object.values(d.sectors)), 1);

    return (
        <Box sx={{ mb: 6 }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1, bgcolor: alpha(COLORS.equity, 0.1), color: COLORS.equity, borderRadius: 0.5 }}>
                    <Activity size={24} />
                </Box>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: -0.5, fontSize: '1.75rem' }}>
                        SMART MONEY 13-F TRACKER
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}>
                        INSTITUTIONAL ALLOCATION TELEMETRY • SEC 13-F CONSOLIDATED
                    </Typography>
                </Box>
                <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                        Total Monitored
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: COLORS.equity, fontFamily: 'monospace' }}>
                        {formatAUM(collective.total_aum)}
                    </Typography>
                </Box>
            </Box>

            {/* Row 1: Collective Regime + Stacked Allocation History */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <MotionCard className="h-full">
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 2, display: 'block', textTransform: 'uppercase' }}>
                                Smart Money Regime
                            </Typography>
                            <RegimeGauge score={regimeScore} label={regimeLabel} />
                            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <Zap size={14} color={riskSignal === 'RISK_ON' ? COLORS.bull : riskSignal === 'RISK_OFF' ? COLORS.bear : COLORS.neutral} />
                                <Typography variant="body2" sx={{ fontWeight: 800, color: riskSignal === 'RISK_ON' ? COLORS.bull : riskSignal === 'RISK_OFF' ? COLORS.bear : COLORS.neutral }}>
                                    {riskSignal}
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block', fontSize: '0.7rem' }}>
                                Z: {regimeScore.toFixed(1)} | Institutions: {collective.institution_count}
                            </Typography>
                        </Box>
                    </MotionCard>
                </Grid>
                <Grid item xs={12} md={8}>
                    <MotionCard delay={0.1} className="h-full">
                        <Box sx={{ p: 3 }}>
                            <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 2, textTransform: 'uppercase', fontSize: '0.8rem' }}>
                                Asset Allocation Trend (8 Quarters)
                            </Typography>
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={stackedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.equity} stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor={COLORS.equity} stopOpacity={0.1}/>
                                        </linearGradient>
                                        <linearGradient id="colorBond" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.bond} stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor={COLORS.bond} stopOpacity={0.1}/>
                                        </linearGradient>
                                        <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.gold} stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor={COLORS.gold} stopOpacity={0.1}/>
                                        </linearGradient>
                                        <linearGradient id="colorOther" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.other} stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor={COLORS.other} stopOpacity={0.1}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="quarter" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                                    <Tooltip
                                        contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontFamily: 'monospace', fontSize: 11 }}
                                        formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name.toUpperCase()]}
                                    />
                                    <Area type="monotone" dataKey="equity" stackId="1" stroke={COLORS.equity} fill="url(#colorEquity)" />
                                    <Area type="monotone" dataKey="bond" stackId="1" stroke={COLORS.bond} fill="url(#colorBond)" />
                                    <Area type="monotone" dataKey="gold" stackId="1" stroke={COLORS.gold} fill="url(#colorGold)" />
                                    <Area type="monotone" dataKey="other" stackId="1" stroke={COLORS.other} fill="url(#colorOther)" />
                                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </MotionCard>
                </Grid>
            </Grid>

            {/* Row 2: Institution Cards + Top Holdings + Sector Heatmap */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Col 1: Institution Cards */}
                <Grid item xs={12} lg={4}>
                    <MotionCard delay={0.2} className="h-full">
                        <Box sx={{ p: 3 }}>
                            <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 2, textTransform: 'uppercase', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Activity size={14} /> Key Institutions
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
                        <Box sx={{ p: 3 }}>
                            <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 2, textTransform: 'uppercase', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <BarChart3 size={14} /> Top Holdings Concentration
                            </Typography>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={aggregatedTopHoldings.slice(0, 12)} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }} tickFormatter={(v) => `${(v/1e9).toFixed(1)}B`} />
                                        <YAxis type="category" dataKey="ticker" tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' }} width={75} />
                                        <Tooltip
                                            contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontFamily: 'monospace', fontSize: 10 }}
                                            formatter={(value: number, _name: string, props: any) => [
                                                `$${(value/1e9).toFixed(2)}B (${props.payload.concentration_contribution.toFixed(1)}%)`,
                                                props.payload.name || props.payload.ticker
                                            ]}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {aggregatedTopHoldings.slice(0, 12).map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={`hsl(${210 + (index * 15)}, 70%, 60%)`} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Box>
                    </MotionCard>
                </Grid>

                {/* Col 3: Sector Rotation Heatmap */}
                <Grid item xs={12} lg={4}>
                    <MotionCard delay={0.4} className="h-full">
                        <Box sx={{ p: 3 }}>
                            <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 2, textTransform: 'uppercase', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Globe size={14} /> Sector Rotation Heatmap
                            </Typography>
                            <Box sx={{ overflowX: 'auto' }}>
                                <Box sx={{ minWidth: 400 }}>
                                    {/* Header row */}
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '120px repeat(auto-fit, minmax(60px, 1fr))', gap: 0.5, mb: 1 }}>
                                        <Box sx={{ p: 0.5, textAlign: 'right' }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                                INSTITUTION
                                            </Typography>
                                        </Box>
                                        {sectorsList.map(sector => (
                                            <Box key={sector} sx={{ p: 0.5 }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.6rem', textTransform: 'uppercase', textAlign: 'center', display: 'block' }}>
                                                    {sector.slice(0, 6)}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                    {/* Data rows */}
                                    {heatmapData.map(row => (
                                        <Box key={row.fund} sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                                            <Box sx={{ width: 120, p: 0.5, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.7rem', fontFamily: 'monospace' }}>
                                                    {row.fund.split(' ')[0]}
                                                </Typography>
                                            </Box>
                                            {sectorsList.map(sector => {
                                                const value = row.sectors[sector] || 0;
                                                return (
                                                    <SectorCell key={`${row.fund}-${sector}`} value={value} max={maxSectorPct} />
                                                );
                                            })}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    </MotionCard>
                </Grid>
            </Grid>

            {/* Row 3: Benchmark Comparisons & Signals */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <MotionCard delay={0.5} className="h-full">
                        <Box sx={{ p: 3 }}>
                            <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, mb: 2, textTransform: 'uppercase', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <GitCompare size={14} /> Benchmark Relative Performance (Avg QoQ)
                            </Typography>
                            <Grid container spacing={2}>
                                {[
                                    { label: 'S&P 500', value: collective ? institutions.reduce((sum, i) => sum + i.spy_comparison, 0) / institutions.length : 0, color: COLORS.equity },
                                    { label: 'TLT (Bonds)', value: collective ? institutions.reduce((sum, i) => sum + i.tlt_comparison, 0) / institutions.length : 0, color: COLORS.bond },
                                    { label: 'Gold (GLD)', value: collective ? institutions.reduce((sum, i) => sum + i.gld_comparison, 0) / institutions.length : 0, color: COLORS.gold }
                                ].map(bench => (
                                    <Grid item xs={4} key={bench.label}>
                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', textTransform: 'uppercase' }}>
                                                {bench.label}
                                            </Typography>
                                            <Typography variant="h6" sx={{ color: bench.color, fontWeight: 900, fontFamily: 'monospace', mt: 0.5 }}>
                                                {bench.value > 0 ? '+' : ''}{bench.value.toFixed(2)}%
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem' }}>
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
                        <Box sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(riskSignal === 'RISK_ON' ? COLORS.bull : riskSignal === 'RISK_OFF' ? COLORS.bear : COLORS.neutral, 0.05) }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1, display: 'block', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                                    Collective Risk Signal
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: riskSignal === 'RISK_ON' ? COLORS.bull : riskSignal === 'RISK_OFF' ? COLORS.bear : COLORS.neutral, fontFamily: 'monospace', textTransform: 'uppercase' }}>
                                    {riskSignal}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, maxWidth: 400, mx: 'auto' }}>
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
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Shield size={12} className="text-emerald-500" />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                        DATA: SEC 13-F EDGAR • ALPHA VANTAGE ENRICHMENT
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.65rem' }}>
                        AS OF: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} UTC
                    </Typography>
                    <Box sx={{ width: 120, height: 4, bgcolor: 'rgba(59,130,246,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ width: '75%', height: '100%', bgcolor: COLORS.equity, animation: 'pulse 3s infinite' }} />
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
