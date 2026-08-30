import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { DataProvenanceBadge } from './DataProvenanceBadge';
import { SnapshotBanner } from './SnapshotBanner';
import { SnapshotTimeline } from './SnapshotTimeline';
import type { AuthorityMetricSnapshot } from '@/lib/authority/metricContract';

const mockSnapshot: AuthorityMetricSnapshot = {
    metric_id: 'test-metric',
    slug: 'test-metric',
    label: 'Test Metric',
    value: 123.45,
    unit: 'USD',
    observed_at: '2024-01-01T00:00:00Z',
    published_at: '2024-01-02T00:00:00Z',
    source: {
        source_name: 'Test Source',
        source_ref: 'TEST/REF',
    },
    native_frequency: 'daily',
    staleness_flag: 'fresh',
    data_status: 'verified',
    methodology_version: '1.0.0',
    revision_of: null,
};

describe('Authority Components', () => {
    describe('DataProvenanceBadge', () => {
        it('renders source and methodology', () => {
            render(<DataProvenanceBadge snapshot={mockSnapshot} />);
            expect(screen.getByText('Test Source')).toBeInTheDocument();
            expect(screen.getByText('v1.0.0')).toBeInTheDocument();
        });
    });

    describe('SnapshotBanner', () => {
        it('does not render for verified state', () => {
            const { container } = render(<SnapshotBanner snapshot={mockSnapshot} />);
            expect(container.firstChild).toBeNull();
        });

        it('renders for provisional state', () => {
            render(<SnapshotBanner snapshot={{ ...mockSnapshot, data_status: 'provisional' }} />);
            expect(screen.getByText('Provisional Data')).toBeInTheDocument();
        });
    });

    describe('SnapshotTimeline', () => {
        it('renders snapshots', () => {
            render(<SnapshotTimeline snapshots={[mockSnapshot]} />);
            expect(screen.getByText('Publication History')).toBeInTheDocument();
            expect(screen.getByText('verified')).toBeInTheDocument();
        });
    });
});
