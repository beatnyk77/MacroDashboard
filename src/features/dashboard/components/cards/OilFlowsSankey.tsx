import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { ResponsiveContainer, Sankey, Tooltip, Layer, Rectangle, BarChart, Bar, XAxis, YAxis, Legend, CartesianGrid } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface OilFlow {
    importer_country_code: string;
    exporter_country_code: string;
    exporter_country_name?: string;
    import_volume_mbbl: number;
    as_of_date: string;
}

interface OilFlowsSankeyProps {
    data?: OilFlow[];
    isLoading?: boolean;
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
    const { x, y, width, height, index, payload } = props;
    const isSource = x < 400; // Simplified logic for 2-column Sankey alignment

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
                x={isSource ? x - 12 : x + width + 12}
                y={y + height / 2}
                textAnchor={isSource ? 'end' : 'start'}
                fontSize="10px"
                fontWeight="900"
                fill="#f8fafc"
                className="uppercase tracking-[0.1em] drop-shadow-sm select-none"
                dominantBaseline="middle"
            >
                {payload.name}
            </text>
            <text
                x={isSource ? x - 12 : x + width + 12}
                y={y + height / 2 + 12}
                textAnchor={isSource ? 'end' : 'start'}
                fontSize="8px"
                fontWeight="bold"
                fill={payload.color}
                className="uppercase tracking-uppercase opacity-80 select-none"
                dominantBaseline="middle"
            >
                {isSource ? 'Source Hub' : 'Primary Sink'}
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
                className="transition-opacity duration-300 hover:fill-opacity-80"
            />
        </Layer>
    );
};


