import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FocusAreaSelector } from '../FocusAreaSelector';
import type { FocusAreaCode } from '@/hooks/useMacroBrief';

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

describe('FocusAreaSelector', () => {
  const noop = () => {};

  beforeEach(() => {
    localStorage.clear();
  });

  it('renders nothing when open is false', () => {
    const { container } = render(
      <FocusAreaSelector selected={[]} onChange={noop} open={false} onClose={noop} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders all 8 focus area options when open', () => {
    render(
      <FocusAreaSelector
        selected={['us', 'india', 'gold']}
        onChange={noop}
        open={true}
        onClose={noop}
      />
    );
    expect(screen.getByText('US Macro')).toBeInTheDocument();
    expect(screen.getByText('India')).toBeInTheDocument();
    expect(screen.getByText('Gold & De-Dollarization')).toBeInTheDocument();
    expect(screen.getByText('China')).toBeInTheDocument();
    expect(screen.getByText('Africa')).toBeInTheDocument();
    expect(screen.getByText('Energy')).toBeInTheDocument();
    expect(screen.getByText('Sovereign Debt')).toBeInTheDocument();
    expect(screen.getByText('Trade Flows')).toBeInTheDocument();
  });

  it('marks selected areas with data-selected=true', () => {
    render(
      <FocusAreaSelector
        selected={['india', 'gold']}
        onChange={noop}
        open={true}
        onClose={noop}
      />
    );
    const indiaBtn = screen.getByRole('button', { name: /India/i });
    expect(indiaBtn).toHaveAttribute('data-selected', 'true');
    const usBtn = screen.getByRole('button', { name: /US Macro/i });
    expect(usBtn).toHaveAttribute('data-selected', 'false');
  });

  it('calls onChange with new area when toggling an unselected area under max', () => {
    const onChange = vi.fn();
    render(
      <FocusAreaSelector
        selected={['us', 'india']}
        onChange={onChange}
        open={true}
        onClose={noop}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Gold/i }));
    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(['us', 'india', 'gold']));
  });

  it('does not call onChange when at max (3) and clicking unselected area', () => {
    const onChange = vi.fn();
    render(
      <FocusAreaSelector
        selected={['us', 'india', 'gold']}
        onChange={onChange}
        open={true}
        onClose={noop}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /China/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('allows deselection even when at max', () => {
    const onChange = vi.fn();
    render(
      <FocusAreaSelector
        selected={['us', 'india', 'gold']}
        onChange={onChange}
        open={true}
        onClose={noop}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /US Macro/i }));
    const args = onChange.mock.calls[0][0] as FocusAreaCode[];
    expect(args).not.toContain('us');
    expect(args).toContain('india');
    expect(args).toContain('gold');
  });
});
