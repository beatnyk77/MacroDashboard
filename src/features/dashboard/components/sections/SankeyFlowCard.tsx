import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Activity,
    Wind,
    DollarSign,
    Home,
    Briefcase,
    Scale,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { useSankeyFlows, SankeyNode } from '@/hooks/useSankeyFlows';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

// Helper to get category icon
const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'capital_flows': return <DollarSign className="w-4 h-4" />;
        case 'inflation_regime': return <Wind className="w-4 h-4" />;
        case 'balance_of_payments': return <Scale className="w-4 h-4" />;
        case 'housing_cycle': return <Home className="w-4 h-4" />;
        case 'activity_regime': return <Activity className="w-4 h-4" />;
        case 'labor_market': return <Briefcase className="w-4 h-4" />;
        default: return <Activity className="w-4 h-4" />;
    }
};

// Helper for Z-score formatting
const formatZScore = (z: number | undefined) => {
    if (z === undefined || z === null) return '-';
    // const sign = z > 0 ? '+' : '';
    return `${z.toFixed(2)}σ`;
};

// Helper for color coding based on Z-score (assuming standard deviation interpretation)
const getZScoreColor = (z: number | undefined) => {
    if (z === undefined || z === null) return 'text-muted-foreground';
    if (Math.abs(z) > 2) return 'text-rose-500'; // Extreme
    if (Math.abs(z) > 1) return 'text-amber-500'; // Elevated
    // if (Math.abs(z) > 0.5) return 'text-blue-400';
    return 'text-emerald-500'; // Normal
};

export const SankeyFlowCard: React.FC = () => {
    const { data: flowData, isLoading, error } = useSankeyFlows();

    // Group nodes by category
    const groupedNodes = useMemo(() => {
        if (!flowData?.nodes) return {};
        return flowData.nodes.reduce((acc, node) => {
            if (!acc[node.category]) acc[node.category] = [];
            acc[node.category].push(node);
            return acc;
        }, {} as Record<string, SankeyNode[]>);
    }, [flowData]);

    // Categories in display order
    const displayCategories = [
        'capital_flows',
        'inflation_regime',
        'balance_of_payments',
        'housing_cycle',
        'activity_regime',
        'labor_market'
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="p-6 h-[200px] border border-white/10 bg-card/40 backdrop-blur-md">
                        <Skeleton className="h-6 w-1/2 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                    </Card>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <Card className="p-6 border-rose-500/20 bg-rose-500/5 backdrop-blur-md">
                <div className="text-rose-400 font-bold mb-2">Failed to load macro flow data</div>
                <p className="text-xs text-rose-400/70">Please check your connection and try again.</p>
            </Card>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 px-2">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="text-blue-500 w-5 h-5" />
                        <h2 className="font-extrabold text-sm tracking-[0.2em] text-blue-500 uppercase">
                            MACRO REGIME DASHBOARD
                        </h2>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
                        Real-time monitoring of 6 key macro-economic subsystems. Z-Scores indicate deviation from
                        historical norms (2-year lookback). <span className="text-amber-500 font-bold">High deviation (&gt;1.5σ)</span> signals regime stress.
                    </p>
                </div>
                {flowData?.last_updated && (
                    <div className="text-[0.65rem] font-mono text-muted-foreground/50 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                        Last Updated: {new Date(flowData.last_updated).toLocaleString()}
                    </div>
                )}
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayCategories.map((category, catIdx) => {
                    const nodes = groupedNodes[category] || [];
                    if (nodes.length === 0) return null;

                    const catColor = nodes[0]?.color || '#ffffff';

                    return (
                        <Card
                            key={category}
                            className="p-0 border-white/5 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl transition-all hover:bg-black/50 hover:border-white/10 group"
                            style={{ animationDelay: `${catIdx * 100}ms` }}
                        >
                            {/* Category Header */}
                            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="p-2 rounded-lg bg-opacity-10"
                                        style={{ backgroundColor: `${catColor}15`, color: catColor }}
                                    >
                                        {getCategoryIcon(category)}
                                    </div>
                                    <span className="font-black text-sm tracking-wider uppercase text-white/90">
                                        {category.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    {nodes.slice(0, 3).map((n, i) => ( // Mini sparkline visualization
                                        <div
                                            key={i}
                                            className="w-1 rounded-full bg-current opacity-40"
                                            style={{
                                                height: '12px',
                                                minHeight: '4px',
                                                color: catColor,
                                                transform: `scaleY(${Math.min(Math.abs(n.z_score || 0.5), 2)})`
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Metric List */}
                            <div className="divide-y divide-white/5">
                                {nodes.map((node) => (
                                    <div key={node.index} className="px-5 py-4 hover:bg-white/[0.02] transition-colors relative">

                                        <TooltipProvider delayDuration={0}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-baseline justify-between gap-4 cursor-default">
                                                        <div className="flex flex-col gap-0.5 min-w-0">
                                                            <span className="text-lg font-black tracking-tight text-white/90 truncate">
                                                                {node.value?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '-'}
                                                                <span className="text-[0.65rem] font-bold text-muted-foreground/60 ml-1.5 uppercase tracking-wide">
                                                                    {node.unit || ''}
                                                                </span>
                                                            </span>
                                                            <span className="text-[0.7rem] font-bold text-muted-foreground/70 uppercase tracking-tight truncate pr-2">
                                                                {node.name}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                                                            <div className={cn(
                                                                "text-sm font-black tracking-tighter flex items-center gap-1",
                                                                getZScoreColor(node.z_score)
                                                            )}>
                                                                {node.z_score ? (
                                                                    <span className="text-[0.6rem] font-bold uppercase opacity-70 mr-1">Z</span>
                                                                ) : null}
                                                                {formatZScore(node.z_score)}
                                                            </div>
                                                            {node.change && (
                                                                <div className={cn(
                                                                    "text-[0.6rem] font-bold flex items-center gap-0.5",
                                                                    node.change > 0 ? "text-emerald-400" : "text-rose-400"
                                                                )}>
                                                                    {node.change > 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                                                                    {Math.abs(node.change).toFixed(1)}% {node.change_period}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="bg-slate-950 border-white/10 p-3 max-w-[250px]">
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-semibold text-white">
                                                            {node.name}
                                                        </p>
                                                        <div className="text-[0.65rem] text-muted-foreground leading-relaxed">
                                                            {node.z_score && Math.abs(node.z_score) > 1.5
                                                                ? <span className="text-amber-400 font-bold block mb-1">⚠️ Significant deviation from trend</span>
                                                                : <span className="text-emerald-400 font-bold block mb-1">Within normal bounds</span>
                                                            }
                                                            Standard deviation (Z-score) measures how unusual the current reading is compared to the 2-year average.
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        {/* Background Activity Indicator (Subtle) */}
                                        {node.z_score && Math.abs(node.z_score) > 1.5 && (
                                            <div
                                                className="absolute inset-y-0 left-0 w-[2px]"
                                                style={{ backgroundColor: Math.abs(node.z_score) > 2 ? '#f43f5e' : '#f59e0b' }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
