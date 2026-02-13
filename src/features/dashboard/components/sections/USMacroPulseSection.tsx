import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { useUSMacroPulse, USMacroPulseData } from '@/hooks/useUSMacroPulse';
import { cn } from '@/lib/utils';
import {
    DollarSign,
    Wind,
    Scale,
    Home,
    Activity,
    Briefcase,
    TrendingUp,
    TrendingDown,
    Activity as ActivityIcon
} from 'lucide-react';

const CATEGORIES = [
    {
        id: 'capital_flows',
        label: 'Capital Flows',
        icon: DollarSign,
        color: '#3b82f6',
        metrics: ['CAPITAL_FROM_EM_DEBT_BN', 'CAPITAL_FROM_GOLD_ETF_BN']
    },
    {
        id: 'inflation_regime',
        label: 'Inflation Regime',
        icon: Wind,
        color: '#f97316',
        metrics: ['US_CPI_YOY', 'INFLATION_CORE_YOY']
    },
    {
        id: 'balance_of_payments',
        label: 'Balance of Payments',
        icon: Scale,
        color: '#8b5cf6',
        metrics: ['BOP_CURRENT_ACCOUNT_GDP', 'BOP_RESERVES_MONTHS', 'BOP_SHORT_TERM_DEBT_GDP']
    },
    {
        id: 'housing_cycles',
        label: 'Housing Cycles',
        icon: Home,
        color: '#ef4444',
        metrics: ['HOUSING_PRICE_INDEX', 'HOUSING_MORTGAGE_RATE_30Y']
    },
    {
        id: 'activity_regime',
        label: 'Activity Regime',
        icon: ActivityIcon,
        color: '#10b981',
        metrics: ['PMI_US_MFG']
    },
    {
        id: 'labor_market',
        label: 'Labor Market',
        icon: Briefcase,
        color: '#f59e0b',
        metrics: ['LABOR_VACANCIES_JOLTS', 'US_UNEMPLOYMENT', 'LABOR_WAGE_GROWTH_YOY']
    }
];

const METRIC_LABELS: Record<string, { label: string, unit: string }> = {
    CAPITAL_FROM_EM_DEBT_BN: { label: 'EM Debt Flows', unit: 'bn USD' },
    CAPITAL_FROM_GOLD_ETF_BN: { label: 'Gold ETF Flows', unit: 'bn USD' },
    US_CPI_YOY: { label: 'Headline Inflation', unit: 'YoY %' },
    INFLATION_CORE_YOY: { label: 'Core Inflation', unit: 'YoY %' },
    BOP_CURRENT_ACCOUNT_GDP: { label: 'Current Account', unit: '% GDP' },
    BOP_RESERVES_MONTHS: { label: 'FX Reserves', unit: 'm cover' },
    BOP_SHORT_TERM_DEBT_GDP: { label: 'Short-Term Debt', unit: '% GDP' },
    HOUSING_PRICE_INDEX: { label: 'Housing Price Index', unit: 'idx' },
    HOUSING_MORTGAGE_RATE_30Y: { label: '30Y Mortgage Rate', unit: '%' },
    PMI_US_MFG: { label: 'Manufacturing PMI', unit: 'pts' },
    LABOR_VACANCIES_JOLTS: { label: 'JOLTS Vacancies', unit: 'k' },
    US_UNEMPLOYMENT: { label: 'Unemployment Rate', unit: '%' },
    LABOR_WAGE_GROWTH_YOY: { label: 'Wage Growth', unit: 'YoY %' }
};

interface MetricRowProps {
    data: USMacroPulseData;
    color: string;
}

