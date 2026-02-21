import React, { useState } from 'react';
import { ResponsiveSankey } from '@nivo/sankey';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, AlertTriangle, ArrowRightLeft, Loader2, Info, ShieldAlert } from 'lucide-react';
import { useComtradeData } from '@/hooks/useComtradeData';
import { cn } from '@/lib/utils';

interface CriticalChokepointsCardProps {
    className?: string;
}

export const CriticalChokepointsCard: React.FC<CriticalChokepointsCardProps> = ({ className }) => {
    const [selectedCategory, setSelectedCategory] = useState<'Semiconductors' | 'Energy' | 'Rare Earths'>('Semiconductors');

    // For MVP, we only implemented Semiconductors (HS 8542)
    const hsCode = selectedCategory === 'Semiconductors' ? '8542' :
        selectedCategory === 'Energy' ? '2709' : '280530';

    const { data, loading, error, lastUpdated } = useComtradeData(selectedCategory, hsCode);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Live';
        if (dateString.length === 4) return dateString; // Annual
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
        } catch {
            return dateString;
        }
    };

    return (
        <Card className={cn("w-full bg-black/40 border-white/10 backdrop-blur-xl relative overflow-hidden group", className)}>
            {/* Ambient Background Glow based on category */}
            <div className={cn(
                "absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[120px] transition-colors duration-1000",
                selectedCategory === 'Semiconductors' ? 'bg-cyan-500/10' :
                    selectedCategory === 'Energy' ? 'bg-orange-500/10' : 'bg-fuchsia-500/10'
            )} />

            <CardHeader className="relative z-10 pb-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-xl font-medium tracking-tight text-white/90 font-mono uppercase">
                                Global Critical Chokepoints
                            </CardTitle>
                            <span title="Bilateral trade flows mapping supply chain dependencies for strategically critical physical assets. Data sourced from UN Comtrade API.">
                                <Info className="w-4 h-4 text-muted-foreground/50 cursor-help" />
                            </span>
                        </div>
                        <CardDescription className="flex items-center gap-2 text-xs font-mono uppercase text-muted-foreground">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                            <span>Physical Supply Chain Routing • {formatDate(lastUpdated || undefined)}</span>
                        </CardDescription>
                    </div>

                    {/* Category Selection Toggles */}
                    <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/5">
                        {(['Semiconductors', 'Energy', 'Rare Earths'] as const).map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                disabled={category !== 'Semiconductors'} // Disable others for MVP
                                className={cn(
                                    "px-3 py-1.5 text-xs font-mono uppercase rounded-md transition-all duration-300",
                                    selectedCategory === category
                                        ? "bg-white/10 text-white shadow-sm ring-1 ring-white/20"
                                        : "text-muted-foreground hover:text-white/70 hover:bg-white/5",
                                    category !== 'Semiconductors' && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 pt-6">

                {/* Alert Banner */}
                <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-medium text-red-200">Dependency Alert</h4>
                        <p className="text-xs text-red-300/80 mt-1">
                            {selectedCategory === 'Semiconductors'
                                ? "High concentration risk observed in advanced semiconductor exports originating from Taiwan (HS 8542)."
                                : "Data analysis in progress for this highly strategic vector."}
                        </p>
                    </div>
                </div>

                {/* Main Visualization Container */}
                <div className="h-[400px] w-full bg-black/20 rounded-xl border border-white/5 relative flex items-center justify-center">

                    {loading ? (
                        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500/50" />
                            <span className="text-xs font-mono uppercase tracking-widest">Intercepting Trade Vectors...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center gap-2 text-red-400/80">
                            <AlertTriangle className="w-8 h-8" />
                            <span className="text-xs font-mono uppercase text-center max-w-[250px]">
                                Strategic Data Uplink Failed<br />{error.message}
                            </span>
                        </div>
                    ) : !data || data.links.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <Info className="w-8 h-8 opacity-50" />
                            <span className="text-xs font-mono uppercase text-center">
                                Insufficient Trade Data for {selectedCategory}
                            </span>
                        </div>
                    ) : (
                        <ResponsiveSankey
                            data={data}
                            margin={{ top: 20, right: 120, bottom: 20, left: 120 }}
                            align="justify"
                            colors={{ scheme: 'category10' }}
                            nodeOpacity={0.85}
                            nodeHoverOthersOpacity={0.1}
                            nodeThickness={18}
                            nodeSpacing={24}
                            nodeBorderWidth={0}
                            nodeBorderColor={{
                                from: 'color',
                                modifiers: [['darker', 0.8]]
                            }}
                            nodeBorderRadius={3}
                            linkOpacity={0.3}
                            linkHoverOthersOpacity={0.05}
                            linkContract={3}
                            enableLinkGradient={true}
                            labelPosition="outside"
                            labelOrientation="horizontal"
                            labelPadding={16}
                            labelTextColor={{ from: 'color', modifiers: [['brighter', 1.5]] }}
                            theme={{
                                text: { fill: '#888', fontSize: 11, fontFamily: 'monospace' },
                                tooltip: {
                                    container: {
                                        background: 'rgba(0, 0, 0, 0.8)',
                                        color: '#fff',
                                        fontSize: '12px',
                                        borderRadius: '4px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }
                                }
                            }}
                            valueFormat={(value) => `$${value} Billion`}
                        />
                    )}

                </div>

                {/* Footer Legend / Insights */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-mono text-muted-foreground uppercase">Key Node</span>
                        </div>
                        <div className="text-sm font-medium text-white/90">Taiwan (TSMC)</div>
                        <div className="text-xs text-white/50 mt-1">Primary source of sub-5nm logic chips globally.</div>
                    </div>

                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-4 h-4 text-orange-400" />
                            <span className="text-xs font-mono text-muted-foreground uppercase">Strategic Flow</span>
                        </div>
                        <div className="text-sm font-medium text-white/90">China → World</div>
                        <div className="text-xs text-white/50 mt-1">Dominant exporter of legacy/trailing-node chips.</div>
                    </div>

                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldAlert className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-mono text-muted-foreground uppercase">Vulnerability</span>
                        </div>
                        <div className="text-sm font-medium text-white/90">ASML Monopoly</div>
                        <div className="text-xs text-white/50 mt-1">Netherlands acts as sole provider of EUV lithography.</div>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
};
