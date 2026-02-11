import React, { useMemo } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import {
    Activity,
    Wind,
    DollarSign,
    Home,
    Briefcase,
    Scale,
    AlertCircle
} from 'lucide-react';
import { useSankeyFlows } from '@/hooks/useSankeyFlows';
import { SubsystemCard } from './subsystems/SubsystemCard';
import { MetricTrendItem } from './subsystems/MetricTrendItem';
import { cn } from '@/lib/utils';

export const SankeyFlowCard: React.FC = () => {
    const { data: flowData, isLoading, error } = useSankeyFlows();

    // Group nodes by category
    const groupedNodes = useMemo(() => {
        if (!flowData?.nodes) return {};
        const groups: any = {};
        flowData.nodes.forEach(node => {
            if (!groups[node.category]) groups[node.category] = [];
            groups[node.category].push(node);
        });
        return groups;
    }, [flowData]);

    const categories = [
        { id: 'capital_flows', label: 'Capital Flows', icon: DollarSign, color: '#3b82f6' },
        { id: 'inflation_regime', label: 'Inflation Regime', icon: Wind, color: '#f97316' },
        { id: 'balance_of_payments', label: 'Balance of Payments', icon: Scale, color: '#8b5cf6' },
        { id: 'housing_cycle', label: 'Housing Cycle', icon: Home, color: '#ef4444' },
        { id: 'activity_regime', label: 'Activity Regime', icon: Activity, color: '#10b981' },
        { id: 'labor_market', label: 'Labor Market', icon: Briefcase, color: '#f59e0b' }
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-[300px] w-full rounded-3xl bg-white/5" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 rounded-3xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-md flex items-center gap-4">
                <AlertCircle className="text-rose-500 w-8 h-8" />
                <div>
                    <div className="text-rose-400 font-bold">Macro Flow Engine Offline</div>
                    <p className="text-xs text-rose-400/70">Unable to synchronize latest subsystem metrics.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Redesigned Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <Activity className="text-blue-500 w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
                            Macro <span className="text-blue-500">Flow</span> Map
                        </h2>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
                        Multivariate regime analysis of global subsystems.
                        We monitor <span className="text-white font-bold">Z-Scores</span> to identify tail risks and trend reversals before they hit headline GDP.
                    </p>
                </div>

                {flowData?.last_updated && (
                    <div className="flex flex-col items-end gap-1.5">
                        <div className="text-[0.6rem] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Data Synchronized</div>
                        <div className="px-4 py-2 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md text-[0.65rem] font-mono text-blue-400/80">
                            {new Date(flowData.last_updated).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZoneName: 'short'
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Subsystem Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((cat, idx) => {
                    const nodes = groupedNodes[cat.id] || [];
                    if (nodes.length === 0) return null;

                    return (
                        <SubsystemCard
                            key={cat.id}
                            title={cat.label}
                            icon={cat.icon}
                            color={cat.color}
                            delay={(idx + 1) * 150}
                        >
                            <div className="divide-y divide-white/[0.03]">
                                {nodes.map((node: any) => (
                                    <MetricTrendItem
                                        key={node.index}
                                        name={node.name}
                                        value={node.value}
                                        unit={node.unit}
                                        zScore={node.z_score}
                                        change={node.change}
                                        changePeriod={node.change_period}
                                        color={cat.color}
                                    />
                                ))}
                            </div>
                        </SubsystemCard>
                    );
                })}
            </div>

            {/* Interpretation Legend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 pt-8 border-t border-white/5">
                {[
                    {
                        label: 'Equilibrium (Normal)',
                        range: '±1.2σ',
                        color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                        desc: 'System in balance. Historical volatility remains within standard standard deviation bounds. No immediate intervention signal.'
                    },
                    {
                        label: 'Distribution Alpha (Transition)',
                        range: '1.2σ to 2.0σ',
                        color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                        desc: 'Escalating skew. The subsystem is migrating away from its historical median. High probability of upcoming regime shift.'
                    },
                    {
                        label: 'Tail Risk (Extreme)',
                        range: '> 2.0σ',
                        color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                        desc: 'Statistical instability. Probability of structural rupture is high. Historical correlations often break down in this zone.'
                    }
                ].map(item => (
                    <div key={item.label} className="group flex flex-col gap-4 p-5 rounded-[2rem] bg-slate-900/40 border border-white/5 backdrop-blur-md hover:bg-slate-900/60 transition-all duration-500">
                        <div className="flex items-center justify-between">
                            <div className={cn("px-3 py-1 rounded-full text-[0.6rem] font-black uppercase tracking-widest border", item.color)}>
                                {item.range}
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-white/40 transition-colors" />
                        </div>
                        <div className="space-y-2">
                            <span className="text-[0.8rem] font-black text-white/90 uppercase tracking-wider">{item.label}</span>
                            <p className="text-[0.65rem] text-muted-foreground leading-relaxed font-medium">
                                {item.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
