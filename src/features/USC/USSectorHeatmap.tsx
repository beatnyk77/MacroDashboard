import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Box, Typography, Grid, Skeleton, LinearProgress } from '@mui/material';
import { TrendingUp, ShieldAlert, Zap } from 'lucide-react';

export const USSectorHeatmap: React.FC = () => {
    const { data: sectors, isLoading } = useQuery({
        queryKey: ['us-sector-summary'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('us_sector_summary')
                .select('*')
                .order('company_count', { ascending: false });

            if (error) throw error;
            return data;
        }
    });

    if (isLoading) {
        return (
            <Grid container spacing={3}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <Grid item xs={12} md={4} key={i}>
                        <Skeleton variant="rounded" height={160} sx={{ bgcolor: 'white/5', borderRadius: '24px' }} />
                    </Grid>
                ))}
            </Grid>
        );
    }

    return (
        <Box>
            <Grid container spacing={4}>
                {sectors?.map((s: any) => (
                    <Grid item xs={12} md={4} key={s.sector}>
                        <Box sx={{
                            p: 6,
                            borderRadius: '32px',
                            bgcolor: 'white/[0.02]',
                            border: '1px solid rgba(255,255,255,0.05)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                bgcolor: 'white/[0.04]',
                                borderColor: s.avg_pe > 25 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                transform: 'translateY(-4px)'
                            }
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                                <Typography variant="h6" sx={{ fontWeight: 900, color: 'white', letterSpacing: '-0.01em' }}>
                                    {s.sector || 'Unclassified'}
                                </Typography>
                                <Typography variant="caption" sx={{ px: 2, py: 0.5, borderRadius: '8px', bgcolor: 'white/5', fontWeight: 800, color: 'white/40' }}>
                                    {s.company_count} COS
                                </Typography>
                            </Box>

                            <Box sx={{ spaceY: 5 }}>
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TrendingUp size={12} className="text-blue-400" />
                                            <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', color: 'white/30', letterSpacing: '0.05em' }}>AVG P/E</Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ fontWeight: 900, color: s.avg_pe > 25 ? '#f43f5e' : 'white' }}>{s.avg_pe?.toFixed(1) || '—'}</Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min((s.avg_pe / 40) * 100, 100)}
                                        sx={{ height: 4, borderRadius: 2, bgcolor: 'white/5', '& .MuiLinearProgress-bar': { bgcolor: s.avg_pe > 25 ? '#f43f5e' : '#3b82f6' } }}
                                    />
                                </Box>

                                <Box sx={{ mt: 4 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ShieldAlert size={12} className="text-rose-400" />
                                            <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', color: 'white/30', letterSpacing: '0.05em' }}>Avg Debt/Eq</Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ fontWeight: 900, color: s.avg_debt_equity > 1.2 ? '#f43f5e' : 'white' }}>{s.avg_debt_equity?.toFixed(2) || '—'}</Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min((s.avg_debt_equity / 2) * 100, 100)}
                                        sx={{ height: 4, borderRadius: 2, bgcolor: 'white/5', '& .MuiLinearProgress-bar': { bgcolor: s.avg_debt_equity > 1.2 ? '#f43f5e' : '#a855f7' } }}
                                    />
                                </Box>

                                <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Zap size={12} className="text-emerald-400" />
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'white/30' }}>AVG ROE</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 900, color: 'emerald.400' }}>{(s.avg_roe * 100).toFixed(1)}%</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};
