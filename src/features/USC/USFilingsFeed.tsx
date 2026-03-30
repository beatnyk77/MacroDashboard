import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Box, Typography, Skeleton } from '@mui/material';
import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const USFilingsFeed: React.FC = () => {
    const { data: filings, isLoading } = useQuery({
        queryKey: ['us-live-filings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('us_filings')
                .select('*, us_companies(name, sector)')
                .order('filing_date', { ascending: false })
                .limit(40);

            if (error) throw error;
            return data;
        }
    });

    if (isLoading) {
        return (
            <Box sx={{ spaceY: 3 }}>
                {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} variant="rounded" height={60} sx={{ bgcolor: 'white/5', mb: 1, borderRadius: '16px' }} />
                ))}
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: 'white' }}>Regulatory Pulse Stream</Typography>
                <Typography variant="caption" sx={{ color: 'white/30', fontWeight: 800, textTransform: 'uppercase' }}>Official 8-K Event Filings • Real-time SEC Feed</Typography>
            </Box>

            <Box sx={{ spaceY: 2 }}>
                {filings?.map((f: any) => (
                    <Box key={f.id} sx={{
                        p: 3,
                        mb: 2,
                        borderRadius: '16px',
                        bgcolor: 'white/[0.01]',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 0.2s',
                        '&:hover': {
                            bgcolor: 'white/[0.03]',
                            borderColor: 'blue.500/20'
                        }
                    }}>
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-uppercase leading-none">
                                    {f.form_type}
                                </span>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: 'white' }}>{f.description}</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: 'white/40', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                                <Link to={`/us-equities/equity/${f.ticker}`} className="text-white/60 hover:text-white transition-colors">{f.us_companies?.name || f.ticker}</Link> &bull; {f.us_companies?.sector || 'US Equity'}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" sx={{ display: 'block', color: 'white/40', fontWeight: 800, lineHeight: 1 }}>
                                    {format(new Date(f.filing_date), 'HH:mm')}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'white/20', fontWeight: 800 }}>
                                    {format(new Date(f.filing_date), 'dd MMM')}
                                </Typography>
                            </Box>
                            <a href={f.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                                <ExternalLink size={14} />
                            </a>
                        </Box>
                    </Box>
                ))}
            </Box>

            {filings?.length === 0 && (
                <Box sx={{ py: 15, textAlign: 'center', bgcolor: 'white/[0.01]', borderRadius: '32px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                    <Typography variant="body2" sx={{ color: 'white/20', fontWeight: 900, textTransform: 'uppercase' }}>
                        SEC Feed Currently Dormant
                    </Typography>
                </Box>
            )}
        </Box>
    );
};
