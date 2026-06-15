import React, { Suspense, lazy } from 'react';
import { Box, Container, Typography, Paper, Chip, Button, Divider } from '@mui/material';
import { ArrowLeft, Database, BookOpen, FlaskConical, Activity, Lightbulb, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { FreshnessChip } from '@/components/FreshnessChip';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { ChartSkeleton } from '@/components/charts/ChartSkeleton';

const IndiaCreditCycleChart = lazy(() => import('./IndiaCreditCycleChart').then(m => ({ default: m.IndiaCreditCycleChart })));

export const IndiaCreditCyclePage: React.FC = () => {
    const { data: primaryMetric } = useLatestMetric(MID.IN_REPO_RATE);
    const dataFreshness = getStaleness(primaryMetric?.lastUpdated, primaryMetric?.frequency);
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "@id": "https://graphiquestor.com/methods/india-credit-cycle-clock",
        "headline": "India Credit Cycle Clock — RBI Policy Signal Methodology",
        "description": "Full methodology for the India Credit Cycle Clock: how Credit Growth YoY vs Credit-Deposit Ratio quadrant mapping tracks RBI lending cycles and signals monetary policy inflection points.",
        "url": "https://graphiquestor.com/methods/india-credit-cycle-clock",
        "datePublished": "2026-06-01",
        "dateModified": "2026-06-01",
        "author": { "@type": "Organization", "name": "GraphiQuestor Research" },
        "publisher": { "@type": "Organization", "name": "GraphiQuestor" },
        "keywords": ["India credit cycle tracker", "RBI lending cycle indicator", "India CD ratio monitor", "India credit growth", "RBI monetary policy signal", "credit deposit ratio India"]
    };

    return (
        <Box sx={{ py: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
            <SEOManager
                title="India Credit Cycle Clock — RBI Policy Signal Methodology"
                description="India credit cycle tracker methodology: how Credit Growth YoY vs the Credit-Deposit ratio maps to four cycle phases (Expansion/Recovery/Downturn/Repair), calibrated against 10-year RBI averages."
                keywords={["India credit cycle tracker", "RBI lending cycle indicator", "India CD ratio monitor", "India credit growth YoY", "RBI policy signal"]}
                canonicalUrl="https://graphiquestor.com/methods/india-credit-cycle-clock"
                jsonLd={jsonLd}
            />

            <Container maxWidth="md">
                {/* Breadcrumb */}
                <Box mb={5} display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                    <Button component={Link} to="/glossary" startIcon={<ArrowLeft size={15} />}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>Glossary</Button>
                    <Typography color="text.disabled" variant="caption">·</Typography>
                    <Button component={Link} to="/methodology"
                        sx={{ color: 'text.secondary', fontSize: '0.8rem', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>Methodology Hub</Button>
                    <Typography color="text.disabled" variant="caption">·</Typography>
                    <Typography variant="caption" color="text.secondary">India Credit Cycle Clock</Typography>
                </Box>

                {/* Hero */}
                <Box mb={8}>
                    <Chip label="Methods Article · India Macro" variant="outlined"
                        sx={{ mb: 3, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.7rem', borderColor: '#22c55e', color: '#22c55e' }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h2" component="h1" fontWeight={900}>
                            India Credit Cycle Clock
                        </Typography>
                        <FreshnessChip status={dataFreshness.state} lastUpdated={primaryMetric?.lastUpdated} />
                    </Box>
                    <Typography variant="h6" color="text.secondary" sx={{ lineHeight: 1.7, fontWeight: 400 }}>
                        Maps the Indian banking system's lending cycle across four regimes — Expansion, Downturn, Repair, and Recovery — using the relationship between credit growth momentum and the credit-deposit ratio as calibrated against RBI 10-year averages.
                    </Typography>
                </Box>

                {/* Definition */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookOpen size={20} style={{ color: '#22c55e' }} />
                        Definition &amp; Intuition
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85, mb: 3 }}>
                        India's credit cycle is structurally different from Western economies: the banking system is dominated by public sector banks whose lending mandates reflect fiscal as well as monetary objectives. The <strong style={{ color: '#86efac' }}>Credit-Deposit (CD) Ratio</strong> — the fraction of deposits deployed as loans — is the RBI's primary instrument for monitoring system-level liquidity stress in the banking sector.
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85 }}>
                        When combined with <strong style={{ color: '#86efac' }}>Credit Growth YoY</strong> (the velocity of new lending), these two variables define the four quadrants of the India Credit Cycle Clock. The clock moves through these quadrants in a broadly predictable sequence, each with distinct implications for asset allocation, RBI policy stance, and NPA (non-performing asset) risk.
                    </Typography>
                </Paper>

                {/* Formula */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FlaskConical size={20} style={{ color: '#22c55e' }} />
                        Formula &amp; Quadrant Mapping
                    </Typography>
                    <Box sx={{ p: 3, mb: 3, bgcolor: 'rgba(30,41,59,0.8)', borderRadius: 2, fontFamily: 'monospace', fontSize: '0.9rem', color: '#86efac', lineHeight: 2, border: '1px solid rgba(34,197,94,0.15)' }}>
                        <Box component="span" sx={{ color: '#64748b' }}># Credit Growth YoY (x-axis){'\n'}</Box>
                        Credit Growth = (Bank Credit_t / Bank Credit_t-12) − 1 × 100{'\n\n'}
                        <Box component="span" sx={{ color: '#64748b' }}># Credit-Deposit Ratio (y-axis){'\n'}</Box>
                        CD Ratio (%) = (Total Bank Credit / Total Bank Deposits) × 100{'\n\n'}
                        <Box component="span" sx={{ color: '#64748b' }}># Quadrant Thresholds (10-year RBI averages){'\n'}</Box>
                        Credit Growth pivot: 12% YoY (10yr avg: ~12.4%){'\n'}
                        CD Ratio pivot:     74% (10yr avg: ~73.8%)
                    </Box>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                        {[
                            { label: 'Bank Credit (RBI)', desc: 'Scheduled Commercial Banks — Non-food Credit, weekly from RBI H3 Statistical Release.' },
                            { label: 'Bank Deposits (RBI)', desc: 'Aggregate Deposits of SCBs — same weekly release. Includes demand and time deposits.' },
                            { label: 'Calibration Period', desc: '10-year rolling RBI averages to set quadrant pivot lines; recalibrated annually each April (RBI fiscal year start).' },
                            { label: 'Source', desc: 'RBI DBIE (Data Bank of India Economy): tables 1 and 2 of the weekly H.3 statistical supplement.' },
                        ].map(d => (
                            <Box key={d.label} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#86efac', fontWeight: 700 }}>{d.label}</Typography>
                                <Typography variant="body2" color="text.secondary" mt={1}>{d.desc}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                {/* Quadrant Definitions */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Activity size={20} style={{ color: '#22c55e' }} />
                        Quadrant Definitions
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block" mb={3}>
                        Each quadrant represents a distinct phase of India's banking credit cycle. The clock moves broadly clockwise.
                    </Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={3} mb={4}>
                        {[
                            {
                                name: 'Expansion',
                                coords: 'High Credit Growth + High CD Ratio',
                                color: '#22c55e',
                                desc: 'Credit growth above trend with CD ratios elevated above 74%. Characteristic of peak business cycle demand. Associated with rising NPA risk as underwriting standards loosen. RBI typically moves to tightening bias.',
                            },
                            {
                                name: 'Downturn',
                                coords: 'Falling Credit Growth + High CD Ratio',
                                color: '#f59e0b',
                                desc: 'Credit momentum decelerating but CD ratios still elevated — banks remain fully deployed. Signs of asset quality stress emerging. NPAs begin to be recognised. RBI watches carefully for systemic risk.',
                            },
                            {
                                name: 'Repair',
                                coords: 'Low Credit Growth + Low CD Ratio',
                                color: '#ef4444',
                                desc: 'Credit growth at or below trend with CD ratios normalising below 74%. Balance sheet repair underway — banks building capital buffers and de-risking portfolios. Weakest phase for credit-sensitive equities.',
                            },
                            {
                                name: 'Recovery',
                                coords: 'Rising Credit Growth + Low CD Ratio',
                                color: '#3b82f6',
                                desc: 'Credit growth re-accelerating from a clean balance sheet base. CD ratios still below historical average, creating headroom for further lending expansion. Typically coincides with RBI easing or neutral stance.',
                            },
                        ].map(q => (
                            <Box key={q.name} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: `1px solid ${q.color}30` }}>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: q.color, flexShrink: 0 }} />
                                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: q.color }}>{q.name}</Typography>
                                </Box>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b' }} display="block" mb={1}>{q.coords}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{q.desc}</Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* Scatter chart */}
                    <Typography variant="caption" color="text.disabled" display="block" mb={2}>
                        Historical cycle positions (2007–2025). X-axis: Credit Growth YoY (%). Y-axis: CD Ratio (%). Dashed lines mark 10-year average pivots.
                    </Typography>
                    <Suspense fallback={<ChartSkeleton height={280} />}>
                        <IndiaCreditCycleChart />
                    </Suspense>
                </Paper>

                {/* Calibration */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Lightbulb size={20} style={{ color: '#22c55e' }} />
                        Calibration Methodology
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85, mb: 3 }}>
                        Pivot thresholds are calibrated against <strong style={{ color: '#86efac' }}>10-year rolling RBI averages</strong> — recalibrated each April to align with the RBI's own fiscal year. This ensures the quadrant lines reflect the structural norms of the current Indian banking system rather than historical epochs that may no longer be representative (e.g., pre-liberalisation credit allocation).
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85 }}>
                        The current regime reading (2025–2026) places India in the <strong style={{ color: '#f59e0b' }}>Downturn</strong> quadrant: credit growth has decelerated from the 2023 expansion peak while CD ratios remain elevated above 76%, reflecting limited deposit growth relative to outstanding loan books. The RBI's macro-prudential guidance on unsecured retail lending (November 2023) and ongoing NBFC capital requirements are consistent with this reading.
                    </Typography>
                </Paper>

                {/* Use Cases */}
                <Paper elevation={0} sx={{ p: 5, mb: 6, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Database size={20} style={{ color: '#22c55e' }} />
                        Institutional Use Cases
                    </Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                        {[
                            { role: 'EM Macro Funds', use: 'Position India banking sector equities against cycle phase. Repair → Recovery transitions historically precede 30–50% outperformance in PSU bank indices relative to Nifty 50.' },
                            { role: 'Fixed Income (India)', use: 'Map cycle phase to RBI rate stance. Expansion phase: price in tightening or macro-prudential tightening. Repair phase: duration extension signals emerging.' },
                            { role: 'Private Credit / PE', use: 'Expansion phase increases competition from banks, compressing private credit spreads. Repair phase creates origination opportunities as banks pull back from mid-market lending.' },
                            { role: 'Sovereign Wealth Funds', use: 'India allocation sizing informed by cycle phase. Expansion phase warrants caution on credit-intensive sectors; Recovery phase signals structural consumption growth tailwind.' },
                        ].map(u => (
                            <Box key={u.role} sx={{ p: 3, bgcolor: 'rgba(34,197,94,0.04)', borderRadius: 2, border: '1px solid rgba(34,197,94,0.12)' }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#22c55e' }} mb={1}>{u.role}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{u.use}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                <Divider sx={{ mb: 5, opacity: 0.1 }} />
                <Box display="flex" gap={2} flexWrap="wrap" mb={8}>
                    <Button component={Link} to="/intel/india" variant="outlined" startIcon={<BookOpen size={14} />} sx={{ borderColor: 'divider', color: 'text.secondary' }}>India Intelligence Engine</Button>
                    <Button component={Link} to="/methodology" variant="outlined" startIcon={<Database size={14} />} sx={{ borderColor: 'divider', color: 'text.secondary' }}>Methodology Hub</Button>
                    <Button component={Link} to="/data-sources" variant="outlined" startIcon={<Link2 size={14} />} sx={{ borderColor: 'divider', color: 'text.secondary' }}>Data Sources</Button>
                    <Button component={Link} to="/" variant="contained" color="primary">View Live Dashboard →</Button>
                </Box>
                <RelatedContent />
                <RelatedMetrics />
            </Container>
        </Box>
    );
};
