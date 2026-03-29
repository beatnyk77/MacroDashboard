import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Filter, ExternalLink, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMacroEvents } from '@/hooks/useMacroEvents';
import { Skeleton } from '@/components/ui/skeleton';

export const MacroEconomicCalendar: React.FC = () => {
    const { data: events, isLoading } = useMacroEvents();
    const [filter, setFilter] = useState<'all' | 'high'>('all');
    const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');

    if (isLoading) return <Skeleton className="w-full h-[400px] rounded-2xl" />;

    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const currencies = ['ALL', ...new Set(events?.map(e => e.country) || [])].sort();

    const filteredEvents = (events || [])
        .filter(e => filter === 'all' || e.impact_level === 'High')
        .filter(e => currencyFilter === 'ALL' || e.country === currencyFilter);

    const getImpactColor = (impact: string) => {
        switch (impact.toLowerCase()) {
            case 'high': return 'bg-rose-500 text-rose-50';
            case 'medium': return 'bg-amber-500 text-amber-50';
            case 'low': return 'bg-emerald-500 text-emerald-50';
            default: return 'bg-slate-500';
        }
    };

    return (
        <Card className="w-full bg-black/40 border-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-white/5 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold tracking-tight text-foreground">Global Economic Calendar</CardTitle>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">Live high-impact macro events & policy decisions</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <select
                        value={currencyFilter}
                        onChange={(e) => setCurrencyFilter(e.target.value)}
                        className="bg-white/5 border-white/5 rounded-md text-xs font-bold text-muted-foreground px-2 py-1.5 focus:outline-none hover:bg-white/10 transition-colors"
                    >
                        {currencies.map(curr => (
                            <option key={curr} value={curr} className="bg-slate-900">{curr}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setFilter(filter === 'all' ? 'high' : 'all')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all border",
                            filter === 'high'
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                    >
                        <Filter className="w-3 h-3" />
                        {filter === 'high' ? 'High Impact' : 'All Impact'}
                    </button>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto overflow-y-auto max-h-[450px] md:max-h-[320px] lg:max-h-[380px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <table className="w-full text-sm text-left border-separate border-spacing-0">
                        <thead className="text-xs font-black uppercase tracking-wider text-muted-foreground/50 sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md">
                            <tr>
                                <th className="px-6 py-3 w-[120px] border-b border-white/5">Date / Time</th>
                                <th className="px-6 py-3 w-[80px] border-b border-white/5">Curr</th>
                                <th className="px-6 py-3 w-[80px] text-center border-b border-white/5">Impact</th>
                                <th className="px-6 py-3 border-b border-white/5">Event</th>
                                <th className="px-6 py-3 w-[100px] text-right border-b border-white/5">Actual</th>
                                <th className="px-6 py-3 w-[100px] text-right border-b border-white/5">Forecast</th>
                                <th className="px-6 py-3 w-[100px] text-right border-b border-white/5">Previous</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredEvents.length > 0 ? filteredEvents.map((event) => {
                                const eventDate = new Date(event.event_date);
                                const isLive = Math.abs(now - eventDate.getTime()) < 3600000; // Within 1 hour

                                return (
                                    <tr key={event.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-mono font-bold text-muted-foreground group-hover:text-foreground transition-colors text-xs">
                                                    {eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                                <span className="text-xs text-muted-foreground/40 font-mono">
                                                    {eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-foreground">
                                            {event.country}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={cn("inline-flex h-3 w-8 rounded-full", getImpactColor(event.impact_level))} />
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-foreground/90">
                                            {event.event_name}
                                            {isLive && (
                                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400 animate-pulse">
                                                    LIVE
                                                </span>
                                            )}
                                        </td>
                                        <td className={cn(
                                            "px-6 py-4 font-mono font-bold text-right",
                                            event.actual ? "text-emerald-400" : "text-muted-foreground/30"
                                        )}>
                                            {event.actual || '---'}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-medium text-muted-foreground text-right">
                                            {event.forecast || '---'}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-medium text-muted-foreground/60 text-right">
                                            {event.previous || '---'}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground font-medium italic">
                                        No macro events found for the selected filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-white/5 bg-white/[0.01]">
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>Time Zone: Local Time</span>
                        </div>
                        <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                            <span>Powered by Finnhub</span>
                            <ExternalLink className="w-3 h-3" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
