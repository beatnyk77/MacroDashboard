import React, { useMemo } from 'react';
import { Box, Typography, Container, Paper, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { SEOManager } from '@/components/SEOManager';
import { ExternalLink, ArrowUpRight, ArrowDownRight, Code } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';

/**
 * Premium standalone tool for Net Liquidity Z-Score visualisation.
 * Optimized for Iframe embedding via ?embed=true
 */
export const NetLiquidityGauge: React.FC = () => {
    const { data } = useNetLiquidity();
    const [searchParams] = useSearchParams();
    const isEmbedded = searchParams.get('embed') === 'true';
    const [showEmbed, setShowEmbed] = React.useState(false);

    const { z_score, percentile, current_value, history, as_of_date } = data;

    // Regime logic based on institutional thresholds
    const regime = useMemo(() => {
        if (z_score >= 2.0) return { label: 'Euphoric / Excessive', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)', shadow: '0 0 40px rgba(244, 63, 94, 0.2)' };
        if (z_score >= 1.0) return { label: 'Goldilocks / expansion', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', shadow: '0 0 40px rgba(16, 185, 129, 0.2)' };
        if (z_score >= 0) return { label: 'Neutral / Supportive', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', shadow: '0 0 40px rgba(59, 130, 246, 0.2)' };
        if (z_score >= -1.0) return { label: 'Tightening Bias', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', shadow: '0 0 40px rgba(245, 158, 11, 0.2)' };
        return { label: 'Contraction / Risk-Off', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', shadow: '0 0 40px rgba(239, 68, 68, 0.2)' };
    }, [z_score]);

    // Trend calculation for last 30 days
    const trend = useMemo(() => {
        if (!history || history.length < 2) return 0;
        const last = history[history.length - 1].value;
        const prev = history[history.length - 30]?.value || history[0].value;
        return ((last - prev) / prev) * 100;
    }, [history]);

    // SVG Gauge math
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    // Map -3 to +3 Z-score range to 0-100% of half circle
    const normalizedZ = Math.min(Math.max(z_score, -3), 3);
    const percentage = ((normalizedZ + 3) / 6) * 100;
    const strokeDashoffset = circumference - (percentage / 100) * (circumference / 2);

    return (
        <Box sx={{ 
            minHeight: isEmbedded ? 'auto' : '100vh', 
            bgcolor: '#050810',
            color: 'white',
            pt: isEmbedded ? 0 : 12,
            pb: isEmbedded ? 0 : 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <SEOManager 
                title="US Net Liquidity Proxy — Institutional Gauge"
                description="Live gauge tracking Federal Reserve net liquidity via Z-score analysis. Institutional-grade macro regime monitoring."
                keywords={['US Net Liquidity Proxy', 'Fed Liquidity Gauge', 'Macro Regime Monitor', 'Z-Score Analysis']}
                canonicalUrl="https://graphiquestor.com/tools/net-liquidity-gauge"
            />

            <Container maxWidth="sm">
                <Paper elevation={0} sx={{ 
                    p: 6, 
                    bgcolor: 'rgba(15, 23, 42, 0.5)', 
                    borderRadius: 6, 
                    border: '1px solid rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(20px)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: regime.shadow
                }}>
                    {/* Background glow */}
                    <Box sx={{ 
                        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
                        width: 300, height: 300, borderRadius: '50%',
                        background: `radial-gradient(circle, ${regime.color}15 0%, transparent 70%)`,
                        pointerEvents: 'none'
                    }} />

                    {/* Branding */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }} />
                            <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 2, color: 'rgba(255,255,255,0.4)' }}>
                                GraphiQuestor Terminal
                            </Typography>
                        </Box>
                        {!isEmbedded && (
                            <Link to="/methods/net-liquidity-z-score" style={{ textDecoration: 'none' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.5, '&:hover': { opacity: 1 }, transition: '0.2s' }}>
                                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 700 }}>METHODOLOGY</Typography>
                                    <ExternalLink size={12} color="white" />
                                </Box>
                            </Link>
                        )}
                    </Box>

                    <Typography variant="h5" component="h1" sx={{ fontWeight: 900, textAlign: 'center', mb: 2, letterSpacing: '0.05em', color: 'white' }}>
                        US NET LIQUIDITY PROXY
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mb: 4, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                        INSTITUTIONAL REGIME MONITOR
                    </Typography>

                    {/* Main Gauge */}
                    <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <svg width="240" height="140" viewBox="0 0 200 120">
                            {/* Track */}
                            <path
                                d="M 20 100 A 80 80 0 0 1 180 100"
                                fill="none"
                                stroke="rgba(255,255,255,0.05)"
                                strokeWidth="12"
                                strokeLinecap="round"
                            />
                            {/* Value Fill */}
                            <motion.path
                                d="M 20 100 A 80 80 0 0 1 180 100"
                                fill="none"
                                stroke={regime.color}
                                strokeWidth="12"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: circumference / 2, strokeDashoffset: circumference / 2 }}
                                animate={{ strokeDashoffset: strokeDashoffset }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                            {/* Markers */}
                            <text x="18" y="115" fontSize="6" fill="rgba(255,255,255,0.3)" fontWeight="bold">-3σ</text>
                            <text x="175" y="115" fontSize="6" fill="rgba(255,255,255,0.3)" fontWeight="bold">+3σ</text>
                            <text x="96" y="15" fontSize="6" fill="rgba(255,255,255,0.3)" fontWeight="bold">0</text>
                        </svg>

                        <Box sx={{ position: 'absolute', bottom: 0, textAlign: 'center' }}>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <Typography variant="h2" sx={{ fontWeight: 900, mb: -1, letterSpacing: -2, background: `linear-gradient(to bottom, white, ${regime.color})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    {z_score > 0 ? '+' : ''}{z_score.toFixed(2)}
                                </Typography>
                                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>
                                    Z-Score Normalised
                                </Typography>
                            </motion.div>
                        </Box>
                    </Box>

                    {/* Regime Description */}
                    <Box sx={{ textAlign: 'center', mb: 5 }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, px: 3, py: 1, borderRadius: 100, bgcolor: regime.bg, border: `1px solid ${regime.color}30`, mb: 2 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: regime.color }} />
                            <Typography sx={{ color: regime.color, fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                                {regime.label}
                            </Typography>
                        </Box>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', lineHeight: 1.6, px: 4 }}>
                            Net liquidity is currently sitting at the <strong>{Math.round(percentile * 100)}th</strong> percentile of historical levels since 2000.
                        </Typography>
                    </Box>

                    {/* Trend & Data */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 4 }}>
                        <Box sx={{ p: 3, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.3)', display: 'block', mb: 1 }}>Value (USD)</Typography>
                            <Typography sx={{ fontWeight: 800 }}>${(current_value / 1000).toFixed(2)}T</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                {trend > 0 ? <ArrowUpRight size={14} color="#10b981" /> : <ArrowDownRight size={14} color="#f43f5e" />}
                                <Typography sx={{ color: trend > 0 ? '#10b981' : '#f43f5e', fontSize: '0.7rem', fontWeight: 800 }}>
                                    {Math.abs(trend).toFixed(1)}% (30d)
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ p: 3, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.3)', display: 'block', mb: 1 }}>Data Quality</Typography>
                            <Typography sx={{ fontWeight: 800, color: '#3b82f6' }}>Institutional</Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', mt: 0.5, fontWeight: 800 }}>
                                LAST SYNC: {as_of_date?.slice(0, 10)}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Mini Sparkline */}
                    <Box sx={{ height: 60, width: '100%', opacity: 0.6 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history?.slice(-60)}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={regime.color} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={regime.color} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke={regime.color} fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} isAnimationActive={false} />
                                <YAxis hide domain={['auto', 'auto']} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Box>

                    {/* Footer / CTA */}
                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center' }}>
                         <a href="https://graphiquestor.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                             <Typography sx={{ color: '#3b82f6', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, '&:hover': { opacity: 0.8 } }}>
                                Powered by GraphiQuestor Macro Engines
                             </Typography>
                         </a>
                    </Box>
                </Paper>

                {!isEmbedded && (
                    <Box sx={{ mt: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                         <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<Code size={14} />}
                            onClick={() => setShowEmbed(!showEmbed)}
                            sx={{ color: 'white/40', borderColor: 'white/10', textTransform: 'none', borderRadius: 2 }}
                         >
                            {showEmbed ? 'Hide Embed Code' : 'Get Embed Code'}
                         </Button>

                         {showEmbed && (
                            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'black', border: '1px solid white/10', width: '100%', maxWidth: '400px' }}>
                                <Typography variant="caption" sx={{ color: 'white/40', display: 'block', mb: 1, textAlign: 'left', fontWeight: 'bold' }}>
                                    IFRAME EMBED SNIPPET
                                </Typography>
                                <Box component="pre" sx={{ m: 0, p: 1, fontSize: '10px', color: '#10b981', overflowX: 'auto', textAlign: 'left' }}>
                                    {`<iframe src="https://graphiquestor.com/tools/net-liquidity-gauge?embed=true" width="100%" height="500" frameborder="0"></iframe>`}
                                </Box>
                            </Box>
                         )}

                         <Link to="/" style={{ textDecoration: 'none' }}>
                            <Typography sx={{ color: '#3b82f6', fontSize: '0.8rem', fontWeight: 900, '&:hover': { textDecoration: 'underline' } }}>
                                ← RETURN TO MACRO TERMINAL
                            </Typography>
                         </Link>
                    </Box>
                )}
            </Container>
        </Box>
    );
};
