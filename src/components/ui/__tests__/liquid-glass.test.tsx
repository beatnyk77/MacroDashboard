import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GlassDock, GlassEffect } from '@/components/ui/liquid-glass';

describe('liquid glass primitives', () => {
    it('renders children inside the web glass surface', () => {
        render(<GlassEffect><span>Surface content</span></GlassEffect>);

        expect(screen.getByText('Surface content')).toBeInTheDocument();
        expect(screen.getByText('Surface content').parentElement?.parentElement).toHaveClass('liquid-glass-web-approx');
    });

    it('renders quick views as accessible links', () => {
        render(<GlassDock items={[{ label: 'Liquidity', detail: 'Net liquidity proxy', href: '#net-liquidity' }]} />);

        const link = screen.getByRole('link', { name: /liquidity, net liquidity proxy/i });
        expect(link).toHaveAttribute('href', '#net-liquidity');
        expect(screen.getByRole('navigation', { name: 'Quick terminal views' })).toBeInTheDocument();
    });

    it('supports action items without requiring a URL', () => {
        const onClick = vi.fn();
        render(<GlassDock items={[{ label: 'Focus', onClick }]} />);

        fireEvent.click(screen.getByRole('button', { name: /focus/i }));
        expect(onClick).toHaveBeenCalledOnce();
    });
});
