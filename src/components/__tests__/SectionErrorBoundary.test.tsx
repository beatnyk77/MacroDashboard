import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionErrorBoundary } from '../SectionErrorBoundary';

const reportClientError = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/errorReporting', () => ({
    reportClientError: (...args: unknown[]) => reportClientError(...args),
}));

function Boom(): never {
    throw new Error('section boom');
}

describe('SectionErrorBoundary', () => {
    beforeEach(() => {
        reportClientError.mockClear();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('reports section crashes via reportClientError', () => {
        render(
            <SectionErrorBoundary name="TestSection">
                <Boom />
            </SectionErrorBoundary>,
        );

        expect(screen.getByText(/TestSection/i)).toBeInTheDocument();
        expect(reportClientError).toHaveBeenCalled();
        expect(reportClientError.mock.calls[0][0].message).toBe('section boom');
        expect(reportClientError.mock.calls[0][0].boundary).toBe('SectionErrorBoundary:TestSection');
    });
});
