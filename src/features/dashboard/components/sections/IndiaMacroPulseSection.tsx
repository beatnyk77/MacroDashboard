import React from 'react';
import { cn } from "@/lib/utils";
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { useIndiaMacro } from '@/hooks/useIndiaMacro';
import { UPIAutopayFailureCard } from './UPIAutopayFailureCard';
import { IndiaMacroCard } from './IndiaMacroCard';
import { BOPPressureTable } from './BOPPressureTable';

import { EnergySection } from './EnergySection';
import { ASISection } from './ASISection';
import { CompositeMetricsSection } from './CompositeMetricsSection';


import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, ChevronDown, ChevronUp, Activity } from 'lucide-react';

const CompactPulseMetric: React.FC<{
    label: string,
    value: number | string,
    unit: string,
    delta?: string,
    trend?: 'up' | 'down',
    status?: 'safe' | 'warning' | 'danger',
    description?: string
}> = ({ label, value, unit, delta, trend, status, description }) => (
    <div className="group/metric p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all duration-300">
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
                <span className="text-[0.55rem] font-black text-muted-foreground/40 uppercase tracking-widest">{label}</span>
                {description && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="w-3 h-3 text-muted-foreground/20 hover:text-muted-foreground/50 transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-950 border-white/10 p-2 text-[0.6rem] max-w-[150px]">
                                {description}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            {status && (
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full shadow-[0_0_8px]",
                    status === 'safe' ? "bg-emerald-500 shadow-emerald-500/20" :
                        status === 'warning' ? "bg-amber-500 shadow-amber-500/20" :
                            "bg-rose-500 shadow-rose-500/20"
                )} />
            )}
        </div>
        <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white/90 tabular-nums tracking-tighter">{value}</span>
                <span className="text-[0.6rem] font-bold text-white/20 uppercase tracking-widest">{unit}</span>
            </div>
            {delta && (
                <div className={cn(
                    "text-[0.6rem] font-black tabular-nums tracking-tight flex items-center gap-0.5",
                    trend === 'up' ? "text-emerald-500" : "text-rose-500"
                )}>
                    {delta}
                </div>
            )}
        </div>
    </div>
);

export const IndiaMacroPulseSection: React.FC = () => {
    const { data } = useIndiaMacro();
    const [isExpanded, setIsExpanded] = React.useState(false);

    const metrics = data?.metrics || [];
    const findMetric = (id: string) => metrics.find(m => m.metric_id === id);

    // High-signal India metrics
    const wpiIndex = findMetric('IN_WPI_YOY');
    const iipGrowth = findMetric('IN_IIP_GROWTH_YOY');
    const retailSales = findMetric('IN_RETAIL_SALES_YOY');
    const goldReserves = findMetric('IN_GOLD_RESERVES_TONNES');

    return (
        <div className="space-y-16">
            {/* Main Header with Contextual Action */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <Activity className="text-blue-500 w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
                            India <span className="text-blue-500">Macro Pulse</span>
                        </h2>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
                        Institutional-grade telemetry tracking credit stress, industrial output, and state-level energy transition alpha.
                    </p>
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                >
                    <span className="text-[0.7rem] font-black uppercase tracking-widest text-white/70 group-hover:text-white">
                        {isExpanded ? 'Collapse Pulse' : 'Expand Full Engine'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-blue-500" />}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-12">
                {/* Hero Section: India Macro Card */}
                <SectionErrorBoundary name="India Macro Card">
                    <IndiaMacroCard />
                </SectionErrorBoundary>

                {/* Industrial & Energy Efficiency Grid */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-[2px] w-8 bg-blue-500" />
                        <h4 className="text-[0.7rem] font-black text-white/90 uppercase tracking-[0.3em]">Energy & Efficiency Terminal</h4>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-1 gap-8 p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5">
                        <SectionErrorBoundary name="Energy Statistics">
                            <EnergySection />
                        </SectionErrorBoundary>

                        <div className="border-t border-white/5 pt-8">
                            <SectionErrorBoundary name="Composite Metrics">
                                <CompositeMetricsSection />
                            </SectionErrorBoundary>
                        </div>
                    </div>
                </div>

                {/* Collapsible Deep Dives */}
                <div className={cn(
                    "grid grid-cols-1 gap-12 transition-all duration-700 ease-in-out overflow-hidden",
                    isExpanded ? "max-h-[2500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                )}>
                    {/* Activity Grid */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-[2px] w-8 bg-amber-500" />
                            <h4 className="text-[0.7rem] font-black text-white/90 uppercase tracking-[0.3em]">Economic Activity Pulse</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <CompactPulseMetric
                                label="Industrial Growth (IIP)"
                                value={iipGrowth?.value?.toFixed(1) || '--'}
                                unit="%"
                                delta={iipGrowth?.delta_mom ? `${iipGrowth.delta_mom > 0 ? '+' : ''}${iipGrowth.delta_mom.toFixed(1)}%` : undefined}
                                trend={iipGrowth?.delta_mom && iipGrowth.delta_mom > 0 ? 'up' : 'down'}
                                description="Index of Industrial Production: Measures mining, electricity, and manufacturing growth."
                                status={iipGrowth?.value && iipGrowth.value < 2 ? 'warning' : 'safe'}
                            />
                            <CompactPulseMetric
                                label="WPI Inflation"
                                value={wpiIndex?.value?.toFixed(1) || '--'}
                                unit="%"
                                delta={wpiIndex?.delta_mom ? `${wpiIndex.delta_mom > 0 ? '+' : ''}${wpiIndex.delta_mom.toFixed(1)}%` : undefined}
                                trend={wpiIndex?.delta_mom && wpiIndex.delta_mom > 0 ? 'up' : 'down'}
                                description="Wholesale Price Index: Tracks price changes in bulk business transactions."
                                status={
                                    wpiIndex?.value ? (wpiIndex.value > 6 ? 'danger' : wpiIndex.value > 4 ? 'warning' : 'safe') : 'safe'
                                }
                            />
                            <CompactPulseMetric
                                label="Retail Velocity"
                                value={retailSales?.value?.toFixed(1) || '--'}
                                unit="%"
                                description="YoY change in organized retail turnover."
                                status="safe"
                            />
                            <CompactPulseMetric
                                label="Gold Accumulation"
                                value={goldReserves?.value?.toLocaleString() || '--'}
                                unit="t"
                                delta={goldReserves?.delta_mom ? `${goldReserves.delta_mom > 0 ? '+' : ''}${goldReserves.delta_mom.toFixed(1)}t` : undefined}
                                trend={goldReserves?.delta_mom && goldReserves.delta_mom > 0 ? 'up' : 'down'}
                                description="Official RBI gold holdings in metric tonnes."
                            />
                        </div>
                    </div>

                    {/* Infrastructure & Institutional */}
                    <div className="flex flex-col gap-16">
                        <SectionErrorBoundary name="Annual Survey of Industries">
                            <ASISection />
                        </SectionErrorBoundary>
                        <div className="border-t border-white/5 pt-16">
                            <SectionErrorBoundary name="UPI Autopay Failure">
                                <UPIAutopayFailureCard />
                            </SectionErrorBoundary>
                        </div>
                    </div>

                    {/* BOP Table */}
                    <SectionErrorBoundary name="BOP Pressure Table">
                        <BOPPressureTable />
                    </SectionErrorBoundary>
                </div>
            </div>
        </div>
    );
};
