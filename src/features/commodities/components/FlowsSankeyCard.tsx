import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ship, ArrowRight, Info } from 'lucide-react';
import { ResponsiveContainer, Sankey, Tooltip, Layer, Rectangle } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TooltipProvider, Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const FLOW_COLORS: Record<string, string> = {
    'Oil': '#3b82f6',
    'LNG': '#60a5fa',
    'Coal': '#475569',
    'Default': '#64748b'
};

const CustomNode = (props: any) => {
    const { x, y, width, height, index, payload, containerWidth } = props;
    const isOut = x + width < containerWidth / 2;
    return (
        <Layer key={`node-${index}`}>
            <Rectangle
                x={x}
                y={y}
                width={width}
                height={Math.max(0, height)}
                fill={payload.color || '#3b82f6'}
                fillOpacity={0.9}
                rx={2}
            />
            <text
                x={isOut ? x - 8 : x + width + 8}
                y={y + height / 2}
                textAnchor={isOut ? 'end' : 'start'}
                fontSize="10px"
                fontWeight="900"
                fill="#94a3b8"
                className="uppercase tracking-tighter"
                dominantBaseline="middle"
            >
                {payload.name}
            </text>
        </Layer>
    );
};

export const FlowsSankeyCard: React.FC = () => {
    const { data: rawFlows, isLoading } = useQuery({
        queryKey: ['commodity-flows'],
        queryFn: async () => {
            const { data, error } = await supabase.from('commodity_flows').select('*');
            if (error) throw error;
            return data;
        }
    });

    const sankeyData = useMemo(() => {
        if (!rawFlows || rawFlows.length === 0) return { nodes: [], links: [] };

        // Pruning: Sort by volume and take top 10
        const topFlows = [...rawFlows].sort((a, b) => b.volume - a.volume).slice(0, 10);
        const totalVolume = rawFlows.reduce((s: number, f: any) => s + f.volume, 0);

        const nodesMap: Record<string, number> = {};
        const nodes: any[] = [];
        const links: any[] = [];

        topFlows.forEach((flow: any) => {
            if (nodesMap[flow.source] === undefined) {
                nodesMap[flow.source] = nodes.length;
                nodes.push({ name: flow.source, color: '#3b82f6' });
            }
            if (nodesMap[flow.target] === undefined) {
                nodesMap[flow.target] = nodes.length;
                nodes.push({ name: flow.target, color: '#10b981' });
            }
            links.push({
                source: nodesMap[flow.source],
                target: nodesMap[flow.target],
                value: flow.volume,
                commodity: flow.commodity,
                share: (flow.volume / totalVolume) * 100,
                color: FLOW_COLORS[flow.commodity] || FLOW_COLORS.Default
            });
        });

        return { nodes, links };
    }, [rawFlows]);

    if (isLoading) return <div className="h-[400px] animate-pulse bg-white/5 rounded-[2.5rem]" />;

    return (
        <Card className="bg-black/60 border-white/5 backdrop-blur-3xl overflow-hidden group h-[400px] flex flex-col">
            <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Ship className="w-4 h-4 text-blue-500" />
                        Physical Flow <span className="text-white">Network</span>
                    </CardTitle>
                    <TooltipProvider>
                        <UITooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground/40 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-900 border-white/10 max-w-xs p-3">
                                <p className="text-[10px] leading-relaxed text-muted-foreground">
                                    Visualizing top 10 physical commodity corridors by monthly volume (kt). Mapping source hubs to destination regions.
                                </p>
                            </TooltipContent>
                        </UITooltip>
                    </TooltipProvider>
                </div>
                <CardDescription className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-tighter mt-1">
                    Benchmarking transit corridors & logistical throughput
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-8 relative overflow-hidden">
                {!sankeyData.nodes.length ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground/40 italic text-[10px] uppercase tracking-widest">
                        Initializing Flow Mesh...
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <Sankey
                            data={sankeyData}
                            nodePadding={50}
                            margin={{ top: 20, bottom: 20, left: 80, right: 80 }}
                            node={<CustomNode containerWidth={800} />}
                            link={{ stroke: '#ffffff0a', strokeWidth: 0 }}
                        >
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload || !payload.length) return null;
                                    const data = payload[0].payload;
                                    if (data.sourceLinks) return null;

                                    return (
                                        <div className="bg-slate-950/90 border border-white/10 p-3 rounded-xl backdrop-blur-xl shadow-2xl">
                                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                                                <span className="text-[10px] font-black text-white uppercase tracking-wider">
                                                    {(data.source?.name || 'Unknown Source')} <ArrowRight className="inline w-3 h-3 mx-1" /> {(data.target?.name || 'Unknown Target')}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between gap-6">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Commodity</span>
                                                    <span className="text-[9px] font-black text-white uppercase">{data.commodity}</span>
                                                </div>
                                                <div className="flex justify-between gap-6">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Volume</span>
                                                    <span className="text-[9px] font-mono font-black text-blue-400">{data.value.toLocaleString()} kt</span>
                                                </div>
                                                <div className="flex justify-between gap-6">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Global Share</span>
                                                    <span className="text-[9px] font-mono font-black text-emerald-400">{data.share.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                        </Sankey>
                    </ResponsiveContainer>
                )}
            </CardContent>
            <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> High Yield</span>
                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Standard</span>
                    </div>
                    <span>Data Integrity: Tier 1</span>
                </div>
            </div>
        </Card>
    );
};
