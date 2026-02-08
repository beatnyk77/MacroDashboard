import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OilImport } from '@/hooks/useOilData';
import { Ship, Info } from 'lucide-react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';

interface OilImportSankeyCardProps {
    data: OilImport[];
    isLoading: boolean;
}

export const OilImportSankeyCard: React.FC<OilImportSankeyCardProps> = ({ data, isLoading }) => {
    // Process data: Aggregate latest month's imports by exporter
    const sankeyData = useMemo(() => {
        if (!data.length) return { nodes: [], links: [] };

        // 1. Find latest date
        const dates = Array.from(new Set(data.map(d => d.as_of_date))).sort();
        const latestDate = dates[dates.length - 1];

        // 2. Filter for latest imports
        const latestImports = data.filter(d => d.as_of_date === latestDate);

        // 3. Aggregate small players into "Others"
        // Sort by volume
        latestImports.sort((a, b) => b.import_volume_mbbl - a.import_volume_mbbl);

        const TOP_N = 5;
        const topImports = latestImports.slice(0, TOP_N);
        const otherImports = latestImports.slice(TOP_N);
        const otherVolume = otherImports.reduce((sum, d) => sum + d.import_volume_mbbl, 0);

        // 4. Construct Nodes & Links
        // Nodes: 0..N-1 (Exporters), N (Others), N+1 (US)
        const nodes = [
            ...topImports.map(d => ({ name: d.exporter_country_code })),
            ...(otherVolume > 0 ? [{ name: 'Rest of World' }] : []),
            { name: 'United States' }
        ];

        const usIndex = nodes.length - 1;
        const otherIndex = otherVolume > 0 ? topImports.length : -1;

        const links = [
            ...topImports.map((d, i) => ({
                source: i,
                target: usIndex,
                value: d.import_volume_mbbl
            })),
            ...(otherVolume > 0 ? [{
                source: otherIndex,
                target: usIndex,
                value: otherVolume
            }] : [])
        ];

        return { nodes, links, latestDate };
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

    return (
        <Card className="bg-black/40 border-white/10 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Ship className="h-4 w-4 text-blue-400" />
                    Crude Oil Sourcing Flow
                </CardTitle>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">{sankeyData.latestDate}</span>
                    <Info className="h-3 w-3 text-muted-foreground/50" />
                </div>
            </CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <Sankey
                        data={sankeyData}
                        nodePadding={50}
                        margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                        link={{ stroke: '#3b82f6', strokeOpacity: 0.3 }}
                        node={{ fill: '#64748b', strokeWidth: 0 }}
                    >
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                            formatter={(value: number, name: string, props: any) => {
                                // Default Sankey tooltip might be tricky, custom formatting:
                                if (props.payload.source && props.payload.target) {
                                    return [`${value.toFixed(1)} mbbl`, `${props.payload.source.name} → ${props.payload.target.name}`];
                                }
                                return [value, name];
                            }}
                        />
                    </Sankey>
                </ResponsiveContainer>

                <div className="mt-4 text-center">
                    <span className="text-xs text-muted-foreground">
                        Top {Math.min(sankeyData.nodes.length - 2, 5)} origins account for
                        <span className="text-white font-mono ml-1">
                            {((sankeyData.links.reduce((sum, l) => l.source !== (sankeyData.nodes.length - 2) ? sum + l.value : sum, 0) /
                                sankeyData.links.reduce((sum, l) => sum + l.value, 0)) * 100).toFixed(1)}%
                        </span> of monthly volume
                    </span>
                </div>
            </CardContent>
        </Card>
    );
};
