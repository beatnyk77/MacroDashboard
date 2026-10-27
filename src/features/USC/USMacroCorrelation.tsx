import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Box, Typography, Grid, Skeleton } from '@mui/material';
import { XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_TOOLTIP_ITEM_STYLE, DEFAULT_TOOLTIP_LABEL_STYLE, DEFAULT_TOOLTIP_STYLE, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_COLORS, alpha, WHITE_ALPHA } from '@/constants/chartDefaults';
import { Zap } from 'lucide-react';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

export const USMacroCorrelation: React.FC = () => {
    const { data: macroMetrics, isLoading } = useQuery({
        queryKey: ['us-macro-correlation-data'],
        queryFn: async () => {
            const metricsList = ['US_POLICY_RATE', 'US_CPI_YOY', 'US_GDP_GROWTH_YOY', 'US_GDP_NOMINAL_TN'];
            const { data, error } = await supabase
                .from('metric_observations')
                .select('metric_id, as_of_date, value, z_score, metrics!metric_id(id, name)')
                .in('metric_id', metricsList)
                .order('as_of_date', { ascending: false })
                .limit(60);

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
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>Macro Correlation Matrix</Typography>
                <Typography variant="caption" sx={{ color: 'white/30', fontWeight: 700, textTransform: 'uppercase' }}>Sovereign Regimes vs Corporate Solvency</Typography>
            </Box>

            <Grid container spacing={4}>
                {/* Interest Rate Regime vs Valuations */}
                <Grid item xs={12} md={8}>
                    <Box sx={{ p: 4, borderRadius: '32px', bgcolor: 'white/[0.02]', border: '1px solid white/5' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'white/60', mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Zap size={14} className="text-amber-400" />
                            INTEREST RATE REGIME (FED FUNDS VS 10Y)
                        </Typography>
                        <Box sx={{ height: 300, width: '100%' }}>
                            <MacroChartContainer height="fill">
                                <LineChart data={macroMetrics?.filter((d: any) => d.metric_id?.includes('RATE') || d.metric_id?.includes('YIELD'))}>
                                    <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} vertical={false} />
                                    <XAxis
                                        {...DEFAULT_XAXIS_PROPS}
                                        dataKey="as_of_date"
                                        tick={{ fill: WHITE_ALPHA.dim, fontSize: 11, fontWeight: 700 }}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        {...DEFAULT_YAXIS_PROPS}
                                        width={60}
                                        tick={{ fill: WHITE_ALPHA.dim, fontSize: 11, fontWeight: 700 }}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={DEFAULT_TOOLTIP_STYLE}
                                        labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE}
                                        itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE}
                                    />
                                    <Line type="monotone" dataKey="value" stroke={CHART_COLORS.west} strokeWidth={3} dot={false} />
                                </LineChart>
                            </MacroChartContainer>
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
                                <Typography variant="caption" sx={{ display: 'block', color: 'white/30', fontWeight: 700, textTransform: 'uppercase', mb: 1 }}>{m.label}</Typography>
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-bold text-white">{m.value}</span>
                                    <div className={`px-2 py-0.5 rounded text-xs font-semibold uppercase bg-${m.color}-500/10 text-${m.color}-400 border border-${m.color}-500/20`}>
                                        {m.trend}
                                    </div>
                                </div>
                            </Box>
                        ))}
                    </Box>
                </Grid>
            </Grid>

            {/* Strategic Commentary */}
            <Box sx={{ mt: 6, p: 6, borderRadius: '32px', bgcolor: 'blue.500/5', border: `1px solid ${alpha(CHART_COLORS.west, 0.1)}` }}>
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
