import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Filter, ExternalLink, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarEvent {
    id: string;
    time: string;
    currency: string;
    impact: 'high' | 'medium' | 'low';
    event: string;
    actual?: string;
    forecast?: string;
    previous?: string;
    status: 'completed' | 'upcoming' | 'live';
}

const SAMPLE_EVENTS: CalendarEvent[] = [
    { id: '1', time: '08:30', currency: 'USD', impact: 'high', event: 'CPI m/m', actual: '0.3%', forecast: '0.2%', previous: '0.1%', status: 'completed' },
    { id: '2', time: '08:30', currency: 'USD', impact: 'high', event: 'Core CPI m/m', actual: '0.3%', forecast: '0.3%', previous: '0.3%', status: 'completed' },
    { id: '3', time: '14:00', currency: 'USD', impact: 'high', event: 'FOMC Meeting Minutes', status: 'upcoming' },
    { id: '4', time: '19:50', currency: 'JPY', impact: 'medium', event: 'Prelim GDP q/q', forecast: '0.4%', previous: '-0.7%', status: 'upcoming' },
    { id: '5', time: '02:00', currency: 'GBP', impact: 'medium', event: 'CPI y/y', forecast: '4.1%', previous: '4.0%', status: 'upcoming' },
    { id: '6', time: '05:30', currency: 'INR', impact: 'high', event: 'RBI Interest Rate Decision', forecast: '6.50%', previous: '6.50%', status: 'upcoming' },
    { id: '7', time: '08:30', currency: 'CAD', impact: 'high', event: 'Employment Change', forecast: '20.0K', previous: '0.1K', status: 'upcoming' }
];

export const MacroEconomicCalendar: React.FC = () => {
    const [filter, setFilter] = useState<'all' | 'high'>('all');

    const filteredEvents = filter === 'all'
        ? SAMPLE_EVENTS
        : SAMPLE_EVENTS.filter(e => e.impact === 'high');

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'high': return 'bg-rose-500 text-rose-50';
            case 'medium': return 'bg-amber-500 text-amber-50';
            case 'low': return 'bg-emerald-500 text-emerald-50';
            default: return 'bg-slate-500';
        }
    };

    return (
        <Card className="w-full bg-black/40 border-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold tracking-tight text-foreground">Global Economic Calendar</CardTitle>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">High-impact macro events & policy decisions</p>
                    </div>
                </div>

                <div className="flex gap-2">
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
                        {filter === 'high' ? 'High Impact Only' : 'All Events'}
                    </button>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs font-black uppercase tracking-wider text-muted-foreground/50 bg-white/5">
                            <tr>
                                <th className="px-6 py-3 w-[100px]">Time</th>
                                <th className="px-6 py-3 w-[80px]">Curr</th>
                                <th className="px-6 py-3 w-[80px] text-center">Impact</th>
                                <th className="px-6 py-3">Event</th>
                                <th className="px-6 py-3 w-[100px] text-right">Actual</th>
                                <th className="px-6 py-3 w-[100px] text-right">Forecast</th>
                                <th className="px-6 py-3 w-[100px] text-right">Previous</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredEvents.map((event) => (
                                <tr key={event.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                                        {event.time}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-foreground">
                                        {event.currency}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className={cn("inline-flex h-3 w-8 rounded-full", getImpactColor(event.impact))} />
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-foreground/90">
                                        {event.event}
                                        {event.status === 'live' && (
                                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 animate-pulse">
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
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-white/5 bg-white/[0.01]">
                    <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>Time Zone: EST (UTC-5)</span>
                        </div>
                        <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                            <span>Full Calendar</span>
                            <ExternalLink className="w-3 h-3" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
