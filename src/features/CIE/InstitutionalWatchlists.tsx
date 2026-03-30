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
        <div className="space-y-6">
            <div className="flex items-center gap-4 px-8 py-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 backdrop-blur-md">
                <Bell size={18} />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Macro Alert History</span>
            </div>
            {isLoading ? (
                <div className="h-20 bg-white/[0.02] rounded-3xl animate-pulse" />
            ) : alerts && alerts.length > 0 ? (
                <div className="space-y-3">
                    {alerts.map(alert => (
                        <div key={alert.id} className="p-6 rounded-[2rem] bg-black/40 border border-white/5 backdrop-blur-3xl flex justify-between items-start group hover:border-blue-500/30 transition-all">
                            <div className="flex-1">
                                <span className="text-xs font-black uppercase text-blue-400 tracking-widest block mb-2">{alert.ticker}</span>
                                <p className="text-xs text-white/60 font-medium leading-relaxed">{alert.message}</p>
                            </div>
                            <span className="text-xs text-white/20 uppercase font-black tracking-widest ml-4">{new Date(alert.created_at).toLocaleDateString()}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-12 text-center bg-white/[0.01] border border-dashed border-white/12 rounded-[2rem]">
                    <p className="text-xs text-white/20 uppercase font-black tracking-widest">No active alerts detected</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
                {/* Watchlists */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between px-8 py-5 rounded-[2rem] bg-orange-500/10 border border-orange-500/20 text-orange-400 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <Shield size={20} />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">CIE Institutional Watchlists</span>
                        </div>
                        <button className="px-6 py-2 rounded-xl bg-orange-500/20 text-xs font-black uppercase tracking-widest hover:bg-orange-500/30 transition-all border border-orange-500/20">
                            + Initialize
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2].map(i => (
                                <div key={i} className="h-48 rounded-[2rem] bg-white/[0.02] border border-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : watchlists && watchlists.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {watchlists.map((list) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={list.id}
                                    className="p-8 rounded-[2.5rem] border border-white/5 bg-black/40 backdrop-blur-3xl hover:border-orange-500/30 transition-all cursor-pointer group flex flex-col justify-between min-h-[220px]"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-black text-white group-hover:text-orange-400 transition-colors italic tracking-tight">{list.name}</h3>
                                        <div className="p-3 rounded-2xl bg-white/5 text-white/20 group-hover:text-white transition-colors border border-white/12">
                                            <Eye size={18} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-black uppercase tracking-widest text-white/20">
                                            {list.company_ids.length} Equities Tracking
                                        </div>
                                        <span className="text-xs font-black uppercase text-orange-400/60 bg-orange-500/5 px-3 py-1.5 rounded-full border border-orange-500/10">Active Protection</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-16 text-center bg-white/[0.01] border border-dashed border-white/12 rounded-[3rem] flex flex-col items-center group hover:bg-white/[0.02] transition-all">
                            <div className="p-6 rounded-full bg-white/5 mb-6 group-hover:scale-110 transition-transform">
                                <Lock size={40} className="text-white/10" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/20 mb-2">No Institutional Watchlists Provisioned</h3>
                            <p className="text-xs text-white/10 max-w-xs font-medium uppercase tracking-widest">Create a watchlist to enable real-time macro telemetry on specific tickers.</p>
                        </div>
                    )}
                </div>

                {/* Saved Views */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between px-8 py-5 rounded-[2rem] bg-white/5 border border-white/12 text-white/40 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <Activity size={20} />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Saved Macro Topographies</span>
                        </div>
                    </div>
                    {savedViews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {savedViews.map((view) => (
                                <div key={view.name} className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 backdrop-blur-3xl flex justify-between items-center group hover:border-blue-500/30 transition-all">
                                    <div>
                                        <h4 className="text-lg font-black text-white italic tracking-tight mb-2 group-hover:text-blue-400 transition-colors uppercase">{view.name}</h4>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-blue-400/60 bg-blue-500/5 px-2.5 py-1 rounded-md border border-blue-500/10 uppercase tracking-widest">
                                                {Object.keys(view.filters).length} Parameter Overlays
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteView(view.name)}
                                        className="p-3 rounded-2xl bg-white/5 text-white/10 hover:text-rose-400 hover:bg-rose-500/10 border border-white/12 hover:border-rose-500/20 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-16 text-center bg-white/[0.01] border border-dashed border-white/12 rounded-[3rem]">
                            <p className="text-xs text-white/20 uppercase font-black tracking-[0.2em]">No saved topographical views detected</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Alerts */}
            <div className="space-y-12">
                <AlertHistory />
            </div>
        </div>
    );
};
