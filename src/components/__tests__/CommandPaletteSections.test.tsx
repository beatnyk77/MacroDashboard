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
    'Regional Intelligence',
    'Energy & Commodities',
    'Institutional Strategy',
    'Geopolitical Risk Matrix',
    'Deflation / Debasement Monitor',
];

describe('CommandPalette — Terminal Sections', () => {
    it('renders terminal section jump entries when open (trade product removed)', () => {
        renderPalette();
        for (const label of EXPECTED_LABELS) {
            expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
        }
        expect(screen.queryByText('Trade Intelligence')).not.toBeInTheDocument();
    });

    it('does not render TradeFx navigation entry', () => {
        renderPalette();
        expect(screen.queryByText('TradeFx — Currency Intelligence')).not.toBeInTheDocument();
        expect(screen.getByText('De-Dollarization & Gold Lab')).toBeInTheDocument();
    });
});
