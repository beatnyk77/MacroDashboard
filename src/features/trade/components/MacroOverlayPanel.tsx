import React from 'react'
import { Activity, TrendingUp, DollarSign, ActivitySquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MacroOverlayPanelProps {
    metrics: { metric_key: string; value: number | null; as_of: string | null }[]
    loading?: boolean
}

const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400",
    amber: "bg-amber-500/10 text-amber-400",
    purple: "bg-purple-500/10 text-purple-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
}

const MetricItem = ({ label, value, unit, icon: Icon, color, isInverse = false }: any) => {
    if (value === null) return null
    
    const isPositive = isInverse ? value < 0 : value > 0
    const isNeutral = value === 0
    
    let valColor = "text-white/60"
    if (!isNeutral) {
        valColor = isPositive ? "text-emerald-400" : "text-rose-400"
    }

    const colorClass = colorMap[color] || colorMap.blue;
    const bgClass = colorClass.split(' ')[0];
    const textClass = colorClass.split(' ')[1];

    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-md", bgClass)}>
                    <Icon className={cn("w-3.5 h-3.5", textClass)} />
                </div>
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{label}</span>
            </div>
            <div className="flex items-center gap-1">
                <span className={cn("text-sm font-black font-mono", valColor)}>
                    {value > 0 && !isInverse && label !== 'PMI' ? '+' : ''}{value.toFixed(1)}
                </span>
                <span className="text-[10px] font-bold text-white/20">{unit}</span>
            </div>
        </div>
    )
}

export const MacroOverlayPanel: React.FC<MacroOverlayPanelProps> = ({ metrics, loading }) => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-48 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                <Activity className="w-5 h-5 text-blue-500 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Loading Macro Context...</p>
            </div>
        )
    }

    if (!metrics || metrics.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 rounded-3xl bg-white/[0.02] border border-white/5 space-y-2">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/20">No Macro Data</p>
                <p className="text-[10px] text-white/10">Macro context is not available for this market.</p>
            </div>
        )
    }

    const getMetric = (key: string) => metrics.find(m => m.metric_key === key)?.value ?? null

    const gdp = getMetric('gdp_yoy_pct')
    const cpi = getMetric('cpi_yoy_pct')
    const fx = getMetric('fx_volatility_pct')
    const pmi = getMetric('manufacturing_pmi')

    return (
        <div className="space-y-4">
            <div className="space-y-0.5 px-1">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
                    Macro Environment
                </h4>
                <p className="text-[10px] font-bold text-white/25">Economic Context Overlay</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
                <MetricItem label="GDP Growth" value={gdp} unit="%" icon={TrendingUp} color="blue" />
                <MetricItem label="Inflation" value={cpi} unit="%" icon={ActivitySquare} color="amber" isInverse={true} />
                <MetricItem label="FX Volatility" value={fx} unit="%" icon={DollarSign} color="purple" isInverse={true} />
                <MetricItem label="Mfg PMI" value={pmi} unit="pt" icon={Activity} color="emerald" />
            </div>
        </div>
    )
}
