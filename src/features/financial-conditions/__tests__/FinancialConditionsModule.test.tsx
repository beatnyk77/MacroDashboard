import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { FinancialConditionsModule } from '../components/FinancialConditionsModule';

vi.mock('@/hooks/useFinancialConditions', () => ({
  useFinancialConditions: () => ({
    data: {
      history: [
        { date: '2025-06-20', fci: 0.05, commodityCycle: 0.18 },
        { date: '2025-09-20', fci: -0.05, commodityCycle: 0.28 },
        { date: '2026-03-20', fci: 0.15, commodityCycle: 0.35 },
      ],
      current: {
        date: '2026-03-20',
        fci: 0.15,
        commodityCycle: 0.35,
        csZScore: 0.05,
        r10yZScore: 0.92,
        slopeZScore: 0.18,
        fxZScore: 0.50,
        equityZScore: 0.45,
      },
      regime: {
        regime: 'COMMODITY_TIGHTENING',
        title: 'Commodity-Driven Tightening',
        badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
        description: 'Commodity cost-push pressures are actively feeding into real yields.',
      },
      components: [
        {
          id: 'cs',
          name: 'Credit Spreads (HY OAS)',
          ticker: 'BAMLH0A0HYM2',
          zScore: 0.05,
          weight: 0.2,
          contribution: 0.01,
          direction: 'neutral',
          impactLabel: '+ Tightening',
          description: 'Widening corporate credit risk premium.',
        },
        {
          id: 'r10y',
          name: '10Y Real Benchmark Yield',
          ticker: 'DFII10 (TIPS)',
          zScore: 0.92,
          weight: 0.2,
          contribution: 0.18,
          direction: 'tightening',
          impactLabel: '+ Tightening',
          description: 'Higher sovereign real discount rates.',
        },
        {
          id: 'slope',
          name: 'Yield Curve Slope (10Y-2Y)',
          ticker: 'T10Y2Y',
          zScore: 0.18,
          weight: 0.2,
          contribution: 0.04,
          direction: 'tightening',
          impactLabel: '+ Inverted',
          description: 'Inversion reflects restrictive stance.',
        },
        {
          id: 'fx',
          name: 'Trade-Weighted US Dollar',
          ticker: 'DTWEXBGS',
          zScore: 0.50,
          weight: 0.2,
          contribution: 0.10,
          direction: 'tightening',
          impactLabel: '+ Dollar Squeeze',
          description: 'Dollar appreciation contracts global funding.',
        },
        {
          id: 'equity',
          name: 'Equity Market Impulse',
          ticker: 'SP500',
          zScore: 0.45,
          weight: 0.2,
          contribution: 0.09,
          direction: 'tightening',
          impactLabel: '+ Equity Drag',
          description: 'Drawdowns destroy balance sheet wealth.',
        },
      ],
      lastUpdated: '2026-03-20',
      staleness: 'fresh',
    },
    isLoading: false,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('FinancialConditionsModule', () => {
  it('renders the module header, regime badge, and components without crashing', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <FinancialConditionsModule />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Verify title is rendered
    expect(
      screen.getByText(/Barclays FCI & Commodity Cycle Transmission Desk/i)
    ).toBeInTheDocument();

    // Verify regime badge
    expect(
      screen.getByText(/Commodity-Driven Tightening/i)
    ).toBeInTheDocument();

    // Verify pillar decomposition section is present
    expect(
      screen.getByText(/5-Pillar Transmission Decomposition/i)
    ).toBeInTheDocument();

    // Verify historical precedents section is present
    expect(
      screen.getByText(/Historical Cycle Precedents/i)
    ).toBeInTheDocument();
  });
});
