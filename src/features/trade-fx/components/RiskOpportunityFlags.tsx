import React, { useMemo } from 'react';
import { AlertTriangle, ArrowUp, ArrowUpRight } from 'lucide-react';
import { TrailNavLink } from '@/components/TrailLink';
import { cn } from '@/lib/utils';
import { buildRiskFlags, type RiskFlag, type RiskFlagType } from '../lib/riskFlags';
import type { MacroRegimeSignal, Role, VolatilityRegime } from '../lib/tradeFxTypes';

const FLAG_STYLES: Record<
    RiskFlag['color'],
    { border: string; icon: string; bg: string }
> = {
    green: {
        border: 'border-l-emerald-500/60',
        icon: 'text-emerald-400',
        bg: 'bg-emerald-500/[0.04]',
    },
    amber: {
        border: 'border-l-amber-500/50',
        icon: 'text-amber-400',
        bg: 'bg-amber-500/[0.04]',
    },
    red: {
        border: 'border-l-rose-500/50',
        icon: 'text-rose-400',
        bg: 'bg-rose-500/[0.04]',
    },
};

function FlagIcon({ type, className }: { type: RiskFlagType; className?: string }) {
    if (type === 'opportunity') return <ArrowUp size={14} className={className} aria-hidden />;
    if (type === 'caution') return <ArrowUpRight size={14} className={className} aria-hidden />;
    return <AlertTriangle size={14} className={className} aria-hidden />;
}

interface RiskOpportunityFlagsProps {
    role: Role;
    volatilityRegime: VolatilityRegime;
    macroSignals: MacroRegimeSignal[];
    className?: string;
}

export const RiskOpportunityFlags: React.FC<RiskOpportunityFlagsProps> = ({
    role,
    volatilityRegime,
    macroSignals,
    className,
}) => {
    const flags = useMemo(
        () => buildRiskFlags(role, volatilityRegime, macroSignals),
        [role, volatilityRegime, macroSignals],
    );

    if (flags.length === 0) return null;

    return (
        <section className={cn('space-y-3', className)}>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 m-0">
                Risk &amp; Opportunity Flags
            </h2>
            <div className="space-y-2.5">
                {flags.map((flag) => {
                    const styles = FLAG_STYLES[flag.color];
                    return (
                        <article
                            key={flag.headline}
                            className={cn(
                                'rounded-xl border border-white/10 border-l-2 px-4 py-3',
                                styles.border,
                                styles.bg,
                            )}
                        >
                            <div className="flex items-start gap-2.5">
                                <FlagIcon
                                    type={flag.type}
                                    className={cn('shrink-0 mt-0.5', styles.icon)}
                                />
                                <div className="min-w-0 space-y-1">
                                    <h3 className="text-xs font-black text-white/85 m-0 leading-snug">
                                        {flag.headline}
                                    </h3>
                                    <p className="text-[11px] text-white/50 leading-relaxed m-0">
                                        {flag.detail}
                                    </p>
                                    <TrailNavLink
                                        to={flag.link}
                                        className="inline-block text-[10px] font-black uppercase tracking-wider text-[#B8860B]/80 hover:text-[#B8860B] transition-colors"
                                    >
                                        {flag.linkLabel} →
                                    </TrailNavLink>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};