import React from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { formatTradeValue } from '../types/trade'
import type { SupplierBreakdown } from '../types/trade'
import { isoToFlag } from '../types/trade'

interface SupplierShareChartProps {
    data: SupplierBreakdown[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const data = payload[0].payload
    return (
        <div className="bg-[#0f1117]/95 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl space-y-1">
            <div className="flex items-center gap-2">
                <span className="text-base">{data.flag}</span>
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-sm font-black text-white font-mono">
                {data.share.toFixed(1)}% Share
            </p>
            <p className="text-[10px] text-white/40 font-mono">
                {formatTradeValue(data.usd)}
            </p>
        </div>
    )
}

export const SupplierShareChart: React.FC<SupplierShareChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-xs text-white/20 font-bold uppercase tracking-widest">No supplier data available</p>
            </div>
        )
    }

    // Top 5 suppliers + "Others"
    const top5 = data.slice(0, 5)
    const others = data.slice(5)

    const othersUsd = others.reduce((acc, curr) => acc + (curr.export_value_usd || 0), 0)
    const othersShare = others.reduce((acc, curr) => acc + (curr.market_share_pct || 0), 0)

    const chartData = [
        ...top5.map(d => ({
            name: d.partner_iso3,
            fullName: d.partner_name,
            flag: isoToFlag(d.partner_iso3.substring(0, 2)), // Approximation for flag
            share: d.market_share_pct || 0,
            usd: d.export_value_usd || 0,
        })),
    ]

    if (others.length > 0) {
        chartData.push({
            name: 'Others',
            fullName: 'Other Suppliers',
            flag: '🌐',
            share: othersShare,
            usd: othersUsd,
        })
    }

    const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#334155']

    return (
        <div className="space-y-4">
            <div className="flex flex-col px-1">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
                    Supplier Competition
                </h4>
                <p className="text-[10px] font-bold text-white/25">Latest Year Market Share</p>
            </div>

            <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                        <XAxis
                            type="number"
                            hide
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}
                            axisLine={false}
                            tickLine={false}
                            width={50}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Bar
                            dataKey="share"
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                        >
                            {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
