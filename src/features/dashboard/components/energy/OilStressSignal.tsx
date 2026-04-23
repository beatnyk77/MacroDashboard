import React from 'react';
import { useLatestOilSpread } from '@/hooks/useOilSpread';
import { Activity, Flame, Droplet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const OilStressSignal: React.FC = () => {
    const { data: spreadData, isLoading, error } = useLatestOilSpread();

    if (isLoading) {
        return (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-muted-foreground animate-spin" />
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-uppercase">Scanning Oil Market...</span>
                </div>
            </div>
        );
    }

    if (error || !spreadData) {
        return null;
    }

    const { spread, regime, change_1d } = spreadData;

    const getRegimeColor = (r: string) => {
        switch (r) {
            case 'EXTREME': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            case 'STRESSED': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'TIGHTENING': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'OVERSUPPLY': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        }
    };

    const getActionableInsight = () => {
        if (regime === 'EXTREME') return "Critical backwardation: Severe inventory deficit.";
        if (regime === 'STRESSED') return "High tightness: Spot premium rising rapidly.";
        if (regime === 'TIGHTENING') return "Markets hardening: Demand outstripping supply.";
        if (regime === 'OVERSUPPLY') return "Contango risk: Inventory levels rising.";
        if (Math.abs(change_1d) > 0.5) return "Volatility spike: Unusual spread movement.";
        return "Stable conditions: Equilibrium persisting.";
    };

    const isTightening = spread > 5;
    const Icon = isTightening ? Flame : Droplet;

    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer">
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={cn("p-2.5 rounded-xl border transition-transform group-hover:scale-110", getRegimeColor(regime))}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white uppercase tracking-heading italic">WTI Spread</span>
                            <span className={cn("text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider border", getRegimeColor(regime))}>
                                {regime}
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{getActionableInsight()}</p>
                    </div>
                </div>

                <div className="text-right space-y-0.5">
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-xl font-black text-white font-mono tracking-tighter">{spread > 0 ? '+' : ''}{spread.toFixed(2)}</span>
                        <div className={cn(
                            "flex items-center px-1.5 py-0.5 rounded text-[10px] font-black font-mono",
                            change_1d > 0 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                        )}>
                            {change_1d > 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                            {Math.abs(change_1d).toFixed(2)}
                        </div>
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest font-mono">
                        24H DELTA PULSE
                    </div>
                </div>
            </div>
            
            {/* Actionable Overlay on Hover */}
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
    );
};
