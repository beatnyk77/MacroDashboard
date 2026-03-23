import React from 'react';
import { Box, Typography, Grid, alpha } from '@mui/material';
import { ResponsiveSankey } from '@nivo/sankey';
import {
    Activity,
    ArrowRightLeft,
    ShieldCheck,
    Database
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useSmartMoneyFlow } from '@/hooks/useSmartMoneyFlow';
import { MotionCard } from '@/components/MotionCard';

const RegimeGauge: React.FC<{ score: number }> = ({ score }) => {
    const data = [
        { value: 100, color: 'rgba(255,255,255,0.05)' }, // Full range
    ];

    // Normalize score (-100 to 100) to gauge percentage (0 to 100)
    const normalized = (score + 100) / 2;
    const color = score > 30 ? '#0df259' : score < -30 ? '#f87171' : '#22d3ee';

    return (
        <Box sx={{ width: '100%', height: 180, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="80%"
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
                        cy="80%"
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
                bottom: '15%',
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center'
            }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: 'monospace' }}>
                    {score > 0 ? '+' : ''}{score.toFixed(0)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                    {score > 30 ? 'RISK-ON' : score < -30 ? 'RISK-OFF' : 'NEUTRAL'}
                </Typography>
            </Box>
        </Box>
    );
};

const MetricCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
    <Box sx={{
        p: 2,
        bgcolor: 'rgba(15, 23, 42, 0.4)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2
    }}>
        <Box sx={{ color, opacity: 0.8 }}>{icon}</Box>
        <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                {label}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 800, fontFamily: 'monospace' }}>
                {value}
            </Typography>
        </Box>
    </Box>
);

export const SmartMoneyFlowMonitor: React.FC = () => {
    const { data } = useSmartMoneyFlow();

    if (!data) return null;

    return (
        <Box sx={{ mb: 6 }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1, bgcolor: alpha('#22d3ee', 0.1), color: '#22d3ee', borderRadius: 0.5 }}>
                    <ArrowRightLeft size={20} />
                </Box>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: -0.5 }}>
                        SMART MONEY FLOW NETWORK
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        INSTITUTIONAL LIQUIDITY DEPLOYMENT (TIC + COT PROXY)
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Sankey Column */}
                <Grid item xs={12} lg={8}>
                    <MotionCard>
                        <Box sx={{ p: 3, height: 450, bgcolor: 'rgba(2, 6, 23, 0.4)' }}>
                            <ResponsiveSankey
                                data={data.sankey_data as any}
                                margin={{ top: 20, right: 120, bottom: 20, left: 120 }}
                                align="justify"
                                colors={node => (node as any).color || '#22d3ee'}
                                nodeOpacity={1}
                                nodeThickness={12}
                                nodeInnerPadding={2}
                                nodeSpacing={24}
                                nodeBorderWidth={0}
                                nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
                                linkOpacity={0.15}
                                linkHoverOpacity={0.6}
                                linkHoverOthersOpacity={0.05}
                                linkContract={2}
                                enableLinkGradient={true}
                                labelPosition="outside"
                                labelPadding={16}
                                labelTextColor="rgba(255,255,255,0.7)"
                                theme={{
                                    labels: { text: { fontSize: 11, fontWeight: 700, fontFamily: 'monospace' } },
                                    tooltip: { container: { background: '#0f172a', color: '#fff', fontSize: '12px', border: '1px solid rgba(255,255,255,0.1)' } }
                                }}
                            />
                        </Box>
                    </MotionCard>
                </Grid>

                {/* Gauge & Metrics Column */}
                <Grid item xs={12} lg={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                        <MotionCard>
                            <Box sx={{ p: 2, textAlign: 'center', height: '100%', flex: 1 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1, display: 'block' }}>
                                    SMART MONEY REGIME
                                </Typography>
                                <RegimeGauge score={data.regime_score} />
                                <Typography variant="body2" sx={{ color: 'text.secondary', px: 2, fontSize: '0.8rem', mt: -1 }}>
                                    {data.interpretation}
                                </Typography>
                            </Box>
                        </MotionCard>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                            <MetricCard
                                label="TIC Foreign Buying"
                                value={`$${data.tic_net_foreign_buying.toFixed(1)}B`}
                                icon={<Database size={18} />}
                                color="#22d3ee"
                            />
                            <MetricCard
                                label="Hedge Fund Equity Net"
                                value={`${data.cot_equities_net_position > 0 ? '+' : ''}${data.cot_equities_net_position.toFixed(1)}%`}
                                icon={<Activity size={18} />}
                                color="#fbbf24"
                            />
                            <MetricCard
                                label="Gold Position (Z)"
                                value={data.cot_gold_net_position.toFixed(1)}
                                icon={<ShieldCheck size={18} />}
                                color="#818cf8"
                            />
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};
