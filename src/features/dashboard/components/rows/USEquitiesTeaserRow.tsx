import React from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { BarChart3, ChevronRight, Activity, Users, ShieldCheck, Zap } from 'lucide-react';
import { MotionCard } from '@/components/MotionCard';

export const USEquitiesTeaserRow: React.FC = () => {
    return (
        <Box sx={{ mb: 6 }}>
            <Box sx={{
                p: { xs: 4, md: 6 },
                borderRadius: '32px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%)',
                border: '1px solid rgba(255,255,255,0.05)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Accent */}
                <Box sx={{
                    position: 'absolute',
                    top: '-10%',
                    right: '-5%',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                    zIndex: 0
                }} />

                <Grid container spacing={6} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
                    <Grid item xs={12} md={7}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[0.6rem] font-black uppercase tracking-[0.2em] mb-4">
                            <Activity size={12} /> Live SEC EDGAR Feed
                        </div>
                        <Typography variant="h3" sx={{ fontWeight: 950, color: 'white', textTransform: 'uppercase', letterSpacing: '-0.02em', mb: 2, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
                            US Corporate <span className="text-blue-500">Fundamentals</span> Terminal
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)', mb: 4, fontWeight: 500, maxWidth: '600px', lineHeight: 1.6 }}>
                            Deep-dive into US equity pulse. Track institutional whale activity, insider conviction, and valuation heatmaps correlated to sovereign liquidity regimes.
                        </Typography>
                        <Button
                            variant="contained"
                            endIcon={<ChevronRight size={18} />}
                            href="/us-equities"
                            sx={{
                                bgcolor: '#3b82f6',
                                fontWeight: 900,
                                fontSize: '0.8rem',
                                borderRadius: '12px',
                                px: 5,
                                py: 2,
                                boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
                                '&:hover': { bgcolor: '#2563eb', transform: 'translateY(-2px)' },
                                transition: 'all 0.2s'
                            }}
                        >
                            Enter Equities Engine
                        </Button>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            {[
                                { label: 'Insider Sync', icon: <Users size={16} className="text-emerald-400" />, sub: 'Form 4 Live' },
                                { label: 'Whale Tracker', icon: <ShieldCheck size={16} className="text-blue-400" />, sub: '13F Filings' },
                                { label: 'Valuation', icon: <BarChart3 size={16} className="text-amber-400" />, sub: 'P/E Heatmaps' },
                                { label: 'Macro Alpha', icon: <Zap size={16} className="text-rose-400" />, sub: 'Rate Sensitivity' }
                            ].map((item, i) => (
                                <MotionCard key={i}>
                                    <Box sx={{ p: 2.5, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                            {item.icon}
                                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.65rem' }}>{item.label}</Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '0.7rem' }}>{item.sub}</Typography>
                                    </Box>
                                </MotionCard>
                            ))}
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};
