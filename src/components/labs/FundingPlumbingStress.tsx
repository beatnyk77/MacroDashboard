import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area
} from 'recharts';
import { useUSMacroPulse, USMacroPulseData } from '@/hooks/useUSMacroPulse';
import { cn } from '@/lib/utils';
import { 
    Activity, 
    ShieldAlert, 
    Waves,
    Globe,
    Landmark,
    Zap
} from 'lucide-react';

interface MetricModuleProps {
    data: USMacroPulseData;
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    unitLabel: string;
    stressConfig: {
        amber: (val: number) => boolean;
        red: (val: number) => boolean;
    };
    invertDelta?: boolean;
}

const MetricModule: React.FC<MetricModuleProps> = ({ 
    data, 
    title, 
    subtitle, 
    icon: Icon, 
    color, 
    unitLabel,
    stressConfig
}) => {
    const isRed = stressConfig.red(data.current_value);
    const isAmber = !isRed && stressConfig.amber(data.current_value);
    // const isGreen = !isRed && !isAmber; (removed to fix lint)

    // const delta = data.delta_yoy || 0; (removed to fix lint)
    // const isPositive = delta >= 0; (removed to fix lint)
    // const showGoodDelta = invertDelta ? !isPositive : isPositive; (removed to fix lint)

    return (
        <div className="flex-1 min-w-[300px] p-6 relative group transition-all duration-500 hover:bg-white/[0.02]">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "p-1.5 rounded-lg border",
                            isRed ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
                            isAmber ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                            "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                        )}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tighter">{title}</h4>
                    </div>
                    <p className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-widest">{subtitle}</p>
                </div>
                
                {/* Status indicator */}
                <div className="flex flex-col items-end gap-1.5">
                    <div className={cn(
                        "w-2 h-2 rounded-full shadow-[0_0_12px_rgba(0,0,0,0.5)]",
                        isRed ? "bg-rose-500 shadow-rose-500" :
                        isAmber ? "bg-amber-500 shadow-amber-500" :
                        "bg-emerald-500 shadow-emerald-500"
                    )} />
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-heading",
                        isRed ? "text-rose-500" : isAmber ? "text-amber-500" : "text-emerald-500"
                    )}>
                        {isRed ? 'High Stress' : isAmber ? 'Caution' : 'Optimal'}
                    </span>
                </div>
            </div>

            {/* Value Section */}
            <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-black text-white tracking-tighter tabular-nums">
                    {data.current_value >= 1000 
                        ? (data.current_value / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })
                        : data.current_value.toLocaleString(undefined, { maximumFractionDigits: 1 })
                    }
                </span>
                <span className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
                    {data.current_value >= 1000 ? unitLabel.replace('mn', 'bn') : unitLabel}
                </span>
            </div>

            {/* Sparkline Context */}
            <div className="h-16 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.history}>
                        <defs>
                            <linearGradient id={`grad-${data.metric_id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
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
                            animationDuration={2000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
                <div className="absolute -bottom-2 right-0 text-[8px] font-black text-white/5 uppercase tracking-widest pointer-events-none">Liquidity Context</div>
            </div>
        </div>
    );
};

export const FundingPlumbingStress: React.FC = () => {
    const { data: pulseData } = useUSMacroPulse();

    const metrics = useMemo(() => {
        if (!pulseData) return null;
        return {
            rrp: pulseData.find(d => d.metric_id === 'REVERSE_REPO_OUTSTANDING'),
            tga: pulseData.find(d => d.metric_id === 'TGA_BALANCE'),
            srf: pulseData.find(d => d.metric_id === 'SRF_USAGE'),
            swaps: pulseData.find(d => d.metric_id === 'FX_SWAP_LINES')
        };
    }, [pulseData]);

    if (!metrics || !metrics.rrp || !metrics.tga || !metrics.srf || !metrics.swaps) {
        return (
            <div className="w-full h-48 bg-white/5 rounded-[2.5rem] animate-pulse flex items-center justify-center">
                <p className="text-xs font-black text-white/20 uppercase tracking-widest">Initializing Funding Telemetry...</p>
            </div>
        );
    }

    return (
        <Card className="w-full bg-black/60 backdrop-blur-3xl border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden relative group">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px]" />
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />

            <div className="relative z-10">
                {/* Header Row */}
                <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <Zap className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-light text-white flex items-center gap-3">
                                <span className="w-8 h-px bg-blue-500" />
                                Funding Plumbing Stress
                            </h3>
                            <p className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-widest mt-0.5">
                                Real-time Systemic Liquidity Telemetry • Federal Reserve Facilities
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Activity className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Feed OK</span>
                        </div>
                        <div className="h-4 w-px bg-white/10" />
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Threshold: Institutional</span>
                    </div>
                </div>

                {/* Modules Grid */}
                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/5">
                    <MetricModule 
                        data={metrics.rrp}
                        title="Net Liquidity Buffer"
                        subtitle="Overnight Reverse Repo (ON RRP)"
                        icon={Waves}
                        color="#3b82f6"
                        unitLabel="bn USD"
                        stressConfig={{
                            amber: (val) => val < 500 && val >= 200,
                            red: (val) => val < 200
                        }}
                        invertDelta
                    />
                    <MetricModule 
                        data={metrics.tga}
                        title="Fiscal Cash Buffer"
                        subtitle="Treasury General Account (TGA)"
                        icon={Landmark}
                        color="#f59e0b"
                        unitLabel="mn USD"
                        stressConfig={{
                            amber: (val) => val < 300000 || val > 900000,
                            red: (val) => val < 100000
                        }}
                    />
                    <MetricModule 
                        data={metrics.srf}
                        title="Domestic Funding Stress"
                        subtitle="Standing Repo Facility (SRF)"
                        icon={ShieldAlert}
                        color="#ef4444"
                        unitLabel="mn USD"
                        stressConfig={{
                            amber: (val) => val > 0 && val <= 5000,
                            red: (val) => val > 5000
                        }}
                    />
                    <MetricModule 
                        data={metrics.swaps}
                        title="Offshore Dollar Gap"
                        subtitle="Central Bank FX Liquidity Swaps"
                        icon={Globe}
                        color="#8b5cf6"
                        unitLabel="mn USD"
                        stressConfig={{
                            amber: (val) => val > 0 && val <= 1000,
                            red: (val) => val > 1000
                        }}
                    />
                </div>

                {/* Insights Footer */}
                <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 flex flex-wrap items-center gap-x-8 gap-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Market Alpha:</span>
                        <p className="text-[10px] text-muted-foreground/70 font-medium">
                            {metrics.rrp.current_value < 300 ? "⚠️ RRP buffer depleted. Increased volatility risk in O/N funding." : "✅ Systemic liquidity remains abundant via RRP drain."}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Correlates:</span>
                        <p className="text-[10px] text-muted-foreground/70 font-medium whitespace-nowrap">SOFR Spreads • Treasury Repo Vol • Eurodollar Basis</p>
                    </div>
                </div>
            </div>
        </Card>
    );
};
