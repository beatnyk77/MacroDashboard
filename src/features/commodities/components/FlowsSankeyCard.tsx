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
                        margin={{ top: 20, bottom: 20, left: 10, right: 10 }}
                        link={{ stroke: 'white', strokeOpacity: 0.1 }}
                    >
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) return null;
                                const data = payload[0].payload;
                                if (data.commodity) {
                                    const link = data as any;
                                    return (
                                        <div className="bg-slate-950 border border-white/10 rounded-lg p-3 shadow-xl">
                                            <p className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                                                {link.source?.name} → {link.target?.name}
                                            </p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between gap-4 text-[10px]">
                                                    <span className="text-muted-foreground">Commodity:</span>
                                                    <span className="text-white font-black">{data.commodity}</span>
                                                </div>
                                                <div className="flex justify-between gap-4 text-[10px]">
                                                    <span className="text-muted-foreground">Volume:</span>
                                                    <span className="text-blue-400 font-mono">{data.value} kt</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="bg-slate-950 border border-white/10 rounded-lg p-3 shadow-xl">
                                        <p className="text-xs font-bold text-white uppercase tracking-wider">{data.name}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Total Throughput: {data.value} kt</p>
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
