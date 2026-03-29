import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Box, Typography, Grid, Skeleton } from '@mui/material';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Zap } from 'lucide-react';

export const USMacroCorrelation: React.FC = () => {
    const { data: macroMetrics, isLoading } = useQuery({
        queryKey: ['us-macro-correlation-data'],
        queryFn: async () => {
            const metricsList = ['US Federal Funds Rate', 'US 10-Year Treasury Yield', 'US CPI Inflation', 'US GDP Growth'];
            const { data, error } = await supabase
                .from('metric_data')
                .select('*, metrics!inner(name)')
                .in('metrics.name', metricsList)
                .order('date', { ascending: false })
                .limit(40);

            if (error) throw error;
            return data;
        }
    });

    if (isLoading) {
        return <Skeleton variant="rounded" height={400} sx={{ bgcolor: 'white/5', borderRadius: '32px' }} />;
    }

    return (
        <Box>
            <Box sx={{ mb: 6 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: 'white' }}>Macro Correlation Matrix</Typography>
                <Typography variant="caption" sx={{ color: 'white/30', fontWeight: 800, textTransform: 'uppercase' }}>Sovereign Regimes vs Corporate Solvency</Typography>
            </Box>

            <Grid container spacing={4}>
                {/* Interest Rate Regime vs Valuations */}
                <Grid item xs={12} md={8}>
                    <Box sx={{ p: 4, borderRadius: '32px', bgcolor: 'white/[0.02]', border: '1px solid white/5' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'white/60', mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Zap size={14} className="text-amber-400" />
                            INTEREST RATE REGIME (FED FUNDS VS 10Y)
                        </Typography>
                        <Box sx={{ height: 300, width: '100%' }}>
                            <ResponsiveContainer>
                                <LineChart data={macroMetrics?.filter((d: any) => d.metrics.name.includes('Rate') || d.metrics.name.includes('Yield'))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {[
                            { label: 'S&P 500 Yield Gap', value: '+1.2%', trend: 'tightening', color: 'rose' },
                            { label: 'Z-Score Solvency', value: '4.2', trend: 'stable', color: 'emerald' },
                            { label: 'Margin Pressure', value: 'HIGH', trend: 'increasing', color: 'amber' }
                        ].map((m, i) => (
                            <Box key={i} sx={{ p: 4, borderRadius: '24px', bgcolor: 'white/[0.02]', border: '1px solid white/5', flex: 1 }}>
                                <Typography variant="caption" sx={{ display: 'block', color: 'white/30', fontWeight: 900, textTransform: 'uppercase', mb: 1 }}>{m.label}</Typography>
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-black text-white">{m.value}</span>
                                    <div className={`px-2 py-0.5 rounded text-xs font-black uppercase bg-${m.color}-500/10 text-${m.color}-400 border border-${m.color}-500/20`}>
                                        {m.trend}
                                    </div>
                                </div>
                            </Box>
                        ))}
                    </Box>
                </Grid>
            </Grid>

            {/* Strategic Commentary */}
            <Box sx={{ mt: 6, p: 6, borderRadius: '32px', bgcolor: 'blue.500/5', border: '1px solid rgba(59,130,246,0.1)' }}>
                <Typography variant="body2" sx={{ color: 'white/60', fontWeight: 600, lineHeight: 1.7 }}>
                    <span className="text-blue-400 font-900 mr-2">FUNDAMENTAL INSIGHT:</span>
                    Current Treasury yields at 4.2%+ represent a structural headwind for long-duration equity valuations.
                    Correlation analysis suggests that sectors with high net leverage (Utilities, Real Estate) are demonstrating
                    increased sensitivity to the "Higher-for-Longer" regime, while Tech margins remain resilient due to high FCF yields.
                </Typography>
            </Box>
        </Box>
    );
};
