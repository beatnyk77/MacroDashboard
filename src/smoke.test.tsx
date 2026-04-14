import React, { Suspense } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { HelmetProvider } from 'react-helmet-async';

// Dummy data for mocks - prefixed with 'mock' for Vitest hoisting
const mockDummyCollective = {
    as_of_date: new Date().toISOString(),
    total_aum: 4200500000000,
    institution_count: 50,
    weighted_yield_pct: 4.8,
    equity_exposure_pct: 68.5,
    regime_interpretation: 'NEUTRAL ACCUMULATION',
    historical_allocation: [{ quarter: '2023-Q4', equity_pct: 69, bond_pct: 21, gold_pct: 5, other_pct: 5 }]
};

const mockDummyInstitution = {
    cik: '0000104569',
    fund_name: 'Vanguard Group Inc.',
    fund_type: 'Mutual Fund',
    filing_date: '2024-02-14',
    as_of_date: '2023-12-31',
    total_aum: 4500200000000,
    top_holdings: [
        { ticker: 'AAPL', name: 'Apple Inc', value: 150000000000, concentration_contribution: 4.5, cusip: '037833100', sector: 'Technology' },
        { ticker: 'MSFT', name: 'Microsoft Corp', value: 140000000000, concentration_contribution: 4.2, cusip: '594918104', sector: 'Technology' }
    ],
    top_sectors: {
        'Technology': 35.5,
        'Healthcare': 15.2,
        'Financials': 12.8
    },
    historical_allocation: [{ quarter: '2023-Q4', equity_pct: 69, bond_pct: 21, gold_pct: 5, other_pct: 5 }],
    asset_class_allocation: { equity_pct: 69, bond_pct: 21, gold_pct: 5, other_pct: 5 },
    regime_z_score: 1.2,
    qoq_delta: 2.5
};

const mockDummyFlow = {
    as_of_date: new Date().toISOString(),
    tic_net_foreign_buying: 15.5,
    cot_equities_net_position: 65.2,
    cot_gold_net_position: 1.2,
    etf_flow_proxy: 10.5,
    regime_score: 45,
    sankey_data: {
        nodes: [{ id: 'Source', color: '#cyan' }, { id: 'Target', color: '#magenta' }],
        links: [{ source: 'Source', target: 'Target', value: 100 }]
    },
    interpretation: 'ACCUMULATION PHASE'
};

// To avoid actual Supabase calls
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn((table) => ({
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            contains: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
            then: (resolve: any) => {
                let data: any = [];
                if (table === 'vw_smart_money_collective') data = mockDummyCollective;
                if (table === 'institutional_13f_holdings') data = [mockDummyInstitution];
                if (table === 'smart_money_flow') data = mockDummyFlow;
                if (table === 'vw_net_liquidity') data = [{ as_of_date: new Date().toISOString(), value: 4500, z_score: 1.5, percentile: 0.85, delta: 10, delta_pct: 0.2, alarm_status: 'nominal' }];
                if (table === 'vw_latest_metrics') data = [{ value: 100 }];
                if (table === 'monthly_regime_digests') data = { year_month: '2024-03', subject_line: 'Test Digest', plain_text: 'Test content', generated_at: new Date().toISOString() };
                if (table === 'g20_sovereign_risk') data = [{ country: 'USA', cds_spread: 10, debt_to_gdp: 120, fiscal_balance: -5, inflation: 2, credit_rating: 'AAA', outlook: 'Stable' }];
                if (table === 'climate_risk_metrics') data = [{ id: '1', date: '2024-01-01', country_code: 'IND', region_code: null, grid_co2_intensity: 450, transition_risk_score: 65.5, renewable_share_pct: 22.5, total_ghg_emissions_mt: 3200, temperature_alignment_c: 2.8, is_climate_emergency: true, metadata: {}, created_at: new Date().toISOString() }];
                if (table === 'metric_observations') data = [{ as_of_date: '2024-01-01', value: 45.2 }, { as_of_date: '2023-12-01', value: 42.1 }, { as_of_date: '2023-11-01', value: 48.3 }];
                if (table === 'vw_latest_ingestions') data = [{ function_name: 'test', status: 'success', start_time: new Date().toISOString(), duration_ms: 100 }];
                if (table === 'vw_data_staleness_monitor_v2') data = [];
                if (table === 'vw_cron_job_status') data = [];
                if (table === 'regime_snapshots') data = { id: '1', regime_label: 'Expansion', pulse_score: 75, signal_breadth: 0.8, timestamp: new Date().toISOString() };
                return Promise.resolve({ data, error: null }).then(resolve);
            }
        })),
    },
}));

// Mock Lucide icons — spread the real module so any icon works automatically
vi.mock('lucide-react', async (importOriginal) => {
    const actual: any = await importOriginal();
    return { ...actual };
});

