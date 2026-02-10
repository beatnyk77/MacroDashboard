import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OilImport } from '@/hooks/useOilData';
import { Ship, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';

interface OilImportSankeyCardProps {
    data: OilImport[];
    isLoading: boolean;
}

// Metadata for styling and labeling
const COUNTRY_META: Record<string, { name: string; region: 'OPEC' | 'Non-OPEC' | 'North America' | 'Other'; color: string }> = {
    'CA': { name: 'Canada', region: 'North America', color: '#60a5fa' }, // Blue-400
    'MX': { name: 'Mexico', region: 'North America', color: '#3b82f6' }, // Blue-500
    'SA': { name: 'Saudi Arabia', region: 'OPEC', color: '#10b981' }, // Emerald-500
    'IQ': { name: 'Iraq', region: 'OPEC', color: '#059669' }, // Emerald-600
    'CO': { name: 'Colombia', region: 'Non-OPEC', color: '#f59e0b' }, // Amber-500
    'EC': { name: 'Ecuador', region: 'OPEC', color: '#34d399' }, // Emerald-400
    'NG': { name: 'Nigeria', region: 'OPEC', color: '#10b981' },
    'VE': { name: 'Venezuela', region: 'OPEC', color: '#f43f5e' }, // Rose-500 (Risk)
    'BR': { name: 'Brazil', region: 'Non-OPEC', color: '#fbbf24' },
    'RU': { name: 'Russia', region: 'OPEC', color: '#ef4444' }, // Red-500
    'US': { name: 'United States', region: 'North America', color: '#64748b' },
};

export const OilImportSankeyCard: React.FC<OilImportSankeyCardProps> = ({ data, isLoading }) => {
    // Process data: Aggregate latest month's imports by exporter
    const sankeyData = useMemo(() => {
        if (!data.length) return { nodes: [], links: [] };

        const dates = Array.from(new Set(data.map(d => d.as_of_date))).sort();
        const latestDate = dates[dates.length - 1];
        const latestImports = data.filter(d => d.as_of_date === latestDate);

        // Sort by volume
        latestImports.sort((a, b) => b.import_volume_mbbl - a.import_volume_mbbl);

        const TOP_N = 6;
        const topImports = latestImports.slice(0, TOP_N);
        const otherImports = latestImports.slice(TOP_N);
        const otherVolume = otherImports.reduce((sum, d) => sum + d.import_volume_mbbl, 0);

        // Calculate total for percentage
        const totalVolume = topImports.reduce((sum, d) => sum + d.import_volume_mbbl, 0) + otherVolume;

        // Construct Nodes
        const nodes = [
            ...topImports.map(d => {
                const meta = COUNTRY_META[d.exporter_country_code] || { name: d.exporter_country_code, region: 'Other', color: '#94a3b8' };
                return { ...meta, value: d.import_volume_mbbl };
            }),
            ...(otherVolume > 0 ? [{ name: 'Rest of World', region: 'Other', color: '#475569', value: otherVolume }] : []),
            { name: 'US Refineries', region: 'North America', color: '#3b82f6', value: totalVolume } // Destination
        ];

        const usIndex = nodes.length - 1;
        const otherIndex = otherVolume > 0 ? topImports.length : -1;

        const links = [
            ...topImports.map((d, i) => ({
                source: i,
                target: usIndex,
                value: d.import_volume_mbbl,
                share: (d.import_volume_mbbl / totalVolume) * 100,
                fill: nodes[i].color // Link color matches source
            })),
            ...(otherVolume > 0 ? [{
                source: otherIndex,
                target: usIndex,
                value: otherVolume,
                share: (otherVolume / totalVolume) * 100,
                fill: '#475569'
            }] : [])
        ];

        return { nodes, links, latestDate, totalVolume };
    }, [data]);

    if (isLoading) {
        return (
            <Card className="h-[400px] animate-pulse bg-white/5 border-white/10">
                <CardHeader><div className="h-6 w-1/2 bg-white/10 rounded" /></CardHeader>
                <CardContent><div className="h-full bg-white/5 rounded" /></CardContent>
            </Card>
        );
    }

    if (!sankeyData.nodes.length) {
        return (
            <Card className="h-[400px] bg-black/40 border-white/10">
                <CardContent className="flex items-center justify-center h-full text-muted-foreground">
                    No import data available
                </CardContent>
            </Card>
        );
    }

    // Calculate OPEC Exposure
    const opecExposure = sankeyData.links
        .filter(l => sankeyData.nodes[l.source as number].region === 'OPEC')
        .reduce((sum, l) => sum + l.share, 0);

    return (
        <Card className="bg-black/40 border-white/10 backdrop-blur-md overflow-hidden relative group">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-white/[0.02] border-b border-white/5">
                <div className="space-y-1">
                    <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Ship className="h-4 w-4 text-blue-500" />
                        Crude Oil Sourcing Flow
                    </CardTitle>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-muted-foreground">
                            {sankeyData.latestDate}
                        </span>
                        {opecExposure > 15 && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/10">
                                <AlertTriangle className="w-3 h-3" />
                                OPEC Exposure: {opecExposure.toFixed(1)}%
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[350px] p-0 relative">
                {/* Legend Overlay */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 pointer-events-none opacity-50">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-blue-500" /> North America
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> OPEC
                    </div>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <Sankey
                        data={sankeyData}
                        nodePadding={50}
                        margin={{ left: 20, right: 20, top: 40, bottom: 20 }}
                        link={{ stroke: 'none' }} // We control fill via payload but Sankey API is tricky, standard Recharts Sankey uses 'fill' for links? No, it uses stroke usually.
                    // Actually Recharts Sankey links are paths. We can color them by passing a custom link component or just mapping stroke.
                    // Let's try passing 'link={{ stroke: ... }}' with function if supported, or rely on index.
                    // Recharts Sankey data link objects can have 'fill' or 'stroke' properties?
                    // If not, we might need a custom Link component.
                    // For safety, let's use a semi-transparent blue default, but we really want colored links.
                    >
                        <defs>
                            <linearGradient id="linkGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) return null;
                                const isNode = payload[0].payload.sourceLinks; // Crude check if it's a node
                                if (isNode) {
                                    const node = payload[0].payload;
                                    return (
                                        <div className="bg-slate-950 border border-white/10 rounded-lg p-3 shadow-xl">
                                            <p className="text-sm font-bold text-white mb-1">{node.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Volume: <span className="text-white font-mono">{node.value.toFixed(1)} mbbl</span>
                                            </p>
                                        </div>
                                    );
                                }
                                const link = payload[0].payload;
                                return (
                                    <div className="bg-slate-950 border border-white/10 rounded-lg p-3 shadow-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: link.fill }} />
                                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                                                {link.source.name} → {link.target.name}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between gap-4 text-xs">
                                                <span className="text-muted-foreground">Volume:</span>
                                                <span className="font-mono text-white">{link.value.toFixed(1)} mbbl</span>
                                            </div>
                                            <div className="flex justify-between gap-4 text-xs">
                                                <span className="text-muted-foreground">Share:</span>
                                                <span className="font-mono text-emerald-400">{link.share.toFixed(1)}%</span>
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
