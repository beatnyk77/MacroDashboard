import React from 'react';
import { TrailLink } from '@/components/TrailLink';
import { Globe2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChinaLocaleHintProps {
    className?: string;
    showBilingual?: boolean;
}

/**
 * Subtle bilingual orientation for China-dominant traffic — not a full translation layer.
 */
export const ChinaLocaleHint: React.FC<ChinaLocaleHintProps> = ({
    className,
    showBilingual = true,
}) => {
    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-3 rounded-lg border border-red-500/15 bg-red-500/[0.04] px-4 py-2.5',
                className
            )}
        >
            <Globe2 size={14} className="shrink-0 text-red-400/80" />
            <div className="min-w-0 flex-1 text-xs leading-relaxed text-white/55">
                {showBilingual && (
                    <span className="mr-2 font-medium text-red-300/90">中国宏观情报</span>
                )}
                <span>
                    China macro telemetry — PBOC liquidity, NBS/Caixin PMI, FX reserves, and de-dollarization signals.
                    Optimised for fast load; data sourced from official statistical releases.
                </span>
            </div>
            <TrailLink
                to="/intel/china"
                className="shrink-0 text-[10px] font-black uppercase tracking-uppercase text-red-400/90 no-underline hover:text-red-300"
            >
                进入 China Hub →
            </TrailLink>
        </div>
    );
};