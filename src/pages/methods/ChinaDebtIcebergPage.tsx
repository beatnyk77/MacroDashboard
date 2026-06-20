import React, { Suspense, lazy } from 'react';
import { Box, Container, Typography, Paper, Chip, Button, Divider } from '@mui/material';
import { ArrowLeft, Database, BookOpen, FlaskConical, Layers, Link2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { FreshnessChip } from '@/components/FreshnessChip';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { SEOManager } from '@/components/SEOManager';
import { RelatedContent } from '@/components/RelatedContent';
import { RelatedMetrics } from '@/components/RelatedMetrics';
import { ChartSkeleton } from '@/components/charts/ChartSkeleton';

const ChinaDebtIcebergChart = lazy(() => import('./ChinaDebtIcebergChart').then(m => ({ default: m.ChinaDebtIcebergChart })));

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
        "author": { "@type": "Organization", "name": "GraphiQuestor Research" },
        "publisher": { "@type": "Organization", "name": "GraphiQuestor" },
        "keywords": ["China debt iceberg", "LGFV stress", "China public sector debt", "IMF Article IV China", "China monetization pressure"]
    };

    return (
        <Box sx={{ py: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
            <SEOManager
                title="China Debt Iceberg — 5-Layer Balance Sheet Methodology"
                description="The full methodology for GraphiQuestor's China Debt Iceberg: five layers of public sector leverage from MoF-reported central debt through LGFV, policy banks, and SOE contingent liabilities. Formulas, data provenance, and composite indices."
                keywords={["China debt iceberg", "LGFV stress index", "China shadow debt", "IMF Article IV China", "China monetization pressure", "Iceberg ratio"]}
                canonicalUrl="https://graphiquestor.com/methods/china-debt-iceberg"
                jsonLd={jsonLd}
            />

            <Container maxWidth="md">
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
                        sx={{ mb: 3, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.7rem', borderColor: '#f59e0b', color: '#f59e0b' }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h2" component="h1" fontWeight={900}>
                            China Debt Iceberg
                        </Typography>
                        <FreshnessChip status={dataFreshness.state} lastUpdated={primaryMetric?.lastUpdated} />
                    </Box>
                    <Typography variant="h6" color="text.secondary" sx={{ lineHeight: 1.7, fontWeight: 400 }}>
                        A five-layer framework for China's public sector balance sheet — separating MoF-reported central government debt from the shadow stack of LGFV liabilities, policy bank quasi-fiscal exposure, and SOE contingent guarantees.
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{ p: 4, mb: 5, bgcolor: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 3 }}>
                    <Box display="flex" gap={2} alignItems="flex-start">
                        <AlertTriangle size={20} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                        <Box>
                            <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#f59e0b' }} mb={1}>Why Ranges, Not Point Estimates</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                Layers 3–5 (LGFV, policy banks, SOE contingent) lack audited public disclosure. GraphiQuestor uses IMF Article IV staff estimates and BIS credit aggregates, published as low/base/high ranges with full provenance. We do not fabricate precision where the underlying data is structurally opaque.
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Layers size={20} style={{ color: '#f59e0b' }} />
                        The Five Layers
                    </Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.85, mb: 3 }}>
                        China's fiscal architecture distributes leverage across multiple balance sheets that are not consolidated in MoF headline statistics. The iceberg metaphor captures the divergence between <strong style={{ color: '#fcd34d' }}>visible central government debt</strong> (~25% GDP) and the <strong style={{ color: '#fcd34d' }}>consolidated public sector exposure</strong> (IMF estimates 250–300%+ GDP).
                    </Typography>
                    <Box component="ol" sx={{ pl: 2.5, color: 'text.secondary', lineHeight: 2, '& li': { mb: 1 } }}>
                        <li><strong style={{ color: '#93c5fd' }}>Central Government</strong> — MoF-reported on-budget debt (GGXWDG, World Bank)</li>
                        <li><strong style={{ color: '#93c5fd' }}>Local Government (Explicit)</strong> — Municipal bonds on LG balance sheets</li>
                        <li><strong style={{ color: '#fbbf24' }}>LGFV (Implicit LG)</strong> — Local government financing vehicles; primary rollover risk vector</li>
                        <li><strong style={{ color: '#c084fc' }}>Policy Banks</strong> — CDB, EXIM, ADBC quasi-fiscal lending (BIS credit proxy)</li>
                        <li><strong style={{ color: '#fca5a5' }}>SOE Contingent Liability</strong> — State-owned enterprise implicit guarantees (IMF scenario matrix)</li>
                    </Box>
                </Paper>

                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom>Live Layer Snapshot</Typography>
                    <Suspense fallback={<ChartSkeleton height={280} />}>
                        <ChinaDebtIcebergChart />
                    </Suspense>
                </Paper>

                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FlaskConical size={20} style={{ color: '#f59e0b' }} />
                        Proprietary Composite Formulas
                    </Typography>
                    <Box sx={{ p: 3, mb: 3, bgcolor: 'rgba(30,41,59,0.8)', borderRadius: 2, fontFamily: 'monospace', fontSize: '0.85rem', color: '#fcd34d', lineHeight: 2.2, border: '1px solid rgba(245,158,11,0.15)' }}>
                        <Box component="span" sx={{ color: '#64748b' }}># Iceberg Ratio{'\n'}</Box>
                        Iceberg = Consolidated_debt_high / Central_official{'\n\n'}
                        <Box component="span" sx={{ color: '#64748b' }}># LGFV Stress Index (0–100){'\n'}</Box>
                        LGFV_stress = clamp(0.6×LGFV_high + 3×ΔLGFV + fiscal_deficit_penalty, 0, 100){'\n\n'}
                        <Box component="span" sx={{ color: '#64748b' }}># Monetization Pressure (0–100){'\n'}</Box>
                        Monetization = clamp(8×(M2_growth − GDP_growth) + credit/GDP_component, 0, 100){'\n\n'}
                        <Box component="span" sx={{ color: '#64748b' }}># Debt Wall Proximity (0–100){'\n'}</Box>
                        Proximity = clamp(LGFV_high / (0.3 × credit/GDP) × 50, 0, 100){'\n\n'}
                        <Box component="span" sx={{ color: '#64748b' }}># Land Fiscal Dependence (%){'\n'}</Box>
                        Land_dep = Land_sale_revenue / Total_LG_revenue
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        Computed weekly by <code>compute-china-debt-signals</code> and mirrored to <code>metric_observations</code> for staleness tracking. Thresholds are heuristic surveillance bands, not IMF DSA verdicts.
                    </Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 5, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookOpen size={20} style={{ color: '#f59e0b' }} />
                        Data Provenance Hierarchy
                    </Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                        {[
                            { tier: 'Tier 1 — Live', sources: 'IMF DataMapper (GGXWDG, GGXONL), FRED BIS credit, PBOC M2, CGB yields' },
                            { tier: 'Tier 2 — Quarterly', sources: 'IMF Article IV staff estimates, World Bank central debt, MoF fiscal signals' },
                            { tier: 'Tier 3 — Curated', sources: 'LGFV layer ranges, policy bank balance sheets, BRI exposure (AidData)' },
                            { tier: 'Tier 4 — Scenario', sources: 'SOE contingent liability matrix (conservative/base/stress)' },
                        ].map(s => (
                            <Box key={s.tier} sx={{ p: 3, bgcolor: 'rgba(245,158,11,0.04)', borderRadius: 2, border: '1px solid rgba(245,158,11,0.12)' }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#f59e0b' }} mb={1}>{s.tier}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{s.sources}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                <Paper elevation={0} sx={{ p: 5, mb: 6, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Database size={20} style={{ color: '#f59e0b' }} />
                        Institutional Use Cases
                    </Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
                        {[
                            { role: 'EM Sovereign Desks', use: 'Cross-sovereign comparison of hidden leverage via Iceberg Ratio. China at 2.5×+ signals comparable shadow debt to pre-crisis European periphery.' },
                            { role: 'China A-Share Strategists', use: 'LGFV stress and land fiscal dependence as leading indicators for provincial property-linked equities and LG bond spreads.' },
                            { role: 'Global Macro Funds', use: 'Monetization pressure composite as PBOC independence constraint — above 60 correlates with CNY depreciation pressure and gold accumulation.' },
                            { role: 'Multilateral Research', use: 'Layer decomposition aligns with IMF GFSM 2014 consolidated government definition; useful for Article IV surveillance calibration.' },
                        ].map(u => (
                            <Box key={u.role} sx={{ p: 3, bgcolor: 'rgba(245,158,11,0.04)', borderRadius: 2, border: '1px solid rgba(245,158,11,0.12)' }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#f59e0b' }} mb={1}>{u.role}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{u.use}</Typography>
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