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

const FedMonetizationChart = lazy(() => import('./FedMonetizationChart').then(m => ({ default: m.FedMonetizationChart })));

export const FedMonetizationPage: React.FC = () => {
    const { data: primaryMetric } = useLatestMetric(MID.FED_BALANCE_SHEET);
    const dataFreshness = getStaleness(primaryMetric?.lastUpdated, primaryMetric?.frequency);
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "@id": "https://graphiquestor.com/methods/fed-monetization-monitor",
        "headline": "Fed Monetization Monitor — GraphiQuestor Methodology",
        "description": "Full methodology for the Fed Monetization Monitor: how Federal Reserve assets as a percentage of total US marketable debt tracks the pace of fiscal dominance and precedes yield curve control discussions.",
        "url": "https://graphiquestor.com/methods/fed-monetization-monitor",
        "datePublished": "2026-06-01",
        "dateModified": "2026-06-01",
        "author": { "@type": "Organization", "name": "GraphiQuestor Research" },
        "publisher": { "@type": "Organization", "name": "GraphiQuestor" },
        "keywords": ["Fed debt monetization ratio", "what percentage of US debt does the Fed own", "Fed monetization tracker", "fiscal dominance", "yield curve control", "WALCL", "GFDEBTN"]
    };

    return (
        <Box sx={{ py: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
            <SEOManager
                title="Fed Monetization Monitor — GraphiQuestor Methodology"
                description="Fed debt monetization ratio methodology: what percentage of US debt does the Fed own, how WALCL ÷ GFDEBTN is calculated, and why readings above 20% historically precede yield curve control discussions."
                keywords={["Fed debt monetization ratio", "what percentage of US debt does the Fed own", "Fed monetization tracker", "fiscal dominance", "yield curve control"]}
                canonicalUrl="https://graphiquestor.com/methods/fed-monetization-monitor"
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
                    <Typography variant="caption" color="text.secondary">Fed Monetization Monitor</Typography>
                </Box>

                {/* Hero */}
                <Box mb={8}>
                    <Chip label="Methods Article · Fiscal Dominance" variant="outlined"
                        sx={{ mb: 3, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.7rem', borderColor: '#6366f1', color: '#6366f1' }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h2" component="h1" fontWeight={900}>
                            Fed Monetization Monitor
                        </Typography>
                        <FreshnessChip status={dataFreshness.state} lastUpdated={primaryMetric?.lastUpdated} />
                    </Box>
                    <Typography variant="h6" color="text.secondary" sx={{ lineHeight: 1.7, fontWeight: 400 }}>
                        Tracks the Federal Reserve's balance sheet as a share of total US marketable debt — a direct measure of how much of the government's financing burden has been absorbed by monetary policy.
                    </Typography>
                </Box>

                {/* Definition */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookOpen size={20} style={{ color: '#6366f1' }} />
                        Definition &amp; Intuition
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85, mb: 3 }}>
                        <strong style={{ color: '#a5b4fc' }}>Debt monetization</strong> occurs when a central bank purchases government securities, effectively financing fiscal deficits through money creation rather than market borrowing. The Fed Monetization Ratio makes this dynamic observable in real time: it measures what fraction of the total outstanding US marketable debt is held on the Federal Reserve's balance sheet.
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85 }}>
                        A rising ratio signals that private and foreign demand for Treasuries is being supplemented — or substituted — by Fed purchases. This compresses term premiums, suppresses yields below market-clearing levels, and, at the margin, funds deficit spending through seigniorage. It is the quantitative backbone of the <strong style={{ color: '#a5b4fc' }}>fiscal dominance</strong> framework.
                    </Typography>
                </Paper>

                {/* Formula */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FlaskConical size={20} style={{ color: '#6366f1' }} />
                        Formula
                    </Typography>
                    <Box sx={{ p: 3, mb: 3, bgcolor: 'rgba(30,41,59,0.8)', borderRadius: 2, fontFamily: 'monospace', fontSize: '0.9rem', color: '#a5b4fc', lineHeight: 2, border: '1px solid rgba(99,102,241,0.15)' }}>
                        <Box component="span" sx={{ color: '#64748b' }}># Fed Assets (WALCL — Federal Reserve Total Assets){'\n'}</Box>
                        Fed Assets = Total Federal Reserve Balance Sheet (USD billions){'\n\n'}
                        <Box component="span" sx={{ color: '#64748b' }}># Total Marketable Debt (GFDEBTN){'\n'}</Box>
                        Marketable Debt = Federal Debt Held by the Public (USD billions){'\n\n'}
                        <Box component="span" sx={{ color: '#64748b' }}># Monetization Ratio{'\n'}</Box>
                        Monetization Ratio (%) = (WALCL ÷ GFDEBTN) × 100
                    </Box>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                        {[
                            { label: 'WALCL (FRED)', desc: 'Federal Reserve Total Assets — weekly H.4.1 release. Includes Treasuries, MBS, and credit facilities.' },
                            { label: 'GFDEBTN (FRED)', desc: 'Federal Debt: Total Public Debt — quarterly Treasury Bulletin series, seasonally unadjusted.' },
                            { label: 'Frequency', desc: 'Weekly WALCL interpolated against quarterly GFDEBTN; monthly averages used for signal smoothing.' },
                            { label: 'Signal Threshold', desc: '>20% historically precedes policy discussions around yield curve control. 2008 baseline: ~7%.' },
                        ].map(d => (
                            <Box key={d.label} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#a5b4fc', fontWeight: 700 }}>{d.label}</Typography>
                                <Typography variant="body2" color="text.secondary" mt={1}>{d.desc}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                {/* Historical Context */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Activity size={20} style={{ color: '#6366f1' }} />
                        Historical Context
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block" mb={3}>
                        Monetization Ratio (%) = WALCL ÷ GFDEBTN × 100. Dashed line at 20% marks historical threshold preceding yield curve control discussions.
                    </Typography>
                    <Suspense fallback={<ChartSkeleton height={240} />}>
                        <FedMonetizationChart />
                    </Suspense>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr' }} gap={2} mt={3}>
                        {[
                            { label: '2008 Baseline', value: '~7%', note: 'Pre-QE1; Fed held only direct credit market obligations' },
                            { label: '2020 Peak', value: '~22%', note: 'COVID-era balance sheet expansion to $8.9T; post-CARES Act financing' },
                            { label: 'Current (2026)', value: '~16%', note: 'Post-QT drawdown; stabilising above structural pre-QE floor' },
                        ].map(d => (
                            <Box key={d.label} sx={{ p: 3, bgcolor: 'rgba(99,102,241,0.05)', borderRadius: 2, border: '1px solid rgba(99,102,241,0.15)', textAlign: 'center' }}>
                                <Typography variant="caption" color="text.disabled" display="block">{d.label}</Typography>
                                <Typography variant="h5" fontWeight={900} sx={{ color: '#a5b4fc', my: 0.5 }}>{d.value}</Typography>
                                <Typography variant="caption" color="text.secondary">{d.note}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                {/* Fiscal Dominance Framework */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Lightbulb size={20} style={{ color: '#6366f1' }} />
                        Fiscal Dominance Framework
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85, mb: 3 }}>
                        The monetization ratio above 20% has historically coincided with or preceded explicit discussions of <strong style={{ color: '#a5b4fc' }}>yield curve control (YCC)</strong> — a regime in which the central bank caps yields at specific maturities to reduce the government's interest expense. Japan's BoJ has operated YCC continuously since 2016. The Fed debated it formally in 2020–2021.
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85, mb: 3 }}>
                        The mechanism is straightforward: as the government's interest bill grows relative to tax revenues, political pressure on the central bank to suppress borrowing costs intensifies. When the Fed's balance sheet represents a large fraction of outstanding debt, its market-making function in Treasuries becomes structurally load-bearing — exit from QE risks disorderly yield moves that the fiscal position cannot absorb.
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85 }}>
                        This monitor does not forecast policy outcomes. It provides the quantitative basis for assessing the degree to which monetary and fiscal policy have become entangled — the defining macro variable of the post-2008 regime.
                    </Typography>
                </Paper>

                {/* Use Cases */}
                <Paper elevation={0} sx={{ p: 5, mb: 6, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Database size={20} style={{ color: '#6366f1' }} />
                        Institutional Use Cases
                    </Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                        {[
                            { role: 'Fixed Income PMs', use: 'Use ratio trajectory to assess duration risk premium compression. Rising monetization suppresses term premiums — monitor for turning points signalling QT resumption or structural reversal.' },
                            { role: 'Macro Hedge Funds', use: 'Cross the monetization signal with real yields and breakeven inflation to identify fiscal dominance inflection points — historically a leading indicator for gold outperformance and USD weakness.' },
                            { role: 'Sovereign Wealth Funds', use: 'Benchmark US Treasury allocation decisions against the monetization regime. High ratios reduce the risk-free designation of long-duration Treasuries in a multi-decade liability context.' },
                            { role: 'Central Bank Research', use: 'Comparative analysis across G7: ECB, BoJ, and BoE equivalent ratios reveal relative fiscal dominance intensity and inform reserve currency allocation modelling.' },
                        ].map(u => (
                            <Box key={u.role} sx={{ p: 3, bgcolor: 'rgba(99,102,241,0.04)', borderRadius: 2, border: '1px solid rgba(99,102,241,0.12)' }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#a5b4fc' }} mb={1}>{u.role}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{u.use}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                <Divider sx={{ mb: 5, opacity: 0.1 }} />
                <Box display="flex" gap={2} flexWrap="wrap" mb={8}>
                    <Button component={Link} to="/glossary/fiscal-dominance" variant="outlined" startIcon={<BookOpen size={14} />} sx={{ borderColor: 'divider', color: 'text.secondary' }}>Fiscal Dominance Glossary</Button>
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
