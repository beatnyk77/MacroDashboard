import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye } from 'lucide-react';

interface Watchlist {
    id: string;
    name: string;
    company_ids: string[];
    created_at: string;
}

export const InstitutionalWatchlists: React.FC = () => {
    const { data: watchlists, isLoading } = useQuery({
        queryKey: ['cie-watchlists'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cie_watchlists')
                .select('*')
                .order('created_at', { ascending: false });

            // If table doesn't exist or RLS blocks it, return empty array for now
            if (error) {
                console.error(error);
                return [] as Watchlist[];
            }
            return data as Watchlist[];
        }
    });

    return (
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
                            <div className="flex -space-x-2">
                                {Array.from({ length: Math.min(list.company_ids.length, 5) }).map((_, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#050810] bg-blue-500/20 flex items-center justify-center text-[0.5rem] font-black text-blue-400">
                                        EQ
                                    </div>
                                ))}
                                {list.company_ids.length > 5 && (
                                    <div className="w-8 h-8 rounded-full border-2 border-[#050810] bg-white/10 flex items-center justify-center text-[0.55rem] font-black text-white/60">
                                        +{list.company_ids.length - 5}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="p-12 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-3xl flex flex-col items-center">
                    <Lock size={32} className="text-white/10 mb-4" />
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/20 mb-2">No Watchlists Setup</h3>
                    <p className="text-[0.65rem] text-muted-foreground/40 max-w-sm mx-auto font-medium">
                        Create your first watchlist to track sovereign risk, fiscal stress, and macro impact across a custom basket of Indian equities.
                    </p>
                </div>
            )}
        </div>
    );
};
