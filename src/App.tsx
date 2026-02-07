import { useMemo, Suspense, lazy } from 'react';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import getTheme from '@/theme';
import { GlobalLayout } from '@/layout/GlobalLayout';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load heavy page components
const DashboardView = lazy(() => import('@/features/dashboard/pages/DashboardView').then(module => ({ default: module.DashboardView })));
const ThematicLabsView = lazy(() => import('@/features/dashboard/pages/ThematicLabsView').then(module => ({ default: module.ThematicLabsView })));
const CountryPulsesView = lazy(() => import('@/features/dashboard/pages/CountryPulsesView').then(module => ({ default: module.CountryPulsesView })));
const MetricsMethodologyPage = lazy(() => import('@/pages/MetricsMethodologyPage').then(module => ({ default: module.MetricsMethodologyPage })));

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
                                        <Route path="/" element={<DashboardView />} />
                                        <Route path="/thematics" element={<ThematicLabsView />} />
                                        <Route path="/countries" element={<CountryPulsesView />} />
                                        <Route path="/methodology" element={<MetricsMethodologyPage />} />
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
