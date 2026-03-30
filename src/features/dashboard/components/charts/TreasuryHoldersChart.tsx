import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { formatCurrency, formatPercentage } from '@/utils/formatNumber';
import { cn } from '@/lib/utils';
import { TreasuryHolder } from '@/hooks/useTreasuryHolders';

interface TreasuryHoldersChartProps {
    data: TreasuryHolder[];
    height?: number;
    className?: string;
}

const COUNTRY_FLAGS: Record<string, string> = {
    'Japan': '🇯🇵',
    'United Kingdom': '🇬🇧',
    'China, Mainland': '🇨🇳',
    'Belgium': '🇧🇪',
    'Luxembourg': '🇱🇺',
    'Canada': '🇨🇦',
    'Cayman Islands': '🇰🇾',
    'Switzerland': '🇨🇭',
    'Ireland': '🇮🇪',
    'Taiwan': '🇹🇼',
    'India': '🇮🇳',
    'Hong Kong': '🇭🇰',
    'Singapore': '🇸🇬',
    'Brazil': '🇧🇷',
    'Norway': '🇳🇴',
    'France': '🇫🇷',
    'Germany': '🇩🇪',
    'Israel': '🇮🇱',
    'Others': '🌐'
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-950/90 backdrop-blur-md border border-white/12 p-3 rounded-xl shadow-2xl min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{COUNTRY_FLAGS[data.country_name] || '🌐'}</span>
                    <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                        {data.country_name}
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between items-end gap-4">
                        <span className="text-xs font-bold text-muted-foreground/70 uppercase">Holdings</span>
                        <span className="text-lg font-black text-white tabular-nums">
                            {formatCurrency(data.holdings_usd_bn, { decimals: 1 })}B
                        </span>
                    </div>
                    <div className="flex justify-between items-end gap-4">
                        <span className="text-xs font-bold text-muted-foreground/70 uppercase">Share</span>
                        <span className="text-sm font-bold text-yellow-400 tabular-nums">
                            {formatPercentage(data.pct_of_total_foreign, { decimals: 1 })}
                        </span>
                    </div>
                    <div className="flex justify-between items-end gap-4">
                        <span className="text-xs font-bold text-muted-foreground/70 uppercase">MoM Change</span>
                        <span className={cn(
                            "text-xs font-bold tabular-nums",
                            (data.mom_pct_change || 0) > 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                            {formatPercentage(data.mom_pct_change, { showSign: true, decimals: 1 })}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export const TreasuryHoldersChart: React.FC<TreasuryHoldersChartProps> = ({ data, height = 500, className }) => {
    // Determine max value for domain to add some headroom
    const maxVal = Math.max(...data.map(d => d.holdings_usd_bn || 0));

    return (
        <div className={cn("w-full bg-slate-950/30 rounded-xl border border-white/5 p-4", className)} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        type="number"
                        hide
                        domain={[0, maxVal * 1.1]}
                    />
                    <YAxis
                        dataKey="country_name"
                        type="category"
                        width={100}
                        tick={({ x, y, payload }) => (
                            <g transform={`translate(${x},${y})`}>
                                <text x={-10} y={0} dy={4} textAnchor="end" fill="rgba(255,255,255,0.5)" fontSize={10} fontWeight={600}>
                                    {payload.value.length > 15 ? `${payload.value.substring(0, 15)}...` : payload.value}
                                </text>
                            </g>
                        )}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    />
                    <Bar
                        dataKey="holdings_usd_bn"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                        animationDuration={1500}
                    >
                        {data.map((_, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={index < 3 ? '#fbbf24' : 'rgba(251, 191, 36, 0.6)'} // Top 3 brighter gold
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
