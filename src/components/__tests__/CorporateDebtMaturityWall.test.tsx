import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CorporateDebtMaturityWall } from '../CorporateDebtMaturityWall';
import { supabase } from '@/lib/supabase';

// Mock Recharts to avoid testing SVG/Canvas rendering
vi.mock('recharts', async () => {
    const OriginalModule = await vi.importActual('recharts');
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
        Bar: () => <div>Bar</div>,
        XAxis: () => <div>XAxis</div>,
        YAxis: () => <div>YAxis</div>,
        CartesianGrid: () => <div>CartesianGrid</div>,
        Tooltip: () => <div>Tooltip</div>,
        Cell: () => <div>Cell</div>,
    };
});

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

describe('CorporateDebtMaturityWall', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        // Mock to delay resolution so we can see loading state
        const mockSelect = vi.fn().mockReturnValue({ 
            order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue(new Promise(() => {})) }) 
        });
        (supabase.from as any).mockReturnValue({ select: mockSelect });

        render(<CorporateDebtMaturityWall />);
        expect(screen.getByText('Analyzing SEC Maturity Filings...')).toBeInTheDocument();
    });

    it('renders data correctly after fetch', async () => {
        // First query: get latest date
        const mockLimitDate = vi.fn().mockResolvedValue({ data: [{ as_of_date: '2023-10-01' }], error: null });
        const mockOrderDate = vi.fn().mockReturnValue({ limit: mockLimitDate });
        const mockSelectDate = vi.fn().mockReturnValue({ order: mockOrderDate });

        // Second query: get data
        const mockData = [
            { as_of_date: '2023-10-01', bucket: '<1Y', maturing_amount: 1.5, percent_of_total_debt: 15, weighted_avg_coupon: 4, implied_refinancing_cost_delta: 50 },
            { as_of_date: '2023-10-01', bucket: '1-3Y', maturing_amount: 2.5, percent_of_total_debt: 25, weighted_avg_coupon: 3.5, implied_refinancing_cost_delta: 20 },
            { as_of_date: '2023-10-01', bucket: '3-5Y', maturing_amount: 3.0, percent_of_total_debt: 30, weighted_avg_coupon: 3.0, implied_refinancing_cost_delta: 10 },
            { as_of_date: '2023-10-01', bucket: '>5Y', maturing_amount: 3.0, percent_of_total_debt: 30, weighted_avg_coupon: 3.2, implied_refinancing_cost_delta: 5 },
        ];
        
        const mockEqData = vi.fn().mockResolvedValue({ data: mockData, error: null });
        const mockSelectData = vi.fn().mockReturnValue({ eq: mockEqData });

        let queryCount = 0;
        (supabase.from as any).mockImplementation(() => {
            queryCount++;
            if (queryCount === 1) {
                return { select: mockSelectDate };
            } else {
                return { select: mockSelectData };
            }
        });

        render(<CorporateDebtMaturityWall />);

        // Wait for loading to finish and component to render data
        await waitFor(() => {
            expect(screen.queryByText('Analyzing SEC Maturity Filings...')).not.toBeInTheDocument();
        });

        // The total debt should be 1.5 + 2.5 + 3.0 + 3.0 = 10.0
        expect(screen.getByText('$10.00T')).toBeInTheDocument();
        
        // <1 Year sum
        expect(screen.getByText('$1.50T')).toBeInTheDocument();
        
        expect(screen.getByText('Corporate Debt Maturity Wall')).toBeInTheDocument();
    });
});
