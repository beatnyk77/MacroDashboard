import { useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import getTheme from '@/theme';
import { GlobalLayout } from '@/layout/GlobalLayout';
import { Dashboard } from '@/features/dashboard/pages/Dashboard';
import { MetricsMethodologyPage } from '@/pages/MetricsMethodologyPage';

// Mock dashboard component for now to avoid compilation errors if not created yet
// Ideally we create GlobalLayout and Dashboard next. 
// But since I'm creating files in parallel/sequence, I'll assume they will exist.
// If not, I can create placeholders in this step or subsequent steps.
// For safety, I will implement lazy imports or just standard imports assuming the user will see me create them in the next tool calls.
// I will create GlobalLayout and Dashboard immediately after this.

import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
    // TODO: Add state for theme toggle
    const theme = useMemo(() => getTheme('dark'), []);

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <BrowserRouter>
                    <GlobalLayout>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/methodology" element={<MetricsMethodologyPage />} />
                        </Routes>
                    </GlobalLayout>
                </BrowserRouter>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;
