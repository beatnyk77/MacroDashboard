import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList, Tooltip as RechartsTooltip } from 'recharts';
import { SectionHeader } from '@/components/SectionHeader';
import { useMajorEconomies } from '@/hooks/useMajorEconomies';

export const SovereignRiskMatrix = React.memo(() => {
    const { data, isLoading } = useMajorEconomies();

    if (isLoading || !data) return null;

    // Filter out countries with incomplete data
    const chartData = data
        .filter(d => d.debt_gold_ratio > 0 && d.growth !== 0)
        .map(d => ({
            name: d.name,
            code: d.code,
            x: d.debt_gold_ratio, // Risk
            y: d.growth,          // Vitality
            z: d.gdp_nominal,     // Size
            cpi: d.cpi,
            flag: d.flag
        }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <Paper sx={{ p: 1.5, border: '1px solid rgba(255,255,255,0.1)', bgcolor: 'background.paper', boxShadow: 24 }}>
                    <Typography variant="body2" sx={{ fontWeight: 900, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {data.flag} {data.name}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Debt/Gold: <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{data.x.toFixed(1)}x</Box>
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Real Growth: <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{data.y.toFixed(1)}%</Box>
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            CPI YoY: <Box component="span" sx={{ color: data.cpi > 5 ? 'error.main' : 'success.main', fontWeight: 700 }}>{data.cpi.toFixed(1)}%</Box>
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            GDP: <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>${data.z.toFixed(1)}T</Box>
                        </Typography>
                    </Box>
                </Paper>
            );
        }
        return null;
    };

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader
                title="Sovereign Risk Matrix"
                subtitle="Mapping Fiscal Vulnerability (Debt/Gold) vs Economic Vitality (Real Growth)"
            />

            <Paper sx={{
                p: 3,
                bgcolor: 'background.paper',
                backgroundImage: 'none',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                height: 450,
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Quadrant Labels */}
                <Typography variant="overline" sx={{ position: 'absolute', top: 20, right: 30, color: 'success.main', fontWeight: 900, opacity: 0.3, fontSize: '0.6rem' }}>
                    DYNAMIC ANCHORS (SAFE)
                </Typography>
                <Typography variant="overline" sx={{ position: 'absolute', top: 20, left: 80, color: 'warning.main', fontWeight: 900, opacity: 0.3, fontSize: '0.6rem' }}>
                    GROWTH AT RISK
                </Typography>
                <Typography variant="overline" sx={{ position: 'absolute', bottom: 60, left: 80, color: 'error.main', fontWeight: 900, opacity: 0.3, fontSize: '0.6rem' }}>
                    FISCAL TRAP (DANGER)
                </Typography>
                <Typography variant="overline" sx={{ position: 'absolute', bottom: 60, right: 30, color: 'primary.main', fontWeight: 900, opacity: 0.3, fontSize: '0.6rem' }}>
                    STAGNANT STABILITY
                </Typography>

                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name="Risk"
                            unit="x"
                            domain={[0, 'auto']}
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={10}
                            label={{ value: 'Debt / Gold Ratio (Lower = Stronger)', position: 'insideBottom', offset: -10, fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            name="Vitality"
                            unit="%"
                            domain={[0, 'auto']}
                            stroke="rgba(255,255,255,0.3)"
                            fontSize={10}
                            label={{ value: 'Real GDP Growth %', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}
                        />
                        <ZAxis type="number" dataKey="z" range={[100, 2000]} />
                        <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                        {/* Shaded Quadrants for interpretation */}
                        {/* Bottom Left: Danger Zone (Fiscal Trap) */}
                        <rect x="0" y="0" width="50%" height="50%" fill="rgba(239, 68, 68, 0.03)" />
                        {/* Top Right: Safety / Growth */}
                        <rect x="50%" y="50%" width="50%" height="50%" fill="rgba(16, 185, 129, 0.03)" />

                        <Scatter data={chartData}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.cpi > 5 ? '#ef4444' : (entry.y > 4 ? '#10b981' : '#3b82f6')}
                                    fillOpacity={0.6}
                                    stroke={entry.cpi > 5 ? '#ef4444' : (entry.y > 4 ? '#10b981' : '#3b82f6')}
                                    strokeWidth={1}
                                />
                            ))}
                            <LabelList
                                dataKey="code"
                                position="top"
                                style={{ fill: 'rgba(255,255,255,0.8)', fontSize: '10px', fontWeight: 'bold' }}
                            />
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </Paper>
        </Box>
    );
});
