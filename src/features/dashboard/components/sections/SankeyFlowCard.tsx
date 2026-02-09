import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, X, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, Sankey, Tooltip as RechartsTooltip } from 'recharts';
import { useSankeyFlows, SankeyNode as SankeyNodeType } from '@/hooks/useSankeyFlows';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Custom Sankey Tooltip
const CustomSankeyTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0];

    // Check if it's a link or a node
    if (data.payload.source !== undefined) {
        // It's a link
        return (
            <div className="bg-slate-950 p-2 border border-white/10 rounded-lg shadow-xl">
                <span className="text-[0.65rem] font-extrabold text-muted-foreground block uppercase">
                    FLOW MAGNITUDE
                </span>
                <span className="text-sm font-black text-primary">
                    {data.payload.value.toFixed(2)} {data.payload.value > 100 ? 'Index' : '$B'}
                </span>
            </div>
        );
    } else {
        // It's a node
        return (
            <div className="bg-slate-950 p-2 border border-white/10 rounded-lg shadow-xl">
                <span className="text-[0.65rem] font-extrabold text-muted-foreground block uppercase">
                    {data.payload.name}
                </span>
                <span
                    className="text-sm font-black"
                    style={{ color: data.payload.color || '#3b82f6' }}
                >
                    {data.payload.category?.replace(/_/g, ' ').toUpperCase()}
                </span>
            </div>
        );
    }
};

