import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Bell, Trash2, Activity } from 'lucide-react';

interface Watchlist {
    id: string;
    name: string;
    company_ids: string[];
    created_at: string;
}

interface Alert {
    id: string;
    ticker: string;
    message: string;
    alert_type: string;
    created_at: string;
}

export const AlertHistory: React.FC = () => {
    const { data: alerts, isLoading } = useQuery({
        queryKey: ['cie-alerts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cie_alerts')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) return [] as Alert[];
            return data as Alert[];
        }
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Bell size={16} />
                <span className="text-[0.7rem] font-black uppercase tracking-widest">Macro Alert History</span>
            </div>
            {isLoading ? (
                <div className="h-20 bg-white/[0.02] rounded-2xl animate-pulse" />
            ) : alerts && alerts.length > 0 ? (
                <div className="space-y-2">
                    {alerts.map(alert => (
                        <div key={alert.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex justify-between items-center">
                            <div>
                                <span className="text-[0.6rem] font-black uppercase text-blue-400 mr-2">{alert.ticker}</span>
                                <p className="text-xs text-white/80">{alert.message}</p>
                            </div>
                            <span className="text-[0.6rem] text-white/30 uppercase">{new Date(alert.created_at).toLocaleDateString()}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-8 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-3xl">
                    <p className="text-[0.6rem] text-white/20 uppercase font-black tracking-widest">No active alerts</p>
                </div>
            )}
        </div>
    );
};

export const InstitutionalWatchlists: React.FC = () => {
    const [savedViews, setSavedViews] = React.useState<{ name: string; filters: any }[]>(() => {
        const saved = localStorage.getItem('cie_saved_views');
        return saved ? JSON.parse(saved) : [];
    });

    const deleteView = (name: string) => {
        const newViews = savedViews.filter(v => v.name !== name);
        setSavedViews(newViews);
        localStorage.setItem('cie_saved_views', JSON.stringify(newViews));
    };

    const { data: watchlists, isLoading } = useQuery({
        queryKey: ['cie-watchlists'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cie_watchlists')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) return [] as Watchlist[];
            return data as Watchlist[];
        }
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Watchlists */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                        <div className="flex items-center gap-3">
                            <Shield size={16} />
                            <span className="text-[0.7rem] font-black uppercase tracking-widest">My Institutional Watchlists</span>
                        </div>
                        <button className="px-3 py-1 rounded-lg bg-orange-500/20 text-[0.6rem] font-black uppercase tracking-widest hover:bg-orange-500/30 transition-colors">
                            + New Watchlist
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2].map(i => (
                                <div key={i} className="h-40 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : watchlists && watchlists.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {watchlists.map((list) => (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    key={list.id}
                                    className="p-6 rounded-3xl border border-white/5 bg-black/20 hover:border-white/10 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-black text-white group-hover:text-orange-400 transition-colors">{list.name}</h3>
                                        <div className="p-2 rounded-full bg-white/5 text-white/40">
                                            <Eye size={14} />
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium text-white/40 mb-6">
                                        {list.company_ids.length} Equities Tracked
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-3xl flex flex-col items-center">
                            <Lock size={32} className="text-white/10 mb-4" />
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/20 mb-2">No Watchlists Setup</h3>
                        </div>
                    )}
                </div>

                {/* Saved Views */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60">
                        <div className="flex items-center gap-3">
                            <Activity size={16} />
                            <span className="text-[0.7rem] font-black uppercase tracking-widest">Saved Screener Views</span>
                        </div>
                    </div>
                    {savedViews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {savedViews.map((view) => (
                                <div key={view.name} className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex justify-between items-center group">
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-1">{view.name}</h4>
                                        <p className="text-[0.6rem] text-white/30 uppercase font-bold">
                                            {Object.keys(view.filters).length} Filters Active
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => deleteView(view.name)}
                                        className="p-2 rounded-lg hover:bg-rose-500/10 text-white/10 hover:text-rose-400 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-3xl">
                            <p className="text-[0.6rem] text-white/20 uppercase font-black tracking-widest">No saved views</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Alerts */}
            <div className="space-y-8">
                <AlertHistory />
            </div>
        </div>
    );
};
