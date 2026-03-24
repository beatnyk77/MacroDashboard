import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Box, Typography, Skeleton } from '@mui/material';
import { format } from 'date-fns';
import { User, ArrowUpRight, ArrowDownRight, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

export const USInsiderActivity: React.FC = () => {
    const { data: insiderTrades, isLoading } = useQuery({
        queryKey: ['us-insider-activity'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('us_insider_trades')
                .select('*, us_companies(name)')
                .order('transaction_date', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data;
        }
    });

    if (isLoading) {
        return (
            <Box sx={{ spaceY: 3 }}>
                {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} variant="rounded" height={80} sx={{ bgcolor: 'white/5', mb: 2, borderRadius: '24px' }} />
                ))}
            </Box>
        );
    }

    return (
        <Box sx={{ spaceY: 3 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: 'white' }}>Live Insider Pulse</Typography>
                <Typography variant="caption" sx={{ color: 'white/30', fontWeight: 800, textTransform: 'uppercase' }}>Recent Form 4 Filings • High Conviction Operations</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {insiderTrades?.map((t: any) => (
                    <Box key={t.id} sx={{
                        p: 4,
                        borderRadius: '24px',
                        bgcolor: 'white/[0.01]',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'between',
                        gap: 4,
                        transition: 'all 0.2s',
                        '&:hover': {
                            bgcolor: 'white/[0.03]',
                            borderColor: 'white/10'
                        }
                    }}>
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Box sx={{
                                w: 48,
                                h: 48,
                                borderRadius: '16px',
                                bgcolor: t.transaction_type === 'BUY' ? 'emerald.500/10' : 'rose.500/10',
                                border: '1px solid',
                                borderColor: t.transaction_type === 'BUY' ? 'emerald.500/20' : 'rose.500/20',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {t.transaction_type === 'BUY' ? <ArrowUpRight size={20} className="text-emerald-400" /> : <ArrowDownRight size={20} className="text-rose-400" />}
                            </Box>
                            <div>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: 'white' }}>{t.insider_name}</Typography>
                                <Typography variant="caption" sx={{ color: 'white/40', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                                    {t.insider_title} &bull; <Link to={`/us-equities/equity/${t.ticker}`} className="text-blue-400/80 hover:text-blue-400 transition-colors">{t.us_companies?.name || t.ticker}</Link>
                                </Typography>
                            </div>
                        </Box>

                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body1" sx={{ fontWeight: 900, color: t.transaction_type === 'BUY' ? 'emerald.400' : 'rose.400' }}>
                                {t.transaction_type === 'BUY' ? '+' : '-'}${Math.abs(t.total_value || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'white/20', fontWeight: 800, textTransform: 'uppercase' }}>
                                {t.shares_traded?.toLocaleString()} SHARES &bull; {format(new Date(t.transaction_date), 'dd MMM')}
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Box>

            {insiderTrades?.length === 0 && (
                <Box sx={{ py: 15, textAlign: 'center', bgcolor: 'white/[0.01]', borderRadius: '32px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                    <Typography variant="body2" sx={{ color: 'white/20', fontWeight: 900, textTransform: 'uppercase' }}>
                        No High-Value Insider Pulse Detected
                    </Typography>
                </Box>
            )}
        </Box>
    );
};
