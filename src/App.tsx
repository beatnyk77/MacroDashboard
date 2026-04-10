import { useMemo, Suspense, lazy } from 'react';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import getTheme from '@/theme';
import { GlobalLayout } from '@/layout/GlobalLayout';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Build Version: 1.0.1 - Cleanup Pass
// Force fresh bundle generation
const Terminal = lazy(() => import('@/pages/Terminal').then(module => ({ default: module.Terminal })));
const MetricsMethodologyPage = lazy(() => import('@/pages/MetricsMethodologyPage').then(module => ({ default: module.MetricsMethodologyPage })));
const BlogPage = lazy(() => import('@/pages/BlogPage').then(module => ({ default: module.BlogPage })));
const ArticlePage = lazy(() => import('@/pages/ArticlePage').then(module => ({ default: module.ArticlePage })));
const RegimeDigestArchivePage = lazy(() => import('@/pages/RegimeDigestArchivePage').then(module => ({ default: module.RegimeDigestArchivePage })));
const RegimeDigestPage = lazy(() => import('@/pages/RegimeDigestPage').then(module => ({ default: module.RegimeDigestPage })));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const DataHealthDashboard = lazy(() => import('@/pages/DataHealthDashboard').then(module => ({ default: module.DataHealthDashboard })));
const APIAccessPage = lazy(() => import('@/pages/APIAccessPage').then(module => ({ default: module.APIAccessPage })));
const APIDocsPage = lazy(() => import('@/pages/APIDocsPage').then(module => ({ default: module.APIDocsPage })));
const TermsOfService = lazy(() => import('@/pages/TermsOfService').then(module => ({ default: module.TermsOfService })));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })));
const About = lazy(() => import('@/pages/About').then(module => ({ default: module.About })));
const GlossaryIndexPage = lazy(() => import('@/pages/GlossaryIndexPage').then(module => ({ default: module.GlossaryIndexPage })));
const GlossaryTermPage = lazy(() => import('@/pages/GlossaryTermPage').then(module => ({ default: module.GlossaryTermPage })));
const IntelIndiaPage = lazy(() => import('@/pages/IntelIndiaPage').then(module => ({ default: module.IntelIndiaPage })));
const CorporateIndiaEngine = lazy(() => import('@/pages/CorporateIndiaEngine').then(module => ({ default: module.CorporateIndiaEngine })));
const CompanyDetail = lazy(() => import('@/pages/CompanyDetail').then(module => ({ default: module.CompanyDetail })));
const IntelChinaPage = lazy(() => import('@/pages/IntelChinaPage').then(module => ({ default: module.IntelChinaPage })));
const USEquitiesEngine = lazy(() => import('@/pages/USEquitiesEngine').then(module => ({ default: module.USEquitiesEngine })));
const USCompanyDetail = lazy(() => import('@/pages/USCompanyDetail').then(module => ({ default: module.USCompanyDetail })));
const MacroObservatory = lazy(() => import('@/pages/MacroObservatory').then(module => ({ default: module.MacroObservatory })));
const ForInstitutional = lazy(() => import('@/pages/ForInstitutional').then(module => ({ default: module.ForInstitutional })));
const WeeklyNarrativeArchive = lazy(() => import('@/pages/WeeklyNarrativeArchive').then(module => ({ default: module.WeeklyNarrativeArchive })));
const CorporateTreasuryHedging = lazy(() => import('@/pages/CorporateTreasuryHedging').then(module => ({ default: module.CorporateTreasuryHedging })));
const IndiaFlowPulsePage = lazy(() => import('@/pages/IndiaFlowPulsePage').then(module => ({ default: module.IndiaFlowPulsePage })));
const CountryProfilePage = lazy(() => import('@/pages/CountryProfilePage').then(module => ({ default: module.CountryProfilePage })));
const CountriesIndexPage = lazy(() => import('@/pages/CountriesIndexPage').then(module => ({ default: module.CountriesIndexPage })));
const DataSourcesPage = lazy(() => import('@/pages/DataSourcesPage').then(module => ({ default: module.DataSourcesPage })));
const NetLiquidityZScorePage = lazy(() => import('@/pages/methods/NetLiquidityZScorePage').then(module => ({ default: module.NetLiquidityZScorePage })));
const DebtGoldZScorePage = lazy(() => import('@/pages/methods/DebtGoldZScorePage').then(module => ({ default: module.DebtGoldZScorePage })));
const LoanToJobEfficiencyPage = lazy(() => import('@/pages/methods/LoanToJobEfficiencyPage').then(module => ({ default: module.LoanToJobEfficiencyPage })));
const EnergyDependencyRatioPage = lazy(() => import('@/pages/methods/EnergyDependencyRatioPage').then(module => ({ default: module.EnergyDependencyRatioPage })));
const FiscalDominanceMeterPage = lazy(() => import('@/pages/methods/FiscalDominanceMeterPage').then(module => ({ default: module.FiscalDominanceMeterPage })));
const NetLiquidityGauge = lazy(() => import('@/pages/tools/NetLiquidityGauge').then(module => ({ default: module.NetLiquidityGauge })));

const USMacroFiscalLab = lazy(() => import('@/pages/labs/USMacroFiscalLab').then(module => ({ default: module.USMacroFiscalLab })));
const DeDollarizationGoldLab = lazy(() => import('@/pages/labs/DeDollarizationGoldLab').then(module => ({ default: module.DeDollarizationGoldLab })));
const EnergyCommoditiesLab = lazy(() => import('@/pages/labs/EnergyCommoditiesLab').then(module => ({ default: module.EnergyCommoditiesLab })));

