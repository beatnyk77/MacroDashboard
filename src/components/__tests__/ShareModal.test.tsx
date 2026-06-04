import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ShareModal } from '../ShareModal';

const defaultProps = {
    open: true,
    onClose: vi.fn(),
    dataUrl: 'data:image/png;base64,abc',
    blob: new Blob(['x'], { type: 'image/png' }),
    title: 'US Net Liquidity Proxy',
    href: 'https://graphiquestor.com/labs/us-macro-fiscal',
};

describe('ShareModal', () => {
    it('renders the PNG preview when open', () => {
        render(<ShareModal {...defaultProps} />);
        const img = screen.getByRole('img', { name: /US Net Liquidity Proxy/i });
        expect(img).toHaveAttribute('src', defaultProps.dataUrl);
    });

    it('renders Twitter, LinkedIn, WhatsApp share links', () => {
        render(<ShareModal {...defaultProps} />);
        expect(screen.getByRole('link', { name: /X \/ Twitter/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /LinkedIn/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /WhatsApp/i })).toBeInTheDocument();
    });

    it('Twitter link contains twitter.com/intent/tweet', () => {
        render(<ShareModal {...defaultProps} />);
        const link = screen.getByRole('link', { name: /X \/ Twitter/i });
        expect(link.getAttribute('href')).toContain('twitter.com/intent/tweet');
    });

    it('Download link has correct filename', () => {
        render(<ShareModal {...defaultProps} />);
        const link = screen.getByRole('link', { name: /Download PNG/i });
        expect(link).toHaveAttribute('href', defaultProps.dataUrl);
        expect(link).toHaveAttribute('download', 'gq-us-net-liquidity-proxy.png');
    });

    it('Copy Link writes to clipboard', async () => {
        Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
        render(<ShareModal {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /Copy Link/i }));
        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(defaultProps.href);
        });
    });

    it('does not render when open=false', () => {
        render(<ShareModal {...defaultProps} open={false} />);
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
});
