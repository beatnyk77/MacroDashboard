import React from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ReferenceLine
} from 'recharts';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

import { CommodityHistoryPoint } from '@/hooks/useCommodities';

interface CommodityHistoryCardProps {
    title: string;
    category: string;
    price: number;
    unit: string;
    history: CommodityHistoryPoint[];
    color: 'red' | 'orange' | 'slate';
    delta?: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-3 rounded-2xl shadow-2xl">
                <div className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">{label}</div>
                <div className="text-sm font-black text-white tabular-nums">
                    ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
            </div>
        );
    }
    return null;
};

export const CommodityHistoryCard: React.FC<CommodityHistoryCardProps> = ({
    title,
    category,
    price,
    unit,
    history,
    color,
    delta = 0
}) => {
    const gradId = `grad-${title.replace(/\s+/g, '')}`;

    // Calculate 25y min/max
    const values = history.map(h => h.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    const colorMap = {
        red: { stroke: '#ef4444', fill: '#ef4444', shadow: 'rgba(239, 68, 68, 0.4)' },
        orange: { stroke: '#f97316', fill: '#f97316', shadow: 'rgba(249, 115, 22, 0.4)' },
        slate: { stroke: '#94a3b8', fill: '#94a3b8', shadow: 'rgba(148, 163, 184, 0.4)' }
    };

    const isPositive = delta > 0;
    const TrendIcon = delta === 0 ? Minus : (isPositive ? TrendingUp : TrendingDown);

    return (
        <div className="group relative bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-700 rounded-[2.5rem] p-8 border border-white/5 overflow-hidden flex flex-col h-full">
            {/* Ambient Background */}
            <div className={cn(
                "absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-10 transition-opacity group-hover:opacity-20",
                color === 'red' ? 'bg-red-500' : color === 'orange' ? 'bg-orange-500' : 'bg-slate-400'
            )} />

            <div className="relative z-10 space-y-6 flex-grow">
                {/* Header Row */}
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "w-1.5 h-1.5 rounded-full animate-pulse",
                                color === 'red' ? 'bg-red-500' : color === 'orange' ? 'bg-orange-500' : 'bg-slate-400'
                            )} />
                            <span className="text-xs font-black text-muted-foreground/50 uppercase tracking-[0.2em]">
                                {category}
                            </span>
                        </div>
                        <h3 className="text-xl font-black text-white tracking-tight uppercase italic underline decoration-white/5 underline-offset-8">
                            {title}
                        </h3>
                    </div>

                    {delta !== undefined && (
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-black border tabular-nums",
                            delta > 0 ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" : "text-rose-400 border-rose-500/20 bg-rose-500/5"
                        )}>
                            <TrendIcon size={12} />
                            {Math.abs(delta).toFixed(2)}%
                        </div>
                    )}
                </div>

                {/* Price Display */}
                <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-md">
                            ${price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[0.65rem] font-bold text-white/30 uppercase tracking-widest">{unit}</span>
                    </div>
                </div>

                {/* 25Y History Chart */}
                <div className="h-[180px] w-full mt-4 -mx-2 relative transition-transform duration-700 group-hover:scale-[1.02]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={colorMap[color].fill} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={colorMap[color].fill} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" hide />
                            <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={colorMap[color].stroke}
                                fill={`url(#${gradId})`}
                                strokeWidth={3}
                                animationDuration={2500}
                                isAnimationActive={true}
                            />
                            <ReferenceLine
                                y={price}
                                stroke={`${colorMap[color].stroke}80`}
                                strokeDasharray="3 3"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Range Stats */}
            <div className="relative z-10 mt-6 pt-6 border-t border-white/5 flex justify-between items-end">
                <div className="space-y-1">
                    <span className="text-[0.55rem] font-bold text-muted-foreground/30 uppercase tracking-widest">25Y Min-Max Band</span>
                    <div className="flex items-center gap-4 text-[0.65rem] font-bold text-white/50 tabular-nums">
                        <span>Low: <span className="text-white">${minVal.toFixed(1)}</span></span>
                        <div className="w-[1px] h-3 bg-white/10" />
                        <span>High: <span className="text-white">${maxVal.toFixed(1)}</span></span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-black text-white/20 uppercase tracking-[0.2em]">Institutional Telemetry</div>
                    <div className="text-xs font-bold text-white/10 uppercase tracking-tighter">Source: NYMEX / COMEX</div>
                </div>
            </div>
        </div>
    );
};
