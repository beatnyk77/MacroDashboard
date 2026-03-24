import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Box, Typography, TextField, InputAdornment, Skeleton } from '@mui/material';
import { Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export const USScreener: React.FC = () => {
    const [search, setSearch] = useState('');

    const { data: companies, isLoading } = useQuery({
        queryKey: ['us-screener-data'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('us_companies')
                .select('*, us_fundamentals(*)');

            if (error) throw error;

            // Map latest fundamentals to each company
            return data.map((c: any) => {
                const latest = [...(c.us_fundamentals || [])].sort((a, b) =>
                    new Date(b.period_end).getTime() - new Date(a.period_end).getTime()
                )[0] || {};
                return { ...c, latest };
            }).sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
        }
    });

    const filtered = companies?.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.ticker.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) {
        return (
            <Box sx={{ spaceY: 2 }}>
                {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} variant="rounded" height={60} sx={{ bgcolor: 'white/5', mb: 1, borderRadius: 2 }} />
                ))}
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Search by Ticker or Company Name..."
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={18} className="text-white/20" />
                            </InputAdornment>
                        ),
                        sx: {
                            bgcolor: 'white/[0.02]',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            color: 'white',
                            '& fieldset': { border: 'none' },
                            '&:hover': { bgcolor: 'white/[0.04]' }
                        }
                    }}
                />
                <Box sx={{
                    px: 3,
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'white/[0.02]',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    cursor: 'pointer'
                }}>
                    <Filter size={18} className="text-blue-400" />
                </Box>
            </Box>

            <Box sx={{ overflowX: 'auto' }}>
                <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                        <tr className="text-[0.6rem] font-black uppercase tracking-widest text-white/20">
                            <th className="px-6 pb-2">Company</th>
                            <th className="px-6 pb-2 text-right">P/E</th>
                            <th className="px-6 pb-2 text-right">P/B</th>
                            <th className="px-6 pb-2 text-right">EV/EBITDA</th>
                            <th className="px-6 pb-2 text-right">ROE</th>
                            <th className="px-6 pb-2 text-right">OP Margin</th>
                            <th className="px-6 pb-2 text-right">FCF Yield</th>
                            <th className="px-6 pb-2 text-right">Debt/Eq</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered?.map((c: any) => (
                            <tr key={c.id} className="group hover:bg-white/[0.02] transition-all bg-white/[0.01]">
                                <td className="px-6 py-4 rounded-l-2xl border-y border-l border-white/5 group-hover:border-white/10">
                                    <Link to={`/us-equities/equity/${c.ticker}`} className="block">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-black text-[0.65rem] text-blue-400">
                                                {c.ticker}
                                            </div>
                                            <div>
                                                <Typography variant="body2" sx={{ fontWeight: 800, color: 'white' }}>{c.name}</Typography>
                                                <Typography variant="caption" sx={{ color: 'white/30', fontWeight: 600, fontSize: '0.6rem', textTransform: 'uppercase' }}>
                                                    {c.sector}
                                                </Typography>
                                            </div>
                                        </div>
                                    </Link>
                                </td>
                                <td className="px-6 py-4 border-y border-white/5 group-hover:border-white/10 text-right">
                                    <span className="text-xs font-mono font-bold text-white/80">{c.latest.pe_ratio?.toFixed(1) || '—'}</span>
                                </td>
                                <td className="px-6 py-4 border-y border-white/5 group-hover:border-white/10 text-right">
                                    <span className="text-xs font-mono font-bold text-white/80">{c.latest.pb_ratio?.toFixed(1) || '—'}</span>
                                </td>
                                <td className="px-6 py-4 border-y border-white/5 group-hover:border-white/10 text-right">
                                    <span className="text-xs font-mono font-bold text-white/80">{c.latest.ev_ebitda?.toFixed(1) || '—'}</span>
                                </td>
                                <td className="px-6 py-4 border-y border-white/5 group-hover:border-white/10 text-right">
                                    <span className={`text-xs font-mono font-bold ${c.latest.roe > 0.15 ? 'text-emerald-400' : 'text-white/60'}`}>
                                        {c.latest.roe ? `${(c.latest.roe * 100).toFixed(1)}%` : '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 border-y border-white/5 group-hover:border-white/10 text-right">
                                    <span className="text-xs font-mono font-bold text-white/60">
                                        {c.latest.operating_margin ? `${(c.latest.operating_margin * 100).toFixed(1)}%` : '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 border-y border-white/5 group-hover:border-white/10 text-right">
                                    <span className="text-xs font-mono font-bold text-emerald-400">
                                        {c.latest.fcf_yield ? `${(c.latest.fcf_yield * 100).toFixed(1)}%` : '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 rounded-r-2xl border-y border-r border-white/5 group-hover:border-white/10 text-right">
                                    <span className={`text-xs font-mono font-bold ${c.latest.debt_equity > 1.5 ? 'text-rose-400' : 'text-white/60'}`}>
                                        {c.latest.debt_equity?.toFixed(2) || '—'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered?.length === 0 && (
                    <Box sx={{ py: 10, textAlign: 'center', bgcolor: 'white/[0.01]', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                        <Typography variant="body2" sx={{ color: 'white/20', fontWeight: 900, textTransform: 'uppercase' }}>
                            Zero Securities Matched Your Pulse
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};
