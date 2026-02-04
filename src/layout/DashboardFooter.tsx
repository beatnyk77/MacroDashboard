import React from 'react';
import { Box, Container, Grid, Typography, Link, Divider, Stack, useTheme } from '@mui/material';
import { ExternalLink, Database, Shield, Github, Activity, Clock, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const DashboardFooter: React.FC = () => {
    const theme = useTheme();
    const currentYear = new Date().getFullYear();

    // Fetch latest ingestion timestamp for trust signal
    const { data: lastIngestion } = useQuery({
        queryKey: ['last_ingestion'],
        queryFn: async () => {
            const { data } = await supabase
                .from('ingestion_logs')
                .select('completed_at')
                .order('completed_at', { ascending: false })
                .limit(1)
                .single();

            return data?.completed_at ? new Date(data.completed_at) : null;
        },
        staleTime: 1000 * 60 * 5,
    });

    const formatTimeAgo = (date: Date | null) => {
        if (!date) return 'System Syncing...';
        const diffMs = new Date().getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    };

    return (
        <Box
            component="footer"
            sx={{
                bgcolor: 'rgba(2, 6, 23, 0.8)',
                backdropFilter: 'blur(12px)',
                borderTop: '1px solid',
                borderColor: 'divider',
                pt: 6,
                pb: 4,
                mt: 'auto',
                position: 'relative',
                zIndex: 10
            }}
        >
            <Container maxWidth="xl">
                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Activity color="#3b82f6" size={24} />
                            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                                Graphi<Typography component="span" variant="h6" sx={{ fontWeight: 800, color: '#3b82f6' }}>Questor</Typography>
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 320, lineHeight: 1.6 }}>
                            The primary macro-economic observatory for institutional-grade monitoring of global liquidity, monetary regimes, and sovereign risk.
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <Link href="https://github.com" target="_blank" color="inherit" sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}>
                                <Github size={20} />
                            </Link>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                        <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.primary', mb: 2, display: 'block' }}>
                            Major Sources
                        </Typography>
                        <Stack spacing={1}>
                            <Link href="https://fred.stlouisfed.org" target="_blank" variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                                FRED (Fed) <ExternalLink size={10} />
                            </Link>
                            <Link href="https://www.bis.org" target="_blank" variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                                BIS Statistics <ExternalLink size={10} />
                            </Link>
                            <Link href="https://www.imf.org" target="_blank" variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                                IMF / WEO <ExternalLink size={10} />
                            </Link>
                            <Link href="https://fiscaldata.treasury.gov" target="_blank" variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                                US Treasury <ExternalLink size={10} />
                            </Link>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                        <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.primary', mb: 2, display: 'block' }}>
                            Protocol
                        </Typography>
                        <Stack spacing={1}>
                            <Link href="/methodology" variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                                Methodology <BookOpen size={10} />
                            </Link>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                <Clock size={12} color={theme.palette.text.disabled} />
                                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
                                    Ingestion: <Typography component="span" variant="caption" sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.65rem' }}>
                                        {formatTimeAgo(lastIngestion)}
                                    </Typography>
                                </Typography>
                            </Box>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Shield size={14} color="#10b981" />
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main', letterSpacing: '0.05em' }}>
                                    AUDITED INTEGRITY
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                                All data points are cross-validated against secondary sources. Z-scores are computed against a rolling 252-day window (High Frequency) or 10-year baseline (Sovereign).
                            </Typography>
                            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Database size={12} color={theme.palette.text.disabled} />
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                                    Pipe Status: <Typography component="span" variant="caption" sx={{ color: 'success.main', fontWeight: 700, fontSize: '0.65rem' }}>STABILIZED</Typography>
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4, opacity: 0.05 }} />

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Typography variant="caption" color="text.disabled">
                        © {currentYear} GraphiQuestor Macro Intelligence.
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic', maxWidth: 600, textAlign: { xs: 'center', sm: 'right' } }}>
                        Disclaimer: Open-source research tool. Not financial advice. Verify all critical data via official primary publications.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};
