import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ship, Globe2 } from 'lucide-react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';
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

const COUNTRY_META: Record<string, { name: string; region: string; color: string }> = {
    'SA': { name: 'Saudi Arabia', region: 'OPEC', color: '#10b981' },
    'RU': { name: 'Russia', region: 'Non-OPEC', color: '#ef4444' },
    'IQ': { name: 'Iraq', region: 'OPEC', color: '#059669' },
    'AE': { name: 'UAE', region: 'OPEC', color: '#34d399' },
    'KW': { name: 'Kuwait', region: 'OPEC', color: '#10b981' },
    'US': { name: 'USA', region: 'North America', color: '#60a5fa' },
    'CA': { name: 'Canada', region: 'North America', color: '#3b82f6' },
    'BR': { name: 'Brazil', region: 'Non-OPEC', color: '#fbbf24' },
    'World': { name: 'Global Supply', region: 'Other', color: '#475569' }
};

export const OilFlowsSankey: React.FC<OilFlowsSankeyProps> = ({ data, isLoading }) => {
    const [activeTab, setActiveTab] = useState<'IN' | 'CN'>('IN');

    const processedData = useMemo(() => {
        const filtered = data.filter(d => d.importer_country_code === activeTab);
        if (!filtered.length) return { nodes: [], links: [] };

        // Aggregate by exporter
        const latestDate = Array.from(new Set(filtered.map(d => d.as_of_date))).sort().pop();
        const latest = filtered.filter(d => d.as_of_date === latestDate);

        latest.sort((a, b) => b.import_volume_mbbl - a.import_volume_mbbl);
        const topN = 6;
        const top = latest.slice(0, topN);
        const otherVolume = latest.slice(topN).reduce((sum, d) => sum + d.import_volume_mbbl, 0);
        const totalVolume = latest.reduce((sum, d) => sum + d.import_volume_mbbl, 0);

        const nodes = [
            ...top.map(d => {
                const meta = COUNTRY_META[d.exporter_country_code] || { name: d.exporter_country_name || d.exporter_country_code, region: 'Other', color: '#94a3b8' };
                return { ...meta, value: d.import_volume_mbbl };
            }),
            ...(otherVolume > 0 ? [{ name: 'Other', region: 'Other', color: '#475569', value: otherVolume }] : []),
            { name: activeTab === 'IN' ? 'India Refineries' : 'China Refineries', region: 'Destination', color: activeTab === 'IN' ? '#3b82f6' : '#ef4444', value: totalVolume }
        ];

        const destIdx = nodes.length - 1;
        const links = [
            ...top.map((d, i) => ({
                source: i,
                target: destIdx,
                value: d.import_volume_mbbl,
                share: (d.import_volume_mbbl / totalVolume) * 100,
                fill: nodes[i].color
            })),
            ...(otherVolume > 0 ? [{
                source: nodes.length - 2,
                target: destIdx,
                value: otherVolume,
                share: (otherVolume / totalVolume) * 100,
                fill: '#475569'
            }] : [])
        ];

        return { nodes, links, totalVolume, latestDate };
    }, [data, activeTab]);

    if (isLoading) return <div className="h-[400px] animate-pulse bg-white/5 rounded-3xl" />;

    return (
        <Card className="bg-slate-950/40 border-white/5 backdrop-blur-3xl overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/5 bg-white/[0.01]">
                <div className="space-y-1">
                    <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 italic">
                        <Ship className="h-4 w-4 text-emerald-500" />
                        Commodity <span className="text-white">Flow</span> Engine
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-tight">
                        Crude Oil Sourcing Dynamics {processedData.latestDate && `— ${processedData.latestDate}`}
                    </p>
                </div>
                <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="bg-black/40 p-1 rounded-xl border border-white/5">
                    <TabsList className="bg-transparent border-0 gap-1">
                        <TabsTrigger value="IN" className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400 rounded-lg text-[10px] font-black uppercase px-4 h-7 tracking-tighter transition-all">India</TabsTrigger>
                        <TabsTrigger value="CN" className="data-[state=active]:bg-rose-500/10 data-[state=active]:text-rose-400 rounded-lg text-[10px] font-black uppercase px-4 h-7 tracking-tighter transition-all">China</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent className="h-[400px] p-8 pt-12 relative">
                {!processedData.nodes.length ? (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-40">
                        <Globe2 className="w-12 h-12 text-muted-foreground" />
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Data Stream Initializing</span>
                            <p className="text-[10px] italic text-muted-foreground">Normalizing import nodes for {activeTab === 'IN' ? 'India' : 'China'}...</p>
                        </div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <Sankey
                            data={processedData}
                            nodePadding={50}
                            margin={{ left: 20, right: 20 }}
                            link={{ stroke: '#ffffff22', strokeWidth: 0 }}
                        >
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload || !payload.length) return null;
                                    const item = payload[0].payload;
                                    const isNode = item.sourceLinks;

                                    return (
                                        <div className="bg-slate-950/90 border border-white/10 p-4 rounded-2xl backdrop-blur-xl shadow-2xl">
                                            {isNode ? (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black text-white uppercase tracking-wider">{item.name}</p>
                                                    <p className="text-[10px] font-mono text-muted-foreground">{(item.value || 0).toFixed(1)} mbbl/yr</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Flow Dynamics</p>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                                                        <p className="text-xs font-black text-white">{item.source.name} → {item.target.name}</p>
                                                    </div>
                                                    <div className="pt-2 border-t border-white/5 space-y-1">
                                                        <div className="flex justify-between gap-8">
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Volume:</span>
                                                            <span className="text-[10px] font-mono font-black text-white">{item.value.toFixed(1)} mbbl</span>
                                                        </div>
                                                        <div className="flex justify-between gap-8">
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Share:</span>
                                                            <span className="text-[10px] font-mono font-black text-emerald-400">{item.share.toFixed(1)}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }}
                            />
                        </Sankey>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
};
