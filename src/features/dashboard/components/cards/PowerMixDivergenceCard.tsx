import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS, WHITE_ALPHA } from '@/constants/chartDefaults';
import { TOOLTIP_SHELL_CLASS } from '@/components/charts/chartTooltipFormat';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

interface PowerMixDivergenceCardProps {
    data?: { region: string; coal: number; renewable: number; other: number }[];
    isLoading?: boolean;
    lastUpdated?: string;
}

export const PowerMixDivergenceCard: React.FC<PowerMixDivergenceCardProps> = ({
    data = [],
    lastUpdated
}) => {
    return (
        <Card className="w-full h-full min-h-[450px] p-6 bg-background/40 border-border backdrop-blur-md flex flex-col gap-6 group shadow-2xl relative overflow-hidden rounded-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />

            <div className="flex items-center justify-between px-0">
                <div>
                    <h4 className="text-xl font-light text-white flex items-center gap-2">
                        <span className="w-8 h-px bg-emerald-500/50" />
                        Power Mix Divergence
                    </h4>
                    <div className="flex items-center gap-3 mt-1 ml-10">
                        <span className="text-xs font-semibold text-emerald-500/80 flex items-center gap-1.5 uppercase tracking-wider">
                            {lastUpdated ? (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    AS OF {new Date(lastUpdated).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </>
                            ) : (
                                "Establishing Data Feed..."
                            )}
                        </span>
                    </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    {data.length > 0 ? (
                        <>
                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                            Live Generation Data
                        </>
                    ) : (
                        <>
                            <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                            Data Syncing
                        </>
                    )}
                </div>
            </div>

            <CardContent className="flex-1 w-full mt-4 p-0">
                {data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground italic text-xs">
                        Connecting to Ember Global Electricity Review...
                    </div>
                ) : (
                    <>
                        <MacroChartContainer height={CHART_HEIGHTS.standard}>
                                <BarChart
                                    data={data}
                                    layout="vertical"
                                    margin={{ top: 10, right: 40, left: 40, bottom: 20 }}
                                    barSize={32}
                                >
                                    <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} horizontal={false} />
                                    <XAxis
                                        {...DEFAULT_XAXIS_PROPS}
                                        type="number"
                                        domain={[0, 100]}
                                        stroke={WHITE_ALPHA.line}
                                        fontSize={11}
                                        fontWeight="900"
                                        tickFormatter={(v) => `${v}%`}
                                        className="uppercase tracking-heading"
                                    />
                                    <YAxis
                                        {...DEFAULT_YAXIS_PROPS}
                                        dataKey="region"
                                        type="category"
                                        stroke={WHITE_ALPHA.line}
                                        fontSize={11}
                                        fontWeight="900"
                                        width={80}
                                        className="uppercase tracking-wider text-white"
                                    />
                                    <Tooltip
                                        cursor={{ fill: WHITE_ALPHA.ghost }}
                                        content={({ active, payload, label }) => {
                                            if (!active || !payload) return null;
                                            return (
                                                <div className={TOOLTIP_SHELL_CLASS}>
                                                    <p className="text-xs font-semibold text-slate-100 mb-3 uppercase tracking-wider border-b border-border pb-2">{label}</p>
                                                    <div className="space-y-2 min-w-[140px]">
                                                        {payload.map((p: any) => (
                                                            <div key={p.name} className="flex justify-between items-center gap-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.fill }} />
                                                                    <span className="text-xs text-slate-400 uppercase font-semibold">{p.name}</span>
                                                                </div>
                                                                <span className="text-xs font-mono font-semibold text-slate-100">{p.value.toFixed(1)}%</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Bar dataKey="coal" stackId="a" fill={CHART_COLORS.line} name="Coal" radius={[4, 0, 0, 4]} />
                                    <Bar dataKey="renewable" stackId="a" fill={CHART_COLORS.expansion} name="Renewables" />
                                    <Bar dataKey="other" stackId="a" fill={CHART_COLORS.west} name="Nuclear/Gas/Other" radius={[0, 4, 4, 0]} />
                                </BarChart>
                        </MacroChartContainer>

                        <div className="flex items-center gap-6 mb-8 px-10">
                            {[
                                { color: CHART_COLORS.line, label: 'Coal' },
                                { color: CHART_COLORS.expansion, label: 'Renewables' },
                                { color: CHART_COLORS.west, label: 'Nuclear/Gas/Other' }
                            ].map(legend => (
                                <div key={legend.label} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full border border-border" style={{ backgroundColor: legend.color }} />
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{legend.label}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div className="mt-8 p-6 rounded-xl bg-white/[0.02] border border-border relative group/insight overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50 group-hover/insight:bg-emerald-400 transition-colors" />
                    <p className="text-xs leading-relaxed text-muted-foreground/80 font-medium">
                        <span className="text-white font-semibold uppercase tracking-wider mr-2 underline decoration-emerald-500/30">Strategic Insight:</span>
                        The structural divergence in power generation is the primary driver of 2025 energy cost disparities.
                        <span className="text-white"> China and India</span> prioritize energy density via coal to fuel industrial expansion,
                        while the <span className="text-white">EU and US</span> Clean Energy transition creates intermittency risks
                        without sufficient baseload or storage backup, leading to higher industrial volatility.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
