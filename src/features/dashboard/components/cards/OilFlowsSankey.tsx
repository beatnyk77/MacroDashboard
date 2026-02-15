import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { ResponsiveContainer, Sankey, Tooltip, Layer, Rectangle, BarChart, Bar, XAxis, YAxis, Legend, CartesianGrid } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OilFlow {
    importer_country_code: string;
    exporter_country_code: string;
    exporter_country_name?: string;
    import_volume_mbbl: number;
    as_of_date: string;
}

interface OilFlowsSankeyProps {
    data: OilFlow[];
    isLoading: boolean;
}

const RISK_META: Record<string, { name: string, score: number, color: string, glow: string }> = {
    'SA': { name: 'Saudi Arabia', score: 5, color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
    'RU': { name: 'Russia', score: 10, color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)' },
    'IQ': { score: 7, name: 'Iraq', color: '#fb7185', glow: 'rgba(251, 113, 133, 0.4)' },
    'AE': { score: 4, name: 'UAE', color: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
    'KW': { score: 4, name: 'Kuwait', color: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
    'US': { score: 1, name: 'USA', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' },
    'CA': { score: 1, name: 'Canada', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' },
    'BR': { score: 3, name: 'Brazil', color: '#34d399', glow: 'rgba(52, 211, 153, 0.4)' },
};

const CustomNode = (props: any) => {
    const { x, y, width, height, index, payload, containerWidth } = props;
    const isOut = x + width < containerWidth / 2;

    return (
        <Layer key={`node-${index}`}>
            <defs>
                <linearGradient id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={payload.color} stopOpacity={1} />
                    <stop offset="100%" stopColor={payload.color} stopOpacity={0.6} />
                </linearGradient>
            </defs>
            <Rectangle
                x={x}
                y={y}
                width={width}
                height={Math.max(0, height)}
                fill={`url(#grad-${index})`}
                stroke={payload.color}
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
            <text
                x={isOut ? x - 12 : x + width + 12}
                y={y + height / 2 + 12}
                textAnchor={isOut ? 'end' : 'start'}
                fontSize="8px"
                fontWeight="bold"
                fill={payload.color}
                className="uppercase tracking-widest opacity-80"
                dominantBaseline="middle"
            >
                {isOut ? 'Source Hub' : 'Primary Sink'}
            </text>
        </Layer>
    );
};

const CustomLink = (props: any) => {
    const { sourceX, sourceY, targetX, targetY, sourceControlX, targetControlX, linkWidth, payload } = props;
    const color = payload.color || '#3b82f6';
    const id = `link-grad-${payload.source}-${payload.target}`;

    return (
        <Layer key={`link-${payload.index}`}>
            <defs>
                <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="50%" stopColor={color} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.2} />
                </linearGradient>
                <filter id="glow">
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
                strokeOpacity={0.3}
                filter="url(#glow)"
                className="transition-opacity duration-300 hover:fill-opacity-80"
            />
        </Layer>
    );
};

export const OilFlowsSankey: React.FC<OilFlowsSankeyProps> = ({ data, isLoading }) => {
    const [activeTab, setActiveTab] = useState<'IN' | 'CN'>('IN');
    const [viewMode, setViewMode] = useState<'sankey' | 'history'>('sankey');

    const historicalData = useMemo(() => {
        const filtered = data.filter(d => d.importer_country_code === activeTab);
        if (!filtered.length) return [];

        const dateMap = new Map<string, any>();
        filtered.forEach(d => {
            if (!dateMap.has(d.as_of_date)) {
                dateMap.set(d.as_of_date, { date: d.as_of_date });
            }
            const dateObj = dateMap.get(d.as_of_date);
            const countryMeta = RISK_META[d.exporter_country_code] || { name: d.exporter_country_name || d.exporter_country_code };
            const key = countryMeta.name;
            dateObj[key] = (dateObj[key] || 0) + d.import_volume_mbbl;
        });

        return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [data, activeTab]);

    const exporters = useMemo(() => {
        const set = new Set<string>();
        historicalData.forEach(d => {
            Object.keys(d).forEach(k => {
                if (k !== 'date') set.add(k);
            });
        });
        return Array.from(set);
    }, [historicalData]);

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
                const meta = RISK_META[d.exporter_country_code] || { name: d.exporter_country_name || d.exporter_country_code, color: '#94a3b8' };
                return { name: meta.name.toUpperCase(), color: meta.color };
            }),
            ...(otherVolume > 0 ? [{ name: 'OTHER EXPORTERS', color: '#475569' }] : []),
            { name: activeTab === 'IN' ? 'INDIA TERMINAL' : 'CHINA TERMINAL', color: activeTab === 'IN' ? '#3b82f6' : '#ef4444' }
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
                color: '#475569'
            }] : [])
        ];

        return { nodes, links, totalVolume, latestDate };
    }, [data, activeTab]);

    if (isLoading) return <div className="h-[480px] animate-pulse bg-white/5 rounded-[2.5rem]" />;

    return (
        <Card className="bg-slate-950/40 border-white/5 backdrop-blur-3xl overflow-hidden group h-[480px] flex flex-col p-8 transition-all hover:bg-slate-950/60 shadow-2xl">
            <div className="flex flex-row items-center justify-between pb-6 border-b border-white/5">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-px bg-gradient-to-r from-blue-500 to-transparent" />
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">
                            Global Oil <span className="text-white">Transit Hubs</span>
                        </h3>
                    </div>
                    <div className="flex items-center gap-3 pl-[3.25rem]">
                        <span className="text-[10px] font-bold text-muted-foreground/60 flex items-center gap-2 uppercase tracking-widest leading-none">
                            {processedData.latestDate ? (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                                    Terminal Synced: {new Date(processedData.latestDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
                                </>
                            ) : (
                                "Connecting High-Fidelity Feeds..."
                            )}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="bg-black/40 p-1 rounded-2xl border border-white/5">
                        <TabsList className="bg-transparent border-0 gap-1 h-8">
                            <TabsTrigger value="sankey" className="rounded-xl text-[10px] font-black uppercase px-5 h-7 tracking-wider transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white">Flow</TabsTrigger>
                            <TabsTrigger value="history" className="rounded-xl text-[10px] font-black uppercase px-5 h-7 tracking-wider transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white">Trends</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="bg-black/40 p-1 rounded-2xl border border-white/5">
                        <TabsList className="bg-transparent border-0 gap-1 h-8">
                            <TabsTrigger value="IN" className="rounded-xl text-[10px] font-black uppercase px-5 h-7 tracking-wider transition-all data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">BHARAT</TabsTrigger>
                            <TabsTrigger value="CN" className="rounded-xl text-[10px] font-black uppercase px-5 h-7 tracking-wider transition-all data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400">CHINA</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            <CardContent className="flex-1 p-0 mt-10 relative overflow-hidden">
                {!processedData.nodes?.length ? (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                            <div className="w-16 h-16 rounded-full border-[3px] border-white/5 border-t-blue-500 animate-[spin_1s_linear_infinite] relative z-10" />
                        </div>
                        <div className="space-y-2 relative z-10">
                            <p className="text-xs font-black text-white uppercase tracking-[0.2em] italic">Building Supply Chain Mesh...</p>
                            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/40">Securing High-Fidelity Upstream Records</p>
                        </div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        {viewMode === 'sankey' ? (
                            <Sankey
                                data={processedData}
                                node={<CustomNode containerWidth={800} />}
                                nodePadding={60}
                                margin={{ left: 140, right: 140, top: 40, bottom: 40 }}
                                link={<CustomLink />}
                            >
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload || !payload.length) return null;
                                        const item = payload[0].payload;
                                        if (item.sourceLinks) return null;

                                        return (
                                            <div className="bg-slate-950/95 border border-white/10 p-4 rounded-2xl backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t-white/20">
                                                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                                                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                                                    <span className="text-[11px] font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
                                                        {(item.source?.name || 'HUB')} <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" /> {(item.target?.name || 'SINK')}
                                                    </span>
                                                </div>
                                                <div className="space-y-2.5">
                                                    <div className="flex justify-between gap-12 items-center">
                                                        <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Throughput</span>
                                                        <span className="text-[11px] font-mono font-black text-white">{item.value.toFixed(1)} <span className="text-[9px] opacity-40">M·BBL</span></span>
                                                    </div>
                                                    <div className="flex justify-between gap-12 items-center">
                                                        <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Supply Weight</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-24 h-1 rounded-full bg-white/5 overflow-hidden">
                                                                <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${item.share}%` }} />
                                                            </div>
                                                            <span className="text-[11px] font-mono font-black text-emerald-400">{item.share.toFixed(1)}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                            </Sankey>
                        ) : (
                            <BarChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fill: '#64748b', fontWeight: 900 }}
                                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).toUpperCase()}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fill: '#64748b', fontWeight: 500 }}
                                    unit="M"
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                                    itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '8px', fontWeight: 'black', textTransform: 'uppercase' }}
                                />
                                <Legend
                                    iconType="circle"
                                    verticalAlign="bottom"
                                    wrapperStyle={{ fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '30px' }}
                                />
                                {exporters.map((exporter, idx) => {
                                    const meta = Object.values(RISK_META).find(m => m.name === exporter) || { color: '#475569' };
                                    return (
                                        <Bar
                                            key={exporter}
                                            dataKey={exporter}
                                            stackId="a"
                                            fill={meta.color}
                                            radius={[idx === exporters.length - 1 ? 4 : 0, idx === exporters.length - 1 ? 4 : 0, 0, 0]}
                                            barSize={32}
                                        />
                                    );
                                })}
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                )}
            </CardContent>

            <div className="mt-auto pt-6 border-t border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex gap-6 items-center">
                        <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mr-2">Risk Stratification</span>
                        {[
                            { color: '#10b981', label: 'Tier 1 / Stable' },
                            { color: '#f59e0b', label: 'Tier 2 / Volatile' },
                            { color: '#f43f5e', label: 'Tier 3 / At-Risk' }
                        ].map(legend => (
                            <div key={legend.label} className="flex items-center gap-2 group/legend">
                                <div className="w-2 h-2 rounded-full border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-shadow group-hover/legend:shadow-[0_0_15px_currentColor]" style={{ backgroundColor: legend.color, color: legend.color }} />
                                <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">{legend.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-black text-muted-foreground/40 uppercase tracking-tighter">
                            Tier 1 Intelligence
                        </span>
                        <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">WEST → EAST</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};
