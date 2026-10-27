import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Scale, TrendingUp } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_TOOLTIP_ITEM_STYLE, DEFAULT_TOOLTIP_LABEL_STYLE, DEFAULT_TOOLTIP_STYLE, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS, WHITE_ALPHA } from '@/constants/chartDefaults';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

interface DebtMetric {
    region: 'West (G7)' | 'East (BRICS+)';
    debtToGdp: number;
    yield10Y: number;
    foreignOwnership: number;
    realYield: number;
}

const DEBT_DATA: DebtMetric[] = [
    { region: 'West (G7)', debtToGdp: 128.5, yield10Y: 4.15, foreignOwnership: 28.4, realYield: 1.2 },
    { region: 'East (BRICS+)', debtToGdp: 64.2, yield10Y: 6.85, foreignOwnership: 12.1, realYield: 2.9 },
];

export const EastWestDebtInfluence: React.FC = () => {
    return (
        <Card className="w-full bg-background/40 border-border backdrop-blur-xl rounded-xl overflow-hidden shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Scale className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold tracking-heading text-foreground">Sovereign Debt Architectures</CardTitle>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">West (G7) vs East (BRICS+): Leverage & Yield Comparison</p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Visual Comparison */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Leverage vs Yield</h4>
                        <MacroChartContainer height={CHART_HEIGHTS.standard}>
                                <BarChart data={DEBT_DATA} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                    <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        {...DEFAULT_YAXIS_PROPS}
                                        type="category"
                                        dataKey="region"
                                        width={100}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={DEFAULT_TOOLTIP_STYLE}
                                        labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE}
                                        itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE}
                                        cursor={{ fill: WHITE_ALPHA.faint }}
                                    />
                                    <Bar dataKey="debtToGdp" name="Debt/GDP %" radius={[0, 4, 4, 0]} barSize={20}>
                                        <Cell fill={CHART_COLORS.east} /> {/* West (High Debt) */}
                                        <Cell fill={CHART_COLORS.expansion} /> {/* East (Lower Debt) */}
                                    </Bar>
                                    <Bar dataKey="yield10Y" name="10Y Yield %" radius={[0, 4, 4, 0]} barSize={20} fill={CHART_COLORS.west} />
                                </BarChart>
                        </MacroChartContainer>
                        <div className="flex justify-center gap-6 mt-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-rose-500" />
                                <span className="text-xs uppercase font-semibold text-muted-foreground">Highest Leverage</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                                <span className="text-xs uppercase font-semibold text-muted-foreground">Lowest Leverage</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-blue-500" />
                                <span className="text-xs uppercase font-semibold text-muted-foreground">Nominal Yield</span>
                            </div>
                        </div>
                    </div>

                    {/* Metric Deep Dive Table */}
                    <div className="flex flex-col justify-center">
                        <div className="grid grid-cols-3 gap-y-6 pb-6 border-b border-border">
                            <div className="col-span-1 text-xs font-semibold uppercase text-muted-foreground tracking-wider self-end pb-2">Metric</div>
                            <div className="col-span-1 text-center text-xs font-semibold uppercase text-rose-400 tracking-wider pb-2">West (G7)</div>
                            <div className="col-span-1 text-center text-xs font-semibold uppercase text-emerald-400 tracking-wider pb-2">East (BRICS+)</div>

                            {/* Row 1: Debt to GDP */}
                            <div className="col-span-1 font-bold text-sm text-foreground">Debt / GDP</div>
                            <div className="col-span-1 text-center font-mono text-xl font-bold text-rose-400">128.5%</div>
                            <div className="col-span-1 text-center font-mono text-xl font-bold text-emerald-400">64.2%</div>

                            {/* Row 2: Real Yield */}
                            <div className="col-span-1 font-bold text-sm text-foreground">Real Yield</div>
                            <div className="col-span-1 text-center font-mono text-lg font-bold text-muted-foreground">1.2%</div>
                            <div className="col-span-1 text-center font-mono text-lg font-bold text-emerald-400">2.9%</div>

                            {/* Row 3: Foreign Ownership */}
                            <div className="col-span-1 font-bold text-sm text-foreground">Foreign Held</div>
                            <div className="col-span-1 text-center font-mono text-lg font-bold text-amber-500">28.4%</div>
                            <div className="col-span-1 text-center font-mono text-lg font-bold text-foreground">12.1%</div>
                        </div>

                        <div className="mt-6 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                            <div className="flex items-start gap-3">
                                <TrendingUp className="w-4 h-4 text-indigo-400 mt-1" />
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1 block">
                                        Strategic Implication
                                    </span>
                                    <p className="text-xs text-indigo-200/80 leading-relaxed font-medium">
                                        Western sovereigns face a "fiscal dominance" trap where high debt loads constrain central bank rates. Eastern blocs maintain positive real yields and lower leverage, offering a "harder" collateral base for currency reserves.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
