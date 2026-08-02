import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ChinaExternalSectorPanel } from '../ChinaExternalSectorPanel';

vi.mock('@/hooks/useChinaMacro', () => ({
    useChinaMacroPulse: () => ({ data: [] }),
    useLatestChinaMetric: () => ({ data: undefined }),
}));

describe('ChinaExternalSectorPanel', () => {
    it('renders a neutral no-data dot, not a green/amber verdict, when metrics are missing', () => {
        const { container } = render(<ChinaExternalSectorPanel />);
        const statusDots = Array.from(container.querySelectorAll('div')).filter(
            (el) => el.className.includes('w-1.5') && el.className.includes('h-1.5') && el.className.includes('rounded-full'),
        );
        expect(statusDots.length).toBe(3);
        statusDots.forEach((dot) => {
            expect(dot.className).not.toMatch(/bg-emerald-500|bg-amber-500/);
            expect(dot.className).toMatch(/bg-white\/15/);
        });
    });
});
