import { useMemo, Suspense, lazy } from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import getTheme from '@/theme';
import { GlobalLayout } from '@/layout/GlobalLayout';
import { ViewProvider } from '@/context/ViewContext';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TrailingSlashRedirect } from '@/components/TrailingSlashRedirect';
import { trailRoute } from '@/lib/urlPath';

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
const DataHealthPublic = lazy(() => import('@/pages/DataHealthPublic').then(module => ({ default: module.DataHealthPublic })));
const SubscribeConfirm = lazy(() => import('@/pages/SubscribeConfirm').then(module => ({ default: module.SubscribeConfirm })));
const ManageSubscription = lazy(() => import('@/pages/ManageSubscription').then(module => ({ default: module.ManageSubscription })));
const APIAccessPage = lazy(() => import('@/pages/APIAccessPage').then(module => ({ default: module.APIAccessPage })));
const APIDocsPage = lazy(() => import('@/pages/APIDocsPage').then(module => ({ default: module.APIDocsPage })));
const TermsOfService = lazy(() => import('@/pages/TermsOfService').then(module => ({ default: module.TermsOfService })));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })));
const About = lazy(() => import('@/pages/About').then(module => ({ default: module.About })));
const GlossaryIndexPage = lazy(() => import('@/pages/GlossaryIndexPage').then(module => ({ default: module.GlossaryIndexPage })));
const GlossaryTermPage = lazy(() => import('@/pages/GlossaryTermPage').then(module => ({ default: module.GlossaryTermPage })));
const IntelIndiaPage = lazy(() => import('@/pages/IntelIndiaPage').then(module => ({ default: module.IntelIndiaPage })));
const IntelChinaPage = lazy(() => import('@/pages/IntelChinaPage').then(module => ({ default: module.IntelChinaPage })));
const MacroObservatory = lazy(() => import('@/pages/MacroObservatory').then(module => ({ default: module.MacroObservatory })));
const ForInstitutional = lazy(() => import('@/pages/ForInstitutional').then(module => ({ default: module.ForInstitutional })));
const ForResearchersPage = lazy(() => import('@/pages/ForResearchersPage').then(module => ({ default: module.ForResearchersPage })));
const MCPIntelligencePage = lazy(() => import('@/pages/MCPIntelligencePage').then(module => ({ default: module.MCPIntelligencePage })));
const WeeklyNarrativeArchive = lazy(() => import('@/pages/WeeklyNarrativeArchive').then(module => ({ default: module.WeeklyNarrativeArchive })));
const WeeklyNarrativePage = lazy(() => import('@/pages/WeeklyNarrativePage').then(module => ({ default: module.WeeklyNarrativePage })));
const CountryProfilePage = lazy(() => import('@/pages/CountryProfilePage').then(module => ({ default: module.CountryProfilePage })));
const CountriesIndexPage = lazy(() => import('@/pages/CountriesIndexPage').then(module => ({ default: module.CountriesIndexPage })));
const DataSourcesPage = lazy(() => import('@/pages/DataSourcesPage').then(module => ({ default: module.DataSourcesPage })));
const NetLiquidityZScorePage = lazy(() => import('@/pages/methods/NetLiquidityZScorePage').then(module => ({ default: module.NetLiquidityZScorePage })));
const DebtGoldZScorePage = lazy(() => import('@/pages/methods/DebtGoldZScorePage').then(module => ({ default: module.DebtGoldZScorePage })));
const LoanToJobEfficiencyPage = lazy(() => import('@/pages/methods/LoanToJobEfficiencyPage').then(module => ({ default: module.LoanToJobEfficiencyPage })));
const EnergyDependencyRatioPage = lazy(() => import('@/pages/methods/EnergyDependencyRatioPage').then(module => ({ default: module.EnergyDependencyRatioPage })));
const FiscalDominanceMeterPage = lazy(() => import('@/pages/methods/FiscalDominanceMeterPage').then(module => ({ default: module.FiscalDominanceMeterPage })));
const M2GoldRatioPage = lazy(() => import('@/pages/methods/M2GoldRatioPage').then(module => ({ default: module.M2GoldRatioPage })));
const DeDollarizationGuide = lazy(() => import('@/pages/methods/DeDollarizationGuide').then(module => ({ default: module.DeDollarizationGuide })));
const FedMonetizationPage = lazy(() => import('@/pages/methods/FedMonetizationPage').then(module => ({ default: module.FedMonetizationPage })));
const IndiaCreditCyclePage = lazy(() => import('@/pages/methods/IndiaCreditCyclePage').then(module => ({ default: module.IndiaCreditCyclePage })));
const ChinaDebtIcebergPage = lazy(() => import('@/pages/methods/ChinaDebtIcebergPage').then(module => ({ default: module.ChinaDebtIcebergPage })));
const NetLiquidityGauge = lazy(() => import('@/pages/tools/NetLiquidityGauge').then(module => ({ default: module.NetLiquidityGauge })));
const DailyRegimeSignal = lazy(() => import('@/pages/tools/DailyRegimeSignal').then(module => ({ default: module.DailyRegimeSignal })));
const GoldRatiosWidget = lazy(() => import('@/pages/tools/GoldRatiosWidget').then(module => ({ default: module.GoldRatiosWidget })));
const ToolsIndexPage = lazy(() => import('@/pages/tools/ToolsIndexPage').then(module => ({ default: module.ToolsIndexPage })));
const NotFound = lazy(() => import('@/pages/NotFound').then(module => ({ default: module.NotFound })));
const MacroBriefPage = lazy(() => import('@/pages/MacroBriefPage').then(module => ({ default: module.MacroBriefPage })));
const MacroBriefArchivePage = lazy(() => import('@/pages/MacroBriefArchivePage').then(module => ({ default: module.MacroBriefArchivePage })));
const OgCardPage = lazy(() => import('@/pages/OgCardPage').then(module => ({ default: module.OgCardPage })));
const MetricPage = lazy(() => import('@/pages/MetricPage').then(module => ({ default: module.MetricPage })));