export const SankeyFlowCard: React.FC = () => {
    const { data: sankeyData, isLoading, error } = useSankeyFlows();
    const [selectedNode, setSelectedNode] = useState<SankeyNodeType | null>(null);

    if (isLoading) {
        return (
            <Card className="p-6 h-[700px] border border-white/10 bg-card/40 backdrop-blur-md rounded-xl flex flex-col gap-4">
                <Skeleton className="h-8 w-[40%] mb-2" />
                <Skeleton className="h-[600px] w-full rounded-xl" />
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="p-6 h-[700px] border border-white/10 bg-card/40 backdrop-blur-md rounded-xl flex items-center justify-center">
                <div className="bg-rose-500/10 text-rose-500 p-4 rounded-lg border border-rose-500/20 text-sm font-bold">
                    Failed to load Sankey flow data. Please try again later.
                </div>
            </Card>
        );
    }

    if (!sankeyData || sankeyData.nodes.length === 0) {
        return (
            <Card className="p-6 h-[700px] border border-white/10 bg-card/40 backdrop-blur-md rounded-xl flex items-center justify-center">
                <div className="bg-blue-500/10 text-blue-500 p-4 rounded-lg border border-blue-500/20 text-sm font-bold">
                    No flow data available yet. Data will appear after initial ingestion.
                </div>
            </Card>
        );
    }

    const handleNodeClick = (node: any) => {
        const nodeData = sankeyData.nodes.find(n => n.index === node.index);
        if (nodeData) {
            setSelectedNode(nodeData);
        }
    };

    // Transform data for Recharts Sankey format
    const chartData = {
        nodes: sankeyData.nodes.map(n => ({
            name: n.name,
            index: n.index,
            category: n.category,
            color: n.color
        })),
        links: sankeyData.links.map(l => ({
            source: l.source,
            target: l.target,
            value: l.value
        }))
    };

    // Category legend
    const categories = [
        { key: 'capital_flows', label: 'Capital Flows', color: '#3b82f6' },
        { key: 'inflation_regime', label: 'Inflation', color: '#f97316' },
        { key: 'balance_of_payments', label: 'BOP', color: '#8b5cf6' },
        { key: 'housing_cycle', label: 'Housing', color: '#ef4444' },
        { key: 'activity_regime', label: 'Activity', color: '#10b981' },
        { key: 'labor_market', label: 'Labor', color: '#f59e0b' }
    ];

    return (
        <>
            <Card className="p-6 h-full min-h-[700px] bg-card/40 backdrop-blur-md border border-white/10 dark:border-white/5 shadow-xl relative overflow-visible transition-all duration-300">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp size={20} className="text-blue-500" />
                            <h4 className="font-extrabold text-xs tracking-[0.12em] text-muted-foreground uppercase">
                                MACRO FLOW MAP
                            </h4>
                        </div>
                        <p className="text-muted-foreground text-xs font-medium leading-relaxed max-w-[80%]">
                            Visualizing macro indicator flows across 6 high-signal metrics
                        </p>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className="text-muted-foreground/50 hover:text-foreground transition-colors p-1">
                                    <Info size={16} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-[300px] bg-slate-950 border-white/10">
                                <p className="text-xs">Data sources: FRED (Federal Reserve Economic Data), IMF BOP Statistics. Some metrics use high-quality public API proxies. Click nodes for details.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* How to Read This Chart */}
                <div className="mb-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <span className="text-[0.65rem] font-black text-blue-400 uppercase tracking-widest block mb-2">
                        Institutional Guide: How to Read This Map
                    </span>
                    <p className="text-[0.7rem] text-muted-foreground/80 leading-relaxed">
                        Each colored band represents a macro category. The **width of each flow** represents the relative magnitude (Z-Score or USD Volume) of that metric's current signaling impact.
                        Bands flowing from left to right visualize how **Input Metrics** (Market data) correlate to **Economic Signals**.
                    </p>
                </div>

                {/* Category Legend */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {categories.map(cat => (
                        <div
                            key={cat.key}
                            className="px-2 py-1 rounded text-[0.7rem] font-bold border"
                            style={{
                                backgroundColor: `${cat.color}20`,
                                color: cat.color,
                                borderColor: `${cat.color}40`,
                            }}
                        >
                            {cat.label}
                        </div>
                    ))}
                </div>

                {/* Sankey Chart */}
                <div className="h-[540px] w-full relative">
                    {/* Axis Labels */}
                    <div className="absolute top-0 left-0 -translate-y-8">
                        <span className="text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em]">INPUT METRICS</span>
                    </div>
                    <div className="absolute top-0 right-0 -translate-y-8">
                        <span className="text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em] text-right block">OUTPUT SIGNALS</span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                        <Sankey
                            data={chartData}
                            nodePadding={20}
                            nodeWidth={10}
                            link={{
                                stroke: 'rgba(148, 163, 184, 0.3)',
                                strokeWidth: 2
                            }}
                            node={(props: any) => {
                                const { x, y, width, height, index, payload } = props;
                                const node = sankeyData.nodes.find(n => n.index === index);
                                return (
                                    <g>
                                        <rect
                                            x={x}
                                            y={y}
                                            width={width}
                                            height={height}
                                            fill={node?.color || '#6b7280'}
                                            fillOpacity="1"
                                            cursor="pointer"
                                            onClick={() => handleNodeClick(payload)}
                                        />
                                        <text
                                            x={x > 500 ? x - 8 : x + width + 8}
                                            y={y + height / 2}
                                            textAnchor={x > 500 ? 'end' : 'start'}
                                            alignmentBaseline="middle"
                                            className="text-[0.65rem] font-bold fill-white/60 uppercase tracking-tighter"
                                        >
                                            {payload.name}
                                        </text>
                                    </g>
                                );
                            }}
                            margin={{ top: 20, right: 120, bottom: 10, left: 120 }}
                        >
                            <RechartsTooltip
                                content={<CustomSankeyTooltip />}
                                cursor={{ fill: 'transparent' }}
                            />
                        </Sankey>
                    </ResponsiveContainer>
                </div>

                {/* Data Source Note */}
                <div className="mt-4 pt-4 border-t border-white/5">
                    <span className="text-[0.65rem] text-muted-foreground block leading-tight">
                        <strong className="text-muted-foreground/80">Data Sources:</strong> FRED (Federal Reserve Economic Data), IMF Balance of Payments Statistics API
                    </span>
                    <span className="text-[0.65rem] text-muted-foreground/50 block mt-1 leading-tight">
                        <strong className="text-muted-foreground/80">Note:</strong> Some metrics use high-quality public API proxies (e.g., equity ETF flows, PMI indicators) instead of paid institutional sources.
                        Last updated: {sankeyData.last_updated ? new Date(sankeyData.last_updated).toLocaleDateString() : 'N/A'}
                    </span>
                </div>
            </Card>

            {/* Detail Modal Overlay */}
            {selectedNode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setSelectedNode(null)}
                    />
                    <div className="relative w-full max-w-xl bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-white mb-2">
                                    {selectedNode.name}
                                </h2>
                                <div
                                    className="inline-block px-2 py-1 rounded text-xs font-bold border"
                                    style={{
                                        backgroundColor: `${selectedNode.color}20`,
                                        color: selectedNode.color,
                                        borderColor: `${selectedNode.color}40`,
                                    }}
                                >
                                    {selectedNode.category.replace(/_/g, ' ').toUpperCase()}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="text-muted-foreground hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                            This node represents a key macro indicator in the {selectedNode.category.replace(/_/g, ' ')} category.
                            Flow magnitude is determined by the latest observed value from FRED or IMF data sources.
                        </p>

                        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-[0.65rem] font-extrabold text-muted-foreground block uppercase mb-2">
                                CATEGORY COLOR LEGEND
                            </span>
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-4 h-4 rounded-sm shadow-sm"
                                    style={{ backgroundColor: selectedNode.color }}
                                />
                                <span className="text-sm font-bold text-foreground">
                                    {selectedNode.category ? (selectedNode.category.replace(/_/g, ' ').charAt(0).toUpperCase() + selectedNode.category.replace(/_/g, ' ').slice(1)) : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
