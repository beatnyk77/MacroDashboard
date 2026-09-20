import { useState, useRef, useCallback, useEffect } from 'react';
import { Citation, DocScope, FAQItem, SessionQuery } from '@/types/faq';
import { FAQ_CATALOG } from '@/data/faqCatalog';

interface UseRAGFAQOptions {
  pageId?: string;
  docScope?: DocScope | string;
  items?: FAQItem[];
  maxHistory?: number;
}

export function useRAGFAQ({ pageId = 'terminal', docScope = 'global', items: propItems, maxHistory = 10 }: UseRAGFAQOptions = {}) {
  const [status, setStatus] = useState<'idle' | 'reading-docs' | 'streaming' | 'completed' | 'error'>('idle');
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [history, setHistory] = useState<SessionQuery[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const selectSessionQuery = useCallback((id: string) => {
    const item = history.find(h => h.id === id);
    if (!item) return;
    setActiveSessionId(id);
    setCurrentQuestion(item.question);
    setCurrentAnswer(item.answer);
    setCitations(item.citations);
    setStatus(item.status);
    setError(item.error || null);
  }, [history]);

  const fallbackLocalRAG = useCallback(async (
    query: string, 
    queryId: string, 
    scope: string
  ) => {
    setStatus('reading-docs');
    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    
    // Simulate brief doc lookup
    if (!isTest) {
      await new Promise(r => setTimeout(r, 400));
    }

    // Find closest match in propItems or FAQ catalog
    const qLower = query.toLowerCase();
    const candidateItems = propItems && propItems.length > 0
      ? propItems
      : Object.values(FAQ_CATALOG).flatMap(e => e.items);

    let matchedItem = null;
    for (const item of candidateItems) {
      if (
        qLower.includes(item.question.toLowerCase()) || 
        item.question.toLowerCase().includes(qLower) ||
        item.tags?.some(t => qLower.includes(t))
      ) {
        matchedItem = item;
        break;
      }
    }

    const citationsFound: Citation[] = matchedItem?.citationUrl ? [
      {
        title: matchedItem.citationLabel || matchedItem.question,
        url: matchedItem.citationUrl,
        snippet: matchedItem.category || 'Methodology'
      }
    ] : [
      {
        title: 'GraphiQuestor Methodology Index',
        url: '/methods',
        snippet: 'Terminal telemetry models & formulas'
      }
    ];

    setCitations(citationsFound);
    setStatus('streaming');

    let syntheticAnswer = '';
    if (matchedItem) {
      syntheticAnswer = `**Analytical Briefing: ${matchedItem.question}**\n\n${matchedItem.answer}\n\n*Source telemetry and formal documentation: [${matchedItem.citationLabel || 'Methodology Document'}](${matchedItem.citationUrl || '/methods'})*`;
    } else {
      syntheticAnswer = `**Synthesized Macro Intelligence (${scope.toUpperCase()})**\n\nRegarding **"${query}"**:\n\nGraphiQuestor computes real-time coordinates across global liquidity, sovereign solvency, and currency reserves without forward-looking forecasting bias.\n\n- **Telemetry Classification**: \`${scope}\` domain telemetry.\n- **Mathematical Lineage**: Sourced from official balance sheet registries (FRED, RBI DBIE, EIA, TreasuryDirect).\n\nFor exact historical data series and code equations, see the primary [Documentation & Methodology](/methods) index.`;
    }

    // Stream out chunks
    const words = syntheticAnswer.split(' ');
    let accumulated = '';
    const delayMs = isTest ? 5 : 35;

    for (let i = 0; i < words.length; i++) {
      accumulated += (i === 0 ? '' : ' ') + words[i];
      setCurrentAnswer(accumulated);
      if (!isTest || i % 4 === 0) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }

    setStatus('completed');
    setHistory(prev => prev.map(h => 
      h.id === queryId 
        ? { ...h, answer: accumulated, citations: citationsFound, status: 'completed' }
        : h
    ));
  }, [propItems]);

  const askQuestion = useCallback(async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || cooldown > 0 || status === 'streaming') return;

    // Abort previous in-flight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const queryId = `query-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setActiveSessionId(queryId);
    setCurrentQuestion(trimmed);
    setCurrentAnswer('');
    setCitations([]);
    setError(null);
    setStatus('reading-docs');
    setCooldown(3); // 3-second throttle

    const newSessionItem: SessionQuery = {
      id: queryId,
      question: trimmed,
      answer: '',
      timestamp: Date.now(),
      citations: [],
      status: 'reading-docs',
    };

    setHistory(prev => [newSessionItem, ...prev.slice(0, maxHistory - 1)]);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      // Offline / dev fallback
      await fallbackLocalRAG(trimmed, queryId, docScope as string);
      return;
    }

    try {
      const endpoint = `${supabaseUrl}/functions/v1/rag-faq`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          question: trimmed,
          pageId,
          docScope,
          history: history.slice(0, 2).map(h => ({ role: 'user', content: h.question }))
        }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Edge function returned status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new window.TextDecoder();
      let buffer = '';
      let accumulatedAnswer = '';
      let activeCitations: Citation[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          if (trimmedLine.startsWith('event: ')) {
            continue;
          }

          if (trimmedLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmedLine.slice(6));
              
              if (data.status) {
                setStatus(data.status);
              }
              if (Array.isArray(data)) {
                activeCitations = data;
                setCitations(data);
              }
              if (data.content) {
                setStatus('streaming');
                accumulatedAnswer += data.content;
                setCurrentAnswer(accumulatedAnswer);
              }
              if (data.completed) {
                setStatus('completed');
              }
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e: any) {
              // Non-fatal parse issue or custom error
              if (e.message && e.message !== 'Unexpected token') {
                throw e;
              }
            }
          }
        }
      }

      setStatus('completed');
      setHistory(prev => prev.map(h => 
        h.id === queryId 
          ? { ...h, answer: accumulatedAnswer, citations: activeCitations, status: 'completed' }
          : h
      ));
    } catch (err: any) {
      if (err.name === 'AbortError') return;

      console.warn('RAG streaming service unavailable, switching to local synthesis fallback:', err);
      // Fallback gracefully so the terminal experience is never interrupted
      await fallbackLocalRAG(trimmed, queryId, docScope as string);
    }
  }, [cooldown, status, maxHistory, docScope, pageId, history, fallbackLocalRAG]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setActiveSessionId(null);
    setCurrentQuestion('');
    setCurrentAnswer('');
    setCitations([]);
    setStatus('idle');
    setError(null);
  }, []);

  return {
    status,
    currentQuestion,
    currentAnswer,
    citations,
    history,
    activeSessionId,
    error,
    cooldown,
    askQuestion,
    selectSessionQuery,
    clearHistory,
  };
}