const ThematicLabsIndexPage = lazy(() => import('@/pages/labs/ThematicLabsIndexPage').then(module => ({ default: module.ThematicLabsIndexPage })));
const USMacroFiscalLab = lazy(() => import('@/pages/labs/USMacroFiscalLab').then(module => ({ default: module.USMacroFiscalLab })));
const DeDollarizationGoldLab = lazy(() => import('@/pages/labs/DeDollarizationGoldLab').then(module => ({ default: module.DeDollarizationGoldLab })));
const CentralBankGoldPurchases = lazy(() => import('@/pages/labs/CentralBankGoldPurchases').then(module => ({ default: module.CentralBankGoldPurchases })));
const BricsTradeSettlement = lazy(() => import('@/pages/labs/BricsTradeSettlement').then(module => ({ default: module.BricsTradeSettlement })));
const USTreasuryForeignHoldings = lazy(() => import('@/pages/labs/USTreasuryForeignHoldings').then(module => ({ default: module.USTreasuryForeignHoldings })));
const PetrodollarDecay = lazy(() => import('@/pages/labs/PetrodollarDecay').then(module => ({ default: module.PetrodollarDecay })));
const EnergyCommoditiesLab = lazy(() => import('@/pages/labs/EnergyCommoditiesLab').then(module => ({ default: module.EnergyCommoditiesLab })));

const SovereignStressLab = lazy(() => import('@/pages/labs/SovereignStressLab').then(module => ({ default: module.SovereignStressLab })));
const ShadowSystemLab = lazy(() => import('@/pages/labs/ShadowSystemLab').then(module => ({ default: module.ShadowSystemLab })));
const China15thFYPLab = lazy(() => import('@/pages/labs/China15thFYP').then(module => ({ default: module.China15thFYPLab })));
const AfricaMacroPulseLab = lazy(() => import('@/pages/labs/AfricaMacroPulse').then(module => ({ default: module.AfricaMacroPulseLab })));

const TradeDashboard = lazy(() => import('@/pages/TradeDashboard').then(module => ({ default: module.default })));
const UKTradeIntelPage = lazy(() => import('@/pages/UKTradeIntelPage').then(module => ({ default: module.default })));
const HSCodeOverviewPage = lazy(() => import('@/pages/HSCodeOverviewPage').then(module => ({ default: module.default })));
const MarketDeepDivePage = lazy(() => import('@/pages/MarketDeepDivePage').then(module => ({ default: module.default })));
const ExportScoutPlaybookPage = lazy(() => import('@/pages/ExportScoutPlaybookPage').then(module => ({ default: module.ExportScoutPlaybookPage })));
const TradeFxPage = lazy(() => import('@/features/trade-fx/TradeFxPage').then(module => ({ default: module.TradeFxPage })));

