import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Eye, ArrowRightLeft, Loader2, ShieldAlert } from 'lucide-react';
import { useShadowTradeData } from '@/hooks/useShadowTradeData';
import { cn } from '@/lib/utils';

interface ShadowTradeCardProps {
    className?: string;
}

const ORIGINS = ['USA', 'Germany', 'United Kingdom', 'Japan'];
const DESTINATIONS = ['United Arab Emirates', 'Turkey', 'Kazakhstan', 'India', 'Serbia'];

const getSpikeColor = (ratio: number): string => {
    if (ratio >= 7) return 'bg-red-500/80 text-red-100';
    if (ratio >= 4) return 'bg-orange-500/70 text-orange-100';
    if (ratio >= 2) return 'bg-yellow-500/60 text-yellow-100';
    return 'bg-white/5 text-white/40';
};

const getSpikeLabel = (ratio: number): string => {
    if (ratio >= 7) return 'CRITICAL';
    if (ratio >= 4) return 'HIGH';
    if (ratio >= 2) return 'ELEVATED';
    return 'NORMAL';
};

const formatUSD = (val: number) =>
    val >= 1e9
        ? `$${(val / 1e9).toFixed(1)}B`
        : val >= 1e6
            ? `$${(val / 1e6).toFixed(0)}M`
            : `$${val.toLocaleString()}`;

export const ShadowTradeCard: React.FC<ShadowTradeCardProps> = ({ className }) => {
    const [hoveredCell, setHoveredCell] = useState<string | null>(null);
    const { data, loading, error } = useShadowTradeData('Semiconductors (HS 8542)');

    // Build a lookup map: `${originName}-${destName}` => anomaly row
    const lookup = new Map(
        data.map(d => [`${d.origin_name}-${d.destination_name}`, d])
    );

    return (
        <Card className={cn("w-full bg-black/40 border-white/12 backdrop-blur-xl relative overflow-hidden", className)}>
            {/* Ambient glow */}
            <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] bg-red-500/10 pointer-events-none" />

            <CardHeader className="relative z-10 pb-2">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-red-400" />
                            <CardTitle className="text-xl font-medium tracking-heading text-white/90 font-mono uppercase">
                                Shadow Trade &amp; Sanctions Evasion Monitor
                            </CardTitle>
                        </div>
                        <CardDescription className="flex items-center gap-2 text-xs font-mono uppercase text-muted-foreground">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-red-400" />
                            <span>Export Anomaly Heatmap · HS 8542 Semiconductors · Baseline: 2019–2021 Avg</span>
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-black/40 border border-white/5 rounded-lg px-3 py-2">
                        <Eye className="w-3.5 h-3.5 text-red-400" />
                        <span>Live Surveillance Feed</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 pt-6">
                {/* Alert Banner */}
                <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300/80">
                        <strong className="text-red-200">Intelligence Note:</strong> The following matrix tracks export spikes from major chip-producing nations (USA, Germany) to known intermediary states used to circumvent technology export controls post-2022.
                    </p>
                </div>

                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-red-500/50" />
                    </div>
                ) : error ? (
                    <div className="h-64 flex items-center justify-center text-red-400/80">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                ) : (
                    <>
                        {/* Heatmap Grid */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="text-left text-xs font-mono text-muted-foreground/60 uppercase px-3 py-2 w-32">
                                            Origin ↓ / Dest →
                                        </th>
                                        {DESTINATIONS.map(dest => (
                                            <th key={dest} className="text-center text-xs font-mono text-muted-foreground uppercase px-4 py-2">
                                                {dest}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {ORIGINS.map(origin => (
                                        <tr key={origin} className="border-t border-white/5">
                                            <td className="text-xs font-mono text-white/80 font-semibold px-3 py-4 uppercase tracking-uppercase">
                                                {origin}
                                            </td>
                                            {DESTINATIONS.map(dest => {
                                                const cellKey = `${origin}-${dest}`;
                                                const row = lookup.get(cellKey);
                                                const ratio = row?.spike_ratio ?? 1;
                                                const isHovered = hoveredCell === cellKey;

                                                return (
                                                    <td
                                                        key={dest}
                                                        className="px-2 py-2"
                                                        onMouseEnter={() => setHoveredCell(cellKey)}
                                                        onMouseLeave={() => setHoveredCell(null)}
                                                    >
                                                        <div className={cn(
                                                            "relative rounded-lg p-3 text-center cursor-default transition-all duration-300",
                                                            getSpikeColor(ratio),
                                                            isHovered ? 'ring-2 ring-white/30 scale-105' : ''
                                                        )}>
                                                            <div className="text-2xl font-black font-mono tabular-nums">
                                                                {ratio.toFixed(1)}×
                                                            </div>
                                                            <div className="text-xs font-bold uppercase tracking-uppercase mt-1 opacity-80">
                                                                {getSpikeLabel(ratio)}
                                                            </div>

                                                            {/* Tooltip on hover */}
                                                            {isHovered && row && (
                                                                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-black/95 border border-white/12 rounded-xl p-3 text-left shadow-2xl pointer-events-none">
                                                                    <div className="text-xs font-bold text-white/90 mb-2 font-mono">
                                                                        {origin} → {dest}
                                                                    </div>
                                                                    <div className="space-y-1 text-xs font-mono">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Baseline ({row.baseline_period})</span>
                                                                            <span className="text-white">{formatUSD(row.baseline_usd)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-muted-foreground">Current ({row.current_period})</span>
                                                                            <span className="text-red-300">{formatUSD(row.current_usd)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between border-t border-white/12 pt-1 mt-1">
                                                                            <span className="text-muted-foreground">Spike Ratio</span>
                                                                            <span className="text-red-200 font-bold">{ratio.toFixed(2)}×</span>
                                                                        </div>
                                                                    </div>
                                                                    {row.metadata?.note && (
                                                                        <p className="text-xs text-muted-foreground/60 italic mt-2 border-t border-white/5 pt-2">
                                                                            {row.metadata.note}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Legend */}
                        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground">
                            <span className="text-white/50 uppercase tracking-uppercase">Spike Intensity:</span>
                            {[
                                { label: 'Normal (<2×)', color: 'bg-white/10' },
                                { label: 'Elevated (2–4×)', color: 'bg-yellow-500/60' },
                                { label: 'High (4–7×)', color: 'bg-orange-500/70' },
                                { label: 'Critical (>7×)', color: 'bg-red-500/80' },
                            ].map(({ label, color }) => (
                                <div key={label} className="flex items-center gap-1.5">
                                    <span className={cn("inline-block w-3 h-3 rounded-sm", color)} />
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};
