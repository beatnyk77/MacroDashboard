import React from 'react';
import {
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Area,
    ComposedChart,
    ReferenceLine,
    ReferenceArea
} from 'recharts';
import { DataStatePanel } from '@/components/DataStatePanel';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';
import { ChartAccessibleTranscript } from '@/components/charts/ChartAccessibleTranscript';
import {
    CHART_HEIGHTS,
    DEFAULT_CARTESIAN_GRID_PROPS,
    DEFAULT_TOOLTIP_STYLE,
    CHART_FONT_FAMILY,
    DEFAULT_TOOLTIP_ITEM_STYLE,
    DEFAULT_TOOLTIP_LABEL_STYLE,
    DEFAULT_XAXIS_PROPS,
    DEFAULT_YAXIS_PROPS,
    CHART_COLORS,
} from '@/constants/chartDefaults';
import { useOilSpread } from '@/hooks/useOilSpread';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Fuel, AlertTriangle, RefreshCw, Activity } from 'lucide-react';
import { getRegimeDetails } from './wtiCalendarSpreadUtils';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useIngestionHealth } from '@/features/daily-macro/hooks/useIngestionHealth';
import { supabase } from '@/lib/supabase';
import { SectionErrorBoundary } from '@/features/daily-macro/components/SectionErrorBoundary';
import { FreshnessChip } from '@/components/FreshnessChip';
import { useStaleness } from '@/hooks/useStaleness';
const WTICalendarSpreadInner: React.FC = () => {
    const { data: spreadData, isLoading, error, refetch } = useOilSpread();
    const { data: health = [] } = useIngestionHealth();
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const { error: invokeError } = await supabase.functions.invoke('ingest-oil-spread');
            if (invokeError) throw invokeError;
            await refetch();
        } catch (err) {
            console.error('[WTICalendarSpread] Refresh failed:', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    const chartData = React.useMemo(() => {
        if (!spreadData) return [];
        return [...spreadData].reverse().map(d => ({
            ...d,
            formattedDate: format(new Date(d.date), 'MMM dd'),
            displayDate: format(new Date(d.date), 'yyyy-MM-dd')
        }));
    }, [spreadData]);

    const latest = spreadData?.[0];
    const staleness = useStaleness(latest?.computed_at, 'daily');
    const isStale = staleness.state !== 'fresh';
    const signalHealth = health.find(h => h.job_name === 'ingest-oil-spread');

    const regime = latest ? getRegimeDetails(latest.spread) : null;

    if (isLoading && !spreadData) {
        return (
            <DataStatePanel
                variant="pending"
                title="Loading WTI calendar spread"
                height={400}
            />
        );
    }

    if (error && !spreadData) {
        return (
            <DataStatePanel
                variant="error"
                title="WTI spread unavailable"
                description="Unable to synchronize WTI CL1/CL2 series. Ensure EIA API connectivity is active."
                onRetry={handleRefresh}
                height={400}
                accentColor="rose"
            />
        );
    }

    if (!latest || chartData.length === 0) {
        return (
            <DataStatePanel
                variant="empty"
                title="No WTI spread data"
                description="Calendar spread observations are not yet populated for this range."
                height={400}
            />
        );
    }

    return (
        <Card className="bg-background/40 border-border backdrop-blur-xl overflow-hidden rounded-xl">
            {/* Header / Meta Bar */}
            <div className="flex flex-wrap items-center justify-between px-8 py-3 bg-white/[0.02] border-b border-border gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Activity size={10} className="text-amber-500/50" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-terminal-dim">Energy Market Structure</span>
                    </div>
                    
                    <FreshnessChip 
                        status={staleness.state} 
                        lastUpdated={latest.computed_at}
                    />

                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-border">
                        <div className={cn("w-1 h-1 rounded-full", signalHealth ? "bg-emerald-400" : "bg-white/20")} />
                        <span className="text-[11px] font-semibold text-terminal-dim uppercase tracking-tighter">
                            Pipeline: {signalHealth ? 'Active' : 'Offline'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[11px] font-semibold text-white/20 uppercase tracking-wider">Last Computed</span>
                        <span className="text-[11px] font-mono font-bold text-white/60">
                            {format(new Date(latest.computed_at || latest.created_at), 'HH:mm')}
                            <span className="mx-1 opacity-20">|</span>
                            {format(new Date(latest.date), 'MMM dd')}
                        </span>
                    </div>
                    
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
                            isRefreshing ? "opacity-50 cursor-not-allowed" : "bg-white/5 border-border hover:bg-white/10 hover:border-white/20 active:scale-95"
                        )}
                    >
                        <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
                        <span className="text-[11px] font-semibold uppercase tracking-wider">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                </div>
            </div>

            {/* Stale Warning Banner */}
            {isStale && (
                <div className="px-8 py-3 bg-amber-500/10 border-b border-amber-500/10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={14} className="text-amber-500" />
                        <span className="text-[11px] font-semibold text-amber-500/80 uppercase tracking-tight">
                            Market data may be delayed. Showing last known physical structure.
                        </span>
                    </div>
                    <button 
                        onClick={handleRefresh}
                        className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 bg-amber-500 text-black rounded hover:bg-amber-400 transition-colors"
                    >
                        Force Update
                    </button>
                </div>
            )}

            <div className={cn(
                "transition-all duration-500",
                isRefreshing ? "opacity-40 grayscale-[0.5] blur-[1px]" : "opacity-100"
            )}>
                <CardHeader className="p-8 pb-0 border-b border-border">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-amber-500/10">
                                    <Fuel className="w-5 h-5 text-amber-500" />
                                </div>
                                <CardTitle className="text-2xl font-bold uppercase tracking-heading text-white italic">
                                    WTI Calendar Spread <span className="text-terminal-dim not-italic">(CL1 - CL2)</span>
                                </CardTitle>
                            </div>
                            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-11">
                                Physical Oil Stress Indicator • NYMEX Futures Terminal
                            </CardDescription>
                        </div>

                        {regime && (
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-terminal-dim mb-1">Current Spread</p>
                                    <p className={cn("text-3xl font-bold tracking-heading italic", latest.spread >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                        {latest.spread >= 0 ? '+' : ''}{latest.spread.toFixed(2)} <span className="text-xs not-italic">USD</span>
                                    </p>
                                </div>
                                <div className={cn("px-6 py-4 rounded-xl border border-border flex flex-col items-center gap-2", regime.color)}>
                                    <regime.icon className="w-5 h-5" />
                                    <span className="text-[11px] font-semibold uppercase tracking-wider">{regime.label}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Insights Panel */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="p-6 rounded-xl bg-white/[0.02] border border-border space-y-4">
                                <h4 className="text-[11px] font-semibold text-terminal-dim uppercase tracking-wider">Institutional Summary</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end border-b border-border pb-2">
                                        <span className="text-[11px] font-semibold text-muted-foreground uppercase">Front Month (CL1)</span>
                                        <span className="text-sm font-bold text-white italic">${latest.front_price.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-border pb-2">
                                        <span className="text-[11px] font-semibold text-muted-foreground uppercase">Next Month (CL2)</span>
                                        <span className="text-sm font-bold text-white italic">${latest.next_price.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-border pb-2">
                                        <span className="text-[11px] font-semibold text-muted-foreground uppercase">1D Change</span>
                                        <span className={cn("text-sm font-bold italic", latest.change_1d >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                            {latest.change_1d >= 0 ? '+' : ''}{latest.change_1d.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                <h4 className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider mb-3">So What?</h4>
                                <p className="text-[11px] leading-relaxed text-amber-500/70 font-semibold uppercase tracking-wider">
                                    {regime?.desc}. {latest.spread > 5 ?
                                        "Physical buyers are front-loading deliveries, signaling immediate supply shortages." :
                                        latest.spread < -5 ?
                                        "Excess supply is hitting storage limits, forcing front-month prices below next-month." :
                                        "The physical market remains in equilibrium with no immediate stress signals."
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Chart Area */}
                        <div className="lg:col-span-3 relative">
                            <MacroChartContainer
                                height={CHART_HEIGHTS.tall}
                                ariaLabel="WTI Physical Oil Calendar Spread CL1 minus CL2 Chart"
                                transcript={
                                    <ChartAccessibleTranscript
                                        takeaway={`The front-to-second month WTI calendar spread trades at ${latest ? (latest.spread >= 0 ? `+$${latest.spread.toFixed(2)}` : `-$${Math.abs(latest.spread).toFixed(2)}`) : 'neutral'}/bbl. ${latest && latest.spread > 0 ? 'Backwardation indicates prompt delivery premiums and tight physical inventory at Cushing, Oklahoma.' : 'Contango indicates storage absorption incentives and prompt crude oversupply.'}`}
                                        readingGuide="Positive spread (> $0) indicates backwardation (immediate delivery premium, tight spot inventories). Negative spread (< $0) indicates contango (glut, storage cost drag, inventory accumulation)."
                                        searchKeywords={['WTI Physical Stress', 'CL1-CL2 Calendar Spread', 'Cushing Oklahoma Storage', 'Backwardation vs Contango', 'NYMEX Crude Futures']}
                                        tableData={{
                                            caption: 'Recent WTI Calendar Spreads & Futures Settlement Prices',
                                            headers: ['Period', 'Spread (USD/bbl)', 'Front Month (CL1)', 'Next Month (CL2)'],
                                            rows: chartData.slice(-8).map(d => [
                                                d.displayDate || d.formattedDate,
                                                `${d.spread >= 0 ? '+' : ''}${d.spread.toFixed(2)}`,
                                                `$${d.front_price.toFixed(2)}`,
                                                `$${d.next_price.toFixed(2)}`
                                            ])
                                        }}
                                    />
                                }
                            >
                                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="spreadGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={latest.spread >= 0 ? CHART_COLORS.expansion : CHART_COLORS.east} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={latest.spread >= 0 ? CHART_COLORS.expansion : CHART_COLORS.east} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} />
                                    <XAxis
                                        {...DEFAULT_XAXIS_PROPS}
                                        dataKey="formattedDate"
                                        axisLine={false}
                                        tick={{ fontFamily: CHART_FONT_FAMILY, fill: '#ffffff30', fontSize: 11, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        {...DEFAULT_YAXIS_PROPS}
                                        width={60}
                                        yAxisId="price"
                                        orientation="left"
                                        domain={['auto', 'auto']}
                                        axisLine={false}
                                        tick={{ fontFamily: CHART_FONT_FAMILY, fill: '#ffffff30', fontSize: 11, fontWeight: 700 }}
                                        tickFormatter={(val) => `$${val}`}
                                    />
                                    <YAxis
                                        {...DEFAULT_YAXIS_PROPS}
                                        width={60}
                                        yAxisId="spread"
                                        orientation="right"
                                        domain={[-4, 4]}
                                        axisLine={false}
                                        tick={{ fontFamily: CHART_FONT_FAMILY, fill: '#ffffff30', fontSize: 11, fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE}
                                        itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE}
                                        contentStyle={{
                                            ...DEFAULT_TOOLTIP_STYLE,
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                        }}
                                    />
                                    
                                    <ReferenceArea 
                                        yAxisId="spread"
                                        y1={-1} 
                                        y2={1} 
                                        fill="#ffffff05" 
                                        strokeOpacity={0}
                                    />
                                    <ReferenceLine yAxisId="spread" y={0} stroke="#ffffff10" strokeWidth={1} />
                                    <ReferenceLine yAxisId="spread" y={1} stroke="#ffffff05" strokeDasharray="3 3" />
                                    <ReferenceLine yAxisId="spread" y={-1} stroke="#ffffff05" strokeDasharray="3 3" />

                                    <Area 
                                        yAxisId="spread"
                                        type="monotone" 
                                        dataKey="spread" 
                                        name="Calendar Spread (CL1-CL2)"
                                        fill="url(#spreadGradient)" 
                                        stroke={latest.spread >= 0 ? CHART_COLORS.expansion : CHART_COLORS.east}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    <Line 
                                        yAxisId="price"
                                        type="monotone" 
                                        dataKey="front_price" 
                                        name="Front Month (CL1)"
                                        stroke="#ffffff60" 
                                        strokeWidth={3}
                                        dot={false}
                                    />
                                    <Line 
                                        yAxisId="price"
                                        type="monotone" 
                                        dataKey="next_price" 
                                        name="Next Month (CL2)"
                                        stroke="#3b82f660" 
                                        strokeWidth={3}
                                        dot={false}
                                    />
                                </ComposedChart>
                            </MacroChartContainer>
                        </div>

                        {/* Custom Legend */}
                        <div className="flex flex-wrap justify-center gap-6 mt-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-terminal-dim">Spread (Backwardation)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-rose-500" />
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-terminal-dim">Spread (Contango)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 bg-white/60" />
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-terminal-dim">CL1 Price</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-0.5 bg-blue-500/40" />
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-terminal-dim">CL2 Price</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </div>
        </Card>
    );
};

export const WTICalendarSpread: React.FC = () => {
    return (
        <SectionErrorBoundary title="WTI Calendar Spread">
            <WTICalendarSpreadInner />
        </SectionErrorBoundary>
    );
};

