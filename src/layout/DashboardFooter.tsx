import React from 'react';
import { Box, Typography, Link, Divider, useTheme, Grid, Stack } from '@mui/material';
import { Clock, Database, BookOpen, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const DashboardFooter: React.FC = () => {
    const theme = useTheme();

    // Fetch latest ingestion timestamp
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
        staleTime: 1000 * 60 * 5, // 5 min
    });

    const formatTimeAgo = (date: Date | null) => {
        if (!date) return 'Unknown';

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    };

    const dataIntervals = [
        { category: 'Daily', metrics: 'Gold prices, market pulse, precious divergence, Fed data' },
        { category: 'Weekly', metrics: 'Net liquidity, global liquidity aggregates' },
        { category: 'Monthly', metrics: 'China/India macro, US CPI, policy rates, foreign Treasury holders' },
        { category: 'Quarterly', metrics: 'GDP growth, IMF WEO, BRICS tracker, GFCF investment data' },
    ];

    return (
        <Box sx={{
            mt: 8,
            py: 4,
            px: { xs: 2, md: 4 },
            bgcolor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid',
            borderColor: 'divider',
            position: 'relative'
        }}>
            {/* Gradient Accent */}
            <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}00 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.main}00 100%)`
            }} />

            <Grid container spacing={4}>
                {/* Last Ingestion */}
                <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Clock size={18} color={theme.palette.primary.main} style={{ marginTop: 2, flexShrink: 0 }} />
                        <Box>
                            <Typography variant="caption" sx={{
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                letterSpacing: '0.1em',
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                display: 'block',
                                mb: 0.5
                            }}>
                                Last Data Ingestion
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', fontFamily: 'monospace' }}>
                                {lastIngestion ? formatTimeAgo(lastIngestion) : 'Loading...'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', mt: 0.3, display: 'block' }}>
                                {lastIngestion ? lastIngestion.toLocaleString() : ''}
                            </Typography>
                        </Box>
                    </Box>
                </Grid>

                {/* Data Update Intervals */}
                <Grid item xs={12} md={5}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Database size={18} color={theme.palette.secondary.main} style={{ marginTop: 2, flexShrink: 0 }} />
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                letterSpacing: '0.1em',
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                display: 'block',
                                mb: 1
                            }}>
                                Data Update Frequencies
                            </Typography>
                            <Stack spacing={0.5}>
                                {dataIntervals.map((interval, idx) => (
                                    <Typography key={idx} variant="caption" sx={{ fontSize: '0.7rem', color: 'text.disabled', lineHeight: 1.4 }}>
                                        <strong style={{ color: theme.palette.text.primary }}>{interval.category}:</strong> {interval.metrics}
                                    </Typography>
                                ))}
                            </Stack>
                        </Box>
                    </Box>
                </Grid>

                {/* Disclaimer */}
                <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <BookOpen size={18} color={theme.palette.warning.main} style={{ marginTop: 2, flexShrink: 0 }} />
                        <Box>
                            <Typography variant="caption" sx={{
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                letterSpacing: '0.1em',
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                display: 'block',
                                mb: 0.5
                            }}>
                                Methodology
                            </Typography>
                            <Link
                                href="/methodology"
                                underline="hover"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    color: 'primary.main',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    '&:hover': { color: 'primary.light' }
                                }}
                            >
                                View Full Documentation
                                <ExternalLink size={12} />
                            </Link>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.05)' }} />

            {/* Disclaimer Footer */}
            <Typography variant="caption" sx={{
                color: 'text.disabled',
                fontSize: '0.7rem',
                display: 'block',
                lineHeight: 1.6,
                fontStyle: 'italic',
                textAlign: 'center'
            }}>
                <strong>Disclaimer:</strong> GraphiQuestor is an open-source macro data compilation, opinionated through gold & liquidity lenses.
                Data is updated at regular intervals (not real-time intraday). Suitable for research & thesis work.
                Not financial advice. All metrics subject to revision as sources update.
                Verify critical data points via primary sources before making investment decisions.
            </Typography>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                    © 2026 GraphiQuestor – Macro Observatory | Built for institutional research
                </Typography>
            </Box>
        </Box>
    );
};
