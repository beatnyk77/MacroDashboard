import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Globe, AlertTriangle, Loader2, Zap } from 'lucide-react';
import { useTradeGravityData, SwingStateData } from '@/hooks/useTradeGravityData';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

interface TradeGravityCardProps {
    className?: string;
}

const PERIODS = ['2018', '2020', '2022', '2023'];

const BRICS_COLOR = '#f97316'; // orange
const G7_COLOR = '#3b82f6'; // blue

const buildChartData = (state: SwingStateData) =>
    PERIODS.map(p => ({
        year: p,
        'BRICS+': state.byPeriod[p]?.['BRICS+'] ?? 0,
        'G7': state.byPeriod[p]?.['G7'] ?? 0,
    }));

export const TradeGravityCard: React.FC<TradeGravityCardProps> = ({ className }) => {
    const { swingStates, loading, error } = useTradeGravityData();
    const [selected, setSelected] = useState<SwingStateData | null>(null);

    // Default to first state once loaded
    React.useEffect(() => {
        if (swingStates.length > 0 && !selected) setSelected(swingStates[0]);
    }, [swingStates, selected]);

    return (
        <Card className={cn("w-full bg-black/40 border-white/12 backdrop-blur-xl relative overflow-hidden", className)}>
            {/* Ambient glow */}
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[120px] bg-orange-500/10 pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-[120px] bg-blue-500/10 pointer-events-none" />

            <CardHeader className="relative z-10 pb-2">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-orange-400" />
                            <CardTitle className="text-xl font-medium tracking-tight text-white/90 font-mono uppercase">
                                BRICS+ vs. G7 Trade Gravity Shift
                            </CardTitle>
                        </div>
                        <CardDescription className="flex items-center gap-2 text-xs font-mono uppercase text-muted-foreground">
                            <Zap className="w-3.5 h-3.5 text-orange-400" />
                            <span>Swing-State Trade Allegiance · All Goods · 2018–2023</span>
                        </CardDescription>
                    </div>
                    {/* Bloc Legend */}
                    <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-orange-500/80 inline-block" />
                            <span className="text-orange-300">BRICS+</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-blue-500/80 inline-block" />
                            <span className="text-blue-300">G7+Allies</span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 pt-4">
                {loading ? (
                    <div className="h-[500px] flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-400/50" />
                    </div>
                ) : error ? (
                    <div className="h-[500px] flex items-center justify-center text-red-400/80">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* LEFT: World Map */}
                        <div className="flex flex-col gap-4">
                            <div className="rounded-xl overflow-hidden border border-white/12 h-[300px] bg-[#0a0a1a]">
                                <MapContainer
                                    center={[20, 20]}
                                    zoom={2}
                                    scrollWheelZoom={false}
                                    style={{ height: '100%', width: '100%', background: '#0a0a1a' }}
                                    zoomControl={false}
                                    attributionControl={false}
                                >
                                    <TileLayer
                                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                    />
                                    {swingStates.map(state => (
                                        <CircleMarker
                                            key={state.code}
                                            center={[state.lat, state.lng]}
                                            radius={selected?.code === state.code ? 18 : 12}
                                            pathOptions={{
                                                color: state.hasShifted ? BRICS_COLOR : G7_COLOR,
                                                fillColor: state.hasShifted ? BRICS_COLOR : G7_COLOR,
                                                fillOpacity: selected?.code === state.code ? 0.9 : 0.5,
                                                weight: selected?.code === state.code ? 3 : 1,
                                            }}
                                            eventHandlers={{ click: () => setSelected(state) }}
                                        >
                                            <Tooltip direction="top" permanent={false} offset={[0, -8]}>
                                                <div className="bg-black/90 text-white font-mono text-xs px-2 py-1 rounded">
                                                    <strong>{state.name}</strong><br />
                                                    BRICS+: {state.currentBricsShare.toFixed(1)}%<br />
                                                    G7: {state.currentG7Share.toFixed(1)}%<br />
                                                    {state.hasShifted && '⚡ Gravity Shifted'}
                                                </div>
                                            </Tooltip>
                                        </CircleMarker>
                                    ))}
                                </MapContainer>
                            </div>

                            {/* Tug-of-War Progress Bars */}
                            <div className="space-y-2">
                                {swingStates.map(state => {
                                    const total = state.currentBricsShare + state.currentG7Share;
                                    const bricsW = total > 0 ? (state.currentBricsShare / total) * 100 : 50;
                                    return (
                                        <button
                                            key={state.code}
                                            onClick={() => setSelected(state)}
                                            className={cn(
                                                "w-full text-left rounded-lg p-3 border transition-all duration-200",
                                                selected?.code === state.code
                                                    ? "border-white/20 bg-white/5"
                                                    : "border-white/5 bg-black/20 hover:border-white/12"
                                            )}
                                        >
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-xs font-mono font-semibold text-white/80">{state.name}</span>
                                                {state.hasShifted && (
                                                    <span className="text-xs font-mono font-bold text-orange-300 bg-orange-500/15 border border-orange-500/20 px-1.5 py-0.5 rounded-full animate-pulse">
                                                        ⚡ GRAVITY SHIFTED
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative h-4 rounded-full bg-black/40 overflow-hidden flex">
                                                <div
                                                    className="h-full transition-all duration-700 rounded-l-full"
                                                    style={{
                                                        width: `${bricsW}%`,
                                                        background: `linear-gradient(90deg, ${BRICS_COLOR}cc, ${BRICS_COLOR})`
                                                    }}
                                                />
                                                <div
                                                    className="h-full transition-all duration-700 rounded-r-full"
                                                    style={{
                                                        width: `${100 - bricsW}%`,
                                                        background: `linear-gradient(90deg, ${G7_COLOR}, ${G7_COLOR}cc)`
                                                    }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs font-mono text-muted-foreground mt-1">
                                                <span className="text-orange-300">{state.currentBricsShare.toFixed(1)}% BRICS+</span>
                                                <span className="text-blue-300">{state.currentG7Share.toFixed(1)}% G7</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RIGHT: Trend Area Chart for selected state */}
                        <div className="flex flex-col gap-4">
                            {selected && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-mono font-semibold text-white/80 uppercase tracking-wider">
                                            {selected.name} — Trade Gravity Trend
                                        </h3>
                                        {selected.hasShifted && (
                                            <span className="text-xs font-mono font-bold text-orange-200 bg-orange-500/15 border border-orange-500/25 px-2 py-0.5 rounded-full">
                                                ⚡ BRICS+ Dominant in 2023
                                            </span>
                                        )}
                                    </div>

                                    <div className="h-[280px] bg-black/20 rounded-xl border border-white/5 p-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={buildChartData(selected)} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                                                <defs>
                                                    <linearGradient id="gradBrics" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={BRICS_COLOR} stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor={BRICS_COLOR} stopOpacity={0.02} />
                                                    </linearGradient>
                                                    <linearGradient id="gradG7" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={G7_COLOR} stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor={G7_COLOR} stopOpacity={0.02} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="year" tick={{ fill: '#888', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                                                <YAxis tickFormatter={v => `${v}%`} tick={{ fill: '#888', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                                                <RechartTooltip
                                                    formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]}
                                                    contentStyle={{
                                                        background: 'rgba(0,0,0,0.85)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: '8px',
                                                        fontFamily: 'monospace',
                                                        fontSize: '11px'
                                                    }}
                                                />
                                                <Legend
                                                    wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px', color: '#aaa' }}
                                                />
                                                <Area type="monotone" dataKey="BRICS+" stroke={BRICS_COLOR} strokeWidth={2} fill="url(#gradBrics)" dot={{ fill: BRICS_COLOR, r: 3 }} />
                                                <Area type="monotone" dataKey="G7" stroke={G7_COLOR} strokeWidth={2} fill="url(#gradG7)" dot={{ fill: G7_COLOR, r: 3 }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Insight Card */}
                                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-xs font-mono text-muted-foreground">
                                        <span className="text-white/60 font-semibold">Intelligence:</span>{' '}
                                        {selected.hasShifted
                                            ? `${selected.name}'s trade gravity has crossed into BRICS+ territory (${selected.currentBricsShare.toFixed(1)}% vs ${selected.currentG7Share.toFixed(1)}% for G7). This signals potential de-dollarization of bilateral settlement.`
                                            : `${selected.name} remains G7-leaning (${selected.currentG7Share.toFixed(1)}%), but BRICS+ share is growing at ${selected.currentBricsShare.toFixed(1)}%.`
                                        }
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
