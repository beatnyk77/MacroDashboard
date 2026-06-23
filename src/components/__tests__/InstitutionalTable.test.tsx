import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
    InstitutionalTable,
    InstitutionalRankCell,
    InstitutionalBadgeCell,
    InstitutionalTrendCell,
} from '@/components/InstitutionalTable';

type Row = {
    id: string;
    name: string;
    value: number;
};

const columns = [
    {
        id: 'rank',
        header: 'Rank',
        cell: (_row: Row, index: number) => <InstitutionalRankCell rank={index + 1} />,
    },
    {
        id: 'name',
        header: 'Name',
        sortable: true,
        cell: (row: Row) => row.name,
    },
    {
        id: 'value',
        header: 'Value',
        align: 'right' as const,
        sortable: true,
        cell: (row: Row) => <InstitutionalTrendCell value={row.value} formattedValue={`${row.value}%`} />,
    },
];

const sampleData: Row[] = [
    { id: 'a', name: 'Alpha', value: 2.4 },
    { id: 'b', name: 'Beta', value: -1.1 },
];

describe('InstitutionalTable', () => {
    it('renders loading skeleton without table body rows', () => {
        render(
            <InstitutionalTable
                data={[]}
                columns={columns}
                getRowKey={(row) => row.id}
                isLoading
            />
        );

        expect(screen.queryByRole('table')).not.toBeInTheDocument();
        expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    });

    it('renders empty state when data is empty', () => {
        render(
            <InstitutionalTable
                data={[]}
                columns={columns}
                getRowKey={(row) => row.id}
                emptyTitle="No refiners found"
                emptyDescription="Awaiting facility telemetry."
            />
        );

        expect(screen.getByText('No refiners found')).toBeInTheDocument();
        expect(screen.getByText('Awaiting facility telemetry.')).toBeInTheDocument();
    });

    it('renders error state with retry action', () => {
        const onRetry = vi.fn();

        render(
            <InstitutionalTable
                data={[]}
                columns={columns}
                getRowKey={(row) => row.id}
                error="Supabase request failed"
                onRetry={onRetry}
            />
        );

        expect(screen.getByText('Failed to load table')).toBeInTheDocument();
        expect(screen.getByText('Supabase request failed')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /retry/i }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('renders rows and calls onSort for sortable headers', () => {
        const onSort = vi.fn();

        render(
            <InstitutionalTable
                data={sampleData}
                columns={columns}
                getRowKey={(row) => row.id}
                sortKey="name"
                sortDirection="asc"
                onSort={onSort}
            />
        );

        expect(screen.getByText('Alpha')).toBeInTheDocument();
        expect(screen.getByText('Beta')).toBeInTheDocument();
        expect(screen.getByText('01')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('columnheader', { name: /name/i }));
        expect(onSort).toHaveBeenCalledWith('name');
    });

    it('applies selected row styling and handles row click', () => {
        const onRowClick = vi.fn();

        const { container } = render(
            <InstitutionalTable
                data={sampleData}
                columns={columns}
                getRowKey={(row) => row.id}
                selectedRowKey="b"
                onRowClick={onRowClick}
            />
        );

        const rows = container.querySelectorAll('tbody tr');
        expect(rows[1]).toHaveClass('bg-white/[0.04]');

        fireEvent.click(screen.getByText('Alpha'));
        expect(onRowClick).toHaveBeenCalledWith(sampleData[0]);
    });

    it('renders caption and footer when data is present', () => {
        render(
            <InstitutionalTable
                data={sampleData}
                columns={columns}
                getRowKey={(row) => row.id}
                caption={<span>Refining Alpha Ranking</span>}
                footer={<button type="button">View full list</button>}
            />
        );

        expect(screen.getByText('Refining Alpha Ranking')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'View full list' })).toBeInTheDocument();
    });
});

describe('InstitutionalTable cell helpers', () => {
    it('renders badge and trend helpers', () => {
        render(
            <div>
                <InstitutionalBadgeCell label="Strong" tone="safe" />
                <InstitutionalTrendCell value={-1.5} formattedValue="-1.5%" />
            </div>
        );

        expect(screen.getByText('Strong')).toBeInTheDocument();
        expect(screen.getByText('-1.5%')).toBeInTheDocument();
    });

    it('renders em dash for null trend values', () => {
        render(<InstitutionalTrendCell value={null} />);
        expect(screen.getByText('—')).toBeInTheDocument();
    });
});