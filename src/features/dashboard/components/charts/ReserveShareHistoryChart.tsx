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

interface ReserveShareHistoryChartProps {
    title: string;
    data: any[];
    currentValue: number;
    color: string;
    years?: number;
    description?: string;
    isDeclining?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl">
                <div className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">{label}</div>
                <div className="text-sm font-black text-white tabular-nums">
                    {payload[0].value.toFixed(1)}%
                </div>
            </div>
        );
    }
    return null;
};

export const ReserveShareHistoryChart: React.FC<ReserveShareHistoryChartProps> = ({
    title,
    data,
    currentValue,
    color,
    years = 25,
    description,
    isDeclining = false
}) => {
    const gradId = `grad-${title.replace(/\s+/g, '')}`;

    return (
        <div className="group relative bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 rounded-[2rem] p-8 border border-white/5 overflow-hidden flex flex-col h-full">
            {/* Background Accent */}
            <div className={cn(
                "absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -mr-32 -mt-32 opacity-10 transition-opacity group-hover:opacity-20",
                color === 'blue' ? 'bg-blue-500' : 'bg-amber-500'
            )} />

            <div className="relative z-10 space-y-4 mb-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">
                            {title}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">
                                {years}-Year Institutional History
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-white tracking-tighter tabular-nums">
                            {currentValue?.toFixed(1)}%
                        </div>
                        <div className="text-[0.55rem] font-black text-muted-foreground/40 uppercase tracking-widest">
                            Official Global Share
                        </div>
                    </div>
                </div>

                {description && (
                    <p className="text-[0.65rem] text-muted-foreground/60 leading-relaxed font-medium max-w-[80%] italic">
                        {description}
                    </p>
                )}
            </div>

            {/* Main Chart */}
            <div className="h-[200px] w-full relative z-10 transition-transform duration-700 group-hover:scale-[1.02]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color === 'blue' ? '#3b82f6' : '#fbbf24'} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={color === 'blue' ? '#3b82f6' : '#fbbf24'} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            hide
                        />
                        <YAxis
                            domain={['dataMin - 5', 'dataMax + 5']}
                            hide
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color === 'blue' ? '#3b82f6' : '#fbbf24'}
                            fill={`url(#${gradId})`}
                            strokeWidth={3}
                            animationDuration={2000}
                        />
                        <ReferenceLine
                            y={currentValue}
                            stroke={color === 'blue' ? '#3b82f680' : '#fbbf2480'}
                            strokeDasharray="4 4"
                            label={{
                                value: `Current: ${currentValue}%`,
                                position: 'right',
                                fill: 'rgba(255,255,255,0.4)',
                                fontSize: 9,
                                fontWeight: 900,
                                className: 'uppercase tracking-tighter'
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Narrative Insight */}
            <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        isDeclining ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                    )} />
                    <span className="text-xs font-black text-white/40 uppercase tracking-widest">
                        {isDeclining ? "Structural Erosion" : "Strategic Expansion"}
                    </span>
                </div>
                <div className="text-xs font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">
                    Source: IMF COFER / WGC
                </div>
            </div>
        </div>
    );
};
