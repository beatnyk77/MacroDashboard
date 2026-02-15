import { useMemo, Suspense, lazy } from 'react';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import getTheme from '@/theme';
import { GlobalLayout } from '@/layout/GlobalLayout';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Lazy load page components
const Dashboard = lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.Dashboard })));
const MetricsMethodologyPage = lazy(() => import('@/pages/MetricsMethodologyPage').then(module => ({ default: module.MetricsMethodologyPage })));
const BlogPage = lazy(() => import('@/pages/BlogPage').then(module => ({ default: module.BlogPage })));
const ArticlePage = lazy(() => import('@/pages/ArticlePage').then(module => ({ default: module.ArticlePage })));
const RegimeDigestArchivePage = lazy(() => import('@/pages/RegimeDigestArchivePage').then(module => ({ default: module.RegimeDigestArchivePage })));
const RegimeDigestPage = lazy(() => import('@/pages/RegimeDigestPage').then(module => ({ default: module.RegimeDigestPage })));

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
                                        <Route path="/" element={<Dashboard />} />
                                        <Route path="/methodology" element={<MetricsMethodologyPage />} />
                                        <Route path="/blog" element={<BlogPage />} />
                                        <Route path="/blog/:slug" element={<ArticlePage />} />
                                        <Route path="/regime-digest" element={<RegimeDigestArchivePage />} />
                                        <Route path="/regime-digest/:year/:month" element={<RegimeDigestPage />} />
                                        {/* Legacy route redirects */}
                                        <Route path="/thematics" element={<Navigate to="/#thematic-labs" replace />} />
                                        <Route path="/countries" element={<Navigate to="/#country-pulses" replace />} />
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

