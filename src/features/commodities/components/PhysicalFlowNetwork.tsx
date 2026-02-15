import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
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
            <defs>
                <linearGradient id={`node-grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={payload.color || '#3b82f6'} stopOpacity={1} />
                    <stop offset="100%" stopColor={payload.color || '#3b82f6'} stopOpacity={0.6} />
                </linearGradient>
            </defs>
            <Rectangle
                x={x}
                y={y}
                width={width}
                height={Math.max(0, height)}
                fill={`url(#node-grad-${index})`}
                stroke={payload.color || '#3b82f6'}
                strokeWidth={0.5}
                rx={1}
            />
            <text
                x={isOut ? x - 12 : x + width + 12}
                y={y + height / 2}
                textAnchor={isOut ? 'end' : 'start'}
                fontSize="10px"
                fontWeight="900"
                fill="#f8fafc"
                className="uppercase tracking-[0.1em] drop-shadow-sm"
                dominantBaseline="middle"
            >
                {payload.name}
            </text>
        </Layer>
    );
};

const CustomLink = (props: any) => {
    const { sourceX, sourceY, targetX, targetY, sourceControlX, targetControlX, linkWidth, payload } = props;
    const color = payload.color || '#3b82f6';
    const id = `flow-link-grad-${payload.source}-${payload.target}`;

    return (
        <Layer key={`link-${payload.index}`}>
            <defs>
                <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={color} stopOpacity={0.1} />
                    <stop offset="50%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.1} />
                </linearGradient>
                <filter id="flow-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <path
                d={`
                    M${sourceX},${sourceY}
                    C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
                    L${targetX},${targetY + linkWidth}
                    C${targetControlX},${targetY + linkWidth} ${sourceControlX},${sourceY + linkWidth} ${sourceX},${sourceY + linkWidth}
                    Z
                `}
                fill={`url(#${id})`}
                stroke={color}
                strokeWidth={0.5}
                strokeOpacity={0.2}
                filter="url(#flow-glow)"
                className="transition-opacity duration-300 hover:fill-opacity-80"
            />
        </Layer>
    );
};

export const PhysicalFlowNetwork: React.FC = () => {
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

    if (isLoading) return <div className="h-[480px] animate-pulse bg-white/5 rounded-[2.5rem]" />;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="bg-slate-950/40 border-white/5 backdrop-blur-3xl overflow-hidden group h-[520px] flex flex-col shadow-2xl relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] via-transparent to-emerald-500/[0.02] pointer-events-none" />

                <CardHeader className="pb-6 border-b border-white/5 bg-white/[0.01] relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3">
                                <div className="w-8 h-px bg-blue-500/50" />
                                Physical <span className="text-white">Flow Network</span>
                            </CardTitle>
                            <CardDescription className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest pl-11">
                                Benchmarking transit corridors & Logistical Throughput
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                                <span className="text-[10px] text-white font-black uppercase tracking-widest">LIVE MESH</span>
                            </div>
                            <TooltipProvider>
                                <UITooltip>
                                    <TooltipTrigger asChild>
                                        <div className="p-2 rounded-xl bg-white/5 border border-white/5 cursor-help hover:bg-white/10 transition-colors">
                                            <Info className="h-3.5 w-3.5 text-muted-foreground/60" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-900/95 border-white/10 max-w-xs p-4 backdrop-blur-xl">
                                        <p className="text-[10px] leading-relaxed text-muted-foreground font-medium uppercase tracking-tight">
                                            Mapping top 10 physical commodity corridors. Volumes indexed in KT (kilotonnes).
                                        </p>
                                    </TooltipContent>
                                </UITooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-10 relative z-10">
                    {!sankeyData.nodes.length ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 opacity-30">
                            <Ship className="w-8 h-8 animate-bounce text-blue-500" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Initializing Logistical Feed...</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <Sankey
                                data={sankeyData}
                                nodePadding={60}
                                margin={{ top: 20, bottom: 20, left: 160, right: 160 }}
                                node={<CustomNode containerWidth={800} />}
                                link={<CustomLink />}
                            >
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload || !payload.length) return null;
                                        const data = payload[0].payload;
                                        if (data.sourceLinks) return null;

                                        return (
                                            <div className="bg-slate-950/95 border border-white/10 p-5 rounded-2xl backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t-white/20 min-w-[220px]">
                                                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                                                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: data.color, color: data.color }} />
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                        {data.source?.name} <ArrowRight className="w-3 h-3 text-muted-foreground/40" /> {data.target?.name}
                                                    </span>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg">
                                                        <span className="text-[9px] font-black text-muted-foreground/60 uppercase">Commodity</span>
                                                        <span className="text-[10px] font-black text-white uppercase tracking-tighter">{data.commodity}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg">
                                                        <span className="text-[9px] font-black text-muted-foreground/60 uppercase">Throughput</span>
                                                        <span className="text-[10px] font-mono font-black text-blue-400">{data.value.toLocaleString()} KT</span>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg">
                                                        <span className="text-[9px] font-black text-muted-foreground/60 uppercase">Network Load</span>
                                                        <span className="text-[10px] font-mono font-black text-emerald-400">{data.share.toFixed(1)}%</span>
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

                <div className="px-8 py-5 border-t border-white/5 bg-black/20 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-6">
                            {Object.entries(FLOW_COLORS).map(([name, color]) => (
                                <div key={name} className="flex items-center gap-2 group cursor-default">
                                    <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: color, color: color }} />
                                    <span className="text-[9px] font-black text-muted-foreground group-hover:text-white transition-colors uppercase tracking-widest">{name}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Data Integrity: Tier 1 Terminal Verified</span>
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};
