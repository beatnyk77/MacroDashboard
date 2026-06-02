import React, { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { scaleThreshold } from 'd3-scale'
import { useImportOrigins, type ImportOriginEntry } from '../hooks/useImportOrigins'
import { formatTradeValue } from '../types/trade'
import { Loader2, MapPin } from 'lucide-react'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// ISO-3 numeric → Alpha-3 mapping for react-simple-maps (geo.id is numeric)
// We match our Alpha-3 (from the backend) against geo.properties.ISO_A3 first.
// Fallback: geo.id (numeric string) → ISO_A3 from properties.

interface ImportOriginMapProps {
    reporterIso3: string
    reporterName?: string
}

function formatPct(n: number) {
    return `${n.toFixed(1)}%`
}

export const ImportOriginMap: React.FC<ImportOriginMapProps> = ({ reporterIso3, reporterName }) => {
    const { data: origins = [], isLoading } = useImportOrigins(reporterIso3)
    const [hovered, setHovered] = useState<ImportOriginEntry | null>(null)

    const maxVal = useMemo(() => {
        if (!origins.length) return 1
        return Math.max(...origins.map(o => o.total_import_usd), 1)
    }, [origins])

    // Cyan-teal scale matching the platform's choropleth aesthetic
    const colorScale = useMemo(() => {
        return scaleThreshold<number, string>()
            .domain([
                maxVal * 0.02,
                maxVal * 0.07,
                maxVal * 0.18,
                maxVal * 0.40,
            ])
            .range(['#0c2333', '#0e7490', '#06b6d4', '#22d3ee', '#67e8f9'])
    }, [maxVal])

    const originMap = useMemo(() => {
        const m = new Map<string, ImportOriginEntry>()
        for (const o of origins) {
            m.set(o.partner_iso3, o)
        }
        return m
    }, [origins])

    const top5 = useMemo(() => origins.slice(0, 5), [origins])
    const hasData = origins.length > 0

    return (
        <div className="w-full space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                        Import Origin Map — {reporterName ?? reporterIso3}
                    </span>
                </div>
                {isLoading && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />}
            </div>

            {/* Map */}
            <div className="relative rounded-2xl overflow-hidden bg-[#050a12] border border-white/5" style={{ height: 220 }}>
                {!hasData && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest text-center px-4">
                            Import origin data will populate<br />after the next ingestion cycle
                        </p>
                    </div>
                )}
                <ComposableMap
                    projectionConfig={{ rotate: [-10, 0, 0], scale: 140 }}
                    className="w-full h-full"
                    style={{ opacity: hasData ? 1 : 0.3 }}
                >
                    <Geographies geography={GEO_URL}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const iso3 = geo.properties.ISO_A3 as string
                                const entry = originMap.get(iso3)
                                const isHovered = hovered?.partner_iso3 === iso3

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onMouseEnter={() => entry && setHovered(entry)}
                                        onMouseLeave={() => setHovered(null)}
                                        fill={entry ? colorScale(entry.total_import_usd) : '#0f172a'}
                                        stroke={isHovered ? '#ffffff' : entry ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.04)'}
                                        strokeWidth={isHovered ? 1.5 : entry ? 0.8 : 0.3}
                                        style={{
                                            default: { outline: 'none', transition: 'all 150ms' },
                                            hover: { outline: 'none', fill: entry ? '#0891b2' : '#1e293b', cursor: entry ? 'pointer' : 'default' },
                                            pressed: { outline: 'none' },
                                        }}
                                    />
                                )
                            })
                        }
                    </Geographies>
                </ComposableMap>

                {/* Hover tooltip */}
                {hovered && (
                    <div className="absolute bottom-3 left-3 p-3 rounded-xl bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.2)] z-50 min-w-[200px] animate-in fade-in duration-150">
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.15em]">{hovered.partner_name ?? hovered.partner_iso3}</p>
                        <p className="text-base font-black text-white tabular-nums mt-1">{formatTradeValue(hovered.total_import_usd)}</p>
                        <p className="text-[10px] font-bold text-cyan-400 tabular-nums">{formatPct(hovered.market_share_pct)} of imports</p>
                    </div>
                )}

                {/* Color legend */}
                {hasData && (
                    <div className="absolute top-2 right-2 flex gap-0.5 items-center">
                        {['#0c2333', '#0e7490', '#06b6d4', '#22d3ee', '#67e8f9'].map((c, i) => (
                            <div
                                key={i}
                                className="w-4 h-2 rounded-sm opacity-80"
                                style={{ background: c }}
                            />
                        ))}
                        <span className="ml-1 text-[8px] font-black text-white/30 uppercase tracking-wider">Share</span>
                    </div>
                )}
            </div>

            {/* Top 5 partners table */}
            {top5.length > 0 && (
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.2em] mb-2">Top Import Origins</p>
                    {top5.map((o, i) => (
                        <div
                            key={o.partner_iso3}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                        >
                            <span className="text-[10px] font-black text-white/20 w-4 text-right shrink-0">#{i + 1}</span>
                            <span className="text-[10px] font-black text-white/60 flex-1 truncate">
                                {o.partner_name ?? o.partner_iso3}
                            </span>
                            <span className="text-[10px] font-mono font-black text-white/70 shrink-0">
                                {formatTradeValue(o.total_import_usd)}
                            </span>
                            <div className="w-16 bg-white/5 rounded-full h-1 shrink-0">
                                <div
                                    className="h-full rounded-full bg-cyan-500/70"
                                    style={{ width: `${Math.min(100, (o.total_import_usd / (top5[0]?.total_import_usd ?? 1)) * 100)}%` }}
                                />
                            </div>
                            <span className="text-[9px] font-bold text-cyan-400/70 w-10 text-right shrink-0">
                                {formatPct(o.market_share_pct)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
