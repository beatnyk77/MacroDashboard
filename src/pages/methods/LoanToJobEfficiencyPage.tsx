import React, { Suspense, lazy } from 'react';
import { Box, Container, Typography, Paper, Chip, Button, Divider } from '@mui/material';
import { ArrowLeft, Database, BookOpen, FlaskConical, Activity, Link2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { ChartSkeleton } from '@/components/charts/ChartSkeleton';

const LoanToJobEfficiencyChart = lazy(() => import('./LoanToJobEfficiencyChart').then(m => ({ default: m.LoanToJobEfficiencyChart })));

export const LoanToJobEfficiencyPage: React.FC = () => {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "@id": "https://graphiquestor.com/methods/loan-to-job-efficiency",
        "headline": "Loan-to-Job Efficiency Ratio — India Credit & Employment Methodology",
        "description": "Full methodology for the India Loan-to-Job Efficiency Ratio: measuring credit productivity in generating formal employment via EPFO and RBI credit data.",
        "url": "https://graphiquestor.com/methods/loan-to-job-efficiency",
        "datePublished": "2026-04-10",
        "dateModified": "2026-04-10",
        "author": { "@type": "Organization", "name": "GraphiQuestor Research" },
        "publisher": { "@type": "Organization", "name": "GraphiQuestor" },
        "keywords": ["India Employment", "EPFO", "Bank Credit Growth", "Loan to Job Ratio", "India Macro"]
    };

    return (
        <Box sx={{ py: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
            <SEOManager
                title="Loan-to-Job Efficiency Ratio — India Credit & Employment Methodology"
                description="How the Loan-to-Job Efficiency Ratio measures the productivity of India bank credit in generating formal employment. Formula, data sources, and institutional interpretation."
                keywords={["India Loan To Job", "EPFO Employment", "India Credit Growth", "K-Shaped Economy"]}
                canonicalUrl="https://graphiquestor.com/methods/loan-to-job-efficiency"
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
                    <Typography variant="caption" color="text.secondary">Loan-to-Job Efficiency</Typography>
                </Box>

                {/* Hero */}
                <Box mb={8}>
                    <Chip label="Methods Article · Macro Indicators · India" variant="outlined"
                        sx={{ mb: 3, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.7rem', borderColor: '#818cf8', color: '#818cf8' }} />
                    <Typography variant="h2" component="h1" fontWeight={900} gutterBottom>
                        Loan-to-Job Efficiency Ratio
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ lineHeight: 1.7, fontWeight: 400 }}>
                        Measuring whether India's credit boom is generating real employment or simply inflating asset prices. A proprietary signal for K-shaped economic divergence.
                    </Typography>
                </Box>

                {/* Definition */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookOpen size={20} style={{ color: '#818cf8' }} />
                        Definition &amp; Intuition
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85, mb: 3 }}>
                        In a healthy credit cycle, bank lending grows in proportion to the formal jobs it creates. The Loan-to-Job Efficiency Ratio (L/J) measures this relationship: <strong style={{ color: '#a5b4fc' }}>for every percentage point of credit growth, how many net new formal jobs are being created?</strong>
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85 }}>
                        A rising L/J ratio — credit growing faster than EPFO (Employees' Provident Fund Organisation) net subscriber additions — indicates credit is increasingly channelled into non-employment-generating activities: real estate speculation, personal consumption loans, and debt restructuring rather than productive capital formation.
                    </Typography>
                </Paper>

                {/* Formula */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid rgba(129,140,248,0.25)', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FlaskConical size={20} style={{ color: '#818cf8' }} />
                        Formula
                    </Typography>
                    <Box sx={{ p: 3, mb: 3, bgcolor: 'rgba(30,41,59,0.8)', borderRadius: 2, fontFamily: 'monospace', fontSize: '0.9rem', color: '#a5b4fc', lineHeight: 2, border: '1px solid rgba(129,140,248,0.15)' }}>
                        <Box component="span" sx={{ color: '#64748b' }}># Loan-to-Job Efficiency Ratio{'\n'}</Box>
                        L/J Ratio = SCB Credit Growth (YoY %) / ∆ EPFO Net Subscribers (thousands/quarter){'\n\n'}
                        <Box component="span" sx={{ color: '#64748b' }}># Interpretation: higher = less employment per unit of credit{'\n'}</Box>
                        <Box component="span" sx={{ color: '#64748b' }}># Trend matters more than the absolute level{'\n'}</Box>
                    </Box>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                        {[
                            { label: 'SCB Credit Growth', source: 'RBI DBIE — Scheduled Commercial Banks non-food credit YoY%', code: 'Fortnightly / Monthly' },
                            { label: 'EPFO Net Payroll', source: 'Ministry of Labour & Employment — EPFO monthly payroll data bulletin', code: 'Monthly (M+3 lag)' },
                            { label: 'Base Period', source: 'Q1 FY2020 = normalised baseline for structural comparison', code: 'Quarterly aggregation' },
                            { label: 'Smoothing', source: '4-quarter centred moving average to remove seasonal EPFO registration patterns', code: 'Rolling 4Q average' },
                        ].map(d => (
                            <Box key={d.label} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="caption" sx={{ color: '#a5b4fc', fontWeight: 700 }}>{d.label}</Typography>
                                <Typography variant="body2" color="text.secondary" mt={1} mb={0.5} sx={{ lineHeight: 1.5 }}>{d.source}</Typography>
                                <Chip label={d.code} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.04)', color: 'text.disabled', fontSize: '0.65rem' }} />
                            </Box>
                        ))}
                    </Box>
                </Paper>

                {/* Chart */}
                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Activity size={20} style={{ color: '#818cf8' }} />
                        Credit Growth vs. Formal Job Creation (Illustrative, Q1 2022–Q4 2024)
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block" mb={3}>
                        Divergence between credit growth and EPFO additions signals K-shaped economy
                    </Typography>
                    <Suspense fallback={<ChartSkeleton height={260} />}>
                        <LoanToJobEfficiencyChart />
                    </Suspense>
                </Paper>

                {/* Use Cases */}
                <Paper elevation={0} sx={{ p: 5, mb: 6, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Users size={20} style={{ color: '#818cf8' }} />
                        Institutional Use Cases
                    </Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                        {[
                            { role: 'India-Focused Equity Funds', use: 'Track as consumption sustainability indicator. Rising L/J ratio signals credit is consumption-driven not capex-driven — bullish for financials near-term but structural risk for discretionary demand.' },
                            { role: 'Emerging Market Debt Investors', use: 'Use as a credit quality leading indicator for Indian banking sector. Elevated L/J with rising NPL formation risk implies credit provisioning underestimates actual default exposure.' },
                            { role: 'Sovereign Credit Analysts', use: 'Monitor as an input to India\'s "inclusive growth" score. Sustained L/J divergence weakens the consumption story underpinning EM capital flows into India.' },
                            { role: 'Policy Research', use: 'Quantifies the "jobless growth" critique of India\'s post-2022 recovery — essential for ground-truthing official GDP and employment metrics against third-party EPFO data.' },
                        ].map(u => (
                            <Box key={u.role} sx={{ p: 3, bgcolor: 'rgba(129,140,248,0.04)', borderRadius: 2, border: '1px solid rgba(129,140,248,0.12)' }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#818cf8' }} mb={1}>{u.role}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{u.use}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                <Divider sx={{ mb: 5, opacity: 0.1 }} />
                <Box display="flex" gap={2} flexWrap="wrap" mb={8}>
                    <Button component={Link} to="/glossary/loan-to-job-efficiency" variant="outlined" startIcon={<BookOpen size={14} />} sx={{ borderColor: 'divider', color: 'text.secondary' }}>Glossary Definition</Button>
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
