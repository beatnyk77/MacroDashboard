import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertCircle, Newspaper, Calendar } from 'lucide-react';
import { useRegime } from '@/hooks/useRegime';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { useMacroEvents } from '@/hooks/useMacroEvents';
import { useMacroHeadlines, MacroHeadline } from '@/hooks/useMacroHeadlines';
import { formatBillions } from '@/utils/formatNumber';
import { cn } from '@/lib/utils';
import { Card, CardContent } from "@/components/ui/card";

interface TodaysBriefPanelProps {
    className?: string;
    sx?: any; // Deprecated, kept for compatibility
}

export const TodaysBriefPanel: React.FC<TodaysBriefPanelProps> = ({ className }) => {
    const { data: regime } = useRegime();
    const { data: liquidity } = useNetLiquidity();
    const { data: events } = useMacroEvents();
    const { data: headlines } = useMacroHeadlines();

    // Restoration of missing variables for JSX
    const liquidityDelta = liquidity?.delta || null;
    const liquidityStatus = liquidityDelta ? (liquidityDelta > 0 ? 'Expanding' : 'Contracting') : 'Awaiting Data';

    // Tailwind text color classes instead of hex values
    const getLiquidityColorClass = () => {
        if (!liquidityDelta) return 'text-muted-foreground';
        return liquidityDelta > 0 ? 'text-emerald-500' : 'text-rose-500';
    };

    const today = useMemo(() => new Date(), []);
    const keyEvent = useMemo(() => {
        if (!events) return null;
        return events
            .filter(e => new Date(e.event_date).toDateString() === today.toDateString())
            .sort((a) => a.impact_level === 'High' ? -1 : 1)[0];
    }, [events, today]);

    // Mapping headlines to briefing items
    const dynamicBriefing = useMemo(() => {
        if (!headlines || headlines.length === 0) return [];
        return headlines.slice(0, 5).map((h: MacroHeadline) => ({
            label: h.title,
            anchor: '#macro-orientation-section', // Default anchor
            trend: h.title.includes('↑') || h.title.includes('positive') ? 'up' :
                (h.title.includes('↓') || h.title.includes('negative') ? 'down' : 'neutral')
        }));
    }, [headlines]);

    const handleScrollTo = (anchor: string) => {
        const element = document.querySelector(anchor);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleHighlight = (label: string, anchor: string) => {
        // 1. Scroll to section
        handleScrollTo(anchor);

        // 2. Map keywords to Metric IDs
        let metricId = '';
        const lowerLabel = label.toLowerCase();

        if (lowerLabel.includes('liquidity') || lowerLabel.includes('fed') || lowerLabel.includes('m2')) metricId = 'NET_LIQUIDITY';
        else if (lowerLabel.includes('dollar') || lowerLabel.includes('dxy') || lowerLabel.includes('usd')) metricId = 'DXY_INDEX';
        else if (lowerLabel.includes('gold') || lowerLabel.includes('precious')) metricId = 'GOLD_PRICE';
        else if (lowerLabel.includes('oil') || lowerLabel.includes('wti') || lowerLabel.includes('crude') || lowerLabel.includes('energy')) metricId = 'CRUDE_OIL';
        else if (lowerLabel.includes('yield') || lowerLabel.includes('treasury') || lowerLabel.includes('curve') || lowerLabel.includes('rates')) metricId = 'YIELD_CURVE';
        else if (lowerLabel.includes('volatility') || lowerLabel.includes('vix') || lowerLabel.includes('fear')) metricId = 'VIX_INDEX';

        if (metricId) {
            // Give a small delay for scroll to start
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('macro-dashboard-highlight', {
                    detail: { metricId }
                }));
            }, 100);
        }
    };

    const getRegimeColorClass = () => {
        if (!regime) return 'text-primary';
        const label = regime.regimeLabel.toLowerCase();
        if (label.includes('expansion') || label.includes('recovery')) return 'text-emerald-500';
        if (label.includes('tightening') || label.includes('slowdown')) return 'text-rose-500';
        return 'text-primary';
    };

    const getRegimeStatus = () => {
        if (!regime) return 'neutral';
        const label = regime.regimeLabel.toLowerCase();
        if (label.includes('expansion') || label.includes('recovery')) return 'safe';
        if (label.includes('tightening') || label.includes('slowdown')) return 'danger';
        return 'neutral';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'safe': return <Activity size={16} className="text-emerald-500" />;
            case 'danger': return <AlertCircle size={16} className="text-rose-500" />;
            default: return <Activity size={16} className="text-primary" />;
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Card className={cn(
            "mb-8 border-l-4 border-l-primary relative overflow-hidden shadow-2xl transition-all duration-300",
            "bg-card/40 backdrop-blur-md border-white/10 dark:border-white/5",
            className
        )}>
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />

            <CardContent className="p-6 md:p-8 relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <span className="block text-primary font-black tracking-[0.2em] text-xs font-sans mb-2">
                            GRAPHIQUESTOR INTELLIGENCE
                        </span>
                        <h3 className="text-3xl md:text-4xl font-serif text-foreground tracking-tight leading-tight">
                            {formatDate(new Date())}
                        </h3>
                    </div>
                    <div className="px-2 py-1 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded text-[0.65rem] font-black tracking-wider uppercase">
                        Proprietary View
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Column 1: Core Signals (4 cols) */}
                    <div className="md:col-span-4 space-y-4">
                        <div className="p-5 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-3">
                                {getStatusIcon(getRegimeStatus())}
                                <span className="text-[0.65rem] font-black tracking-widest text-muted-foreground uppercase">
                                    Regime Consensus
                                </span>
                            </div>
                            <h5 className={cn("text-xl font-black mb-1", getRegimeColorClass())}>
                                {regime?.regimeLabel || 'Neutral Persistence'}
                            </h5>
                            <span className="text-xs font-semibold text-muted-foreground">
                                {regime?.timestamp ? `Model updated ${new Date(regime.timestamp).toLocaleDateString()}` : 'Real-time detection active'}
                            </span>
                        </div>

                        <div className="p-5 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-3">
                                {liquidityDelta && liquidityDelta > 0 ? (
                                    <TrendingUp size={16} className="text-emerald-500" />
                                ) : (
                                    <TrendingDown size={16} className="text-rose-500" />
                                )}
                                <span className="text-[0.65rem] font-black tracking-widest text-muted-foreground uppercase">
                                    Liquidity Impulse
                                </span>
                            </div>
                            <h5 className={cn("text-xl font-black mb-1", getLiquidityColorClass())}>
                                {liquidityStatus}
                            </h5>
                            <span className="text-xs font-semibold text-muted-foreground">
                                {liquidityDelta ? `${liquidityDelta > 0 ? '+' : ''}${formatBillions(liquidityDelta / 1e9, { decimals: 1 })} net change (7D)` : 'Awaiting fresh feed'}
                            </span>
                        </div>
                    </div>

                    {/* Column 2: Market Briefing (5 cols) */}
                    <div className="md:col-span-5">
                        <div className="p-5 rounded-lg bg-white/5 border border-white/10 h-full">
                            <div className="flex items-center gap-2 mb-4">
                                <Newspaper size={16} className="text-primary" />
                                <span className="text-[0.65rem] font-black tracking-widest text-muted-foreground uppercase">
                                    LIVE INTELLIGENCE FEED
                                </span>
                            </div>
                            <div className="space-y-4 divide-y divide-white/5">
                                {dynamicBriefing.length > 0 ? (
                                    dynamicBriefing.map((item, idx) => {
                                        const rawHeadline = headlines?.find(h => h.title === item.label);
                                        return (
                                            <div key={idx} className="flex items-start gap-3 pt-3 first:pt-0">
                                                <div className={cn(
                                                    "mt-1.5 w-1.5 h-1.5 rounded-full shrink-0",
                                                    item.trend === 'up' ? 'bg-emerald-500' : item.trend === 'down' ? 'bg-rose-500' : 'bg-muted-foreground'
                                                )} />
                                                <a
                                                    href={rawHeadline?.link || '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => {
                                                        if (!rawHeadline?.link || rawHeadline.link.includes('example.com')) {
                                                            e.preventDefault();
                                                            handleHighlight(item.label, item.anchor);
                                                        }
                                                    }}
                                                    className="text-xs font-semibold text-foreground hover:text-primary transition-colors line-clamp-3 leading-relaxed cursor-pointer"
                                                    title={item.label}
                                                >
                                                    {item.label}
                                                </a>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <span className="text-xs text-muted-foreground text-center block py-4">
                                        Awaiting institutional signal ingest...
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Scheduled Focus (3 cols) */}
                    <div className="md:col-span-3">
                        <div className="p-5 rounded-lg bg-blue-500/5 border border-dashed border-primary/50 h-full flex flex-col">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar size={16} className="text-secondary" />
                                <span className="text-[0.65rem] font-black tracking-widest text-muted-foreground uppercase">
                                    Today's Key Alpha
                                </span>
                            </div>

                            {keyEvent ? (
                                <div>
                                    <h6 className="text-base font-black text-foreground mb-2 leading-tight">
                                        {keyEvent.event_name}
                                    </h6>
                                    <div className="flex gap-2 mb-4">
                                        <span className="px-1.5 py-0.5 bg-white/10 rounded text-[0.55rem] font-black uppercase">
                                            {keyEvent.country}
                                        </span>
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded text-[0.55rem] font-black uppercase text-white",
                                            keyEvent.impact_level === 'High' ? 'bg-rose-500' : 'bg-amber-500'
                                        )}>
                                            {keyEvent.impact_level}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-xs font-semibold text-muted-foreground">Forecast</span>
                                            <span className="text-xs font-black font-mono text-foreground capitalize">{keyEvent.forecast || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-semibold text-muted-foreground">Previous</span>
                                            <span className="text-xs font-black font-mono text-foreground">{keyEvent.previous || '-'}</span>
                                        </div>
                                        <div className="flex justify-between mt-2 pt-2 border-t border-white/5">
                                            <span className="text-xs font-black text-muted-foreground uppercase">ACTUAL</span>
                                            <span className="text-xs font-black font-mono text-primary">{keyEvent.actual || 'PENDING'}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-50 text-center py-6">
                                    <AlertCircle size={24} />
                                    <span className="text-xs font-bold">
                                        No high-impact releases scheduled for today.
                                    </span>
                                </div>
                            )}

                            <span
                                onClick={() => handleScrollTo('#macro-calendar')}
                                className="mt-auto pt-4 text-right text-[0.6rem] font-black text-primary cursor-pointer hover:underline uppercase block ml-auto"
                            >
                                VIEW FULL CALENDAR →
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

