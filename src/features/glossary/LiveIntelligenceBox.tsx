import React from 'react';
import { Box, Paper, Typography, Button, Divider } from '@mui/material';
import { ShieldCheck, Info, ArrowRight, Activity } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

export type LiveMetricColor = 'emerald' | 'amber' | 'rose' | 'blue';

export interface LiveMetricResult {
    displayValue: string;
    unit: string;
    label: string;
    color: LiveMetricColor;
    interpretation: string;
    lastUpdated: string;
    linkTo: string;
}

const COLORS: Record<LiveMetricColor, { bg: string; border: string; badge: string; text: string }> = {
    emerald: { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)',  badge: '#10b981', text: '#10b981' },
    amber:   { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', badge: '#f59e0b', text: '#f59e0b' },
    rose:    { bg: 'rgba(244,63,94,0.08)',   border: 'rgba(244,63,94,0.2)',   badge: '#f43f5e', text: '#f43f5e' },
    blue:    { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)',  badge: '#3b82f6', text: '#3b82f6' },
};

interface Props {
    result: LiveMetricResult;
}

export const LiveIntelligenceBox: React.FC<Props> = ({ result }) => {
    const c = COLORS[result.color];
    const dateObj = result.lastUpdated ? new Date(result.lastUpdated) : null;
    const isStale = dateObj ? (Date.now() - dateObj.getTime() > 7 * 24 * 60 * 60 * 1000) : false;

    const dateStr = dateObj
        ? dateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
        : 'Live';

    return (
        <Box sx={{ mb: 6 }}>
            <Paper elevation={0} sx={{
                p: 4, borderRadius: 3,
                background: `linear-gradient(135deg, ${c.bg} 0%, rgba(0,0,0,0) 100%)`,
                border: `1px solid ${c.border}`,
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Background decoration */}
                <Activity size={120} style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.03, transform: 'rotate(-15deg)', pointerEvents: 'none' }} />

                {/* Header */}
                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                    <Box sx={{ p: 1, borderRadius: 1, bgcolor: c.badge, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={18} color="white" />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: c.badge, fontSize: '0.75rem' }}>
                        Live Intelligence Answer
                    </Typography>
                </Box>

                <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4} alignItems="flex-start">
                    {/* Left — metric value */}
                    <Box sx={{ minWidth: 180 }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>
                            Current Reading
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary', mt: 0.5, lineHeight: 1.1 }}>
                            {result.displayValue}
                            {result.unit && (
                                <Typography component="span" variant="body1" sx={{ color: 'text.secondary', ml: 0.75, fontWeight: 600 }}>
                                    {result.unit}
                                </Typography>
                            )}
                        </Typography>
                        <Box sx={{ mt: 1.5, display: 'inline-flex', alignItems: 'center', px: 1.5, py: 0.5, borderRadius: 1, bgcolor: c.bg, border: `1px solid ${c.border}` }}>
                            <Typography variant="caption" sx={{ color: c.text, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem' }}>
                                {result.label}
                            </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
                            <Info size={11} /> As of {dateStr}
                            {isStale && (
                                <Box component="span" sx={{ ml: 1, color: 'amber.main', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.6rem', bgcolor: 'rgba(245,158,11,0.1)', px: 0.5, borderRadius: 0.5 }}>
                                    Elevated Staleness
                                </Box>
                            )}
                        </Typography>
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, opacity: 0.1 }} />

                    {/* Right — interpretation */}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>
                            Macro Implication
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, lineHeight: 1.75, fontSize: '0.95rem', fontWeight: 500 }}>
                            {result.interpretation}
                        </Typography>
                        <Button
                            component={RouterLink}
                            to={result.linkTo}
                            size="small"
                            variant="text"
                            endIcon={<ArrowRight size={14} />}
                            sx={{ mt: 2, p: 0, minWidth: 0, fontWeight: 700, color: c.text, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
                        >
                            View in Terminal
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};
