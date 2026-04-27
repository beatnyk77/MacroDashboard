import React from 'react'
import {
    XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts'
import { formatTradeValue } from '../types/trade'
import type { TrendPoint } from '../types/trade'

interface ImportTrendChartProps {
    data: TrendPoint[]
    countryName?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-[#0f1117]/95 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-base font-black text-emerald-400 font-mono">
                {formatTradeValue(payload[0]?.value)}
            </p>
            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Export Value</p>
        </div>
    )
}

export const ImportTrendChart: React.FC<ImportTrendChartProps> = ({ data, countryName }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-xs text-white/20 font-bold uppercase tracking-widest">No trend data available</p>
            </div>
        )
    }

    const chartData = data.map(d => ({
        year: d.year.toString(),
        value: d.export_value_usd,
    }))

    const values = data.map(d => d.export_value_usd)
    const min = Math.min(...values) * 0.8
    const max = Math.max(...values) * 1.1
    const trend = values[values.length - 1] > values[0] ? 'up' : 'down'

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <div className="space-y-0.5">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
                        Export Trend {countryName ? `· ${countryName}` : ''}
                    </h4>
                    <p className="text-[10px] font-bold text-white/25">Annual, USD · UN Comtrade</p>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                    trend === 'up' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                }`}>
                    {trend === 'up' ? '↑ Growing' : '↓ Declining'}
                </span>
            </div>

            <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="tradeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis
                            dataKey="year"
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[min, max]}
                            tick={false}
                            axisLine={false}
                            tickLine={false}
                            width={0}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(16,185,129,0.3)', strokeWidth: 1 }} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="url(#tradeGradient)"
                            dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: '#10b981', stroke: 'rgba(16,185,129,0.4)', strokeWidth: 4 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
