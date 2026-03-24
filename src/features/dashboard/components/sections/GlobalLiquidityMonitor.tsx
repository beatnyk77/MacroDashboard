import React from 'react';
import { Box, Typography, Grid, useTheme, alpha } from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Globe,
    Database,
    Zap,
    Gauge
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { useGlobalLiquidity } from '@/hooks/useGlobalLiquidity';
import { MotionCard } from '@/components/MotionCard';
import { formatNumber } from '@/utils/formatNumber';
import { formatDelta } from '@/utils/formatMetric';

const Sparkline: React.FC<{ data: any[], dataKey: string, color: string }> = ({ data, dataKey, color }) => (
    <Box sx={{ width: '100%', height: 40 }}>
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <YAxis hide domain={['auto', 'auto']} />
                <Area
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    fillOpacity={1}
                    fill={`url(#gradient-${dataKey})`}
                    strokeWidth={1.5}
                    isAnimationActive={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    </Box>
);

const IndicatorCard: React.FC<{
    label: string;
    value: string | number;
    delta: number;
    unit?: string;
    icon: React.ReactNode;
    data: any[];
    dataKey: string;
    color: string;
}> = ({ label, value, delta, unit = '', icon, data, dataKey, color }) => {
    const isUp = delta > 0;
    const isNeutral = Math.abs(delta) < 0.01;

    return (
        <Box sx={{
            p: 2,
            height: '100%',
            bgcolor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {label}
                </Typography>
                <Box sx={{ color }}>{icon}</Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700, fontFamily: 'monospace' }}>
                    {typeof value === 'number' ? formatNumber(value, { decimals: 2 }) : value}{unit}
                </Typography>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: isNeutral ? 'text.secondary' : (isUp ? 'success.main' : 'error.main'),
                    fontSize: '0.75rem',
                    fontWeight: 600
                }}>
                    {isNeutral ? <Minus size={12} /> : (isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />)}
                    <Typography variant="caption" sx={{ ml: 0.25, fontWeight: 700 }}>
                        {formatDelta(delta, { decimals: 2, unit: '%' })}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ mt: 'auto' }}>
                <Sparkline data={data} dataKey={dataKey} color={color} />
            </Box>
        </Box>
    );
};

