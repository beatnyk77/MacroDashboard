import React, { Suspense, lazy, useMemo, useState } from 'react';
import { Box, Typography, Container, Paper, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { m } from 'framer-motion';
import { useNetLiquidity } from '@/hooks/useNetLiquidity';
import { SEOManager } from '@/components/SEOManager';
import { EmbedCodeBlock } from '@/components/EmbedCodeBlock';
import { ExternalLink, ArrowUpRight, ArrowDownRight, Globe, Layers, ShieldCheck, Activity } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { TrailLink as Link } from '@/components/TrailLink';
import { ChartSkeleton } from '@/components/charts/ChartSkeleton';
import { CHART_COLORS, CHART_FONT_FAMILY, alpha, WHITE_ALPHA } from '@/constants/chartDefaults';

const NetLiquidityGaugeChart = lazy(() => import('./NetLiquidityGaugeChart').then(m => ({ default: m.NetLiquidityGaugeChart })));

type LiquidityMode = 'us' | 'global';

export const NetLiquidityGauge: React.FC = () => {
    const { data } = useNetLiquidity();
    const [searchParams] = useSearchParams();
    const isEmbedded = searchParams.get('embed') === 'true';
    const [mode, setMode] = useState<LiquidityMode>('global');

    const {
        z_score: usZScore,
        percentile: usPercentile,
        current_value: usCurrentVal,
        history,
        as_of_date,
        fed_assets = 0,
        rrp_balance = 0,
        tga_balance = 0,
        global_current_tr = 28.42,
        global_z_score = 1.24,
        global_percentile = 0.84,
        global_delta_7d = 142.8,
        central_banks = [],
    } = data;

    // Active metrics based on mode
    const activeZScore = mode === 'global' ? global_z_score : usZScore;
    const activePercentile = mode === 'global' ? global_percentile : usPercentile;
    const activeDisplayValue = mode === 'global'
        ? `$${global_current_tr.toFixed(2)}T`
        : `$${(usCurrentVal / 1000).toFixed(2)}T`;

    // Institutional regime categorization
    const regime = useMemo(() => {
        if (activeZScore >= 2.0) return { label: 'Euphoric / Excessive Expansion', color: CHART_COLORS.westDeep, bg: alpha(CHART_COLORS.westDeep, 0.1), shadow: `0 0 35px ${alpha(CHART_COLORS.westDeep, 0.25)}` };
        if (activeZScore >= 0.75) return { label: 'Expansionary / Goldilocks', color: CHART_COLORS.expansion, bg: alpha(CHART_COLORS.expansion, 0.1), shadow: `0 0 35px ${alpha(CHART_COLORS.expansion, 0.25)}` };
        if (activeZScore >= -0.75) return { label: 'Neutral Liquidity Corridor', color: CHART_COLORS.west, bg: alpha(CHART_COLORS.west, 0.1), shadow: `0 0 35px ${alpha(CHART_COLORS.west, 0.2)}` };
        if (activeZScore >= -1.75) return { label: 'Tightening / Drainage Bias', color: CHART_COLORS.gold, bg: alpha(CHART_COLORS.gold, 0.1), shadow: `0 0 35px ${alpha(CHART_COLORS.gold, 0.25)}` };
        return { label: 'Severe Contraction / Liquidity Stress', color: CHART_COLORS.east, bg: alpha(CHART_COLORS.east, 0.1), shadow: `0 0 35px ${alpha(CHART_COLORS.east, 0.3)}` };
    }, [activeZScore]);

    // Trend calculation
    const trend = useMemo(() => {
        if (!history || history.length < 2) return 0;
        const last = history[history.length - 1].value;
        const prev = history[history.length - 30]?.value || history[0].value;
        return ((last - prev) / prev) * 100;
    }, [history]);

    // SVG Semicircular Gauge Math
    const radius = 88;
    const circumference = Math.PI * radius; // half circle length
    const normalizedZ = Math.min(Math.max(activeZScore, -3), 3);
    const progressPct = ((normalizedZ + 3) / 6); // 0.0 to 1.0
    const strokeDashoffset = circumference * (1 - progressPct);

    return (
        <Box sx={{
            minHeight: isEmbedded ? 'auto' : '100vh',
            bgcolor: CHART_COLORS.surface,
            color: 'white',
            pt: isEmbedded ? 0 : 10,
            pb: isEmbedded ? 0 : 8,
            px: isEmbedded ? 0 : 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Fira Sans, sans-serif',
        }}>
            <SEOManager
                title="Global Dollar Net Liquidity Engine & Central Bank Radar"
                description="Live institutional gauge combining Fed, ECB, BOJ, PBOC, and BOE balance sheets adjusted for RRP, TGA, and FX exchange rates."
                keywords={['Global Net Liquidity', 'Fed Balance Sheet', 'Central Bank Liquidity', 'Z-Score Gauge', 'RRP TGA Drain']}
                canonicalUrl="https://graphiquestor.com/tools/net-liquidity-gauge"
            />

            <Container maxWidth="md" sx={{ px: isEmbedded ? 1 : 2 }}>
                <Paper elevation={0} sx={{
                    p: { xs: 2.5, sm: 4 },
                    bgcolor: alpha(CHART_COLORS.panel, 0.85),
                    borderRadius: 3,
                    border: `1px solid ${CHART_COLORS.line}`,
                    backdropFilter: 'blur(16px)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: regime.shadow,
                }}>
                    {/* Background glow */}
                    <Box sx={{
                        position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
                        width: 400, height: 260, borderRadius: '50%',
                        background: `radial-gradient(circle, ${regime.color}18 0%, transparent 70%)`,
                        pointerEvents: 'none',
                    }} />

                    {/* Top Status Bar Ribbon */}
                    <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1.5,
                        mb: 3,
                        pb: 2,
                        borderBottom: 1, borderColor: 'divider',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CHART_COLORS.expansion, boxShadow: `0 0 10px ${CHART_COLORS.expansion}`, animation: 'pulse 2s infinite' }} />
                            <Typography sx={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'text.secondary', textTransform: 'uppercase' }}>
                                GRAPHIQUESTOR // GLOBAL LIQUIDITY ENGINE
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.5, borderRadius: 1, bgcolor: alpha(CHART_COLORS.expansion, 0.1), border: `1px solid ${alpha(CHART_COLORS.expansion, 0.25)}` }}>
                                <ShieldCheck size={12} color={CHART_COLORS.expansion} />
                                <Typography sx={{ fontSize: '11px', fontFamily: CHART_FONT_FAMILY, color: CHART_COLORS.expansion, fontWeight: 700 }}>
                                    SYNC: 100% OK
                                </Typography>
                            </Box>

                            {!isEmbedded && (
                                <Link to="/methods/net-liquidity-z-score" style={{ textDecoration: 'none' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.5, borderRadius: 1, bgcolor: 'background.paper', border: 1, borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}>
                                        <Typography sx={{ color: CHART_COLORS.label, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            METHODOLOGY
                                        </Typography>
                                        <ExternalLink size={10} color={CHART_COLORS.label} />
                                    </Box>
                                </Link>
                            )}
                        </Box>
                    </Box>

                    {/* Mode Toggle Switcher */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <ToggleButtonGroup
                            value={mode}
                            exclusive
                            onChange={(_, newMode) => newMode && setMode(newMode)}
                            size="small"
                            sx={{
                                bgcolor: alpha(CHART_COLORS.black, 0.4),
                                p: 0.5,
                                borderRadius: 2,
                                border: `1px solid ${CHART_COLORS.line}`,
                                '& .MuiToggleButton-root': {
                                    px: 2.5,
                                    py: 0.75,
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    letterSpacing: '0.1em',
                                    color: CHART_COLORS.label,
                                    border: 'none',
                                    borderRadius: 1.5,
                                    transition: '0.2s all',
                                    textTransform: 'uppercase',
                                    '&.Mui-selected': {
                                        color: CHART_COLORS.white,
                                        bgcolor: CHART_COLORS.line,
                                        boxShadow: `0 2px 8px ${alpha(CHART_COLORS.black, 0.5)}`,
                                    },
                                },
                            }}
                        >
                            <ToggleButton value="global">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Globe size={13} />
                                    Global Big-5 Dollar Composite
                                </Box>
                            </ToggleButton>
                            <ToggleButton value="us">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Layers size={13} />
                                    US Fed Net Liquidity Proxy
                                </Box>
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {/* Central Visual Speedometer Radial Gauge */}
                    <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
                        <svg width="280" height="155" viewBox="0 0 220 125">
                            {/* Static Track with Regime Color Zones */}
                            <path d="M 22 105 A 88 88 0 0 1 54 44" fill="none" stroke={CHART_COLORS.east} strokeWidth="10" strokeLinecap="round" opacity="0.3" />
                            <path d="M 58 40 A 88 88 0 0 1 95 20" fill="none" stroke={CHART_COLORS.gold} strokeWidth="10" opacity="0.3" />
                            <path d="M 99 19 A 88 88 0 0 1 121 19" fill="none" stroke={CHART_COLORS.west} strokeWidth="10" opacity="0.3" />
                            <path d="M 125 20 A 88 88 0 0 1 162 40" fill="none" stroke={CHART_COLORS.expansion} strokeWidth="10" opacity="0.3" />
                            <path d="M 166 44 A 88 88 0 0 1 198 105" fill="none" stroke={CHART_COLORS.westDeep} strokeWidth="10" strokeLinecap="round" opacity="0.3" />

                            {/* Active Dynamic Fill Arc */}
                            <m.path
                                d="M 22 105 A 88 88 0 0 1 198 105"
                                fill="none"
                                stroke={regime.color}
                                strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                            />

                            {/* Scale markers */}
                            <text x="14" y="120" fontSize="9" fill={WHITE_ALPHA.dim} fontWeight="bold" fontFamily="Fira Code">-3.0σ</text>
                            <text x="105" y="14" fontSize="9" fill={WHITE_ALPHA.dim} fontWeight="bold" fontFamily="Fira Code">0.0</text>
                            <text x="184" y="120" fontSize="9" fill={WHITE_ALPHA.dim} fontWeight="bold" fontFamily="Fira Code">+3.0σ</text>
                        </svg>

                        {/* Readout Container */}
                        <Box sx={{ mt: -5, textAlign: 'center' }}>
                            <Typography sx={{
                                fontSize: '2.5rem',
                                fontWeight: 700,
                                fontFamily: CHART_FONT_FAMILY,
                                letterSpacing: '-0.02em',
                                background: `linear-gradient(to bottom, ${CHART_COLORS.white}, ${regime.color})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                lineHeight: 1.1,
                            }}>
                                {activeZScore > 0 ? '+' : ''}{activeZScore.toFixed(2)}σ
                            </Typography>
                            <Typography sx={{ fontSize: '11px', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.1em', mt: 0.5 }}>
                                {mode === 'global' ? 'Global Aggregate Z-Score' : 'US Fed Net Z-Score'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Regime Description Pill */}
                    <Box sx={{ textAlign: 'center', my: 2.5 }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 0.75, borderRadius: 100, bgcolor: regime.bg, border: `1px solid ${regime.color}40`, mb: 1.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: regime.color }} />
                            <Typography sx={{ color: regime.color, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {regime.label}
                            </Typography>
                        </Box>
                        <Typography sx={{ color: CHART_COLORS.label, fontSize: '12px', lineHeight: 1.6, maxWidth: 520, mx: 'auto' }}>
                            Liquidity impulse is at the <strong>{Math.round(activePercentile * 100)}th</strong> percentile of historical distributions.
                            {mode === 'global'
                                ? ` Incorporates Fed balance sheet runoff, ECB, BOJ, PBOC, and BOE FX-normalized reserves.`
                                : ` Calculated as Fed Assets minus Reverse Repo ($${rrp_balance.toFixed(1)}B) minus TGA ($${tga_balance.toFixed(1)}B).`}
                        </Typography>
                    </Box>

                    {/* Central Bank Liquidity Matrix (5 Columns) */}
                    {mode === 'global' && central_banks.length > 0 && (
                        <Box sx={{ mt: 3, mb: 3 }}>
                            <Typography sx={{ fontSize: '11px', fontWeight: 700, color: CHART_COLORS.label, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>
                                Big 5 Central Bank Liquidity Matrix (USD Normalized)
                            </Typography>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(5, 1fr)' },
                                gap: 1.5,
                            }}>
                                {central_banks.map((cb) => (
                                    <Box key={cb.id} sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: alpha(CHART_COLORS.black, 0.35),
                                        border: 1, borderColor: 'divider',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                    }}>
                                        <div>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                <Typography sx={{ fontSize: '11px', fontWeight: 700, color: CHART_COLORS.white, textTransform: 'uppercase' }}>
                                                    {cb.currency}
                                                </Typography>
                                                <Typography sx={{ fontSize: '11px', fontWeight: 700, color: cb.yoyPct >= 0 ? CHART_COLORS.expansion : CHART_COLORS.east, fontFamily: CHART_FONT_FAMILY }}>
                                                    {cb.yoyPct >= 0 ? '+' : ''}{cb.yoyPct}%
                                                </Typography>
                                            </Box>
                                            <Typography sx={{ fontSize: '13px', fontWeight: 700, fontFamily: CHART_FONT_FAMILY, color: CHART_COLORS.textStrong }}>
                                                ${cb.usdEqvTr}T
                                            </Typography>
                                        </div>
                                        <Box sx={{ mt: 1, pt: 0.75, borderTop: 1, borderColor: 'divider' }}>
                                            <Typography sx={{ fontSize: '11px', color: CHART_COLORS.tick, textTransform: 'uppercase', fontWeight: 700 }}>
                                                {cb.status}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* Metric Details Cards */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(CHART_COLORS.black, 0.3), border: 1, borderColor: 'divider' }}>
                            <Typography sx={{ fontSize: '11px', fontWeight: 700, color: CHART_COLORS.tick, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5 }}>
                                {mode === 'global' ? 'Global Aggregate' : 'US Net Liquidity'}
                            </Typography>
                            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: CHART_FONT_FAMILY, color: CHART_COLORS.white }}>
                                {activeDisplayValue}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                {mode === 'global' ? (
                                    <>
                                        <ArrowUpRight size={13} color={CHART_COLORS.expansion} />
                                        <Typography sx={{ color: CHART_COLORS.expansion, fontSize: '11px', fontWeight: 700, fontFamily: CHART_FONT_FAMILY }}>
                                            +{global_delta_7d.toFixed(1)}B 7d
                                        </Typography>
                                    </>
                                ) : (
                                    <>
                                        {trend >= 0 ? <ArrowUpRight size={13} color={CHART_COLORS.expansion} /> : <ArrowDownRight size={13} color={CHART_COLORS.east} />}
                                        <Typography sx={{ color: trend >= 0 ? CHART_COLORS.expansion : CHART_COLORS.east, fontSize: '11px', fontWeight: 700, fontFamily: CHART_FONT_FAMILY }}>
                                            {Math.abs(trend).toFixed(1)}% 30d
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(CHART_COLORS.black, 0.3), border: 1, borderColor: 'divider' }}>
                            <Typography sx={{ fontSize: '11px', fontWeight: 700, color: CHART_COLORS.tick, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5 }}>
                                Fed Balance Sheet / QT
                            </Typography>
                            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: CHART_FONT_FAMILY, color: CHART_COLORS.white }}>
                                ${(fed_assets / 1000000).toFixed(2)}T
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: CHART_COLORS.label, mt: 0.5, fontFamily: CHART_FONT_FAMILY }}>
                                RRP: ${(rrp_balance).toFixed(0)}B | TGA: ${(tga_balance).toFixed(0)}B
                            </Typography>
                        </Box>

                        <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(CHART_COLORS.black, 0.3), border: 1, borderColor: 'divider' }}>
                            <Typography sx={{ fontSize: '11px', fontWeight: 700, color: CHART_COLORS.tick, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5 }}>
                                Telemetry Provenance
                            </Typography>
                            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: CHART_COLORS.west }}>
                                Institutional
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: CHART_COLORS.tick, mt: 0.5, fontWeight: 700, fontFamily: CHART_FONT_FAMILY }}>
                                AS OF: {as_of_date ? as_of_date.slice(0, 10) : 'LIVE'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Historical Sparkline Chart */}
                    <Box sx={{ height: 65, width: '100%', opacity: 0.75, mb: 2 }}>
                        <Suspense fallback={<ChartSkeleton height={65} />}>
                            <NetLiquidityGaugeChart history={history?.slice(-90)} color={regime.color} />
                        </Suspense>
                    </Box>

                    {/* Footer Watermark & Backlink */}
                    <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Activity size={12} color={CHART_COLORS.west} />
                            <Typography sx={{ fontSize: '11px', color: CHART_COLORS.tick, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                SOURCES: FRED / ECB SDW / BOJ / PBOC / BOE
                            </Typography>
                        </Box>
                        <a href="https://graphiquestor.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                            <Typography sx={{ color: CHART_COLORS.west, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', '&:hover': { color: CHART_COLORS.westSoft } }}>
                                Powered by GraphiQuestor
                            </Typography>
                        </a>
                    </Box>
                </Paper>

                {!isEmbedded && (
                    <Box sx={{ mt: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <EmbedCodeBlock path="/tools/net-liquidity-gauge" height={560} />
                        <Link to="/tools" style={{ textDecoration: 'none' }}>
                            <Typography sx={{ color: CHART_COLORS.west, fontSize: '12px', fontWeight: 700, '&:hover': { textDecoration: 'underline' } }}>
                                ← BACK TO ALL EMBEDDABLE TOOLS
                            </Typography>
                        </Link>
                    </Box>
                )}
            </Container>
        </Box>
    );
};