const MetricRow: React.FC<MetricRowProps> = ({ data, color }) => {
    const config = METRIC_LABELS[data.metric_id] || { label: data.metric_id, unit: '' };
    const isPositive = (data.delta_yoy || 0) >= 0;

    return (
        <div className="group/row flex flex-col md:flex-row items-center gap-6 py-6 px-4 hover:bg-white/[0.02] transition-all duration-300">
            {/* Label Block */}
            <div className="w-full md:w-56 space-y-1 shrink-0">
                <div className="text-[0.65rem] font-black text-muted-foreground/40 uppercase tracking-widest">{config.label}</div>
                <div className="text-[0.6rem] font-bold text-white/30 uppercase tracking-tighter">{config.unit}</div>
            </div>

            {/* Sparkline Block */}
            <div className="w-full h-16 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.history}>
                        <defs>
                            <linearGradient id={`grad-${data.metric_id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill={`url(#grad-${data.metric_id})`}
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
                {/* 25Y context label floating inside sparkline */}
                <div className="absolute top-0 right-0 text-[0.45rem] font-black text-white/10 uppercase tracking-widest pointer-events-none">25-YEAR CONTEXT</div>
            </div>

            {/* Value Block */}
            <div className="w-full md:w-48 flex items-center justify-between md:justify-end gap-6 shrink-0">
                <div className="text-right">
                    <div className="text-2xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        {data.current_value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </div>
                    <div className={cn(
                        "text-[0.65rem] font-black tabular-nums tracking-tight flex items-center justify-end gap-1",
                        isPositive ? "text-emerald-500" : "text-rose-500"
                    )}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(data.delta_yoy || 0).toFixed(1)}%
                    </div>
                </div>

                {/* Status Indicator */}
                <div className={cn(
                    "w-2 h-2 rounded-full shrink-0 shadow-[0_0_10px_currentcolor]",
                    (data.z_score || 0) > 1.5 ? "text-rose-500 bg-rose-500" :
                        (data.z_score || 0) < -1.5 ? "text-amber-500 bg-amber-500" :
                            "text-emerald-500 bg-emerald-500"
                )} />
            </div>
        </div>
    );
};

export const USMacroPulseSection: React.FC = () => {
    const { data: pulseData } = useUSMacroPulse();

    const groupedData = useMemo(() => {
        if (!pulseData) return {};
        return pulseData.reduce((acc, metric) => {
            acc[metric.metric_id] = metric;
            return acc;
        }, {} as Record<string, USMacroPulseData>);
    }, [pulseData]);

    if (!pulseData) {
        return (
            <div className="space-y-8">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-64 w-full rounded-[2.5rem] bg-white/5" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {CATEGORIES.map((cat) => (
                <Card
                    key={cat.id}
                    className="p-8 bg-black/40 backdrop-blur-3xl border-white/5 shadow-2xl overflow-hidden rounded-[2.5rem] relative group"
                >
                    {/* Background Glow */}
                    <div
                        className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] -mr-32 -mt-32 opacity-[0.03] transition-opacity group-hover:opacity-[0.07]"
                        style={{ backgroundColor: cat.color }}
                    />

                    <div className="relative z-10 space-y-6">
                        {/* Section Header */}
                        <div className="flex items-center gap-4 px-4">
                            <div
                                className="p-2.5 rounded-xl border shadow-inner"
                                style={{
                                    backgroundColor: `${cat.color}10`,
                                    borderColor: `${cat.color}20`,
                                    color: cat.color
                                }}
                            >
                                <cat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight text-white uppercase italic">
                                    {cat.label} <span className="text-muted-foreground/30 ml-2">Sub-Head</span>
                                </h3>
                                <p className="text-[0.65rem] text-muted-foreground/60 font-medium uppercase tracking-widest mt-0.5">
                                    Institutional Regime Monitoring
                                </p>
                            </div>
                        </div>

                        {/* Rows Grid */}
                        <div className="divide-y divide-white/[0.03]">
                            {cat.metrics.map(metricId => {
                                const data = groupedData[metricId];
                                if (!data) return null;
                                return (
                                    <MetricRow
                                        key={metricId}
                                        data={data}
                                        color={cat.color}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </Card>
            ))}

            {/* Methodology Note */}
            <div className="px-8 py-6 rounded-3xl bg-blue-500/[0.02] border border-blue-500/10 flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-500/10">
                    <Activity color="#3b82f6" size={16} />
                </div>
                <div>
                    <span className="text-[0.7rem] font-bold text-blue-400 uppercase tracking-widest">Institutional Note:</span>
                    <p className="text-[0.65rem] text-muted-foreground/50 leading-relaxed mt-1">
                        All sparklines represent 25-year indexed historical distribution. Current levels are benchmarked against 3-year rolling standard deviations (Z-Scores) to identify regime instability. Sources include FRED, US Treasury, and BLS.
                    </p>
                </div>
            </div>
        </div>
    );
};
