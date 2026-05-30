import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from '@/components/CommandPalette/CommandPalette';

function renderPalette() {
    return render(
        <MemoryRouter>
            <CommandPalette open={true} setOpen={vi.fn()} />
        </MemoryRouter>
    );
}

const EXPECTED_LABELS = [
    'Daily Macro Brief',
    'Sovereign Compass',
    'Weekly Regime Digest',
    'Monthly Strategy',
    'Liquidity Plumbline',
    'Sovereign Stress',
    'Trade Intelligence',
    'Regional Intelligence',
    'Energy & Commodities',
    'Institutional Strategy',
    'Geopolitical Risk Matrix',
    'Deflation / Debasement Monitor',
];

describe('CommandPalette — Terminal Sections', () => {
    it('renders all 12 terminal section jump entries when open', () => {
        renderPalette();
        for (const label of EXPECTED_LABELS) {
            expect(screen.getByText(label)).toBeInTheDocument();
        }
    });
});
