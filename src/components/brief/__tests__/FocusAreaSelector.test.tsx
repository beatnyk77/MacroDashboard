import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FocusAreaSelector } from '../FocusAreaSelector';

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

describe('FocusAreaSelector', () => {
  const noop = () => {};

  beforeEach(() => {
    localStorage.clear();
  });

  it('renders all focus area options', () => {
    render(
      <FocusAreaSelector
        selected={['us_macro', 'india', 'gold_dedollarization']}
        onChange={noop}
      />
    );
    expect(screen.getByRole('button', { name: /US Macro/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /India/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gold & De-Dollarization/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /China/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Africa/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Energy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sovereign Debt/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Trade Flows/i })).toBeInTheDocument();
  });

  it('marks selected areas with data-selected=true', () => {
    render(
      <FocusAreaSelector
        selected={['india', 'gold_dedollarization']}
        onChange={noop}
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
        selected={['us_macro', 'india']}
        onChange={onChange}
      />
    );
    onChange.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /Gold/i }));
    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(['us_macro', 'india', 'gold_dedollarization']));
  });

  it('slides the window when at max and clicking an unselected area', () => {
    const onChange = vi.fn();
    render(
      <FocusAreaSelector
        selected={['us_macro', 'india', 'gold_dedollarization']}
        onChange={onChange}
      />
    );
    onChange.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /China/i }));
    expect(onChange).toHaveBeenCalledWith(['india', 'gold_dedollarization', 'china']);
  });

  it('allows deselection even when at max', () => {
    const onChange = vi.fn();
    render(
      <FocusAreaSelector
        selected={['us_macro', 'india', 'gold_dedollarization']}
        onChange={onChange}
      />
    );
    onChange.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /US Macro/i }));
    const args = onChange.mock.calls[0][0] as string[];
    expect(args).not.toContain('us_macro');
    expect(args).toContain('india');
    expect(args).toContain('gold_dedollarization');
  });
});
