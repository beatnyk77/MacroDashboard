import React from 'react';
import { cn } from '@/lib/utils';
import { CURRENCY_PAIRS, TIME_HORIZONS } from '../constants/currencyPairs';
import type { CurrencyPair, TimeHorizon } from '../lib/tradeFxTypes';

interface CurrencyPairSelectorProps {
    pair: CurrencyPair;
    horizon: TimeHorizon;
    onPairChange: (pair: CurrencyPair) => void;
    onHorizonChange: (horizon: TimeHorizon) => void;
    className?: string;
}

export const CurrencyPairSelector: React.FC<CurrencyPairSelectorProps> = ({
    pair,
    horizon,
    onPairChange,
    onHorizonChange,
    className,
}) => {
    const pairConfig = CURRENCY_PAIRS.find((p) => p.pair === pair);

    return (
        <div className={cn('flex flex-col gap-3', className)}>
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/30 mr-1">
                    Pair
                </span>
                {CURRENCY_PAIRS.map((p) => {
                    const active = pair === p.pair;
                    return (
                        <button
                            key={p.pair}
                            type="button"
                            onClick={() => onPairChange(p.pair)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border',
                                active
                                    ? 'bg-[#B8860B]/15 text-[#B8860B] border-[#B8860B]/35'
                                    : 'text-white/40 border-white/5 hover:text-white/60 hover:bg-white/5',
                            )}
                        >
                            {p.label}
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/30 mr-1">
                    Horizon
                </span>
                {TIME_HORIZONS.map((h) => {
                    const active = horizon === h.id;
                    return (
                        <button
                            key={h.id}
                            type="button"
                            onClick={() => onHorizonChange(h.id)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border',
                                active
                                    ? 'bg-white/10 text-white border-white/20'
                                    : 'text-white/40 border-transparent hover:text-white/60 hover:bg-white/5',
                            )}
                        >
                            {h.label}
                        </button>
                    );
                })}
            </div>

            {pairConfig && !pairConfig.hasLiveTelemetry && pairConfig.dataNote && (
                <p className="text-[10px] text-amber-400/70 m-0 leading-relaxed">
                    {pairConfig.dataNote}
                </p>
            )}
        </div>
    );
};