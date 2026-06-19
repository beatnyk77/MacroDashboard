import React from 'react';
import { TrailLink } from '@/components/TrailLink';
import { ArrowRight, BarChart3, Globe2 } from 'lucide-react';
import { trackClick } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface PremiumActionBarProps {
    className?: string;
    latestDataHref?: string;
    compareHref?: string;
}

export const PremiumActionBar: React.FC<PremiumActionBarProps> = ({
    className,
    latestDataHref = '/',
    compareHref = '/countries',
}) => {
    return (
        <div className={cn('flex flex-col gap-3 sm:flex-row', className)}>
            <TrailLink
                to={compareHref}
                onClick={() => trackClick('compare_countries', 'premium_action_bar')}
                className="group flex flex-1 items-center justify-between gap-3 rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/[0.08] to-transparent px-5 py-4 no-underline backdrop-blur-xl transition-all hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
                        <Globe2 size={18} className="text-blue-400" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-400/70">
                            Sovereign Compass
                        </div>
                        <div className="text-sm font-extrabold text-white/90 group-hover:text-white">
                            Compare Countries
                        </div>
                    </div>
                </div>
                <ArrowRight size={16} className="text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-400" />
            </TrailLink>

            <TrailLink
                to={latestDataHref}
                onClick={() => trackClick('view_latest_data', 'premium_action_bar')}
                className="group flex flex-1 items-center justify-between gap-3 rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/[0.08] to-transparent px-5 py-4 no-underline backdrop-blur-xl transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
                        <BarChart3 size={18} className="text-emerald-400" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-400/70">
                            Live Telemetry
                        </div>
                        <div className="text-sm font-extrabold text-white/90 group-hover:text-white">
                            View Latest Data
                        </div>
                    </div>
                </div>
                <ArrowRight size={16} className="text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" />
            </TrailLink>
        </div>
    );
};