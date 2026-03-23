import React from 'react';
import { Box, Typography, Grid, alpha } from '@mui/material';
import { ResponsiveSankey } from '@nivo/sankey';
import {
    Activity,
    ShieldAlert,
    Layers,
    Target,
    Zap
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { useGoldPositioning } from '@/hooks/useGoldPositioning';
import { MotionCard } from '@/components/MotionCard';

const PredictionGauge: React.FC<{ score: number }> = ({ score }) => {
    const data = [{ value: 100 }];
    const normalized = Math.max(0, Math.min(100, score));
    const color = score > 60 ? '#f59e0b' : score < 40 ? '#ef4444' : '#6366f1';

    return (
        <Box sx={{ width: '100%', height: 160, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} cx="50%" cy="80%" startAngle={180} endAngle={0} innerRadius="65%" outerRadius="90%" paddingAngle={0} dataKey="value" stroke="none">
                        <Cell fill="rgba(255,255,255,0.05)" />
                    </Pie>
                    <Pie data={[{ value: normalized }, { value: 100 - normalized }]} cx="50%" cy="80%" startAngle={180} endAngle={0} innerRadius="65%" outerRadius="90%" paddingAngle={0} dataKey="value" stroke="none">
                        <Cell fill={color} />
                        <Cell fill="transparent" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <Box sx={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'monospace' }}>{score.toFixed(0)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', tracking: 1 }}>PREDICTION</Typography>
            </Box>
        </Box>
    );
};

export const GoldPositioningMonitor: React.FC = () => {
    const { data, isLoading } = useGoldPositioning();

    if (isLoading || !data) return null;

    const cotData = [
        { name: 'Managed Money', value: data.cot_managed_money_net, color: '#f59e0b' },
        { name: 'Swap Dealers', value: data.cot_swap_dealer_net, color: '#3b82f6' },
        { name: 'Producers', value: data.cot_producer_net, color: '#ef4444' }
    ];

    return (
        <Box sx={{ mb: 12 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b', borderRadius: 1 }}>
                    <Target size={24} />
                </Box>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', textTransform: 'uppercase', tracking: -0.5 }}>
                        Gold Positioning & Manipulation Monitor
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', tracking: 1 }}>
                        Futures Allocation × Whale Hedging × Implied Direction
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* 1. COT Positioning Heatmap */}
                <Grid item xs={12} lg={4}>
                    <MotionCard>
                        <Box sx={{ p: 3 }}>
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-[0.7rem] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                                    <Activity size={12} /> Institutional Net Position
                                </span>
                                <div className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[0.6rem] font-bold">COT PROXY</div>
                            </div>
                            <Box sx={{ height: 250 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cotData} layout="vertical" margin={{ left: 20 }}>
                                        <XAxis type="number" hide domain={[-100, 100]} />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} width={100} />
                                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }} />
                                        <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {cotData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Box>
                    </MotionCard>
                </Grid>

                {/* 2. Paper vs Physical Sankey */}
                <Grid item xs={12} lg={5}>
                    <MotionCard>
                        <Box sx={{ p: 3, height: '100%', minHeight: 330 }}>
                            <span className="text-[0.7rem] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 mb-6">
                                <Layers size={12} /> Paper vs Physical Flows
                            </span>
                            <Box sx={{ height: 230 }}>
                                <ResponsiveSankey
                                    data={data.sankey_data as any}
                                    margin={{ top: 10, right: 100, bottom: 10, left: 100 }}
                                    align="justify"
                                    colors={node => (node as any).color || '#f59e0b'}
                                    nodeThickness={12}
                                    nodeSpacing={18}
                                    linkOpacity={0.2}
                                    linkHoverOpacity={0.6}
                                    enableLinkGradient={true}
                                    labelPosition="outside"
                                    labelPadding={12}
                                    labelTextColor="rgba(255,255,255,0.7)"
                                    theme={{
                                        labels: { text: { fontSize: 10, fontWeight: 800, fontFamily: 'monospace' } },
                                        tooltip: { container: { background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }
                                    }}
                                />
                            </Box>
                        </Box>
                    </MotionCard>
                </Grid>

                {/* 3. Prediction & Whale Badge */}
                <Grid item xs={12} lg={3}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                        <MotionCard>
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <PredictionGauge score={data.prediction_gauge_score} />
                                <Box sx={{ mt: -1 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}>
                                        1-WEEK PREDICTION BAND
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'monospace' }}>
                                        ${data.price_band_low.toFixed(0)} — ${data.price_band_high.toFixed(0)}
                                    </Typography>
                                </Box>
                            </Box>
                        </MotionCard>

                        <MotionCard>
                            <Box sx={{ p: 2, bgcolor: alpha('#818cf8', 0.05) }}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-indigo-500/20 text-indigo-400">
                                        <ShieldAlert size={18} />
                                    </div>
                                    <div>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, display: 'block', textTransform: 'uppercase', fontSize: '0.6rem' }}>
                                            WHALE HEDGING PRESSURE
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#818cf8', fontFamily: 'monospace' }}>
                                            {data.whale_hedging_pressure.toFixed(1)}Z
                                        </Typography>
                                    </div>
                                </div>
                            </Box>
                        </MotionCard>
                    </Box>
                </Grid>
            </Grid>

            {/* Interpretation Footer */}
            <Box sx={{ mt: 3 }}>
                <MotionCard>
                    <Box sx={{ p: 2, bgcolor: 'rgba(255,215,0,0.02)', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Zap size={16} className="text-amber-500 mt-1 flex-shrink-0" />
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', fontWeight: 500 }}>
                            {data.interpretation} — <span className="text-xs opacity-50 uppercase font-black tracking-tighter">Verified @ {data.as_of_date}</span>
                        </Typography>
                    </Box>
                </MotionCard>
            </Box>
        </Box>
    );
};
