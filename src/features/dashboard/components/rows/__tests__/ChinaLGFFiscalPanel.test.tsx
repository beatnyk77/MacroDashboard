import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ChinaLGFFiscalPanel } from '../ChinaLGFFiscalPanel';

vi.mock('@/hooks/useChinaDebt', () => ({
    useChinaDebtLayers: () => ({ data: [], isLoading: false }),
    useChinaFiscalSignals: () => ({ data: [], isLoading: false }),
}));

describe('ChinaLGFFiscalPanel', () => {
    it('does not highlight a warning card when the underlying metric is missing', () => {
        const { container } = render(<ChinaLGFFiscalPanel />);
        // KPI warn styling uses bg-amber-500/[0.04] — not the header icon chrome (bg-amber-500/10)
        const warningCards = Array.from(container.querySelectorAll('div')).filter(
            (el) => el.className.includes('bg-amber-500/[0.04]') || el.className.includes('bg-amber-500/\\[0.04\\]'),
        );
        // Only LGFV Debt can warn when a real value exists; with missing data, zero warnings.
        expect(warningCards.length).toBe(0);
    });
});
