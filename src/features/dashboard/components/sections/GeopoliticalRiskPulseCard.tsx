import React from 'react';
import { Card } from "@/components/ui/card";
import { useInstitutionalFeatures } from '@/hooks/useInstitutionalFeatures';
import { Info, ShieldAlert, ShieldCheck, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/Sparkline';

export const GeopoliticalRiskPulseCard: React.FC = () => {
    const { geoRisk } = useInstitutionalFeatures();
    const data = geoRisk.data;

    const compositeZ = data?.composite_z_score || 0;

    // Status Logic
    let status: 'safe' | 'warning' | 'danger' = 'safe';
    let statusText = 'Geopolitical Risk Contained';
    let statusColor = 'text-emerald-500';
    let statusBg = 'bg-emerald-500/10 border-emerald-500/20';
    let Icon = ShieldCheck;

    if (compositeZ > 1.5) {
        status = 'danger';
        statusText = 'Extreme Geopolitical Pricing';
        statusColor = 'text-rose-500';
        statusBg = 'bg-rose-500/10 border-rose-500/20';
        Icon = ShieldAlert;
    } else if (compositeZ > 0.5) {
        status = 'warning';
        statusText = 'Elevated Market Tension';
        statusColor = 'text-amber-500';
        statusBg = 'bg-amber-500/10 border-amber-500/20';
        Icon = Shield;
    }

    const renderSubMetric = (label: string, value: number | undefined, color: string) => (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{label}</span>
            <div className="flex items-baseline gap-1">
                <span className={cn("text-lg font-black tracking-tighter", color)}>
                    {value !== undefined ? (value > 0 ? '+' : '') + value.toFixed(1) : '-'}
                </span>
                <span className="text-xs font-bold text-muted-foreground/40">Z</span>
            </div>
        </div>
    );

    return (
        <Card className="p-6 h-full border-border bg-card/40 backdrop-blur-md flex flex-col relative overflow-hidden group">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em]">
                            Systemic Risk Detection
                        </span>
                        <div className={cn("px-1.5 py-0.5 rounded-[3px] border text-xs font-black", statusBg, statusColor)}>
                            {status.toUpperCase()}
                        </div>
                    </div>
                    <h3 className="text-lg font-black text-foreground tracking-tight">
                        Geopolitical Risk Pulse
                    </h3>
                </div>
                <Info size={16} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                {/* Hero Gauge Area */}
                <div className="flex flex-col justify-center">
                    <div className="flex items-baseline gap-2 mb-2">
                        <h2 className={cn("text-5xl font-black tracking-tighter", statusColor)}>
                            {compositeZ.toFixed(2)}
                        </h2>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Composite Z</span>
                    </div>
                    <div className={cn("flex items-center gap-2 text-xs font-extrabold uppercase tracking-tight", statusColor)}>
                        <Icon size={14} />
                        {statusText}
                    </div>
                </div>

                {/* Sub-Metric Breakdown */}
                <div className="grid grid-cols-3 gap-2 border-l border-white/5 pl-6">
                    {renderSubMetric('VIX (Equity)', data?.vix_z, (data?.vix_z || 0) > 1 ? 'text-rose-400' : 'text-foreground')}
                    {renderSubMetric('MOVE (Bonds)', data?.move_z, (data?.move_z || 0) > 1 ? 'text-rose-400' : 'text-foreground')}
                    {renderSubMetric('GOLD (Metal)', data?.gold_z, (data?.gold_z || 0) > 1 ? 'text-rose-400' : 'text-foreground')}
                </div>
            </div>

            {/* Sparkline */}
            <div className="h-16 mb-6 opacity-40 group-hover:opacity-100 transition-opacity">
                {data?.history && (
                    <Sparkline
                        data={data.history}
                        height={64}
                        color={status === 'danger' ? '#f43f5e' : (status === 'warning' ? '#f59e0b' : '#10b981')}
                    />
                )}
            </div>

            {/* Methodology & Legend Footer */}
            <div className="mt-auto pt-4 border-t border-white/5 space-y-3">
                <p className="text-xs text-muted-foreground font-medium leading-relaxed italic">
                    "Tracks systemic risk by aggregating volatility across asset classes. Extreme readings indicate geopolitical pricing that exceeds historical norms."
                </p>
                <div className="flex items-center justify-between text-xs font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> &lt;0.5 Calm</span>
                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 0.5-1.5 Elevated</span>
                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> &gt;1.5 Extreme</span>
                    </div>
                    <span>Source: FRED, ICE BofA</span>
                </div>
            </div>
        </Card>
    );
};
