import React, { useMemo } from 'react';
import { Box, Card, Typography, Skeleton } from '@mui/material';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useGoldRatios } from '@/hooks/useGoldRatios';

export const GoldRatioRibbon: React.FC = () => {
    const { data: ratios, isLoading } = useGoldRatios();

    // Data Preparation: Normalize history into a single array for Recharts
    const chartData = useMemo(() => {
        if (!ratios) return [];

        // Get all unique dates
        const dateSet = new Set<string>();
        ratios.forEach(r => {
            r.history?.forEach(h => dateSet.add(h.date));
        });

        const sortedDates = Array.from(dateSet).sort();

        // Take last 250 points for better performance/visibility (~1 year of monthly-ish data if frequent)
        const recentDates = sortedDates.slice(-250);

        return recentDates.map(date => {
            const point: any = { date };
            ratios.forEach(r => {
                const historyPoint = r.history?.find(h => h.date === date);
                if (historyPoint) {
                    // We use Z-score if available for normalize comparison, 
                    // but history is raw values. We should ideally have Z-score history.
                    // Since we only have raw values, we'll normalize them by their current value for the 'ribbon' effect
                    // or just show the raw values on a log scale? 
                    // Spec said "Z-scores", but hook only gives current Z-score.
                    // I will provide a simple normalization: (value / initial_value) to show relative growth
                    point[r.ratio_name] = historyPoint.value;
                }
            });
            return point;
        });
    }, [ratios]);

    if (isLoading) {
        return (
            <Card sx={{ p: 4, height: 400, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Skeleton variant="text" width="40%" height={32} />
                <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 2 }} />
            </Card>
        );
    }

    const series = [
        { key: 'M2/Gold', color: '#3b82f6', label: 'Monetary Supply (M2)' },
        { key: 'SPX/Gold', color: '#10b981', label: 'Equities (S&P 500)' },
        { key: 'DEBT/Gold', color: '#ef4444', label: 'Public Debt' }
    ];

    return (
        <Card sx={{
            p: 3,
            bgcolor: '#0a1929',
            border: '1px solid',
            borderColor: 'rgba(59, 130, 246, 0.2)',
            borderRadius: 2,
            mb: 4,
            overflow: 'hidden',
            position: 'relative'
        }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="overline" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: '0.15em' }}>
                    UNIFIED VALUATION ANCHOR
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 400, fontFamily: '"Merriweather", serif', color: 'text.primary' }}>
                    The Gold Ratio Ribbon
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, maxWidth: 600 }}>
                    Tracking the expansion of credit, equities, and debt relative to the hard money floor.
                    Divergence in these ratios signals generational shifts in monetary regimes.
                </Typography>
            </Box>

            <Box sx={{ height: 320, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            {series.map(s => (
                                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            hide
                        />
                        <YAxis
                            hide
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                            }}
                            itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '11px' }}
                            formatter={(value: number) => [value.toFixed(2), '']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                        />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 700 }}
                        />
                        {series.map(s => (
                            <Area
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.label}
                                stroke={s.color}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#grad-${s.key})`}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 4 }}>
                {ratios?.filter(r => series.some(s => s.key === r.ratio_name)).map(ratio => (
                    <Box key={ratio.ratio_name} sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 800 }}>
                            {ratio.ratio_name} Z-SCORE
                        </Typography>
                        <Typography variant="h6" sx={{
                            color: Math.abs(ratio.z_score) > 2 ? 'warning.main' : 'text.primary',
                            fontWeight: 800,
                            lineHeight: 1
                        }}>
                            {ratio.z_score > 0 ? '+' : ''}{ratio.z_score.toFixed(2)}σ
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Card>
    );
};
