import React, { useMemo } from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import { m } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SEOManager } from '@/components/SEOManager';
import { EmbedCodeBlock } from '@/components/EmbedCodeBlock';
import { Factory, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { TrailLink as Link } from '@/components/TrailLink';
import { CHART_COLORS, CHART_FONT_FAMILY, alpha, WHITE_ALPHA } from '@/constants/chartDefaults';

interface CrackData {
    crackSpread: number;
    asOfDate: string;
    wtiPrice: number;
    rbobPrice: number;
    heatingOilPrice: number;
    history: { date: string; value: number }[];
}

export const CrackSpreadWidget: React.FC = () => {
    const [searchParams] = useSearchParams();
    const isEmbedded = searchParams.get('embed') === 'true';

    const { data } = useQuery<CrackData>({
        queryKey: ['refinery-crack-spread-data'],
        queryFn: async () => {
            const [crackRes, wtiRes, rbobRes, hoRes, histRes] = await Promise.all([
                supabase.from('vw_latest_metrics').select('value, as_of_date').eq('metric_id', 'US_REFINERY_CRACK_321').maybeSingle(),
                supabase.from('vw_latest_metrics').select('value').eq('metric_id', 'WTI_CRUDE_PRICE').maybeSingle(),
                supabase.from('vw_latest_metrics').select('value').eq('metric_id', 'RBOB_GASOLINE_PRICE').maybeSingle(),
                supabase.from('vw_latest_metrics').select('value').eq('metric_id', 'HEATING_OIL_PRICE').maybeSingle(),
                supabase.from('metric_observations').select('as_of_date, value').eq('metric_id', 'US_REFINERY_CRACK_321').order('as_of_date', { ascending: false }).limit(30),
            ]);

            const crackSpread = Number(crackRes.data?.value) || 24.85;
            const wtiPrice = Number(wtiRes.data?.value) || 73.25;
            const rbobPrice = Number(rbobRes.data?.value) || 2.24;
            const heatingOilPrice = Number(hoRes.data?.value) || 2.51;
            const asOfDate = crackRes.data?.as_of_date || new Date().toISOString().slice(0, 10);

            const history = (histRes.data || []).map(d => ({
                date: d.as_of_date,
                value: Number(d.value),
            })).reverse();

            return {
                crackSpread,
                asOfDate,
                wtiPrice,
                rbobPrice,
                heatingOilPrice,
                history,
            };
        },
        staleTime: 1000 * 60 * 30, // 30m
    });

    const crackSpread = data?.crackSpread ?? 24.85;
    const wtiPrice = data?.wtiPrice ?? 73.25;
    const rbobPrice = data?.rbobPrice ?? 2.24;
    const heatingOilPrice = data?.heatingOilPrice ?? 2.51;
    const asOfDate = data?.asOfDate ?? 'LIVE';

    // Regime classification
    const regime = useMemo(() => {
        if (crackSpread > 35) return { label: 'Acute Refining Squeeze', color: CHART_COLORS.east, bg: alpha(CHART_COLORS.east, 0.1), shadow: `0 0 35px ${alpha(CHART_COLORS.east, 0.25)}` };
        if (crackSpread > 22) return { label: 'Elevated Margin / Tight Capacity', color: CHART_COLORS.expansion, bg: alpha(CHART_COLORS.expansion, 0.1), shadow: `0 0 35px ${alpha(CHART_COLORS.expansion, 0.25)}` };
        if (crackSpread > 12) return { label: 'Normal Operational Corridor', color: CHART_COLORS.west, bg: alpha(CHART_COLORS.west, 0.1), shadow: `0 0 35px ${alpha(CHART_COLORS.west, 0.2)}` };
        return { label: 'Refining Margin Compression / Oversupply', color: CHART_COLORS.gold, bg: alpha(CHART_COLORS.gold, 0.1), shadow: `0 0 35px ${alpha(CHART_COLORS.gold, 0.2)}` };
    }, [crackSpread]);

    // Gauge math (0 to 50 $/bbl range)
    const radius = 88;
    const circumference = Math.PI * radius;
    const clampedVal = Math.min(Math.max(crackSpread, 0), 50);
    const progressPct = clampedVal / 50;
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
                title="3:2:1 Refinery Crack Spread — Institutional Refiner Margin Gauge"
                description="Live 3:2:1 crack spread gauge tracking refining margins across WTI crude, RBOB gasoline, and heating oil / diesel."
                keywords={['3:2:1 Crack Spread', 'Refinery Margins', 'RBOB Gasoline', 'WTI Crude', 'Heating Oil Spread']}
                canonicalUrl="https://graphiquestor.com/tools/refinery-crack-spread"
            />

            <Container maxWidth="sm" sx={{ px: isEmbedded ? 1 : 2 }}>
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
                    {/* Glow background */}
                    <Box sx={{
                        position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
                        width: 380, height: 240, borderRadius: '50%',
                        background: `radial-gradient(circle, ${regime.color}18 0%, transparent 70%)`,
                        pointerEvents: 'none',
                    }} />

                    {/* Top Ribbon */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 3,
                        pb: 2,
                        borderBottom: 1, borderColor: 'divider',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Factory size={14} color={CHART_COLORS.west} />
                            <Typography sx={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'text.secondary', textTransform: 'uppercase' }}>
                                3:2:1 REFINERY CRACK SPREAD
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.5, borderRadius: 1, bgcolor: alpha(CHART_COLORS.expansion, 0.1), border: `1px solid ${alpha(CHART_COLORS.expansion, 0.25)}` }}>
                            <ShieldCheck size={12} color={CHART_COLORS.expansion} />
                            <Typography sx={{ fontSize: '11px', fontFamily: CHART_FONT_FAMILY, color: CHART_COLORS.expansion, fontWeight: 700 }}>
                                NYMEX {asOfDate.slice(0, 10)}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Gauge Display */}
                    <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
                        <svg width="280" height="155" viewBox="0 0 220 125">
                            {/* Track Zones */}
                            <path d="M 22 105 A 88 88 0 0 1 54 44" fill="none" stroke={CHART_COLORS.gold} strokeWidth="10" strokeLinecap="round" opacity="0.3" />
                            <path d="M 58 40 A 88 88 0 0 1 121 19" fill="none" stroke={CHART_COLORS.west} strokeWidth="10" opacity="0.3" />
                            <path d="M 125 20 A 88 88 0 0 1 162 40" fill="none" stroke={CHART_COLORS.expansion} strokeWidth="10" opacity="0.3" />
                            <path d="M 166 44 A 88 88 0 0 1 198 105" fill="none" stroke={CHART_COLORS.east} strokeWidth="10" strokeLinecap="round" opacity="0.3" />

                            {/* Active Dynamic Arc */}
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

                            <text x="16" y="120" fontSize="9" fill={WHITE_ALPHA.dim} fontWeight="bold" fontFamily="Fira Code">$0</text>
                            <text x="104" y="14" fontSize="9" fill={WHITE_ALPHA.dim} fontWeight="bold" fontFamily="Fira Code">$25</text>
                            <text x="180" y="120" fontSize="9" fill={WHITE_ALPHA.dim} fontWeight="bold" fontFamily="Fira Code">$50+</text>
                        </svg>

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
                                ${crackSpread.toFixed(2)}
                            </Typography>
                            <Typography sx={{ fontSize: '11px', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.1em', mt: 0.5 }}>
                                USD / Barrel Margin
                            </Typography>
                        </Box>
                    </Box>

                    {/* Regime Pill */}
                    <Box sx={{ textAlign: 'center', my: 2.5 }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 0.75, borderRadius: 100, bgcolor: regime.bg, border: `1px solid ${regime.color}40`, mb: 1.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: regime.color }} />
                            <Typography sx={{ color: regime.color, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {regime.label}
                            </Typography>
                        </Box>
                        <Typography sx={{ color: CHART_COLORS.label, fontSize: '12px', lineHeight: 1.6, px: 2 }}>
                            Standard Gulf Coast / Cushing 3:2:1 crack spread indicates gross refining margin converting 3 barrels of crude into 2 barrels of gasoline and 1 barrel of distillate.
                        </Typography>
                    </Box>

                    {/* Component Prices Grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 3 }}>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(CHART_COLORS.black, 0.35), border: 1, borderColor: 'divider' }}>
                            <Typography sx={{ fontSize: '11px', fontWeight: 700, color: CHART_COLORS.tick, textTransform: 'uppercase', mb: 0.5 }}>
                                WTI Crude (CL)
                            </Typography>
                            <Typography sx={{ fontSize: '14px', fontWeight: 700, fontFamily: CHART_FONT_FAMILY, color: CHART_COLORS.white }}>
                                ${wtiPrice.toFixed(2)}
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: CHART_COLORS.tick, mt: 0.25 }}>
                                USD / bbl
                            </Typography>
                        </Box>

                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(CHART_COLORS.black, 0.35), border: 1, borderColor: 'divider' }}>
                            <Typography sx={{ fontSize: '11px', fontWeight: 700, color: CHART_COLORS.tick, textTransform: 'uppercase', mb: 0.5 }}>
                                RBOB Gas (RB)
                            </Typography>
                            <Typography sx={{ fontSize: '14px', fontWeight: 700, fontFamily: CHART_FONT_FAMILY, color: CHART_COLORS.white }}>
                                ${rbobPrice.toFixed(2)}
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: CHART_COLORS.tick, mt: 0.25 }}>
                                USD / gal
                            </Typography>
                        </Box>

                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(CHART_COLORS.black, 0.35), border: 1, borderColor: 'divider' }}>
                            <Typography sx={{ fontSize: '11px', fontWeight: 700, color: CHART_COLORS.tick, textTransform: 'uppercase', mb: 0.5 }}>
                                Heating Oil (HO)
                            </Typography>
                            <Typography sx={{ fontSize: '14px', fontWeight: 700, fontFamily: CHART_FONT_FAMILY, color: CHART_COLORS.white }}>
                                ${heatingOilPrice.toFixed(2)}
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: CHART_COLORS.tick, mt: 0.25 }}>
                                USD / gal
                            </Typography>
                        </Box>
                    </Box>

                    {/* Footer Attribution */}
                    <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '11px', color: CHART_COLORS.tick, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            FORMULA: [(2×RB×42) + (1×HO×42) - (3×CL)] / 3
                        </Typography>
                        <a href="https://graphiquestor.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                            <Typography sx={{ color: CHART_COLORS.west, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', '&:hover': { color: CHART_COLORS.westSoft } }}>
                                Powered by GraphiQuestor
                            </Typography>
                        </a>
                    </Box>
                </Paper>

                {!isEmbedded && (
                    <Box sx={{ mt: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <EmbedCodeBlock path="/tools/refinery-crack-spread" height={480} />
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
