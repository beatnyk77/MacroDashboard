import React from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FreshnessChip } from '@/components/FreshnessChip';
import { useEnergyRegime } from '@/hooks/useEnergyRegime';

const REGIME_COLORS: Record<string, string> = {
    EXTREME: 'text-rose-500 border-rose-500/30 bg-rose-500/10',
    STRESSED: 'text-orange-500 border-orange-500/30 bg-orange-500/10',
    TIGHTENING: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
    OVERSUPPLY: 'text-blue-500 border-blue-500/30 bg-blue-500/10',
    NORMAL: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10',
};

function Pillar({
    label,
    value,
    sub,
    accent,
}: {
    label: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    accent?: string;
}) {
    return (
        <div className="p-6 rounded-xl bg-white/[0.02] border border-border flex flex-col gap-2">
            <span className={cn('text-[11px] font-semibold uppercase tracking-wider', accent ?? 'text-terminal-dim')}>
                {label}
            </span>
            <div className="text-2xl font-bold italic tracking-heading text-white">{value}</div>
            {sub && <div className="text-[11px] font-semibold text-terminal-dim uppercase tracking-wider">{sub}</div>}
        </div>
    );
}

export const CurrentEnergyRegimeCard: React.FC = () => {
    const regime = useEnergyRegime();
    const regimeColor = REGIME_COLORS[regime.wtiRegime] ?? REGIME_COLORS.NORMAL;

    const spreadSign = regime.wtiSpread > 0 ? '+' : '';
    const brentChangeSign = regime.brentChangePct > 0 ? '+' : '';

    return (
        <div className={cn(
            'w-full rounded-xl bg-background/40 border backdrop-blur-xl overflow-hidden',
            regime.isAnyStale ? 'border-amber-500/20' : 'border-border',
        )}>
            {/* Header bar */}
            <div className="flex items-center justify-between px-8 py-3 bg-white/[0.02] border-b border-border">
                <div className="flex items-center gap-3">
                    <Activity size={10} className="text-amber-500/50" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-terminal-dim">
                        Energy Market Regime
                    </span>
                    <div className={cn('px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider', regimeColor)}>
                        {regime.wtiRegime}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {regime.lastUpdated && (
                        <FreshnessChip
                            status={regime.isAnyStale ? 'lagged' : 'fresh'}
                            lastUpdated={regime.lastUpdated}
                        />
                    )}
                </div>
            </div>

            {/* Stale warning */}
            {regime.isAnyStale && (
                <div className="px-8 py-2 bg-amber-500/10 border-b border-amber-500/10 flex items-center gap-3">
                    <AlertTriangle size={12} className="text-amber-500" />
                    <span className="text-[11px] font-semibold text-amber-500/80 uppercase tracking-tight">
                        One or more signals may be delayed — showing last known state.
                    </span>
                </div>
            )}

            {/* Pillars */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-8">
                <Pillar
                    label="WTI Spread (CL1−CL2)"
                    accent="text-amber-500/60"
                    value={
                        <span className={regime.wtiSpread >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {spreadSign}{regime.wtiSpread.toFixed(2)} <span className="text-sm not-italic">USD</span>
                        </span>
                    }
                    sub={regime.wtiRegime.replace('_', ' ')}
                />
                <Pillar
                    label="Brent Crude"
                    accent="text-blue-400/60"
                    value={
                        regime.brentPrice > 0
                            ? <>${regime.brentPrice.toFixed(2)}</>
                            : <span className="text-white/20">—</span>
                    }
                    sub={
                        regime.brentPrice > 0
                            ? <span className={regime.brentChangePct >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                {brentChangeSign}{regime.brentChangePct.toFixed(2)}% chg
                              </span>
                            : 'Unavailable'
                    }
                />
                <Pillar
                    label="US Refinery Util"
                    accent="text-rose-400/60"
                    value={
                        regime.refineryUtil > 0
                            ? <>{regime.refineryUtil.toFixed(1)}<span className="text-sm not-italic">%</span></>
                            : <span className="text-white/20">—</span>
                    }
                    sub={
                        regime.refineryUtil > 90 ? 'Near capacity ceiling' :
                        regime.refineryUtil > 80 ? 'Normal operating range' :
                        regime.refineryUtil > 0 ? 'Below average utilization' : 'Unavailable'
                    }
                />
                <Pillar
                    label="EU Gas Storage"
                    accent="text-emerald-400/60"
                    value={
                        regime.euGasStorage > 0
                            ? <>{regime.euGasStorage.toFixed(1)}<span className="text-sm not-italic">%</span></>
                            : <span className="text-white/20">—</span>
                    }
                    sub={
                        regime.euGasStorage > 75 ? 'Well-stocked — low winter risk' :
                        regime.euGasStorage > 50 ? 'Adequate — monitor drawdown pace' :
                        regime.euGasStorage > 0 ? 'Low — elevated winter risk' : 'Unavailable'
                    }
                />
            </div>

            {/* Narrative footer */}
            <div className="px-8 pb-6">
                <div className="px-6 py-4 rounded-xl bg-white/[0.02] border border-border">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-terminal-dim block mb-1">
                        Regime Synthesis
                    </span>
                    <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider leading-relaxed">
                        {regime.overallNarrative}
                    </p>
                </div>
            </div>
        </div>
    );
};
