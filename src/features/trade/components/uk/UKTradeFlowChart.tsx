import React, { useMemo } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { UKOTSFlow } from '../../hooks/useUKTradeFlows'
import { aggregateUKFlows } from '../../utils/aggregateUKFlows'

interface UKTradeFlowChartProps {
    flows: UKOTSFlow[]
}

function formatGbp(value: number): string {
    if (value >= 1_000_000_000) return `£${(value / 1_000_000_000).toFixed(1)}B`
    if (value >= 1_000_000) return `£${(value / 1_000_000).toFixed(0)}M`
    return `£${value.toLocaleString()}`
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="px-3 py-2 rounded-xl bg-slate-950/95 border border-indigo-500/20 backdrop-blur-xl shadow-lg">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-wider mb-1">{label}</p>
            {payload.map(p => (
                <p key={p.name} className="text-sm font-black text-white font-mono">
                    {p.name}: {formatGbp(p.value)}
                </p>
            ))}
        </div>
    )
}

export const UKTradeFlowChart: React.FC<UKTradeFlowChartProps> = ({ flows }) => {
    const chartData = useMemo(() => aggregateUKFlows(flows), [flows])

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-xs text-white/20 font-bold uppercase tracking-widest">No OTS flow data available</p>
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis
                    dataKey="month"
                    tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                />
                <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatGbp(v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }} />
                <Bar dataKey="Import" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Export" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}