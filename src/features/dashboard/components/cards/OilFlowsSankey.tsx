import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ship, Globe2, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, Sankey, Tooltip, Layer, Rectangle } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OilFlow {
    importer_country_code: string;
    exporter_country_code: string;
    exporter_country_name: string;
    import_volume_mbbl: number;
    as_of_date: string;
}

interface OilFlowsSankeyProps {
    data: OilFlow[];
    isLoading: boolean;
}

const RISK_META: Record<string, { name: string, score: number, color: string }> = {
    'SA': { name: 'Saudi Arabia', score: 5, color: '#f59e0b' },
    'RU': { name: 'Russia', score: 10, color: '#f43f5e' },
    'IQ': { score: 7, name: 'Iraq', color: '#fb7185' },
    'AE': { score: 4, name: 'UAE', color: '#10b981' },
    'KW': { score: 4, name: 'Kuwait', color: '#10b981' },
    'US': { score: 1, name: 'USA', color: '#10b981' },
    'CA': { score: 1, name: 'Canada', color: '#10b981' },
    'BR': { score: 3, name: 'Brazil', color: '#34d399' },
};

const DemoNode = (props: any) => {
    const { x, y, width, height, index, payload, containerWidth } = props;
    const isOut = x + width < containerWidth / 2;
    return (
        <Layer key={`node-${index}`}>
            <Rectangle
                x={x}
                y={y}
                width={width}
                height={height}
                fill={payload.color || '#475569'}
                fillOpacity={0.8}
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

export const OilFlowsSankey: React.FC<OilFlowsSankeyProps> = ({ data, isLoading }) => {
    const [activeTab, setActiveTab] = useState<'IN' | 'CN'>('IN');

    const processedData = useMemo(() => {
        const filtered = data.filter(d => d.importer_country_code === activeTab);
        if (!filtered.length) return { nodes: [], links: [] };

        const latestDate = Array.from(new Set(filtered.map(d => d.as_of_date))).sort().pop();
        const latest = filtered.filter(d => d.as_of_date === latestDate);

        latest.sort((a, b) => b.import_volume_mbbl - a.import_volume_mbbl);
        const topN = 6;
        const top = latest.slice(0, topN);
        const otherVolume = latest.slice(topN).reduce((sum, d) => sum + d.import_volume_mbbl, 0);
        const totalVolume = latest.reduce((sum, d) => sum + d.import_volume_mbbl, 0);

        const nodes = [
            ...top.map(d => {
                const meta = RISK_META[d.exporter_country_code] || { name: d.exporter_country_name || d.exporter_country_code, color: '#475569' };
                return { name: meta.name, color: meta.color };
            }),
            ...(otherVolume > 0 ? [{ name: 'Other Exporters', color: '#334155' }] : []),
            { name: activeTab === 'IN' ? 'INDIA HUB' : 'CHINA HUB', color: activeTab === 'IN' ? '#3b82f6' : '#ef4444' }
        ];

        const destIdx = nodes.length - 1;
        const links = [
            ...top.map((d, i) => ({
                source: i,
                target: destIdx,
                value: d.import_volume_mbbl,
                share: (d.import_volume_mbbl / totalVolume) * 100,
                color: nodes[i].color
            })),
            ...(otherVolume > 0 ? [{
                source: nodes.length - 2,
                target: destIdx,
                value: otherVolume,
                share: (otherVolume / totalVolume) * 100,
                color: '#334155'
            }] : [])
        ];

        return { nodes, links, totalVolume, latestDate };
    }, [data, activeTab]);

    if (isLoading) return <div className="h-[450px] animate-pulse bg-white/5 rounded-3xl" />;

    return (
        <Card className="bg-black/60 border-white/5 backdrop-blur-3xl overflow-hidden group h-[450px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5 bg-white/[0.01]">
                <div className="space-y-1">
                    <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Ship className="h-4 w-4 text-blue-400" />
                        Crude Oil <span className="text-white">Sourcing</span> Flow
                    </CardTitle>
                    <CardDescription className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-tighter">
                        Geopolitical supply vector tracking {processedData.latestDate && `— FY ${processedData.latestDate}`}
                    </CardDescription>
                </div>
                <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="bg-white/5 p-1 rounded-xl border border-white/5">
                    <TabsList className="bg-transparent border-0 gap-1 h-7">
                        <TabsTrigger value="IN" className="rounded-lg text-[10px] font-black uppercase px-4 h-6 tracking-tighter transition-all">India</TabsTrigger>
                        <TabsTrigger value="CN" className="rounded-lg text-[10px] font-black uppercase px-4 h-6 tracking-tighter transition-all">China</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent className="flex-1 p-8 pt-12 relative overflow-hidden">
                {!processedData.nodes.length ? (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-40">
                        <Globe2 className="w-12 h-12 text-muted-foreground" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Establishing Data Mesh...</span>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <Sankey
                            data={processedData}
                            node={<DemoNode containerWidth={800} />}
                            nodePadding={40}
                            margin={{ left: 100, right: 100, top: 20, bottom: 20 }}
                            link={{ stroke: '#ffffff11', strokeWidth: 0 }}
                        >
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload || !payload.length) return null;
                                    const item = payload[0].payload;
                                    if (item.sourceLinks) return null; // Hide node tooltips for cleaner look

                                    return (
                                        <div className="bg-slate-950/90 border border-white/10 p-3 rounded-xl backdrop-blur-xl shadow-2xl">
                                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                <span className="text-[10px] font-black text-white uppercase tracking-wider">
                                                    {item.source.name} <ArrowRight className="inline w-3 h-3 mx-1" /> {item.target.name}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between gap-6">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Annual Volume</span>
                                                    <span className="text-[9px] font-mono font-black text-white">{item.value.toFixed(1)} mbbl</span>
                                                </div>
                                                <div className="flex justify-between gap-6">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Supply Share</span>
                                                    <span className="text-[9px] font-mono font-black text-emerald-400">{item.share.toFixed(1)}%</span>
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
                <div className="flex items-center justify-between">
                    <div className="flex gap-4 items-center">
                        <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mr-2">Risk Legend</span>
                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /><span className="text-[8px] font-black text-muted-foreground/60 uppercase">Stable</span></div>
                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" /><span className="text-[8px] font-black text-muted-foreground/60 uppercase">Volatile</span></div>
                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]" /><span className="text-[8px] font-black text-muted-foreground/60 uppercase">At-Risk</span></div>
                    </div>
                    <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">Flow Direction: West → East</span>
                </div>
            </div>
        </Card>
    );
};
