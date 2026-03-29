import React from 'react';
import { Calendar, Info } from 'lucide-react';
import { useMacroEvents, MacroEvent } from '@/hooks/useMacroEvents';
import { HoverDetail } from '@/components/HoverDetail';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const UpcomingEventsCard: React.FC = () => {
    const { data: events, isLoading } = useMacroEvents();

    if (isLoading) return <Skeleton className="h-[300px] w-full rounded-xl" />;
    if (!events || events.length === 0) return null;

    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.event_date) >= now);
    const pastEvents = events.filter(e => new Date(e.event_date) < now).reverse().slice(0, 5); // Last 5 past events

    const renderRow = (event: MacroEvent) => {
        const isPast = new Date(event.event_date) < now;

        return (
            <HoverDetail
                key={event.id}
                title={event.event_name}
                subtitle={`${new Date(event.event_date).toLocaleString()} | ${event.country}`}
                detailContent={{
                    description: `High-impact macro release for ${event.country}. Tracking ${event.event_name} allows institutional players to gauge regime shifts and liquidity cycles.`,
                    stats: [
                        { label: 'Forecast', value: event.forecast || 'N/A' },
                        { label: 'Previous', value: event.previous || 'N/A' },
                        { label: 'Impact', value: (event.impact_level || 'Medium').toUpperCase(), color: event.impact_level === 'High' ? '#f43f5e' : '#eab308' }
                    ],
                    methodology: "Surprise delta (Actual - Forecast) tracks consensus divergence. Institutional desks monitor these to anticipate volatility regimes and adjust liquidity positioning.",
                    source: event.source_url
                }}
            >
                <tr
                    className={cn(
                        "group hover:bg-white/[0.02] border-b border-white/[0.05] transition-colors last:border-0",
                        isPast && "opacity-60 grayscale-[0.5]"
                    )}
                    onClick={() => {
                        if (typeof window !== 'undefined' && 'gtag' in window) {
                            (window as any).gtag('event', 'click_calendar_event', {
                                event_name: event.event_name,
                                country: event.country,
                                impact_level: event.impact_level
                            });
                        }
                    }}
                >
                    <td className="py-3 pl-0 pr-2 w-[130px] whitespace-nowrap">
                        <div className="flex flex-col">
                            <span className={cn(
                                "font-bold text-[0.65rem] leading-tight",
                                isPast ? "text-muted-foreground" : "text-foreground"
                            )}>
                                {new Date(event.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                                {new Date(event.event_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                        </div>
                    </td>
                    <td className="py-3 px-2 w-[80px]">
                        <span className="font-extrabold text-[0.65rem] text-blue-400">
                            {event.country}
                        </span>
                    </td>
                    <td className="py-3 px-2">
                        <div className="font-semibold text-[0.75rem] truncate max-w-[200px] text-foreground">
                            {event.event_name}
                        </div>
                    </td>
                    <td className="py-3 px-2 w-[70px]">
                        <div
                            className="w-2 h-4 rounded-sm"
                            style={{
                                backgroundColor: event.impact_level === 'High' ? '#ef4444' : (event.impact_level === 'Medium' ? '#f59e0b' : '#94a3b8')
                            }}
                        />
                    </td>
                    <td className="py-3 px-2 text-right w-[90px]">
                        <span className="text-xs text-muted-foreground font-mono">{event.forecast || '-'}</span>
                    </td>
                    <td className="py-3 px-2 text-right w-[90px]">
                        <span className="text-xs text-muted-foreground/70 font-mono">{event.previous || '-'}</span>
                    </td>
                    <td className="py-3 pl-2 pr-0 text-right w-[90px]">
                        {event.actual ? (
                            <span className="font-extrabold text-[0.75rem] text-foreground font-mono">
                                {event.actual}
                            </span>
                        ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[0.55rem] font-black bg-white/[0.05] text-muted-foreground/50 tracking-wider">
                                PENDING
                            </span>
                        )}
                    </td>
                </tr>
            </HoverDetail>
        );
    };

    return (
        <Card className="h-full bg-card/40 backdrop-blur-md border-white/10 dark:border-white/5 flex flex-col gap-4 overflow-hidden p-6 shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-secondary-foreground/60" />
                    <span className="font-extrabold text-xs tracking-[0.1em] text-muted-foreground uppercase">
                        MACRO CALENDAR
                    </span>
                </div>
                <div className="group relative">
                    <Info size={14} className="text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                    <div className="absolute right-0 top-6 w-48 p-2 bg-popover border border-border rounded shadow-xl text-xs text-popover-foreground z-10 hidden group-hover:block animate-in fade-in zoom-in-95 duration-200">
                        Institutional-grade calendar powered by Finnhub. Live updates hourly.
                    </div>
                </div>
            </div>

            <div className="relative w-full overflow-auto">
                <div className="w-full">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-white/[0.05]">
                                <th className="pb-2 text-xs font-extrabold text-muted-foreground border-none pl-0 w-[130px]">DATE / TIME</th>
                                <th className="pb-2 text-xs font-extrabold text-muted-foreground border-none w-[80px]">COUNTRY</th>
                                <th className="pb-2 text-xs font-extrabold text-muted-foreground border-none">EVENT</th>
                                <th className="pb-2 text-xs font-extrabold text-muted-foreground border-none w-[70px]">IMPACT</th>
                                <th className="pb-2 text-xs font-extrabold text-muted-foreground border-none text-right w-[90px]">FORECAST</th>
                                <th className="pb-2 text-xs font-extrabold text-muted-foreground border-none text-right w-[90px]">PREVIOUS</th>
                                <th className="pb-2 text-xs font-extrabold text-muted-foreground border-none text-right w-[90px] pr-0">ACTUAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {upcomingEvents.length > 0 && upcomingEvents.slice(0, 8).map(renderRow)}

                            {pastEvents.length > 0 && (
                                <>
                                    <tr>
                                        <td colSpan={7} className="py-4 border-none">
                                            <div className="flex items-center gap-4 opacity-50">
                                                <div className="flex-1 h-px bg-border" />
                                                <span className="text-xs font-black text-muted-foreground tracking-[0.2em]">RECENT RELEASES</span>
                                                <div className="flex-1 h-px bg-border" />
                                            </div>
                                        </td>
                                    </tr>
                                    {pastEvents.map(renderRow)}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Card>
    );
};
