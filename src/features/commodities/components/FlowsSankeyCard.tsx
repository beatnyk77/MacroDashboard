import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ship } from 'lucide-react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const FlowsSankeyCard: React.FC = () => {
    const { data: rawFlows, isLoading } = useQuery({
        queryKey: ['commodity-flows'],
        queryFn: async () => {
            const { data, error } = await supabase.from('commodity_flows').select('*');
            if (error) throw error;
            return data;
        }
    });

    const sankeyData = React.useMemo(() => {
        if (!rawFlows || rawFlows.length === 0) return { nodes: [], links: [] };

        const nodesMap: Record<string, number> = {};
        const nodes: any[] = [];
        const links: any[] = [];

        rawFlows.forEach((flow: any) => {
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
                commodity: flow.commodity
            });
        });

        return { nodes, links };
    }, [rawFlows]);

    if (isLoading) return <div className="h-48 animate-pulse bg-white/5 rounded-2xl" />;

    return (
        <Card className="bg-black/40 border-white/10 backdrop-blur-md">
            <CardHeader className="pb-2 bg-white/[0.02] border-b border-white/5 px-4 lg:px-6">
                <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Ship className="w-3 h-3 text-blue-500" />
                    Physical Flow Network
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <Sankey
                        data={sankeyData}
                        nodePadding={30}
                        margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        link={{ stroke: 'white', strokeOpacity: 0.1 }}
                        node={({ x, y, width, height, index, payload, containerWidth }) => {
                            const isOut = x + width + 6 > containerWidth;
                            return (
                                <g>
                                    <rect x={x} y={y} width={width} height={height} fill={payload.color || "#3b82f6"} fillOpacity={1} rx={4} />
                                    <text
                                        x={x + width / 2}
                                        y={y + height / 2}
                                        textAnchor="middle"
                                        alignmentBaseline="middle"
                                        fill="#fff"
                                        fontSize={10}
                                        fontWeight="bold"
                                        className="pointer-events-none uppercase tracking-wider drop-shadow-md"
                                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                                    >
                                        {payload.name}
                                    </text>
                                </g>
                            );
                        }}
                    >
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) return null;
                                const data = payload[0].payload;
                                if (data.commodity) {
                                    const link = data as any;
                                    const totalVolume = rawFlows?.reduce((sum: number, f: any) => sum + f.volume, 0) || 1;
                                    const share = ((link.value / totalVolume) * 100).toFixed(1);

                                    return (
                                        <div className="bg-slate-950 border border-white/10 rounded-lg p-3 shadow-xl backdrop-blur-xl">
                                            <p className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                {link.source?.name} → {link.target?.name}
                                            </p>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between gap-6 text-[10px]">
                                                    <span className="text-muted-foreground font-medium">Commodity</span>
                                                    <span className="text-white font-black uppercase">{data.commodity}</span>
                                                </div>
                                                <div className="flex justify-between gap-6 text-[10px]">
                                                    <span className="text-muted-foreground font-medium">Volume</span>
                                                    <span className="text-blue-400 font-mono font-bold">{data.value.toLocaleString()} kt</span>
                                                </div>
                                                <div className="flex justify-between gap-6 text-[10px]">
                                                    <span className="text-muted-foreground font-medium">Global Share</span>
                                                    <span className="text-emerald-400 font-mono font-bold">{share}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="bg-slate-950 border border-white/10 rounded-lg p-3 shadow-xl backdrop-blur-xl">
                                        <p className="text-xs font-bold text-white uppercase tracking-wider">{data.name}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1 flex justify-between gap-4">
                                            <span>Throughput</span>
                                            <span className="font-mono text-white">{data.value.toLocaleString()} kt</span>
                                        </p>
                                    </div>
                                );
                            }}
                        />
                    </Sankey>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};
