import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricFreshnessChip } from '@/components/MetricFreshnessChip';

vi.mock('@/hooks/useLatestMetric', () => ({
    useLatestMetric: vi.fn(),
}));

import { useLatestMetric } from '@/hooks/useLatestMetric';

const mockUseLatestMetric = vi.mocked(useLatestMetric);

describe('MetricFreshnessChip', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-12T14:00:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows a loading skeleton while metric data is fetching', () => {
        mockUseLatestMetric.mockReturnValue({
            data: undefined,
            isLoading: true,
        } as ReturnType<typeof useLatestMetric>);

        render(<MetricFreshnessChip metricId="FED_BALANCE_SHEET" />);

        expect(screen.getByLabelText('Loading data freshness')).toBeInTheDocument();
    });

    it('renders FreshnessChip when metric data is available', () => {
        mockUseLatestMetric.mockReturnValue({
            data: {
                value: 8.2,
                lastUpdated: '2026-06-12T12:00:00.000Z',
                frequency: 'Weekly',
                sourceRef: 'live_api:ingest-fred',
                isProvisional: false,
                provenance: 'api_live',
                delta: null,
                deltaPeriod: '7d',
                trend: 'neutral',
                history: [],
                status: 'safe',
            },
            isLoading: false,
        } as ReturnType<typeof useLatestMetric>);

        render(<MetricFreshnessChip metricId="FED_BALANCE_SHEET" />);

        expect(screen.getByText('FRESH')).toBeInTheDocument();
    });

    it('falls back to a subdued source label when metric is unavailable', () => {
        mockUseLatestMetric.mockReturnValue({
            data: null,
            isLoading: false,
        } as ReturnType<typeof useLatestMetric>);

        render(
            <MetricFreshnessChip
                metricId="FED_BALANCE_SHEET"
                sourceLabel="FRED / Treasury"
            />
        );

        expect(screen.getByText('Source: FRED / Treasury')).toBeInTheDocument();
    });
});