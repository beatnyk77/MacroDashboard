import React from 'react';
import { Box, Typography, Container, Paper, Skeleton } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { TrailLink as Link } from '@/components/TrailLink';
import { ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useGoldRatios } from '@/hooks/useGoldRatios';
import { SEOManager } from '@/components/SEOManager';
import { EmbedCodeBlock } from '@/components/EmbedCodeBlock';
import { CHART_COLORS, alpha, WHITE_ALPHA } from '@/constants/chartDefaults';

function zColor(z: number): string {
    if (z >= 1.5) return CHART_COLORS.east;
    if (z >= 0.5) return CHART_COLORS.gold;
    if (z <= -1.5) return CHART_COLORS.expansion;
    if (z <= -0.5) return CHART_COLORS.west;
    return WHITE_ALPHA.mid;
}

/**
 * Embeddable Gold Ratios widget — M2/Gold, Debt/Gold, SPX/Gold, Gold/Silver
 * with z-scores and percentiles from the existing gold-ratio pipeline.
 * Iframe-safe via ?embed=true (chromeless, noindex).
 */
export const GoldRatiosWidget: React.FC = () => {
    const { data: ratios, isLoading } = useGoldRatios();
    const [searchParams] = useSearchParams();
    const isEmbedded = searchParams.get('embed') === 'true';

    return (
        <Box sx={{
            minHeight: isEmbedded ? 'auto' : '100vh',
            bgcolor: CHART_COLORS.surface,
            color: 'white',
            pt: isEmbedded ? 0 : 12,
            pb: isEmbedded ? 0 : 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <SEOManager
                title="Gold Ratios Monitor — M2/Gold, Debt/Gold, SPX/Gold"
                description="Live monetary-debasement gauges: M2/Gold, US Debt/Gold, SPX/Gold, and Gold/Silver ratios with z-scores against history. Free embeddable widget."
                keywords={['M2 gold ratio', 'debt to gold ratio', 'SPX gold ratio', 'gold silver ratio', 'monetary debasement']}
                canonical="https://graphiquestor.com/tools/gold-ratios/"
            />

            <Container maxWidth="sm">
                <Paper elevation={0} sx={{
                    p: 6,
                    bgcolor: alpha(CHART_COLORS.panel, 0.5),
                    borderRadius: 6,
                    border: 1, borderColor: 'divider',
                    backdropFilter: 'blur(20px)',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Branding */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CHART_COLORS.gold, boxShadow: `0 0 10px ${CHART_COLORS.gold}` }} />
                            <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: '0.1em', color: 'text.disabled' }}>
                                GraphiQuestor Terminal
                            </Typography>
                        </Box>
                        {!isEmbedded && (
                            <Link to="/methods/m2-gold-ratio" style={{ textDecoration: 'none' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.5, '&:hover': { opacity: 1 }, transition: '0.2s' }}>
                                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 700 }}>METHODOLOGY</Typography>
                                    <ExternalLink size={12} color="white" />
                                </Box>
                            </Link>
                        )}
                    </Box>

                    <Typography variant="h5" component="h1" sx={{ fontWeight: 700, textAlign: 'center', mb: 1, letterSpacing: '0.1em', color: 'white' }}>
                        GOLD RATIOS MONITOR
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mb: 4, color: 'text.disabled', fontWeight: 700 }}>
                        MONETARY DEBASEMENT GAUGES · Z-SCORED VS HISTORY
                    </Typography>

                    {isLoading || !ratios ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {[1, 2, 3, 4].map(i => (
                                <Skeleton key={i} variant="rounded" height={72} sx={{ bgcolor: 'action.hover' }} />
                            ))}
                        </Box>
                    ) : ratios.length === 0 ? (
                        <Typography sx={{ textAlign: 'center', color: 'text.disabled', fontSize: '0.8rem', py: 4 }}>
                            Ratio data temporarily unavailable.
                        </Typography>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {ratios.map(ratio => {
                                const color = zColor(ratio.z_score);
                                const spark = ratio.history?.slice(-30) ?? [];
                                const trendUp = spark.length >= 2 && spark[spark.length - 1].value >= spark[0].value;
                                return (
                                    <Box key={ratio.ratio_name} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5, borderRadius: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.primary' }}>
                                                {ratio.ratio_name}
                                            </Typography>
                                            <Typography sx={{ fontSize: '11px', color: 'text.disabled', fontWeight: 700 }}>
                                                {Math.round(ratio.percentile)}th percentile
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                                                {trendUp
                                                    ? <ArrowUpRight size={14} color={WHITE_ALPHA.dim} />
                                                    : <ArrowDownRight size={14} color={WHITE_ALPHA.dim} />}
                                                <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                                    {ratio.current_value >= 100 ? ratio.current_value.toFixed(0) : ratio.current_value.toFixed(2)}
                                                </Typography>
                                            </Box>
                                            <Typography sx={{ fontSize: '11px', fontWeight: 700, color }}>
                                                z {ratio.z_score > 0 ? '+' : ''}{ratio.z_score.toFixed(2)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}

                    {/* Footer / backlink */}
                    <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
                        <a href="https://graphiquestor.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                            <Typography sx={{ color: CHART_COLORS.west, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', '&:hover': { opacity: 0.8 } }}>
                                Powered by GraphiQuestor Macro Engines
                            </Typography>
                        </a>
                    </Box>
                </Paper>

                {!isEmbedded && (
                    <Box sx={{ mt: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <EmbedCodeBlock path="/tools/gold-ratios" height={560} />
                        <Link to="/tools" style={{ textDecoration: 'none' }}>
                            <Typography sx={{ color: CHART_COLORS.west, fontSize: '0.8rem', fontWeight: 700, '&:hover': { textDecoration: 'underline' } }}>
                                ← ALL EMBEDDABLE TOOLS
                            </Typography>
                        </Link>
                    </Box>
                )}
            </Container>
        </Box>
    );
};