export const GlobalLiquidityMonitor: React.FC = () => {
    const { data } = useGlobalLiquidity();
    const theme = useTheme();

    const colors = {
        EXPANDING: '#0df259', // Kinetic Green
        CONTRACTING: '#f87171', // Red
        NEUTRAL: '#fbbf24', // Amber
        ACCELERATING: '#22d3ee', // Cyan
        DECELERATING: '#94a3b8', // Slate
        STEADY: '#818cf8', // Indigo
    };

    const currentRegimeColor = colors[data.regime_label] || colors.NEUTRAL;
    const currentVelocityColor = colors[data.velocity_label] || colors.STEADY;

    const DirectionIcon = data.regime_label === 'EXPANDING' ? ArrowUpRight :
        data.regime_label === 'CONTRACTING' ? ArrowDownRight : Minus;

    return (
        <Box sx={{ mb: 6, mt: 2 }}>
            {/* Hero Section with Large Gauge/Arrow */}
            <Box sx={{
                p: 4,
                mb: 3,
                borderRadius: 2,
                bgcolor: 'rgba(2, 6, 23, 0.8)',
                border: '1px solid rgba(13, 242, 89, 0.1)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Subtle Background Glow */}
                <Box sx={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-10%',
                    width: '400px',
                    height: '400px',
                    background: `radial-gradient(circle, ${currentRegimeColor}1a 0%, transparent 70%)`,
                    filter: 'blur(60px)',
                    zIndex: 0
                }} />

                <Grid container spacing={4} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
                    <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-start' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Box sx={{
                                p: 2,
                                borderRadius: '50%',
                                bgcolor: alpha(currentRegimeColor, 0.1),
                                color: currentRegimeColor,
                                display: 'flex',
                                boxShadow: `0 0 20px ${currentRegimeColor}1a`
                            }}>
                                <DirectionIcon size={48} strokeWidth={2.5} />
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: -1 }}>
                                    {data.regime_label}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                        VELOCITY:
                                    </Typography>
                                    <Typography variant="subtitle2" sx={{ color: currentVelocityColor, fontWeight: 800 }}>
                                        {data.velocity_label}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 500, lineHeight: 1.4, mb: 1 }}>
                            {data.interpretation}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: '800px' }}>
                            Institutional composite monitoring across G5 Central Bank assets, global M2 trends, cross-border flows, and financial stress proxies.
                            Values updated weekly based on FRED and TIC repositories.
                        </Typography>
                    </Grid>
                </Grid>
            </Box>

            {/* 5-Card Strip */}
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} lg={2.4}>
                    <MotionCard delay={0.1}>
                        <IndicatorCard
                            label="CB Aggregate"
                            value={data.cb_aggregate}
                            unit="T"
                            delta={data.cb_aggregate_wow_pct}
                            icon={<Database size={18} />}
                            data={data.trailing_history}
                            dataKey="cb"
                            color={theme.palette.primary.main}
                        />
                    </MotionCard>
                </Grid>
                <Grid item xs={12} sm={6} lg={2.4}>
                    <MotionCard delay={0.2}>
                        <IndicatorCard
                            label="Global M2"
                            value={formatNumber(data.global_m2_growth / 1000, { decimals: 1 })}
                            unit="T"
                            delta={data.global_m2_wow_pct}
                            icon={<Globe size={18} />}
                            data={data.trailing_history}
                            dataKey="m2"
                            color="#22d3ee"
                        />
                    </MotionCard>
                </Grid>
                <Grid item xs={12} sm={6} lg={2.4}>
                    <MotionCard delay={0.3}>
                        <IndicatorCard
                            label="Flow Index"
                            value={data.cross_border_flow}
                            delta={data.cross_border_wow_pct}
                            icon={<Zap size={18} />}
                            data={data.trailing_history}
                            dataKey="flow"
                            color="#818cf8"
                        />
                    </MotionCard>
                </Grid>
                <Grid item xs={12} sm={6} lg={2.4}>
                    <MotionCard delay={0.4}>
                        <IndicatorCard
                            label="Risk Proxy"
                            value={data.risk_on_off_proxy}
                            delta={data.risk_on_off_wow_pct}
                            icon={<Activity size={18} />}
                            data={data.trailing_history}
                            dataKey="risk"
                            color="#fbbf24"
                        />
                    </MotionCard>
                </Grid>
                <Grid item xs={12} lg={2.4}>
                    <MotionCard delay={0.5}>
                        <IndicatorCard
                            label="Composite Score"
                            value={data.composite_score}
                            delta={data.composite_wow_pct}
                            icon={<Gauge size={18} />}
                            data={data.trailing_history}
                            dataKey="risk" // Using risk as proxy for sparkline if score history not fully backfilled
                            color={currentRegimeColor}
                        />
                    </MotionCard>
                </Grid>
            </Grid>

            {/* Regime Progress Bar */}
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>LIQUIDITY REGIME</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>CORRELATION: HIGH (LIQUIDITY, DEBT WALL)</Typography>
                </Box>
                <Box sx={{ height: 8, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden', display: 'flex' }}>
                    <Box sx={{ width: '33.33%', height: '100%', bgcolor: data.composite_score < -15 ? 'error.main' : 'rgba(248, 113, 113, 0.2)' }} />
                    <Box sx={{ width: '33.33%', height: '100%', bgcolor: data.composite_score >= -15 && data.composite_score <= 15 ? 'warning.main' : 'rgba(251, 191, 36, 0.2)' }} />
                    <Box sx={{ width: '33.33%', height: '100%', bgcolor: data.composite_score > 15 ? 'success.main' : 'rgba(13, 242, 89, 0.2)' }} />
                </Box>
            </Box>
        </Box>
    );
};
