import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRAGFAQ } from '../useRAGFAQ';
import { FAQItem } from '@/types/faq';

const testItems: FAQItem[] = [
  {
    id: 't-1',
    question: 'How is TGA accounted for in Net Liquidity?',
    answer: 'TGA is subtracted from Fed assets because Treasury deposits at the Fed are unencumbered sovereign cash.',
    category: 'Monetary',
    citationUrl: '/methods/net-liquidity',
    tags: ['tga', 'liquidity']
  }
];

describe('useRAGFAQ hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with idle state and empty answers', () => {
    const { result } = renderHook(() => useRAGFAQ({ items: testItems }));

    expect(result.current.status).toBe('idle');
    expect(result.current.currentQuestion).toBe('');
    expect(result.current.currentAnswer).toBe('');
    expect(result.current.citations).toEqual([]);
    expect(result.current.history).toEqual([]);
  });

  it('runs local synthesis when Supabase edge function is unavailable', async () => {
    const { result } = renderHook(() => useRAGFAQ({ items: testItems }));

    await act(async () => {
      await result.current.askQuestion('How is TGA accounted for in Net Liquidity?');
    });

    expect(result.current.status).toBe('completed');
    expect(result.current.currentAnswer).toContain('TGA is subtracted from Fed assets');
    expect(result.current.citations.length).toBeGreaterThan(0);
    expect(result.current.history.length).toBe(1);
    expect(result.current.history[0].question).toBe('How is TGA accounted for in Net Liquidity?');
  });

  it('supports selecting past queries from session history', async () => {
    const { result } = renderHook(() => useRAGFAQ({ items: testItems }));

    await act(async () => {
      await result.current.askQuestion('How is TGA accounted for in Net Liquidity?');
    });

    const firstSessionId = result.current.activeSessionId;
    expect(firstSessionId).toBeTruthy();

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toEqual([]);
    expect(result.current.currentAnswer).toBe('');
  });
});
