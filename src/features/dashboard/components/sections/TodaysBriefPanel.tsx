import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertCircle, Newspaper, ExternalLink, AlertTriangle } from 'lucide-react';
import { useRegime } from '@/hooks/useRegime';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { useMacroHeadlines, MacroHeadline, isHeadlineStale, timeAgo } from '@/hooks/useMacroHeadlines';
import { formatBillions } from '@/utils/formatNumber';
import { cn } from '@/lib/utils';
import { Card, CardContent } from "@/components/ui/card";

interface TodaysBriefPanelProps {
    className?: string;
    sx?: any; // Deprecated, kept for compatibility
}

type FeedTab = 'all' | 'india' | 'global';

export const TodaysBriefPanel: React.FC<TodaysBriefPanelProps> = ({ className }) => {
    const { data: regime } = useRegime();
    const { data: liquidity } = useNetLiquidity();
    const { data: headlines } = useMacroHeadlines();
    const [activeTab, setActiveTab] = useState<FeedTab>('all');

    // Restoration of missing variables for JSX
    const liquidityDelta = liquidity?.delta || null;
    const liquidityStatus = liquidityDelta ? (liquidityDelta > 0 ? 'Expanding' : 'Contracting') : 'Awaiting Data';

    const getLiquidityColorClass = () => {
        if (!liquidityDelta) return 'text-muted-foreground';
        return liquidityDelta > 0 ? 'text-emerald-500' : 'text-rose-500';
    };

    // Filter headlines by tab
    const filteredHeadlines = useMemo(() => {
        if (!headlines || headlines.length === 0) return [];
        let filtered = headlines;
        if (activeTab === 'india') {
            filtered = headlines.filter(h => h.category === 'India');
        } else if (activeTab === 'global') {
            filtered = headlines.filter(h => h.category === 'Global' || !h.category);
        }
        return filtered.slice(0, 8);
    }, [headlines, activeTab]);

    const handleScrollTo = (anchor: string) => {
        const element = document.querySelector(anchor);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleHighlight = (label: string, anchor: string) => {
        handleScrollTo(anchor);
        let metricId = '';
        const lowerLabel = label.toLowerCase();

        if (lowerLabel.includes('liquidity') || lowerLabel.includes('fed') || lowerLabel.includes('m2')) metricId = 'NET_LIQUIDITY';
        else if (lowerLabel.includes('dollar') || lowerLabel.includes('dxy') || lowerLabel.includes('usd')) metricId = 'DXY_INDEX';
        else if (lowerLabel.includes('gold') || lowerLabel.includes('precious')) metricId = 'GOLD_PRICE_USD';
        else if (lowerLabel.includes('oil') || lowerLabel.includes('wti') || lowerLabel.includes('crude') || lowerLabel.includes('energy')) metricId = 'CRUDE_OIL';
        else if (lowerLabel.includes('yield') || lowerLabel.includes('treasury') || lowerLabel.includes('curve') || lowerLabel.includes('rates')) metricId = 'YIELD_CURVE';
        else if (lowerLabel.includes('volatility') || lowerLabel.includes('vix') || lowerLabel.includes('fear')) metricId = 'VIX_INDEX';

        if (metricId) {
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

    /** Source color badge */
    const getSourceColor = (source: string): string => {
        if (source.includes('Economic Times') || source.includes('Mint')) return 'text-emerald-400 bg-emerald-500/10';
        if (source.includes('RBI') || source.includes('India')) return 'text-blue-400 bg-blue-500/10';
        if (source.includes('Bloomberg')) return 'text-purple-400 bg-purple-500/10';
        if (source.includes('Reuters')) return 'text-orange-400 bg-orange-500/10';
        if (source.includes('FT') || source.includes('Financial')) return 'text-pink-400 bg-pink-500/10';
        return 'text-muted-foreground bg-white/5';
    };

    const tabs: { key: FeedTab; label: string; emoji?: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'india', label: 'India', emoji: '🇮🇳' },
        { key: 'global', label: 'Global', emoji: '🌍' },
    ];

    return (
        <Card className={cn(
            "mb-8 border-l-4 border-l-primary relative overflow-hidden shadow-2xl transition-all duration-300",
            "bg-card/40 backdrop-blur-md border-white/12 dark:border-white/5",
            className
        )}>
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />

            <CardContent className="p-6 md:p-8 relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <span className="block text-primary font-black tracking-uppercase text-xs font-sans mb-2">
                            GRAPHIQUESTOR INTELLIGENCE
                        </span>
                        <h3 className="text-3xl md:text-4xl font-serif text-foreground tracking-heading leading-tight">
                            {formatDate(new Date())}
                        </h3>
                    </div>
                    <div className="px-2 py-1 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded text-xs font-black tracking-uppercase uppercase">
                        Proprietary View
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Column 1: Core Signals (4 cols) */}
                    <div className="md:col-span-4 space-y-4">
                        <div className="p-5 rounded-lg bg-white/5 border border-white/12">
                            <div className="flex items-center gap-2 mb-3">
                                {getStatusIcon(getRegimeStatus())}
                                <span className="text-xs font-black tracking-uppercase text-muted-foreground uppercase" aria-label="Current Market Regime Status">
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

                        <div className="p-5 rounded-lg bg-white/5 border border-white/12">
                            <div className="flex items-center gap-2 mb-3">
                                {liquidityDelta && liquidityDelta > 0 ? (
                                    <TrendingUp size={16} className="text-emerald-500" />
                                ) : (
                                    <TrendingDown size={16} className="text-rose-500" />
                                )}
                                <span className="text-xs font-black tracking-uppercase text-muted-foreground uppercase" aria-label="Liquidity Signal">
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

                    {/* Column 2: Market Briefing with India/Global Tabs */}
                    <div className="md:col-span-8">
                        <section className="p-5 rounded-lg bg-white/5 border border-white/12 h-full" aria-label="India Macro News Feed">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Newspaper size={16} className="text-primary" />
                                    <span className="text-xs font-black tracking-uppercase text-muted-foreground uppercase">
                                        LIVE INTELLIGENCE FEED
                                    </span>
                                </div>
                                {/* Category Tabs */}
                                <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveTab(tab.key)}
                                            className={cn(
                                                "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-uppercase transition-all duration-200",
                                                activeTab === tab.key
                                                    ? "bg-blue-500/20 text-blue-400 shadow-sm"
                                                    : "text-muted-foreground/60 hover:text-muted-foreground"
                                            )}
                                        >
                                            {tab.emoji && <span className="mr-1">{tab.emoji}</span>}
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3 divide-y divide-white/5">
                                {filteredHeadlines.length > 0 ? (
                                    filteredHeadlines.map((headline: MacroHeadline, idx: number) => {
                                        const stale = isHeadlineStale(headline.published_at);
                                        return (
                                            <div key={headline.id || idx} className="flex items-start gap-3 pt-3 first:pt-0">
                                                <div className={cn(
                                                    "mt-1.5 w-1.5 h-1.5 rounded-full shrink-0",
                                                    stale ? 'bg-amber-500/50' : (headline.category === 'India' ? 'bg-emerald-500' : 'bg-blue-500')
                                                )} />
                                                <div className="flex-1 min-w-0">
                                                    <a
                                                        href={headline.link || '#'}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => {
                                                            if (!headline.link || headline.link.includes('example.com')) {
                                                                e.preventDefault();
                                                                handleHighlight(headline.title, '#macro-orientation-section');
                                                            }
                                                        }}
                                                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 leading-relaxed cursor-pointer inline-flex items-start gap-1.5"
                                                        title={headline.title}
                                                    >
                                                        {headline.title}
                                                        {headline.link && !headline.link.includes('example.com') && (
                                                            <ExternalLink size={10} className="text-muted-foreground/40 shrink-0 mt-1" />
                                                        )}
                                                    </a>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", getSourceColor(headline.source))}>
                                                            {headline.source}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground/50 font-medium">
                                                            {timeAgo(headline.published_at)}
                                                        </span>
                                                        {stale && (
                                                            <span className="text-xs text-amber-400/80 font-bold flex items-center gap-0.5" title="This headline is older than 48 hours">
                                                                <AlertTriangle size={10} />
                                                                Stale
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <span className="text-xs text-muted-foreground text-center block py-4">
                                        {activeTab === 'india' ? 'No India-specific headlines yet — awaiting next ingest cycle...' :
                                            activeTab === 'global' ? 'No global headlines yet — awaiting next ingest cycle...' :
                                                'Awaiting institutional signal ingest...'}
                                    </span>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
