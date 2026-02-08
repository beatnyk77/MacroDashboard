import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList, Tooltip as RechartsTooltip } from 'recharts';
import { useMajorEconomies } from '@/hooks/useMajorEconomies';
import { cn } from '@/lib/utils';
import { ArrowDown } from 'lucide-react';

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

export const SovereignRiskMatrix = React.memo(() => {
    const { data, isLoading } = useMajorEconomies();
    const [isExpanded, setIsExpanded] = React.useState(false);

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


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Sovereign Risk Matrix</h3>
                    <p className="text-[0.65rem] font-black tracking-widest text-muted-foreground/50 uppercase">Fiscal Vulnerability (Debt/Gold) vs Vitality (Growth)</p>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[0.6rem] font-black uppercase tracking-widest transition-all"
                >
                    {isExpanded ? 'Collapse Analysis' : 'Expand Deep Analysis'}
                </button>
            </div>

            <div className={cn(
                "spa-card bg-slate-900/40 border-white/5 overflow-hidden transition-all duration-700 ease-in-out",
                isExpanded ? "h-[550px] opacity-100" : "h-[200px] opacity-80 hover:opacity-100"
            )}>
                {!isExpanded && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] cursor-pointer group" onClick={() => setIsExpanded(true)}>
                        <div className="text-center group-hover:scale-110 transition-transform">
                            <ArrowDown className="w-8 h-8 text-blue-500 mx-auto mb-2 opacity-50 group-hover:opacity-100" />
                            <span className="text-[0.65rem] font-black text-blue-400 uppercase tracking-[0.2em]">Reveal Global Risk Landscape</span>
                        </div>
                    </div>
                )}

                <div className="h-full pt-4">
                    <div className="relative h-full px-4">
                        {/* Quadrant Labels */}
                        {isExpanded && (
                            <>
                                <div className="absolute top-4 left-20 text-[0.55rem] font-black text-emerald-500/40 uppercase tracking-widest pointer-events-none">DYNAMIC ANCHORS</div>
                                <div className="absolute top-4 right-10 text-[0.55rem] font-black text-amber-500/40 uppercase tracking-widest pointer-events-none">GROWTH AT RISK</div>
                                <div className="absolute bottom-16 right-10 text-[0.55rem] font-black text-rose-500/40 uppercase tracking-widest pointer-events-none">FISCAL TRAP</div>
                                <div className="absolute bottom-16 left-20 text-[0.55rem] font-black text-blue-500/40 uppercase tracking-widest pointer-events-none">STAGNANT STABILITY</div>
                            </>
                        )}

                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    type="number"
                                    dataKey="x"
                                    name="Risk"
                                    unit="x"
                                    domain={[0, 'auto']}
                                    stroke="rgba(255,255,255,0.2)"
                                    fontSize={9}
                                    tick={{ fill: 'rgba(255,255,255,0.3)' }}
                                    label={{ value: 'Debt / Gold Ratio', position: 'insideBottom', offset: -10, fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 900 }}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="y"
                                    name="Vitality"
                                    unit="%"
                                    domain={[0, 'auto']}
                                    stroke="rgba(255,255,255,0.2)"
                                    fontSize={9}
                                    tick={{ fill: 'rgba(255,255,255,0.3)' }}
                                    label={{ value: 'Real GDP Growth %', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 900 }}
                                />
                                <ZAxis type="number" dataKey="z" range={[50, 1000]} />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                                <Scatter data={chartData}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.cpi > 5 ? '#ef4444' : (entry.y > 4 ? '#10b981' : '#3b82f6')}
                                            fillOpacity={0.5}
                                            stroke={entry.cpi > 5 ? '#ef4444' : (entry.y > 4 ? '#10b981' : '#3b82f6')}
                                            strokeWidth={1}
                                        />
                                    ))}
                                    <LabelList
                                        dataKey="code"
                                        position="top"
                                        style={{ fill: 'rgba(255,255,255,0.6)', fontSize: '9px', fontWeight: '900' }}
                                    />
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
});
