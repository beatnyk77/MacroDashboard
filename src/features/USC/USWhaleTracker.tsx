import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Box, Typography, Skeleton } from '@mui/material';
import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const USWhaleTracker: React.FC = () => {
    const { data: whaleHoldings, isLoading } = useQuery({
        queryKey: ['us-whale-holdings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('us_13f_holdings')
                .select('*, us_companies(name, sector)')
                .order('value_usd', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data;
        }
    });

    if (isLoading) {
        return (
            <Box sx={{ spaceY: 3 }}>
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} variant="rounded" height={100} sx={{ bgcolor: 'white/5', mb: 2, borderRadius: '24px' }} />
                ))}
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: 'white' }}>13F Whale Tracker</Typography>
                <Typography variant="caption" sx={{ color: 'white/30', fontWeight: 800, textTransform: 'uppercase' }}>Institutional Positioning • Top Holding Conviction</Typography>
            </Box>

            <Box sx={{ overflowX: 'auto' }}>
                <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                        <tr className="text-xs font-black uppercase tracking-widest text-white/20">
                            <th className="px-6 pb-2">Institutional Manager</th>
                            <th className="px-6 pb-2">Securities Held</th>
                            <th className="px-6 pb-2 text-right">Value ($M)</th>
                            <th className="px-6 pb-2 text-right">Shares</th>
                            <th className="px-6 pb-2 text-right">Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {whaleHoldings?.map((h: any) => (
                            <tr key={h.id} className="group hover:bg-white/[0.02] transition-all bg-white/[0.01]">
                                <td className="px-6 py-4 rounded-l-2xl border-y border-l border-white/5 group-hover:border-white/12">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'white' }}>{h.manager_name}</Typography>
                                            <Typography variant="caption" sx={{ color: 'white/30', fontWeight: 600, fontSize: '0.6rem' }}>FORM 13F-HR • Q4 2025</Typography>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 border-y border-white/5 group-hover:border-white/12">
                                    <Link to={`/us-equities/equity/${h.ticker}`} className="inline-flex items-center gap-2 px-2 py-1 rounded bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all">
                                        <span className="text-xs font-black text-blue-400">{h.ticker}</span>
                                        <span className="text-xs font-bold text-white/40 truncate max-w-[100px]">{h.us_companies?.name}</span>
                                    </Link>
                                </td>
                                <td className="px-6 py-4 border-y border-white/5 group-hover:border-white/12 text-right">
                                    <span className="text-sm font-mono font-black text-white">{(h.shares_value / 1000000).toFixed(1)}M</span>
                                </td>
                                <td className="px-6 py-4 border-y border-white/5 group-hover:border-white/12 text-right">
                                    <span className="text-xs font-mono font-bold text-white/40">{h.shares_count?.toLocaleString()}</span>
                                </td>
                                <td className="px-6 py-4 rounded-r-2xl border-y border-r border-white/5 group-hover:border-white/12 text-right">
                                    <span className="text-xs font-black text-emerald-400">NEW</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!whaleHoldings || whaleHoldings.length === 0 && (
                    <Box sx={{ py: 15, textAlign: 'center', bgcolor: 'white/[0.01]', borderRadius: '32px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                        <Typography variant="body2" sx={{ color: 'white/20', fontWeight: 900, textTransform: 'uppercase' }}>
                            Awaiting Q4 13F Data Ingestion
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};
