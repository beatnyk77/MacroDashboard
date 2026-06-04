import React, { createRef } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShareButton } from '../ShareButton';

const mockCapture = vi.fn();
vi.mock('@/hooks/useCardCapture', () => ({
    useCardCapture: () => ({ capture: mockCapture, isCapturing: false, error: null }),
}));
vi.mock('../ShareModal', () => ({
    ShareModal: ({ open, title }: { open: boolean; title: string }) =>
        open ? <div data-testid="share-modal">{title}</div> : null,
}));

beforeEach(() => { vi.clearAllMocks(); });

describe('ShareButton', () => {
    it('renders a share button', () => {
        const ref = createRef<HTMLDivElement>();
        render(<div ref={ref}><ShareButton targetRef={ref} title="Net Liquidity" dataSource="FRED" /></div>);
        expect(screen.getByRole('button', { name: /share this chart/i })).toBeInTheDocument();
    });

    it('calls capture with the target element on click', async () => {
        const ref = createRef<HTMLDivElement>();
        mockCapture.mockResolvedValue({ dataUrl: 'data:image/png;base64,x', blob: new Blob() });
        render(<div ref={ref}><ShareButton targetRef={ref} title="Net Liquidity" dataSource="FRED" /></div>);
        fireEvent.click(screen.getByRole('button', { name: /share this chart/i }));
        await waitFor(() => {
            expect(mockCapture).toHaveBeenCalledWith(expect.any(HTMLElement), { dataSource: 'FRED' });
        });
    });

    it('opens ShareModal after successful capture', async () => {
        const ref = createRef<HTMLDivElement>();
        mockCapture.mockResolvedValue({ dataUrl: 'data:image/png;base64,x', blob: new Blob() });
        render(<div ref={ref}><ShareButton targetRef={ref} title="Net Liquidity" dataSource="FRED" /></div>);
        fireEvent.click(screen.getByRole('button', { name: /share this chart/i }));
        await waitFor(() => {
            expect(screen.getByTestId('share-modal')).toBeInTheDocument();
        });
    });
});
