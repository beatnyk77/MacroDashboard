import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataQualityBadge } from '../DataQualityBadge';

describe('DataQualityBadge', () => {
    it('renders with default props (live)', () => {
        render(<DataQualityBadge />);
        // By default label is true, type is live
        expect(screen.getByText('Live Feed')).toBeInTheDocument();
        // Since it's live, should have specific classes
        const container = screen.getByText('Live Feed').closest('div');
        expect(container).toHaveClass('bg-emerald-500/10');
    });

    it('renders simulated type correctly', () => {
        render(<DataQualityBadge type="simulated" />);
        expect(screen.getByText('Simulated Data')).toBeInTheDocument();
        const container = screen.getByText('Simulated Data').closest('div');
        expect(container).toHaveClass('bg-amber-500/10');
    });

    it('renders stale type correctly', () => {
        render(<DataQualityBadge type="stale" />);
        expect(screen.getByText('Feed Stale')).toBeInTheDocument();
        const container = screen.getByText('Feed Stale').closest('div');
        expect(container).toHaveClass('bg-rose-500/10');
    });

    it('does not render label when label=false', () => {
        const { container } = render(<DataQualityBadge label={false} />);
        expect(screen.queryByText('Live Feed')).not.toBeInTheDocument();
        // The container should still exist
        expect(container.firstChild).toBeInTheDocument();
    });

    it('renders formatted date when lastUpdated is provided', () => {
        const testDate = new Date('2023-05-15T12:00:00Z');
        render(<DataQualityBadge lastUpdated={testDate} />);
        
        // Match formatted date e.g., 'May 15'
        const expectedDateString = testDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        expect(screen.getByText((content) => content.includes(expectedDateString))).toBeInTheDocument();
    });

    it('does not render date for simulated type even if timestamp provided', () => {
        const testDate = new Date('2023-05-15T12:00:00Z');
        render(<DataQualityBadge type="simulated" timestamp={testDate} />);
        
        const expectedDateString = testDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        expect(screen.queryByText((content) => content.includes(expectedDateString))).not.toBeInTheDocument();
    });
});
