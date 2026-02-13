import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OilImport } from '@/hooks/useOilData';
import { Ship } from 'lucide-react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';

interface OilImportSankeyCardProps {
    data: OilImport[];
    isLoading: boolean;
}

// Metadata for styling and labeling
const COUNTRY_META: Record<string, { name: string; region: string; color: string; risk?: 'Stable' | 'Volatile' | 'At-Risk' }> = {
    'CAN': { name: 'Canada', region: 'North America', color: '#60a5fa', risk: 'Stable' },
    'MEX': { name: 'Mexico', region: 'North America', color: '#3b82f6', risk: 'Stable' },
    'SAU': { name: 'Saudi Arabia', region: 'Middle East', color: '#10b981', risk: 'Stable' },
    'IRQ': { name: 'Iraq', region: 'Middle East', color: '#059669', risk: 'Volatile' },
    'RUS': { name: 'Russia', region: 'OPEC+', color: '#ef4444', risk: 'At-Risk' },
    'USA': { name: 'United States', region: 'North America', color: '#64748b', risk: 'Stable' },
    'KWT': { name: 'Kuwait', region: 'Middle East', color: '#34d399', risk: 'Stable' },
    'UAE': { name: 'UAE', region: 'Middle East', color: '#10b981', risk: 'Stable' },
    'KAZ': { name: 'Kazakhstan', region: 'Central Asia', color: '#fbbf24', risk: 'Volatile' },
    'BRA': { name: 'Brazil', region: 'South America', color: '#fbbf24', risk: 'Stable' },
    'MYS': { name: 'Malaysia', region: 'Asia', color: '#8b5cf6', risk: 'Stable' },
    'ARE': { name: 'UAE', region: 'Middle East', color: '#10b981', risk: 'Stable' },
    'OMN': { name: 'Oman', region: 'Middle East', color: '#059669', risk: 'Stable' },
};

const DESTINATION_META: Record<string, { name: string; color: string }> = {
    'US': { name: 'US Refineries', color: '#3b82f6' },
    'IN': { name: 'India Refineries', color: '#f59e0b' },
    'CN': { name: 'China Refineries', color: '#ef4444' },
};

