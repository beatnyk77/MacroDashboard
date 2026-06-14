import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
    DataFreshnessStatusChip,
    DataHealthHeaderChip,
    DataFreshnessFooterChip,
} from '../DataHealthBanner';
import type { IntegrityReport } from '@/hooks/useDataIntegrity';

vi.mock('@/hooks/useDataIntegrity', () => ({
    useDataIntegrity: vi.fn(),
}));

import { useDataIntegrity } from '@/hooks/useDataIntegrity';

const mockUseDataIntegrity = vi.mocked(useDataIntegrity);

function mockHealth(overrides: Partial<IntegrityReport> = {}) {
    const base: IntegrityReport = {
        status: 'healthy',
        message: 'All core systems operational.',
        staleCount: 0,
        totalHighFrequency: 12,
        lastChecked: '2026-06-12T12:00:00.000Z',
        lastIngestionAt: '2026-06-12T06:00:00.000Z',
        ...overrides,
    };

    mockUseDataIntegrity.mockReturnValue({
        data: base,
        isLoading: false,
        isSuccess: true,
        isError: false,
        error: null,
        status: 'success',
        fetchStatus: 'idle',
        isPending: false,
        isFetching: false,
        isRefetching: false,
        isLoadingError: false,
        isRefetchError: false,
        isStale: false,
        isPlaceholderData: false,
        isPaused: false,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        refetch: vi.fn(),
        remove: vi.fn(),
    } as ReturnType<typeof useDataIntegrity>);
}

describe('DataFreshnessStatusChip', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-12T14:00:00.000Z')); // Thursday 14:00 UTC
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('shows all feeds live when no stale metrics', () => {
        mockHealth({ staleCount: 0, status: 'healthy' });
        render(<DataFreshnessStatusChip />);
        expect(screen.getByText('All feeds live')).toBeInTheDocument();
    });

    it('shows weekday lag warning when feeds are stale within 24h', () => {
        mockHealth({
            status: 'degraded',
            staleCount: 3,
            lastIngestionAt: '2026-06-12T02:00:00.000Z', // 12h ago
        });
        render(<DataFreshnessStatusChip />);
        expect(screen.getByText(/3 feeds lagged/i)).toBeInTheDocument();
    });

    it('shows critical stale state when ingestion is older than 24h on a weekday', () => {
        mockHealth({
            status: 'critical',
            staleCount: 5,
            lastIngestionAt: '2026-06-10T06:00:00.000Z', // >48h ago
        });
        render(<DataFreshnessStatusChip />);
        expect(screen.getByText(/5 feeds stale/i)).toBeInTheDocument();
    });

    it('shows weekend scheduled refresh instead of alarming on Saturday', () => {
        vi.setSystemTime(new Date('2026-06-13T14:00:00.000Z')); // Saturday
        mockHealth({
            status: 'degraded',
            staleCount: 4,
            lastIngestionAt: '2026-06-11T06:00:00.000Z',
        });
        render(<DataFreshnessStatusChip />);
        expect(screen.getByText(/Weekend · Next refresh/i)).toBeInTheDocument();
    });

    it('returns null while loading', () => {
        mockUseDataIntegrity.mockReturnValue({
            data: undefined,
            isLoading: true,
        } as ReturnType<typeof useDataIntegrity>);

        const { container } = render(<DataFreshnessStatusChip />);
        expect(container.firstChild).toBeNull();
    });
});

describe('DataHealthHeaderChip', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-12T14:00:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('links to the public data-health page', () => {
        mockHealth();
        render(
            <MemoryRouter>
                <DataHealthHeaderChip />
            </MemoryRouter>
        );

        const link = screen.getByRole('link', { name: /data feed status/i });
        expect(link).toHaveAttribute('href', '/data-health');
        expect(screen.getByText('All feeds live')).toBeInTheDocument();
    });
});

describe('DataFreshnessFooterChip', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-12T14:00:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('reuses the shared freshness chip', () => {
        mockHealth();
        render(<DataFreshnessFooterChip />);
        expect(screen.getByText('All feeds live')).toBeInTheDocument();
    });
});