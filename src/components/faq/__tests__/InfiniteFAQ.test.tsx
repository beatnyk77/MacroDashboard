import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { InfiniteFAQ } from '../InfiniteFAQ';
import { FAQItem } from '@/types/faq';

const customMockItems: FAQItem[] = [
  {
    id: 'custom-1',
    question: 'How is sovereign beta computed?',
    answer: 'Sovereign beta is computed against the 10-year US Treasury benchmark yield.',
    category: 'Quantitative',
    citationUrl: '/methods/sovereign-beta',
    citationLabel: 'Doc: Sovereign Beta',
    tags: ['beta', 'yield']
  },
  {
    id: 'custom-2',
    question: 'What is the overnight repo threshold?',
    answer: 'The threshold is monitored when reverse repo balances approach zero.',
    category: 'Liquidity',
    tags: ['repo', 'rrp']
  }
];

describe('InfiniteFAQ Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders default terminal FAQ items when no props are provided', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <InfiniteFAQ />
      </MemoryRouter>
    );

    expect(screen.getByText('Global Macro Terminal Intel')).toBeInTheDocument();
    expect(screen.getByText(/What constitutes the Net Liquidity metric/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask anything else/i)).toBeInTheDocument();
  });

  it('accepts custom items and title overrides', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <InfiniteFAQ
          title="Custom Desk Quantitative FAQ"
          items={customMockItems}
          docScope="sovereign"
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Custom Desk Quantitative FAQ')).toBeInTheDocument();
    expect(screen.getByText('How is sovereign beta computed?')).toBeInTheDocument();
    expect(screen.getByText('What is the overnight repo threshold?')).toBeInTheDocument();
  });

  it('expands and collapses accordion questions on click', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <InfiniteFAQ items={customMockItems} />
      </MemoryRouter>
    );

    const questionButton = screen.getByRole('button', { name: /What is the overnight repo threshold/i });
    expect(questionButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(questionButton);
    expect(questionButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/The threshold is monitored when reverse repo balances approach zero/i)).toBeInTheDocument();

    fireEvent.click(questionButton);
    expect(questionButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('filters curated items via search input', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <InfiniteFAQ items={customMockItems} />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Filter curated questions...');
    fireEvent.change(searchInput, { target: { value: 'beta' } });

    expect(screen.getByText('How is sovereign beta computed?')).toBeInTheDocument();
    expect(screen.queryByText('What is the overnight repo threshold?')).not.toBeInTheDocument();
  });

  it('submits a free-form question in the AI terminal and streams response', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <InfiniteFAQ items={customMockItems} autoFocus={true} />
      </MemoryRouter>
    );

    const promptInput = screen.getByPlaceholderText(/Ask anything else/i);
    fireEvent.change(promptInput, { target: { value: 'What is the overnight repo threshold?' } });

    const submitBtn = screen.getByRole('button', { name: /Ask/i });
    fireEvent.click(submitBtn);

    // Verifies streaming/completed answer appears
    await waitFor(
      () => {
        expect(screen.getByText(/The threshold is monitored when reverse repo balances approach zero/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('populates and queries suggested prompts', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <InfiniteFAQ
          items={customMockItems}
          suggestedPrompts={['Explain overnight repo drain']}
        />
      </MemoryRouter>
    );

    const promptBtn = screen.getByText('Explain overnight repo drain');
    fireEvent.click(promptBtn);

    const input = screen.getByPlaceholderText(/Ask anything else/i) as HTMLInputElement;
    expect(input.value).toBe('Explain overnight repo drain');
  });
});
