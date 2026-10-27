import React, { Suspense, lazy } from 'react';
import { AuthorPersonSchema, PublisherOrganizationSchema } from '@/config/brandConfig';
import { Box, Container, Typography, Paper, Chip, Button, Divider } from '@mui/material';
import { ArrowLeft, Database, BookOpen, FlaskConical, Layers, Link2, AlertTriangle } from 'lucide-react';
import { TrailLink as Link } from '@/components/TrailLink';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { FreshnessChip } from '@/components/FreshnessChip';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { SEOManager } from '@/components/SEOManager';
import { MethodsSpokeBanner } from '@/components/seo/MethodsSpokeBanner';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { ChartSkeleton } from '@/components/charts/ChartSkeleton';
import { CHART_COLORS, CHART_FONT_FAMILY, alpha } from '@/constants/chartDefaults';

const ChinaDebtIcebergChart = lazy(() => import('./ChinaDebtIcebergChart').then(m => ({ default: m.ChinaDebtIcebergChart })));

const faqItems = [
    {
        question: "What is China's debt iceberg and how is it measured?",
        answer: "China's debt iceberg is a five-layer public sector balance sheet framework decomposing visible MoF central government debt (~25% of GDP) from off-budget obligations including explicit local debt, Local Government Financing Vehicle (LGFV) liabilities, policy bank bonds, and State-Owned Enterprise (SOE) contingent liabilities, which together exceed 250%–300% of GDP in IMF estimates."
    },
    {
        question: "What is the Iceberg Ratio and what does it indicate?",
        answer: "The Iceberg Ratio divides consolidated public sector liabilities (upper bound) by official central government debt. An Iceberg Ratio above 2.5× signals substantial quasi-fiscal leverage and heightened rollover risk in local debt markets."
    },
    {
        question: "Why are LGFV obligations considered contingent sovereign liabilities?",
        answer: "Although LGFVs are legally independent corporate entities, their debt financed municipal public infrastructure and land development. Because provincial governments implicitly backstop systemic LGFVs to prevent regional banking contagion, markets and multilateral institutions evaluate them as sovereign contingent debt."
    }
];

