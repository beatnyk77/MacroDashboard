import React, { useMemo } from 'react';
import { Calculator, Database, ChevronDown } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

export interface CompositeIndexCardProps {
    title: string;
    value: number | undefined | null;
    formula: string;
    sources: string[];
    status: 'safe' | 'warning' | 'danger' | 'neutral';
    trend?: number;
    history?: { date: string; value: number }[];
    icon?: React.ReactNode;
    description?: string;
    isLoading?: boolean;
    prefix?: string;
    suffix?: string;
    directionality?: string;
}

const scoreColor = (v: number | undefined | null): string => {
    if (v === undefined || v === null || isNaN(v)) return '#64748b';
    if (v > 65) return '#22c55e';
    if (v > 45) return '#f59e0b';
    return '#ef4444';
};

const clamp = (val: number, min: number, max: number): number => {
    return Math.min(Math.max(val, min), max);
};

const percentileLabel = (v: number, min: number, max: number): string => {
    if (max === min) return 'MID';
    const pct = ((v - min) / (max - min)) * 100;
    if (pct > 70) return 'STRONG';
    if (pct > 40) return 'MODERATE';
    return 'WEAK';
};

const SIGNIFICANCE_MAP: Record<string, string> = {
    'resilient_growth': 'Real GDP growth adjusted for composite inflation. Measures whether the economy is expanding faster than prices are rising.',
    'wholesale_efficiency': 'Spread between industrial output volume growth and manufacturing input costs. Positive spread indicates margin expansion opportunities.',
    'real_wage_efficiency': 'Wages adjusted for inflation and labor participation. Reflects whether real wage quality is improving.',
    'capital_wage_productivity': 'Ratio of industrial capacity utilization to average wages. Measures how efficiently capital is deployed relative to labor costs.',
    'energy_intensity': 'Energy consumption per unit of industrial output. Lower values indicate more efficient production processes.',
    'labor_productivity': 'Gross Value Added per industrial worker. Direct measure of operational efficiency in manufacturing.',
    'urban_rural_efficiency': 'Labor market efficiency across regions. Values near 1.0 indicate balanced employment growth.',
    'fuel_cost_stability': 'Inflation in fuel prices. Stability is critical for maintaining industrial and logistics cost efficiency.',
    'renewable_capacity': 'Share of renewable energy in total production capacity. Reflects energy security and green transition progress.',
};

export const CompositeIndexCard: React.FC<CompositeIndexCardProps> = ({
    title,
    value,
    formula,
    sources,
    status,
    history,
    isLoading,
    prefix = '',
    suffix = ''
}) => {
    const isNullValue = value === null || value === undefined || (typeof value === 'number' && isNaN(value));
    const isZeroWithNeutral = value === 0 && status === 'neutral';

    // Compute min/max from history if available
    const histMinMax = useMemo(() => {
        if (!history || history.length === 0) {
            // Default range based on typical ranges
            return { min: 0, max: 100 };
        }
        const values = history.map(h => h.value).filter(v => typeof v === 'number' && !isNaN(v));
        if (values.length === 0) return { min: 0, max: 100 };
        return {
            min: Math.min(...values),
            max: Math.max(...values)
        };
    }, [history]);

    // Get significance text for this index
    const getSignificanceKey = (): string => {
        if (title.includes('Inflation-Resilient')) return 'resilient_growth';
        if (title.includes('Wholesale')) return 'wholesale_efficiency';
        if (title.includes('Real Wage')) return 'real_wage_efficiency';
        if (title.includes('Capital-Wage')) return 'capital_wage_productivity';
        if (title.includes('Energy Intensity')) return 'energy_intensity';
        if (title.includes('Labor Prod')) return 'labor_productivity';
        if (title.includes('Urban-Rural')) return 'urban_rural_efficiency';
        if (title.includes('Fuel')) return 'fuel_cost_stability';
        if (title.includes('Renewable')) return 'renewable_capacity';
        return 'resilient_growth';
    };

    const significanceText = SIGNIFICANCE_MAP[getSignificanceKey()];
    const color = scoreColor(value);

    const gaugePercent = useMemo(() => {
        if (isNullValue) return 0;
        return clamp(((value! - histMinMax.min) / (histMinMax.max - histMinMax.min)) * 100, 0, 100);
    }, [value, isNullValue, histMinMax]);

    return (
        <div className="bg-slate-950/40 backdrop-blur-md border border-white/8 rounded-xl p-4 space-y-3 group hover:border-white/12 transition-colors">
            {/* Header: Label + Freshness */}
            <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                    {title}
                </span>
                {sources.length > 0 && (
                    <span className="text-xs font-semibold text-white/40 uppercase tracking-uppercase flex items-center gap-0.5">
                        <Database size={8} /> {sources[0]}
                    </span>
                )}
            </div>

            {/* Main Value */}
            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-10 w-20 bg-white/10" />
                    <Skeleton className="h-2 w-full bg-white/5" />
                </div>
            ) : isNullValue ? (
                <div className="text-xs text-slate-500 italic">Data pending</div>
            ) : isZeroWithNeutral ? (
                <div className="text-xs text-slate-600 italic">Awaiting wiring</div>
            ) : (
                <>
                    <div className="text-4xl font-mono font-bold" style={{ color }}>
                        {prefix}{value?.toFixed(1)}{suffix}
                    </div>

                    {/* Horizontal Range Bar */}
                    <div className="space-y-1">
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${gaugePercent}%`,
                                    backgroundColor: color
                                }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-white/40 font-mono">
                            <span>{histMinMax.min.toFixed(0)}</span>
                            <span className="text-white/60">
                                {percentileLabel(value!, histMinMax.min, histMinMax.max)}
                            </span>
                            <span>{histMinMax.max.toFixed(0)}</span>
                        </div>
                    </div>
                </>
            )}

            {/* Collapsible Significance */}
            {!isNullValue && !isZeroWithNeutral && (
                <details className="group/details">
                    <summary className="text-[10px] text-white/50 cursor-pointer list-none flex items-center gap-1 hover:text-white/70 transition-colors">
                        <span className="font-medium uppercase tracking-wider">Why this matters</span>
                        <ChevronDown size={10} className="group-open/details:rotate-180 transition-transform" />
                    </summary>
                    <p className="text-[11px] text-white/40 mt-2 leading-relaxed italic">
                        {significanceText}
                    </p>
                </details>
            )}

            {/* Formula */}
            {!isNullValue && !isZeroWithNeutral && (
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-white/[0.02] border border-white/[0.05]">
                    <Calculator size={9} className="text-white/30" />
                    <span className="text-xs text-white/30 font-mono">{formula}</span>
                </div>
            )}
        </div>
    );
};
