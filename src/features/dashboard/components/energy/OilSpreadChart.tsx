import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOilSpread } from '@/hooks/useOilSpread';
import { Activity, AlertTriangle } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine
} from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_TOOLTIP_ITEM_STYLE, DEFAULT_TOOLTIP_LABEL_STYLE, DEFAULT_TOOLTIP_STYLE, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, CHART_HEIGHTS, CHART_COLORS, CHART_RAMPS, WHITE_ALPHA } from '@/constants/chartDefaults';
import { format } from 'date-fns';

import { ChartAccessibleTranscript } from '@/components/charts/ChartAccessibleTranscript';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

export const OilSpreadChart: React.FC = () => {
    const { data, isLoading, error } = useOilSpread();

    const chartData = useMemo(() => {
        if (!data) return [];
        // Sort ascending by date for chronological chart
        return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(d => ({
            ...d,
            formattedDate: format(new Date(d.date), 'MMM dd')
        }));
    }, [data]);

    if (isLoading) {
        return (
            <Card className="bg-card/40 backdrop-blur-md border-border h-[400px] flex items-center justify-center">
                <Activity className="w-8 h-8 text-blue-500 animate-spin" />
            </Card>
        );
    }

    if (error || !data || data.length === 0) {
        return (
            <Card className="bg-card/40 backdrop-blur-md border-border h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 opacity-50" />
                    <span className="text-sm font-semibold">Unable to load WTI Spread Data</span>
                </div>
            </Card>
        );
    }

    const latestSpread = data[0]?.spread || 0;
    const isBackwardation = latestSpread > 0;

    const recentObservations = chartData.slice(-6).reverse().map(d => [
        d.date,
        `$${d.spread.toFixed(2)}`,
        d.spread > 0 ? 'Backwardation (Tight)' : 'Contango (Loose)',
    ]);

    return (
        <Card className="bg-card/40 backdrop-blur-md border-border overflow-hidden shadow-2xl">
            <CardHeader className="pb-2 border-b border-border">
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-serif text-foreground tracking-heading flex items-center gap-2">
                            <Activity className="w-5 h-5 text-amber-500" />
                            WTI Physical Market Stress
                        </CardTitle>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            CL1 - CL2 Calendar Spread (Front Month vs Next Month)
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Current Spread</div>
                        <div className={`text-2xl font-bold font-mono ${isBackwardation ? 'text-amber-500' : 'text-blue-500'}`}>
                            {latestSpread > 0 ? '+' : ''}{latestSpread.toFixed(2)}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <figure role="region" aria-label="WTI Crude Oil Calendar Spread Physical Stress Chart" className="m-0 p-0">
                    <MacroChartContainer height={CHART_HEIGHTS.standard}>
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} vertical={false} />
                                <XAxis
                                    {...DEFAULT_XAXIS_PROPS}
                                    dataKey="formattedDate"
                                    stroke={WHITE_ALPHA.dim}
                                    fontSize={11}
                                    axisLine={false}
                                    dy={10}
                                    minTickGap={30}
                                />
                                <YAxis
                                    {...DEFAULT_YAXIS_PROPS}
                                    width={60}
                                    stroke={WHITE_ALPHA.dim}
                                    fontSize={11}
                                    axisLine={false}
                                    tickFormatter={(val) => `$${val}`}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={DEFAULT_TOOLTIP_STYLE}
                                    labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE}
                                    itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE}
                                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spread']}
                                />
                                
                                {/* Regime Bands */}
                                <ReferenceLine y={16} stroke={CHART_RAMPS.coverage[0]} strokeDasharray="3 3" strokeOpacity={0.6} label={{ position: 'insideTopLeft', value: 'EXTREME STRESS', fill: CHART_RAMPS.coverage[0], fontSize: 11, fontWeight: 'bold' }} />
                                <ReferenceLine y={10} stroke={CHART_COLORS.east} strokeDasharray="3 3" strokeOpacity={0.5} label={{ position: 'insideTopLeft', value: 'STRESSED', fill: CHART_COLORS.east, fontSize: 11, fontWeight: 'bold' }} />
                                <ReferenceLine y={5} stroke={CHART_COLORS.gold} strokeDasharray="3 3" strokeOpacity={0.4} label={{ position: 'insideTopLeft', value: 'TIGHTENING', fill: CHART_COLORS.gold, fontSize: 11, fontWeight: 'bold' }} />
                                <ReferenceLine y={0} stroke={WHITE_ALPHA.soft} strokeWidth={2} label={{ position: 'insideTopLeft', value: 'PARITY', fill: WHITE_ALPHA.dim, fontSize: 11, fontWeight: 'bold' }} />
                                <ReferenceLine y={-5} stroke={CHART_COLORS.west} strokeDasharray="3 3" strokeOpacity={0.4} label={{ position: 'insideBottomLeft', value: 'OVERSUPPLY', fill: CHART_COLORS.west, fontSize: 11, fontWeight: 'bold' }} />

                                <Line 
                                    type="monotone" 
                                    dataKey="spread" 
                                    stroke={CHART_COLORS.gold} 
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, fill: CHART_COLORS.gold, stroke: "#fff", strokeWidth: 2 }}
                                />
                            </LineChart>
                    </MacroChartContainer>

                    <ChartAccessibleTranscript
                        takeaway={
                            isBackwardation
                                ? `WTI Crude 1-month calendar spread (CL1−CL2) is in backwardation at +$${latestSpread.toFixed(2)}/bbl. Prompt month premium signals physical supply tightness and active inventory draws at the Cushing, Oklahoma storage hub.`
                                : `WTI Crude 1-month calendar spread (CL1−CL2) is in contango at $${latestSpread.toFixed(2)}/bbl. Deferred month premium indicates ample crude storage availability and loose immediate physical supply.`
                        }
                        readingGuide="Positive spread (> $0) = Backwardation (tight immediate supply). Negative spread (< $0) = Contango (oversupply/storage surplus). Spreads > $5.00/bbl reflect severe delivery bottlenecks."
                        searchKeywords={[
                            'WTI Crude Oil',
                            'CL1-CL2 Calendar Spread',
                            'Crude Backwardation',
                            'Contango',
                            'Cushing Oklahoma Storage',
                            'Physical Energy Delivery',
                            'NYMEX Light Sweet Crude'
                        ]}
                        tableData={{
                            caption: 'WTI CL1-CL2 Calendar Spread Recent Observations',
                            headers: ['Observation Date', 'Spread ($/bbl)', 'Market Regime'],
                            rows: recentObservations,
                        }}
                    />
                </figure>
            </CardContent>
        </Card>
    );
};