export const OilImportSankeyCard: React.FC<OilImportSankeyCardProps> = ({ data, isLoading }) => {
    const sankeyData = useMemo(() => {
        if (!data.length) return { nodes: [], links: [] };

        // Get latest observations per importer/exporter pair
        const latestPairs = new Map<string, OilImport>();
        data.forEach(d => {
            const key = `${d.importer_country_code}-${d.exporter_country_code}`;
            const existing = latestPairs.get(key);
            if (!existing || new Date(d.as_of_date) > new Date(existing.as_of_date)) {
                latestPairs.set(key, d);
            }
        });

        const latestData = Array.from(latestPairs.values()).filter(d => d.import_volume_mbbl > 0);
        if (!latestData.length) return { nodes: [], links: [] };

        const latestDate = latestData.sort((a, b) => new Date(b.as_of_date).getTime() - new Date(a.as_of_date).getTime())[0].as_of_date;

        // Construct nodes (Exporters -> Importers)
        const exporterCodes = Array.from(new Set(latestData.map(d => d.exporter_country_code)));
        const importerCodes = Array.from(new Set(latestData.map(d => d.importer_country_code)));

        const nodes = [
            ...exporterCodes.map(code => {
                const meta = COUNTRY_META[code] || { name: code, region: 'Other', color: '#94a3b8' };
                return { ...meta, code };
            }),
            ...importerCodes.map(code => {
                const meta = DESTINATION_META[code] || { name: `${code} Refineries`, color: '#64748b' };
                return { ...meta, code };
            })
        ];

        const exporterCount = exporterCodes.length;
        const links = latestData.map(d => {
            const source = exporterCodes.indexOf(d.exporter_country_code);
            const target = exporterCount + importerCodes.indexOf(d.importer_country_code);
            const sourceMeta = nodes[source];
            return {
                source,
                target,
                value: d.import_volume_mbbl,
                fill: sourceMeta.color,
                opacity: (sourceMeta as any).risk === 'At-Risk' ? 0.6 : 0.3
            };
        });

        return { nodes, links, latestDate };
    }, [data]);

    if (isLoading) {
        return (
            <Card className="h-[500px] animate-pulse bg-black/40 border-white/10 rounded-[2.5rem]">
                <CardHeader><div className="h-6 w-1/2 bg-white/10 rounded" /></CardHeader>
                <CardContent className="h-full pt-10"><div className="h-4/5 w-full bg-white/5 rounded-3xl" /></CardContent>
            </Card>
        );
    }

    if (!sankeyData.nodes.length) {
        return (
            <Card className="h-[500px] bg-black/40 border-white/10 rounded-[2.5rem] overflow-hidden">
                <CardContent className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                    <div className="text-center space-y-1">
                        <p className="italic font-medium">Synchronizing global partner feeds...</p>
                        <p className="text-[10px] uppercase tracking-widest font-black opacity-50">EIA International v2 Connection Active</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-black/60 border-white/10 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden relative group shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-6 pt-8 px-8 border-b border-white/5 bg-white/[0.01]">
                <div className="space-y-1.5">
                    <CardTitle className="text-base font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <Ship className="h-4 w-4 text-blue-400" />
                        </div>
                        Crude Oil Sourcing Flow
                    </CardTitle>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5">
                            <span className={cn("w-1.5 h-1.5 rounded-full", sankeyData.latestDate ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
                            {sankeyData.latestDate ? (
                                `AS OF ${new Date(sankeyData.latestDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}`
                            ) : (
                                "SYNCING METRIC FEEDS..."
                            )}
                        </span>
                    </div>
                </div>

                {/* Risk Legend */}
                <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Stable</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Volatile</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">At-Risk</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="h-[400px] p-8 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <Sankey
                        data={sankeyData}
                        nodePadding={10}
                        margin={{ left: 10, right: 10, top: 20, bottom: 20 }}
                        node={({ x, y, width, height, payload, containerWidth }) => {
                            const isSource = x < containerWidth / 2;
                            return (
                                <g>
                                    <rect
                                        x={x}
                                        y={y}
                                        width={width}
                                        height={Math.max(0, height)}
                                        fill={payload.color || '#64748b'}
                                        rx={4}
                                        className="shadow-lg"
                                    />
                                    <text
                                        x={isSource ? x - 8 : x + width + 8}
                                        y={y + height / 2}
                                        textAnchor={isSource ? 'end' : 'start'}
                                        fontSize="9"
                                        fontWeight="900"
                                        fill="#fff"
                                        className="uppercase tracking-tighter"
                                        dominantBaseline="middle"
                                    >
                                        {payload.name}
                                    </text>
                                    {isSource && (
                                        <text
                                            x={x - 8}
                                            y={y + height / 2 + 12}
                                            textAnchor="end"
                                            fontSize="8"
                                            fill="#94a3b8"
                                            className="uppercase tracking-widest font-bold"
                                        >
                                            {payload.region}
                                        </text>
                                    )}
                                </g>
                            );
                        }}
                        link={{ stroke: 'rgba(255,255,255,0.05)' }} // Base link style
                    >
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) return null;
                                const data = payload[0].payload;
                                const isNode = data.sourceLinks;

                                if (isNode) {
                                    return (
                                        <div className="bg-slate-950/90 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
                                            <p className="text-xs font-black text-white mb-2 uppercase tracking-widest">{data.name}</p>
                                            <div className="flex justify-between gap-4 text-[10px]">
                                                <span className="text-muted-foreground uppercase font-bold">Total Flow</span>
                                                <span className="font-mono text-white">{(data.value || 0).toLocaleString()} MBBL</span>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="bg-slate-950/90 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.fill }} />
                                            <span className="text-xs font-black text-white uppercase tracking-[0.1em]">
                                                {data.source?.name} → {data.target?.name}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between gap-6 text-[10px]">
                                                <span className="text-muted-foreground uppercase font-bold">Volume</span>
                                                <span className="font-mono text-white">{(data.value || 0).toLocaleString()} MBBL</span>
                                            </div>
                                            <div className="flex justify-between gap-6 text-[10px]">
                                                <span className="text-muted-foreground uppercase font-bold">Risk Level</span>
                                                <span className={cn(
                                                    "font-black uppercase tracking-widest",
                                                    data.source?.risk === 'At-Risk' ? 'text-rose-400' :
                                                        data.source?.risk === 'Volatile' ? 'text-amber-400' : 'text-emerald-400'
                                                )}>
                                                    {data.source?.risk || 'STABLE'}
                                                </span>
                                            </div>
                                        </div>
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

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