const LoadingFallback = () => (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress color="primary" size={24} />
    </Box>
);



function App() {
    const theme = useMemo(() => getTheme('dark'), []);

    return (
        <GlobalErrorBoundary>
            <LazyMotion features={domAnimation} strict>
            <QueryClientProvider client={queryClient}>
                <ViewProvider>
                    <ThemeProvider theme={theme}>
                        <CssBaseline />
                        <BrowserRouter>
                            <TrailingSlashRedirect />
                            <GlobalLayout>
                                <Suspense fallback={<LoadingFallback />}>
                                    <Routes>
                                        <Route path={trailRoute('/')} element={<Terminal />} />
                                        <Route path={trailRoute('/methodology')} element={<MetricsMethodologyPage />} />
                                        <Route path={trailRoute('/metrics/:id')} element={<MetricPage />} />
                                        <Route path={trailRoute('/data-sources')} element={<DataSourcesPage />} />
                                        <Route path={trailRoute('/blog')} element={<BlogPage />} />
                                        <Route path={trailRoute('/blog/:slug')} element={<ArticlePage />} />
                                        <Route path={trailRoute('/regime-digest')} element={<RegimeDigestArchivePage />} />
                                        <Route path={trailRoute('/regime-digest/:year/:month')} element={<RegimeDigestPage />} />
                                        <Route path={trailRoute('/admin')} element={<AdminDashboard />} />
                                        <Route path={trailRoute('/admin/data-health')} element={<DataHealthDashboard />} />
                                        <Route path={trailRoute('/data-health')} element={<DataHealthPublic />} />
                                        <Route path={trailRoute('/subscribe/confirm')} element={<SubscribeConfirm />} />
                                        <Route path={trailRoute('/subscribe/manage')} element={<ManageSubscription />} />
                                        <Route path={trailRoute('/api-access')} element={<APIAccessPage />} />
                                        <Route path={trailRoute('/api-docs')} element={<APIDocsPage />} />
                                        <Route path={trailRoute('/mcp')} element={<MCPIntelligencePage />} />
                                        <Route path={trailRoute('/terms')} element={<TermsOfService />} />
                                        <Route path={trailRoute('/privacy')} element={<PrivacyPolicy />} />
                                        <Route path={trailRoute('/about')} element={<About />} />
                                        <Route path={trailRoute('/glossary')} element={<GlossaryIndexPage />} />
                                        <Route path={trailRoute('/glossary/:slug')} element={<GlossaryTermPage />} />
                                        {/* Methods Articles */}
                                        <Route path={trailRoute('/methods/net-liquidity-z-score')} element={<NetLiquidityZScorePage />} />
                                        <Route path={trailRoute('/methods/debt-gold-z-score')} element={<DebtGoldZScorePage />} />
                                        <Route path={trailRoute('/methods/loan-to-job-efficiency')} element={<LoanToJobEfficiencyPage />} />
                                        <Route path={trailRoute('/methods/energy-dependency-ratio')} element={<EnergyDependencyRatioPage />} />
                                        <Route path={trailRoute('/methods/fiscal-dominance-meter')} element={<FiscalDominanceMeterPage />} />
                                        <Route path={trailRoute('/methods/m2-gold-ratio')} element={<M2GoldRatioPage />} />
                                        <Route path={trailRoute('/methods/de-dollarization-guide')} element={<DeDollarizationGuide />} />
                                        <Route path={trailRoute('/methods/fed-monetization-monitor')} element={<FedMonetizationPage />} />
                                        <Route path={trailRoute('/methods/india-credit-cycle-clock')} element={<IndiaCreditCyclePage />} />
                                        <Route path={trailRoute('/methods/china-debt-iceberg')} element={<ChinaDebtIcebergPage />} />
                                        <Route path={trailRoute('/intel/india')} element={<IntelIndiaPage />} />
                                        <Route path={trailRoute('/intel/china')} element={<IntelChinaPage />} />
                                        <Route path={trailRoute('/macro-observatory')} element={<MacroObservatory />} />
                                        <Route path={trailRoute('/institutional')} element={<ForInstitutional />} />
                                        <Route path={trailRoute('/for-researchers')} element={<ForResearchersPage />} />
                                        <Route path={trailRoute('/weekly-narrative')} element={<WeeklyNarrativeArchive />} />
                                        <Route path={trailRoute('/weekly-narrative/:date')} element={<WeeklyNarrativePage />} />

                                        {/* Trade Intelligence */}
                                        <Route path={trailRoute('/trade-fx')} element={<TradeFxPage />} />
                                        <Route path={trailRoute('/trade')} element={<TradeDashboard />} />
                                        <Route path={trailRoute('/trade/hs/:code')} element={<HSCodeOverviewPage />} />
                                        <Route path={trailRoute('/trade/playbook/:code')} element={<ExportScoutPlaybookPage />} />
                                        <Route path={trailRoute('/trade/hs/:code/market/:iso')} element={<MarketDeepDivePage />} />
                                        <Route path={trailRoute('/trade/uk/:code')} element={<UKTradeIntelPage />} />

                                        {/* Tools & Embeds */}
                                        <Route path={trailRoute('/tools')} element={<ToolsIndexPage />} />
                                        <Route path={trailRoute('/tools/net-liquidity-gauge')} element={<NetLiquidityGauge />} />
                                        <Route path={trailRoute('/tools/daily-regime-signal')} element={<DailyRegimeSignal />} />
                                        <Route path={trailRoute('/tools/gold-ratios')} element={<GoldRatiosWidget />} />

                                        {/* Countries */}
                                        <Route path={trailRoute('/countries')} element={<CountriesIndexPage />} />
                                        <Route path={trailRoute('/countries/:iso')} element={<CountryProfilePage />} />

                                        {/* Labs */}
                                        <Route path={trailRoute('/labs/us-macro-fiscal')} element={<USMacroFiscalLab />} />
                                        <Route path={trailRoute('/labs/india')} element={<Navigate to={trailRoute('/intel/india')} replace />} />
                                        <Route path={trailRoute('/labs/china')} element={<Navigate to={trailRoute('/intel/china')} replace />} />
                                        <Route path={trailRoute('/labs/de-dollarization-gold')} element={<DeDollarizationGoldLab />} />
                                        <Route path={trailRoute('/labs/central-bank-gold-purchases')} element={<CentralBankGoldPurchases />} />
                                        <Route path={trailRoute('/labs/brics-trade-settlement')} element={<BricsTradeSettlement />} />
                                        <Route path={trailRoute('/labs/us-treasury-foreign-holdings')} element={<USTreasuryForeignHoldings />} />
                                        <Route path={trailRoute('/labs/petrodollar-decay-indicators')} element={<PetrodollarDecay />} />
                                        <Route path={trailRoute('/labs/energy-commodities')} element={<EnergyCommoditiesLab />} />
                                        <Route path={trailRoute('/labs/sovereign-stress')} element={<SovereignStressLab />} />
                                        <Route path={trailRoute('/labs/shadow-system')} element={<ShadowSystemLab />} />
                                        <Route path={trailRoute('/labs/china-15th-fyp')} element={<China15thFYPLab />} />
                                        <Route path={trailRoute('/labs/africa-macro')} element={<AfricaMacroPulseLab />} />
                                        {/* Labs Index & Thematic redirects */}
                                        <Route path={trailRoute('/labs')} element={<ThematicLabsIndexPage />} />
                                        <Route path={trailRoute('/thematics')} element={<Navigate to={trailRoute('/labs')} replace />} />
                                        {/* Morning Macro Brief */}
                                        <Route path={trailRoute('/macro-brief')} element={<MacroBriefPage />} />
                                        <Route path={trailRoute('/macro-brief/:date')} element={<MacroBriefPage />} />
                                        <Route path={trailRoute('/macro-brief/archive')} element={<MacroBriefArchivePage />} />
                                        {/* Internal render target for scripts/prerender.mjs OG screenshots — noindex, not in sitemap */}
                                        <Route path={trailRoute('/og-card/:kind/:slug')} element={<OgCardPage />} />
                                        {/* Catch-all 404 */}
                                        <Route path="*" element={<NotFound />} />
                                    </Routes>
                                </Suspense>
                            </GlobalLayout>
                        </BrowserRouter>
                    </ThemeProvider>
                </ViewProvider>
            </QueryClientProvider>
            </LazyMotion>
        </GlobalErrorBoundary>
    );
}

export default App;