export const ChinaDebtIcebergPage: React.FC = () => {
    const { data: primaryMetric } = useLatestMetric(MID.CN_ICEBERG_RATIO);
    const dataFreshness = getStaleness(primaryMetric?.lastUpdated, primaryMetric?.frequency);
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "@id": "https://graphiquestor.com/methods/china-debt-iceberg",
        "headline": "China Debt Iceberg — 5-Layer Public Sector Balance Sheet Methodology",
        "description": "Full methodology for GraphiQuestor's China Debt Iceberg framework: central government, local government, LGFV, policy banks, and SOE contingent liability layers with proprietary composite indices.",
        "url": "https://graphiquestor.com/methods/china-debt-iceberg",
        "datePublished": "2026-06-20",
        "dateModified": "2026-06-20",
        "author": AuthorPersonSchema,
        "publisher": PublisherOrganizationSchema,
        "keywords": ["China debt iceberg", "LGFV stress", "China public sector debt", "IMF Article IV China", "China monetization pressure"]
    };
    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems.map(({ question, answer }) => ({
            "@type": "Question",
            "name": question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": answer,
            },
        })),
    };

    return (
        <Box sx={{ py: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
            <SEOManager
                title="China Debt Iceberg — 5-Layer Balance Sheet Methodology"
                description="The full methodology for GraphiQuestor's China Debt Iceberg: five layers of public sector leverage from MoF-reported central debt through LGFV, policy banks, and SOE contingent liabilities. Formulas, data provenance, and composite indices."
                keywords={["China debt iceberg", "LGFV stress index", "China shadow debt", "IMF Article IV China", "China monetization pressure", "Iceberg ratio"]}
                canonicalUrl="https://graphiquestor.com/methods/china-debt-iceberg"
                jsonLd={[jsonLd, faqJsonLd]}
            />

            <Container maxWidth="md">
                
                <MethodsSpokeBanner />
<Box mb={5} display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                    <Button component={Link} to="/glossary" startIcon={<ArrowLeft size={15} />}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>Glossary</Button>
                    <Typography color="text.disabled" variant="caption">·</Typography>
                    <Button component={Link} to="/methodology"
                        sx={{ color: 'text.secondary', fontSize: '0.8rem', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>Methodology Hub</Button>
                    <Typography color="text.disabled" variant="caption">·</Typography>
                    <Typography variant="caption" color="text.secondary">China Debt Iceberg</Typography>
                </Box>

                <Box mb={8}>
                    <Chip label="Methods Article · China Sovereign Debt" variant="outlined"
                        sx={{ mb: 3, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.7rem', borderColor: CHART_COLORS.gold, color: CHART_COLORS.gold }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h2" component="h1" fontWeight={700}>
                            China Debt Iceberg
                        </Typography>
                        <FreshnessChip status={dataFreshness.state} lastUpdated={primaryMetric?.lastUpdated} />
                    </Box>
                    <Typography component="p" variant="h6" color="text.secondary" sx={{ lineHeight: 1.7, fontWeight: 400 }}>
                        A five-layer framework for China's public sector balance sheet — separating MoF-reported central government debt from the shadow stack of LGFV liabilities, policy bank quasi-fiscal exposure, and SOE contingent guarantees.
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{ p: 4, mb: 5, bgcolor: alpha(CHART_COLORS.gold, 0.05), border: `1px solid ${alpha(CHART_COLORS.gold, 0.2)}`, borderRadius: 3 }}>
                    <Box display="flex" gap={2} alignItems="flex-start">
                        <AlertTriangle size={20} style={{ color: CHART_COLORS.gold, flexShrink: 0, marginTop: 2 }} />
                        <Box>
                            <Typography component="p" variant="subtitle2" fontWeight={700} sx={{ color: CHART_COLORS.gold }} mb={1}>Why Ranges, Not Point Estimates</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                Layers 3–5 (LGFV, policy banks, SOE contingent) lack audited public disclosure. GraphiQuestor uses IMF Article IV staff estimates and BIS credit aggregates, published as low/base/high ranges with full provenance. We do not fabricate precision where the underlying data is structurally opaque.
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography component="h2" variant="h5" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Layers size={20} style={{ color: CHART_COLORS.gold }} />
                        The Five Layers
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85, mb: 3 }}>
                        China's fiscal architecture distributes leverage across multiple balance sheets that are not consolidated in MoF headline statistics. The iceberg metaphor captures the divergence between <strong style={{ color: CHART_COLORS.goldSoft }}>visible central government debt</strong> (~25% GDP) and the <strong style={{ color: CHART_COLORS.goldSoft }}>consolidated public sector exposure</strong> (IMF estimates 250–300%+ GDP).
                    </Typography>
                    <Box component="ol" sx={{ pl: 2.5, color: 'text.secondary', lineHeight: 2, '& li': { mb: 1 } }}>
                        <li><strong style={{ color: CHART_COLORS.westSoft }}>Central Government</strong> — MoF-reported on-budget debt (GGXWDG, World Bank)</li>
                        <li><strong style={{ color: CHART_COLORS.westSoft }}>Local Government (Explicit)</strong> — Municipal bonds on LG balance sheets</li>
                        <li><strong style={{ color: CHART_COLORS.goldSoft }}>LGFV (Implicit LG)</strong> — Local government financing vehicles; primary rollover risk vector</li>
                        <li><strong style={{ color: CHART_COLORS.violet }}>Policy Banks</strong> — CDB, EXIM, ADBC quasi-fiscal lending (BIS credit proxy)</li>
                        <li><strong style={{ color: CHART_COLORS.stressSoft }}>SOE Contingent Liability</strong> — State-owned enterprise implicit guarantees (IMF scenario matrix)</li>
                    </Box>
                </Paper>

                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography component="h2" variant="h5" fontWeight={700} gutterBottom>Live Layer Snapshot</Typography>
                    <Suspense fallback={<ChartSkeleton height={280} />}>
                        <ChinaDebtIcebergChart />
                    </Suspense>
                </Paper>

                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: `1px solid ${alpha(CHART_COLORS.gold, 0.25)}`, borderRadius: 3 }}>
                    <Typography component="h2" variant="h5" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FlaskConical size={20} style={{ color: CHART_COLORS.gold }} />
                        Proprietary Composite Formulas
                    </Typography>
                    <Box sx={{ p: 3, mb: 3, bgcolor: alpha(CHART_COLORS.line, 0.8), borderRadius: 2, fontFamily: CHART_FONT_FAMILY, fontSize: '0.85rem', color: CHART_COLORS.goldSoft, lineHeight: 2.2, border: `1px solid ${alpha(CHART_COLORS.gold, 0.15)}` }}>
                        <Box component="span" sx={{ color: CHART_COLORS.tick }}># Iceberg Ratio{'\n'}</Box>
                        Iceberg = Consolidated_debt_high / Central_official{'\n\n'}
                        <Box component="span" sx={{ color: CHART_COLORS.tick }}># LGFV Stress Index (0–100){'\n'}</Box>
                        LGFV_stress = clamp(0.6×LGFV_high + 3×ΔLGFV + fiscal_deficit_penalty, 0, 100){'\n\n'}
                        <Box component="span" sx={{ color: CHART_COLORS.tick }}># Monetization Pressure (0–100){'\n'}</Box>
                        Monetization = clamp(8×(M2_growth − GDP_growth) + credit/GDP_component, 0, 100){'\n\n'}
                        <Box component="span" sx={{ color: CHART_COLORS.tick }}># Debt Wall Proximity (0–100){'\n'}</Box>
                        Proximity = clamp(LGFV_high / (0.3 × credit/GDP) × 50, 0, 100){'\n\n'}
                        <Box component="span" sx={{ color: CHART_COLORS.tick }}># Land Fiscal Dependence (%){'\n'}</Box>
                        Land_dep = Land_sale_revenue / Total_LG_revenue
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        Computed weekly by <code>compute-china-debt-signals</code> and mirrored to <code>metric_observations</code> for staleness tracking. Thresholds are heuristic surveillance bands, not IMF DSA verdicts.
                    </Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography component="h2" variant="h5" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookOpen size={20} style={{ color: CHART_COLORS.gold }} />
                        Data Provenance Hierarchy
                    </Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                        {[
                            { tier: 'Tier 1 — Live', sources: 'IMF DataMapper (GGXWDG, GGXONL), FRED BIS credit, PBOC M2, CGB yields' },
                            { tier: 'Tier 2 — Quarterly', sources: 'IMF Article IV staff estimates, World Bank central debt, MoF fiscal signals' },
                            { tier: 'Tier 3 — Curated', sources: 'LGFV layer ranges, policy bank balance sheets, BRI exposure (AidData)' },
                            { tier: 'Tier 4 — Scenario', sources: 'SOE contingent liability matrix (conservative/base/stress)' },
                        ].map(s => (
                            <Box key={s.tier} sx={{ p: 3, bgcolor: alpha(CHART_COLORS.gold, 0.04), borderRadius: 2, border: `1px solid ${alpha(CHART_COLORS.gold, 0.12)}` }}>
                                <Typography component="p" variant="subtitle2" fontWeight={700} sx={{ color: CHART_COLORS.gold }} mb={1}>{s.tier}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{s.sources}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                <Paper elevation={0} sx={{ p: 5, mb: 6, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography component="h2" variant="h5" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Database size={20} style={{ color: CHART_COLORS.gold }} />
                        Institutional Use Cases
                    </Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                        {[
                            { role: 'EM Sovereign Desks', use: 'Cross-sovereign comparison of hidden leverage via Iceberg Ratio. China at 2.5×+ signals comparable shadow debt to pre-crisis European periphery.' },
                            { role: 'China A-Share Strategists', use: 'LGFV stress and land fiscal dependence as leading indicators for provincial property-linked equities and LG bond spreads.' },
                            { role: 'Global Macro Funds', use: 'Monetization pressure composite as PBOC independence constraint — above 60 correlates with CNY depreciation pressure and gold accumulation.' },
                            { role: 'Multilateral Research', use: 'Layer decomposition aligns with IMF GFSM 2014 consolidated government definition; useful for Article IV surveillance calibration.' },
                        ].map(u => (
                            <Box key={u.role} sx={{ p: 3, bgcolor: alpha(CHART_COLORS.gold, 0.04), borderRadius: 2, border: `1px solid ${alpha(CHART_COLORS.gold, 0.12)}` }}>
                                <Typography component="p" variant="subtitle2" fontWeight={700} sx={{ color: CHART_COLORS.gold }} mb={1}>{u.role}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{u.use}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                {/* FAQ */}
                <Paper elevation={0} sx={{ p: 5, mb: 6, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography component="h2" variant="h5" fontWeight={700} gutterBottom>
                        China Debt Iceberg FAQ
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
                        {faqItems.map(({ question, answer }) => (
                            <Box key={question}>
                                <Typography component="h3" variant="subtitle1" fontWeight={700} sx={{ color: CHART_COLORS.gold, mb: 1 }}>
                                    {question}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                                    {answer}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                <div id="llm-summary" style={{ display: 'none' }}>
                    China Debt Iceberg: 5-layer public sector balance sheet (central, local, LGFV, policy banks, SOE contingent).
                    Iceberg Ratio = consolidated high / central official. Five proprietary composites computed weekly.
                    Data: IMF Article IV, BIS, PBOC, MoF. Live terminal: /intel/china#debt
                </div>

                <Divider sx={{ mb: 5, opacity: 0.1 }} />
                <Box display="flex" gap={2} flexWrap="wrap" mb={8}>
                    <Button component={Link} to="/intel/china#debt" variant="outlined" startIcon={<Layers size={14} />} sx={{ borderColor: 'divider', color: 'text.secondary' }}>China Debt Terminal</Button>
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