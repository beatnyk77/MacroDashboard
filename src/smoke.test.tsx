import React, { Suspense } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// To avoid actual Supabase calls
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => Promise.resolve({ data: [], error: null }).then(resolve))
    },
}));

vi.mock('recharts', async () => {
    const OriginalModule = await vi.importActual('recharts');
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    };
});

// Load pages
import { Terminal } from './pages/Terminal';
import { DataHealthDashboard } from './pages/DataHealthDashboard';
import { MacroObservatory } from './pages/MacroObservatory';
import { AdminDashboard } from './pages/AdminDashboard';
import { DeDollarizationGoldLab } from './pages/labs/DeDollarizationGoldLab';
import { China15thFYPLab } from './pages/labs/China15thFYP';
import { EnergyCommoditiesLab } from './pages/labs/EnergyCommoditiesLab';
import { ShadowSystemLab } from './pages/labs/ShadowSystemLab';
import { SovereignStressLab } from './pages/labs/SovereignStressLab';
import { SustainableFinanceLab } from './pages/labs/SustainableFinanceLab';
import { USMacroFiscalLab } from './pages/labs/USMacroFiscalLab';
import { ViewProvider } from '@/context/ViewContext';

const qClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
});

const theme = createTheme();

import { HelmetProvider } from 'react-helmet-async';

const TestWrapper = ({ children, route = '/' }: { children: React.ReactNode, route?: string }) => (
    <MemoryRouter initialEntries={[route]}>
        <QueryClientProvider client={qClient}>
            <ThemeProvider theme={theme}>
                <HelmetProvider>
                    <ViewProvider>
                        <Suspense fallback={<div>Loading...</div>}>
                            {children}
                        </Suspense>
                    </ViewProvider>
                </HelmetProvider>
            </ThemeProvider>
        </QueryClientProvider>
    </MemoryRouter>
);

describe('Smoke Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        qClient.clear();
    });

    it('renders Terminal page without crashing', async () => {
        render(
            <TestWrapper>
                <Terminal />
            </TestWrapper>
        );

        // Just checking if any valid element inside terminal mounts, e.g. a title or tab
        const heading = await screen.findByRole('heading', { name: /Macro Observatory/i }, { timeout: 4000 });
        expect(heading).toBeInTheDocument();
    });

    it('renders DeDollarizationGoldLab page without crashing', async () => {
        render(
            <TestWrapper route="/labs/de-dollarization">
                <DeDollarizationGoldLab />
            </TestWrapper>
        );
        expect(await screen.findByText(/De-Dollarization & Gold/i)).toBeInTheDocument();
    });

    it('renders DataHealthDashboard page without crashing', async () => {
        render(
            <TestWrapper route="/health">
                <DataHealthDashboard />
            </TestWrapper>
        );
        expect(await screen.findByText(/METRIC INTEGRITY COMMAND/i)).toBeInTheDocument();
    });

    it('renders MacroObservatory page without crashing', async () => {
        render(
            <TestWrapper route="/observatory">
                <MacroObservatory />
            </TestWrapper>
        );
        expect(await screen.findByText(/Observatory/i, {}, { timeout: 10000 })).toBeInTheDocument();
    }, 20000);

    it('renders AdminDashboard page (authenticated) without crashing', async () => {
        sessionStorage.setItem('admin_auth', 'true');
        render(
            <TestWrapper route="/admin">
                <AdminDashboard />
            </TestWrapper>
        );
        expect(await screen.findByText(/TERMINAL HEALTH/i)).toBeInTheDocument();
        sessionStorage.clear();
    });

    it('renders USMacroFiscalLab page without crashing', async () => {
        render(
            <TestWrapper route="/labs/us-macro">
                <USMacroFiscalLab />
            </TestWrapper>
        );
        expect(await screen.findByText(/Telemetry/i, {}, { timeout: 10000 })).toBeInTheDocument();
    }, 20000);

    it('renders EnergyCommoditiesLab page without crashing', async () => {
        render(
            <TestWrapper route="/labs/energy">
                <EnergyCommoditiesLab />
            </TestWrapper>
        );
        expect(await screen.findByText(/Resource Security/i, {}, { timeout: 10000 })).toBeInTheDocument();
    }, 20000);

    it('renders China15thFYPLab page without crashing', async () => {
        render(
            <TestWrapper route="/labs/china-fyp">
                <China15thFYPLab />
            </TestWrapper>
        );
        expect(await screen.findByText(/Intelligence/i, {}, { timeout: 10000 })).toBeInTheDocument();
    }, 20000);

    it('renders SovereignStressLab page without crashing', async () => {
        render(
            <TestWrapper route="/labs/sovereign">
                <SovereignStressLab />
            </TestWrapper>
        );
        expect(await screen.findByText(/Sustainability/i, {}, { timeout: 10000 })).toBeInTheDocument();
    }, 20000);

    it('renders ShadowSystemLab page without crashing', async () => {
        render(
            <TestWrapper route="/labs/shadow">
                <ShadowSystemLab />
            </TestWrapper>
        );
        expect(await screen.findByText(/Trade Terminal/i, {}, { timeout: 10000 })).toBeInTheDocument();
    }, 20000);

    it('renders SustainableFinanceLab page without crashing', async () => {
        render(
            <TestWrapper route="/labs/sustainable">
                <SustainableFinanceLab />
            </TestWrapper>
        );
        expect(await screen.findByText(/Climate/i, {}, { timeout: 10000 })).toBeInTheDocument();
    }, 20000);
});
