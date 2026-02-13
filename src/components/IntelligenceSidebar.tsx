import React, { useState } from 'react';
import {
    ChevronRight,
    ChevronLeft,
    Newspaper,
    ExternalLink,
    Clock,
    TrendingUp
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const IntelligenceSidebar: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const { data: headlines, isLoading } = useQuery({
        queryKey: ['news-headlines'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('macro_news_headlines')
                .select('*')
                .order('published_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            return data;
        },
        refetchInterval: 300000 // 5m
    });

    if (isCollapsed) {
        return (
            <button
                onClick={() => setIsCollapsed(false)}
                className="fixed right-0 top-1/2 -translate-y-1/2 bg-background border border-r-0 border-white/10 p-2 rounded-l-xl hover:bg-white/5 transition-all z-[1100] shadow-2xl"
            >
                <ChevronLeft size={20} className="text-muted-foreground" />
            </button>
        );
    }

    return (
        <aside className="hidden xl:flex w-[280px] h-[calc(100vh-72px)] sticky top-[72px] right-0 flex-col border-l border-white/10 bg-background/50 backdrop-blur-xl z-[1100]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2">
                    <Newspaper size={18} className="text-blue-400" />
                    <span className="text-xs font-black tracking-widest uppercase text-primary">Intelligence</span>
                </div>
                <button
                    onClick={() => setIsCollapsed(true)}
                    className="p-1 hover:bg-white/10 rounded-md transition-colors"
                >
                    <ChevronRight size={18} className="text-muted-foreground" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="px-4 py-6 space-y-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-24 bg-white/5 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        headlines?.map((item: any) => (
                            <a
                                key={item.id}
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group"
                            >
                                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase tracking-tighter">
                                            {item.source}
                                        </span>
                                        <span className="text-[0.65rem] text-muted-foreground/50 flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(item.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-semibold leading-relaxed group-hover:text-primary transition-colors line-clamp-3 mb-3">
                                        {item.title}
                                    </h4>
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-1 overflow-hidden">
                                            {item.keywords?.slice(0, 2).map((k: string) => (
                                                <span key={k} className="text-[0.6rem] text-muted-foreground/60 truncate">#{k}</span>
                                            ))}
                                        </div>
                                        <ExternalLink size={10} className="text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                                    </div>
                                </div>
                            </a>
                        ))
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-white/5">
                <div className="flex items-center gap-2 text-[0.65rem] text-muted-foreground">
                    <TrendingUp size={12} className="text-emerald-500" />
                    <span className="font-bold uppercase tracking-widest">Market Pulse: Active</span>
                </div>
            </div>
        </aside>
    );
};