export const OilFlowsSankey: React.FC<OilFlowsSankeyProps> = ({ data: propData, isLoading: propLoading }) => {
    const [activeTab, setActiveTab] = useState<'IN' | 'CN'>('IN');
    const [viewMode, setViewMode] = useState<'sankey' | 'history'>('sankey');

    // Fetch from commodity_flows as secondary source if propData is missing/empty
    const { data: commodityFlows, isLoading: flowsLoading } = useQuery({
        queryKey: ['commodity-flows-oil'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('commodity_flows')
                .select('*')
                .eq('commodity', 'Crude Oil');
            if (error) throw error;
            return data;
        },
        enabled: !propData || propData.length === 0
    });

    const data = useMemo(() => {
        if (propData && propData.length > 0) return propData;
        if (!commodityFlows) return [];

        // Map commodity_flows to OilFlow interface
        return commodityFlows.map((f: any) => ({
            importer_country_code: f.target === 'India' ? 'IN' : f.target === 'China' ? 'CN' : f.target,
            exporter_country_code: f.source === 'Saudi Arabia' ? 'SA' : f.source === 'Russia' ? 'RU' : f.source === 'Iraq' ? 'IQ' : f.source,
            exporter_country_name: f.source,
            import_volume_mbbl: Number(f.volume),
            as_of_date: f.as_of_date
        }));
    }, [propData, commodityFlows]);

    const isLoading = propLoading || flowsLoading;

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
        const filtered = data.filter(d => d.importer_country_code === activeTab && d.import_volume_mbbl > 0);
        if (!filtered.length) return { nodes: [], links: [] };

        const latestDate = Array.from(new Set(filtered.map(d => d.as_of_date))).sort().pop();
        const latest = filtered.filter(d => d.as_of_date === latestDate);

        latest.sort((a, b) => b.import_volume_mbbl - a.import_volume_mbbl);
        const totalVolume = latest.reduce((sum, d) => sum + d.import_volume_mbbl, 0);

        if (totalVolume <= 0) return { nodes: [], links: [], totalVolume: 0, latestDate };

        const topN = 6;
        const top = latest.slice(0, topN);
        const otherVolume = latest.slice(topN).reduce((sum, d) => sum + d.import_volume_mbbl, 0);

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
                share: totalVolume > 0 ? (d.import_volume_mbbl / totalVolume) * 100 : 0,
                color: nodes[i].color
            })),
            ...(otherVolume > 0 ? [{
                source: nodes.length - 2,
                target: destIdx,
                value: otherVolume,
                share: totalVolume > 0 ? (otherVolume / totalVolume) * 100 : 0,
                color: '#475569'
            }] : [])
        ];

        return { nodes, links, totalVolume, latestDate };
    }, [data, activeTab]);

    if (isLoading) return <div className="h-[520px] animate-pulse bg-white/5 rounded-[2.5rem]" />;

    return (
        <Card className="bg-slate-900/60 border-white/12 backdrop-blur-3xl overflow-hidden group min-h-[520px] h-auto flex flex-col p-6 sm:p-8 transition-all hover:bg-slate-900/80 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] relative">
            {/* Background Decorative Gradients - Tamed */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] -mr-48 -mt-48 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 blur-[120px] -ml-48 -mb-48 pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center justify-between pb-8 border-b border-white/12 gap-6">
                <div className="space-y-2 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-4">
                        <div className={`w-12 h-1 bg-gradient-to-r ${activeTab === 'IN' ? 'from-blue-500' : 'from-rose-500'} to-transparent rounded-full`} />
                        <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-heading leading-none">
                            Asia Commodity <span className="text-muted-foreground/40 font-light">Flow Dynamics</span>
                        </h3>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-3 md:pl-[4rem]">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                            <span className="text-xs font-black text-white/60 uppercase tracking-uppercase">
                                {processedData.latestDate ? `Synced: ${new Date(processedData.latestDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : "Connecting Feeds..."}
                            </span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-xs font-bold text-muted-foreground/40 uppercase tracking-uppercase">EIA International Analytics</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-black/30 p-1.5 rounded-2xl border border-white/12 backdrop-blur-md">
                    <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="bg-white/5 p-1 rounded-xl">
                        <TabsList className="bg-transparent border-0 gap-1 h-8">
                            <TabsTrigger value="sankey" className="rounded-lg text-xs font-black uppercase px-6 h-7 tracking-uppercase transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-lg">Flow</TabsTrigger>
                            <TabsTrigger value="history" className="rounded-lg text-xs font-black uppercase px-6 h-7 tracking-uppercase transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-lg">Trends</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="w-px h-6 bg-white/10" />
                    <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="bg-white/5 p-1 rounded-xl">
                        <TabsList className="bg-transparent border-0 gap-1 h-8">
                            <TabsTrigger value="IN" className="rounded-lg text-xs font-black uppercase px-6 h-7 tracking-uppercase transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(37,99,235,0.4)]">INDIA</TabsTrigger>
                            <TabsTrigger value="CN" className="rounded-lg text-xs font-black uppercase px-6 h-7 tracking-uppercase transition-all data-[state=active]:bg-rose-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(225,29,72,0.4)]">CHINA</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            <CardContent className="flex-1 p-0 mt-8 relative overflow-hidden min-h-[350px]">
                {/* Sub-section Heading */}
                <div className="absolute top-0 left-0 z-20">
                    <span className="text-xs font-black text-white/30 uppercase tracking-uppercase bg-slate-900/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5">
                        {viewMode === 'sankey' ? 'Real-time Supply Corridors' : 'Annual Sourcing Trajectory'}
                    </span>
                </div>

                {!processedData.nodes?.length ? (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full animate-pulse" />
                            <div className="w-16 h-16 rounded-full border-[3px] border-white/5 border-t-white animate-[spin_1.5s_linear_infinite] relative z-10" />
                        </div>
                        <div className="space-y-2 relative z-10">
                            <p className="text-sm font-black text-white uppercase tracking-uppercase">Normalizing Trade Data</p>
                            <p className="text-xs uppercase tracking-[0.4em] font-medium text-muted-foreground/40">Protocol: EIA-INT-V2-ANNUAL</p>
                        </div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        {viewMode === 'sankey' ? (
                            <Sankey
                                data={processedData}
                                node={<CustomNode />}
                                nodePadding={40}
                                margin={{ top: 60, bottom: 40, left: 160, right: 160 }}
                                link={<CustomLink />}
                            >
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload || !payload.length) return null;
                                        const item = payload[0].payload;
                                        if (item.sourceLinks) return null;

                                        return (
                                            <div className="bg-slate-900 border border-white/20 p-5 rounded-2xl backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] min-w-[240px]">
                                                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/12">
                                                    <div className="w-3 h-3 rounded-full shadow-[0_0_12px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                                                    <span className="text-sm font-black text-white uppercase tracking-uppercase flex items-center gap-3">
                                                        {(item.source?.name || 'HUB')} <ArrowRight className="w-4 h-4 text-white/30" /> {(item.target?.name || 'TERMINAL')}
                                                    </span>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                                        <span className="text-xs font-black text-white/40 uppercase tracking-uppercase">Annual Volume</span>
                                                        <span className="text-sm font-mono font-black text-white">{item.value.toFixed(1)} <span className="text-xs opacity-30 font-sans">M·BBL</span></span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center px-1">
                                                            <span className="text-xs font-black text-white/40 uppercase tracking-uppercase">Network Share</span>
                                                            <span className="text-xs font-mono font-black text-emerald-400">{item.share.toFixed(1)}%</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                            <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-1000" style={{ width: `${item.share}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                            </Sankey>
                        ) : (
                            <BarChart data={historicalData} margin={{ top: 60, right: 30, left: 30, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ffffff" stopOpacity={0.1} />
                                        <stop offset="100%" stopColor="#ffffff" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#ffffff08" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={{ stroke: '#ffffff10' }}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#f8fafc', fontWeight: 900, opacity: 0.6 }}
                                    dy={15}
                                    tickFormatter={(val) => new Date(val).getFullYear().toString()}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#f8fafc', fontWeight: 600, opacity: 0.4 }}
                                    unit="M"
                                    dx={-10}
                                />
                                <Tooltip
                                    cursor={{ fill: 'url(#barGradient)' }}
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '16px',
                                        backdropFilter: 'blur(16px)',
                                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                                        padding: '16px'
                                    }}
                                    itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                    labelStyle={{ color: '#ffffff', fontSize: '12px', marginBottom: '12px', fontWeight: '900', textTransform: 'uppercase', opacity: 0.7 }}
                                />
                                <Legend
                                    iconType="circle"
                                    verticalAlign="bottom"
                                    align="center"
                                    wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.2em', paddingTop: '40px', color: '#64748b' }}
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
                                            barSize={48}
                                        />
                                    );
                                })}
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                )}
            </CardContent>

            <div className="mt-8 pt-8 border-t border-white/12">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex flex-wrap justify-center gap-8 items-center">
                        <span className="text-xs font-black text-white/20 uppercase tracking-[0.4em] mr-2">Market Risk Tiering</span>
                        {[
                            { color: '#10b981', label: 'Tier 1 / Optimal' },
                            { color: '#f59e0b', label: 'Tier 2 / Diversify' },
                            { color: '#ef4444', label: 'Tier 3 / Critical' }
                        ].map(legend => (
                            <div key={legend.label} className="flex items-center gap-3 group/legend">
                                <div className="w-2.5 h-2.5 rounded-full border border-white/12 shadow-[0_0_12px_rgba(255,255,255,0.1)] transition-all group-hover/legend:scale-125" style={{ backgroundColor: legend.color, color: legend.color }} />
                                <span className="text-xs font-black text-white/50 uppercase tracking-uppercase">{legend.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-black text-white/30 uppercase tracking-uppercase">Processing Standard</span>
                            <span className="text-xs font-black text-blue-500 uppercase tracking-uppercase bg-blue-500/10 px-3 py-0.5 rounded-full border border-blue-500/20">
                                West ↔ East Corridor
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};
