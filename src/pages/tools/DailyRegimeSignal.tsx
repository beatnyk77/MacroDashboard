import React from 'react';
import { Box, Typography, Container, Paper, Skeleton } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { TrailLink as Link } from '@/components/TrailLink';
import { ExternalLink } from 'lucide-react';
import { useDailyMacroSignal } from '@/features/daily-macro/hooks/useDailyMacroSignal';
import { SEOManager } from '@/components/SEOManager';
import { EmbedCodeBlock } from '@/components/EmbedCodeBlock';
import { CHART_COLORS, alpha } from '@/constants/chartDefaults';

const REGIME_STYLES: Record<string, { color: string; bg: string; label: string }> = {
    RISK_ON: { color: CHART_COLORS.expansion, bg: alpha(CHART_COLORS.expansion, 0.1), label: 'Risk On' },
    NEUTRAL: { color: CHART_COLORS.gold, bg: alpha(CHART_COLORS.gold, 0.1), label: 'Neutral' },
    RISK_OFF: { color: CHART_COLORS.stress, bg: alpha(CHART_COLORS.stress, 0.1), label: 'Risk Off' },
};

const COMPONENT_LABELS: Record<string, string> = {
    liquidity: 'Liquidity',
    rates: 'Rates',
    dollar: 'Dollar',
    vol: 'Volatility',
    metals: 'Metals',
};

/**
 * Embeddable Daily Macro Regime Signal widget.
 * Surfaces the pre-computed daily_signal regime, 0-100 score, and
 * component breakdown. Iframe-safe via ?embed=true (chromeless, noindex).
 */
export const DailyRegimeSignal: React.FC = () => {
    const { data: signal, isLoading } = useDailyMacroSignal();
    const [searchParams] = useSearchParams();
    const isEmbedded = searchParams.get('embed') === 'true';

    const regime = REGIME_STYLES[signal?.regime ?? 'NEUTRAL'] ?? REGIME_STYLES.NEUTRAL;

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
                title="Daily Macro Regime Signal — Risk On / Risk Off Gauge"
                description="Live daily macro regime signal (Risk On / Neutral / Risk Off) computed from global liquidity, rates, dollar, volatility, and metals. Free embeddable widget."
                keywords={['macro regime signal', 'risk on risk off indicator', 'daily macro signal', 'liquidity regime']}
                canonical="https://graphiquestor.com/tools/daily-regime-signal/"
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
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CHART_COLORS.west, boxShadow: `0 0 10px ${CHART_COLORS.west}` }} />
                            <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: '0.1em', color: 'text.disabled' }}>
                                GraphiQuestor Terminal
                            </Typography>
                        </Box>
                        {!isEmbedded && (
                            <Link to="/macro-brief" style={{ textDecoration: 'none' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.5, '&:hover': { opacity: 1 }, transition: '0.2s' }}>
                                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 700 }}>DAILY BRIEF</Typography>
                                    <ExternalLink size={12} color="white" />
                                </Box>
                            </Link>
                        )}
                    </Box>

                    <Typography variant="h5" component="h1" sx={{ fontWeight: 700, textAlign: 'center', mb: 1, letterSpacing: '0.1em', color: 'white' }}>
                        DAILY MACRO REGIME
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mb: 4, color: 'text.disabled', fontWeight: 700 }}>
                        LIQUIDITY · RATES · DOLLAR · VOL · METALS
                    </Typography>

                    {isLoading || !signal ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Skeleton variant="rounded" height={90} sx={{ bgcolor: 'action.hover' }} />
                            <Skeleton variant="rounded" height={140} sx={{ bgcolor: 'action.hover' }} />
                        </Box>
                    ) : (
                        <>
                            {/* Regime + score */}
                            <Box sx={{ textAlign: 'center', mb: 5 }}>
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, px: 4, py: 1.5, borderRadius: 100, bgcolor: regime.bg, border: `1px solid ${regime.color}40`, mb: 2 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: regime.color }} />
                                    <Typography sx={{ color: regime.color, fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        {regime.label}
                                    </Typography>
                                </Box>
                                <Typography variant="h2" sx={{ fontWeight: 700, letterSpacing: '-0.02em', background: `linear-gradient(to bottom, white, ${regime.color})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    {Math.round(signal.score)}
                                </Typography>
                                <Typography variant="overline" sx={{ color: 'text.disabled', fontWeight: 700 }}>
                                    Composite Score (0–100) · Confidence {Math.round(signal.confidence_pct)}%
                                </Typography>
                            </Box>

                            {/* Component bars */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
                                {Object.entries(signal.component_scores).map(([key, value]) => (
                                    <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography sx={{ width: 84, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.disabled' }}>
                                            {COMPONENT_LABELS[key] ?? key}
                                        </Typography>
                                        <Box sx={{ flex: 1, height: 8, borderRadius: 100, bgcolor: 'action.hover', overflow: 'hidden' }}>
                                            <Box sx={{ width: `${Math.min(Math.max(value, 0), 100)}%`, height: '100%', borderRadius: 100, bgcolor: value >= 60 ? CHART_COLORS.expansion : value >= 40 ? CHART_COLORS.gold : CHART_COLORS.stress, transition: 'width 0.8s ease' }} />
                                        </Box>
                                        <Typography sx={{ width: 30, textAlign: 'right', fontSize: '11px', fontWeight: 700, color: 'text.secondary' }}>
                                            {Math.round(value)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>

                            {/* Key driver */}
                            {signal.key_driver && (
                                <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider', mb: 1 }}>
                                    <Typography variant="overline" sx={{ color: 'text.disabled', display: 'block' }}>Key Driver</Typography>
                                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600 }}>{signal.key_driver}</Typography>
                                </Box>
                            )}

                            <Typography sx={{ color: 'text.disabled', fontSize: '11px', fontWeight: 700, textAlign: 'center', mt: 2 }}>
                                AS OF {signal.signal_date}{signal.is_stale ? ' · AWAITING TODAY’S COMPUTE' : ''}
                            </Typography>
                        </>
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
                        <EmbedCodeBlock path="/tools/daily-regime-signal" height={620} />
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