const SovereignStressLab = lazy(() => import('@/pages/labs/SovereignStressLab').then(module => ({ default: module.SovereignStressLab })));
const ShadowSystemLab = lazy(() => import('@/pages/labs/ShadowSystemLab').then(module => ({ default: module.ShadowSystemLab })));
const SustainableFinanceLab = lazy(() => import('@/pages/labs/SustainableFinanceLab').then(module => ({ default: module.SustainableFinanceLab })));
const China15thFYPLab = lazy(() => import('@/pages/labs/China15thFYP').then(module => ({ default: module.China15thFYPLab })));

const LoadingFallback = () => (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress color="primary" size={24} />
    </Box>
);

import { ViewProvider } from '@/context/ViewContext';

function App() {
    const theme = useMemo(() => getTheme('dark'), []);

    return (
        <GlobalErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <ViewProvider>
                    <ThemeProvider theme={theme}>
                        <CssBaseline />
                        <BrowserRouter>
                            <GlobalLayout>
                                <Suspense fallback={<LoadingFallback />}>
                                    <Routes>
                                        <Route path="/" element={<Terminal />} />
                                        <Route path="/methodology" element={<MetricsMethodologyPage />} />
                                        <Route path="/data-sources" element={<DataSourcesPage />} />
                                        <Route path="/blog" element={<BlogPage />} />
                                        <Route path="/blog/:slug" element={<ArticlePage />} />
                                        <Route path="/regime-digest" element={<RegimeDigestArchivePage />} />
                                        <Route path="/regime-digest/:year/:month" element={<RegimeDigestPage />} />
                                        <Route path="/admin" element={<AdminDashboard />} />
                                        <Route path="/admin/data-health" element={<DataHealthDashboard />} />
                                        <Route path="/api-access" element={<APIAccessPage />} />
                                        <Route path="/api-docs" element={<APIDocsPage />} />
                                        <Route path="/terms" element={<TermsOfService />} />
                                        <Route path="/privacy" element={<PrivacyPolicy />} />
                                        <Route path="/about" element={<About />} />
                                        <Route path="/glossary" element={<GlossaryIndexPage />} />
                                        <Route path="/glossary/:slug" element={<GlossaryTermPage />} />
                                        {/* Methods Articles */}
                                        <Route path="/methods/net-liquidity-z-score" element={<NetLiquidityZScorePage />} />
                                        <Route path="/methods/debt-gold-z-score" element={<DebtGoldZScorePage />} />
                                        <Route path="/methods/loan-to-job-efficiency" element={<LoanToJobEfficiencyPage />} />
                                        <Route path="/methods/energy-dependency-ratio" element={<EnergyDependencyRatioPage />} />
                                        <Route path="/methods/fiscal-dominance-meter" element={<FiscalDominanceMeterPage />} />
                                        <Route path="/intel/india" element={<IntelIndiaPage />} />
                                        <Route path="/india-equities" element={<CorporateIndiaEngine />} />
                                        <Route path="/india-equities/:tool" element={<CorporateIndiaEngine />} />
                                        <Route path="/india-equities/equity/:ticker" element={<CompanyDetail />} />
                                        <Route path="/us-equities" element={<USEquitiesEngine />} />
                                        <Route path="/us-equities/:tool" element={<USEquitiesEngine />} />
                                        <Route path="/us-equities/equity/:ticker" element={<USCompanyDetail />} />
                                        <Route path="/intel/china" element={<IntelChinaPage />} />
                                        <Route path="/macro-observatory" element={<MacroObservatory />} />
                                        <Route path="/institutional" element={<ForInstitutional />} />
                                        <Route path="/weekly-narrative" element={<WeeklyNarrativeArchive />} />
                                        <Route path="/treasury-hedging" element={<CorporateTreasuryHedging />} />
                                        <Route path="/india-equities/fii-dii" element={<IndiaFlowPulsePage />} />

                                        {/* Tools & Embeds */}
                                        <Route path="/tools/net-liquidity-gauge" element={<NetLiquidityGauge />} />

                                        {/* Countries */}
                                        <Route path="/countries" element={<CountriesIndexPage />} />
                                        <Route path="/countries/:iso" element={<CountryProfilePage />} />

                                        {/* Labs */}
                                        <Route path="/labs/us-macro-fiscal" element={<USMacroFiscalLab />} />
                                        <Route path="/labs/india" element={<Navigate to="/intel/india" replace />} />
                                        <Route path="/labs/china" element={<Navigate to="/intel/china" replace />} />
                                        <Route path="/labs/de-dollarization-gold" element={<DeDollarizationGoldLab />} />
                                        <Route path="/labs/energy-commodities" element={<EnergyCommoditiesLab />} />
                                        <Route path="/labs/sovereign-stress" element={<SovereignStressLab />} />
                                        <Route path="/labs/shadow-system" element={<ShadowSystemLab />} />
                                        <Route path="/labs/sustainable-finance-climate-risk" element={<SustainableFinanceLab />} />
                                        <Route path="/labs/china-15th-fyp" element={<China15thFYPLab />} />
                                        {/* Legacy route redirects */}
                                        <Route path="/thematics" element={<Navigate to="/#thematic-labs" replace />} />
                                        {/* Catch-all 404 to Home */}
                                        <Route path="*" element={<Navigate to="/" replace />} />
                                    </Routes>
                                </Suspense>
                            </GlobalLayout>
                        </BrowserRouter>
                    </ThemeProvider>
                </ViewProvider>
            </QueryClientProvider>
        </GlobalErrorBoundary>
    );
}

export default App;