// Mock Recharts to avoid testing SVG/Canvas rendering and sizing issues
vi.mock('recharts', async () => {
    const OriginalModule: any = await vi.importActual('recharts');
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div className="mock-responsive-container">{children}</div>,
        BarChart: ({ children }: { children: React.ReactNode }) => <div className="mock-bar-chart">{children}</div>,
        AreaChart: ({ children }: { children: React.ReactNode }) => <div className="mock-area-chart">{children}</div>,
        LineChart: ({ children }: { children: React.ReactNode }) => <div className="mock-line-chart">{children}</div>,
        PieChart: ({ children }: { children: React.ReactNode }) => <div className="mock-pie-chart">{children}</div>,
        Bar: () => <div className="mock-bar" />,
        Area: () => <div className="mock-area" />,
        Line: () => <div className="mock-line" />,
        Pie: () => <div className="mock-pie" />,
        XAxis: () => <div className="mock-xaxis" />,
        YAxis: () => <div className="mock-yaxis" />,
        CartesianGrid: () => <div className="mock-grid" />,
        Tooltip: () => <div className="mock-tooltip" />,
        Cell: () => <div className="mock-cell" />,
    };
});

// Mock ResizeObserver
(window as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock IntersectionObserver
(window as any).IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
};

// Components to test
import Terminal from '@/pages/Terminal';
import { IndiaFlowPulsePage } from '@/pages/IndiaFlowPulsePage';
import DataHealthDashboard from '@/pages/DataHealthDashboard';
import MacroObservatory from '@/pages/MacroObservatory';
import { AdminDashboard } from '@/pages/AdminDashboard';
import USMacroFiscalLab from '@/pages/labs/USMacroFiscalLab';
import EnergyCommoditiesLab from '@/pages/labs/EnergyCommoditiesLab';
import { China15thFYPLab } from '@/pages/labs/China15thFYP';
import SovereignStressLab from '@/pages/labs/SovereignStressLab';

import { About } from '@/pages/About';

const theme = createTheme();
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            // @ts-expect-error: Deno globals and third-party types - 'suspense' is technically deprecated in the types, but required to test Suspense components correctly without using experimental useSuspenseQuery
            suspense: true
        },
    },
});

const TestWrapper: React.FC<{ children: React.ReactNode; route?: string }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
            <HelmetProvider>
                <MemoryRouter>
                    <Suspense fallback={<div>Loading...</div>}>
                        {children}
                    </Suspense>
                </MemoryRouter>
            </HelmetProvider>
        </ThemeProvider>
    </QueryClientProvider>
);

describe('Smoke Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock IntersectionObserver which is not available in jsdom
        window.IntersectionObserver = class {
            constructor(public callback: IntersectionObserverCallback) {}
            observe = vi.fn()
            unobserve = vi.fn()
            disconnect = vi.fn()
            root = null
            rootMargin = ''
            thresholds = []
            takeRecords = () => []
        } as any;
    });

    it('renders Terminal page without crashing', async () => {
        render(
            <TestWrapper route="/terminal">
                <Terminal />
            </TestWrapper>
        );
        expect(await screen.findByText(/INSTITUTIONAL PULSE/i, {}, { timeout: 10000 })).toBeInTheDocument();
    }, 20000);

    it('renders IndiaFlowPulsePage without crashing', async () => {
        render(
            <TestWrapper route="/india-flow-pulse">
                <IndiaFlowPulsePage />
            </TestWrapper>
        );
        expect(await screen.findByText(/Flow Pulse/i, {}, { timeout: 10000 })).toBeInTheDocument();
    }, 20000);

    it('renders DataHealthDashboard (authenticated) without crashing', async () => {
        sessionStorage.setItem('admin_auth', 'true');
        render(
            <TestWrapper route="/admin/health">
                <DataHealthDashboard />
            </TestWrapper>
        );
        expect(await screen.findByText(/Macro Data Operations/i, {}, { timeout: 10000 })).toBeInTheDocument();
        sessionStorage.clear();
    }, 20000);

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
    }, 20000);

    it('renders USMacroFiscalLab page without crashing', async () => {
        render(
            <TestWrapper route="/labs/us-macro">
                <USMacroFiscalLab />
            </TestWrapper>
        );
        expect(await screen.findByText(/Core Sovereign Telemetry/i, {}, { timeout: 10000 })).toBeInTheDocument();
    }, 20000);

    it('renders EnergyCommoditiesLab page without crashing', async () => {
        render(
            <TestWrapper route="/labs/energy">
                <EnergyCommoditiesLab />
            </TestWrapper>
        );
        expect(await screen.findByText(/Institutional Resource Security/i, {}, { timeout: 10000 })).toBeInTheDocument();
    }, 20000);

    it('renders China15thFYPLab page without crashing', async () => {
        render(
            <TestWrapper route="/labs/china-fyp">
                <China15thFYPLab />
            </TestWrapper>
        );
        expect(await screen.findByText(/Mission Intelligence Lab/i, {}, { timeout: 10000 })).toBeInTheDocument();
    }, 20000);

    it('renders SovereignStressLab page without crashing', async () => {
        render(
            <TestWrapper route="/labs/sovereign-stress">
                <SovereignStressLab />
            </TestWrapper>
        );
        expect(await screen.findByText(/Fiscal Sustainability Monitor/i, {}, { timeout: 10000 })).toBeInTheDocument();
    }, 20000);



    it('renders About page without crashing', async () => {
        render(
            <TestWrapper route="/about">
                <About />
            </TestWrapper>
        );
        // MUI Typography with h1 "The Surveillance Mandate"
        expect(await screen.findByText(/The Surveillance Mandate/i, {}, { timeout: 10000 })).toBeInTheDocument();
    }, 20000);
});
