import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Sparkles, AlertCircle, RotateCcw, Clock, Trash2 } from 'lucide-react';
import { Citation, SessionQuery } from '@/types/faq';
import { StreamedMarkdownAnswer } from './StreamedMarkdownAnswer';

interface AIRAGTerminalProps {
  status: 'idle' | 'reading-docs' | 'streaming' | 'completed' | 'error';
  currentQuestion: string;
  currentAnswer: string;
  citations: Citation[];
  history: SessionQuery[];
  activeSessionId: string | null;
  error?: string | null;
  cooldown?: number;
  suggestedPrompts?: string[];
  docScope?: string;
  autoFocus?: boolean;
  onAsk: (question: string) => void;
  onSelectSession: (id: string) => void;
  onClearHistory?: () => void;
  className?: string;
}

export const AIRAGTerminal: React.FC<AIRAGTerminalProps> = ({
  status,
  currentQuestion,
  currentAnswer,
  citations,
  history,
  activeSessionId,
  error,
  cooldown = 0,
  suggestedPrompts = [],
  docScope = 'global',
  autoFocus = true,
  onAsk,
  onSelectSession,
  onClearHistory,
  className = '',
}) => {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalBodyRef = useRef<HTMLDivElement>(null);

  // Auto-focus input on page load
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Scroll to response when streaming begins or updates
  useEffect(() => {
    if (status === 'streaming' && terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [status, currentAnswer]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed || cooldown > 0 || status === 'streaming') return;
    onAsk(trimmed);
    setInputVal('');
  };

  const handlePromptClick = (prompt: string) => {
    setInputVal(prompt);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const isWorking = status === 'reading-docs' || status === 'streaming';

  return (
    <div
      className={`flex flex-col h-full bg-[#060a14] border border-[#1a2538] rounded-md overflow-hidden ${className}`}
    >
      {/* Terminal Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#080d1a] border-b border-[#182333]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span className="font-mono text-[11px] font-semibold tracking-wider text-[#d4e4fa]">
            DOCS RAG INTELLIGENCE TERMINAL
          </span>
          <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded-sm bg-[#0e1c30] text-[#38bdf8] border border-[#1b3252]">
            {docScope}
          </span>
        </div>

        {/* Telemetry Status Indicator */}
        <div className="flex items-center gap-2">
          {status === 'idle' && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#64748b]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]" />
              READY
            </span>
          )}
          {status === 'reading-docs' && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#f59e0b] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
              READING DOCS...
            </span>
          )}
          {status === 'streaming' && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#10b981]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
              STREAMING SSE
            </span>
          )}
          {status === 'completed' && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#38bdf8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
              SYNTHESIS COMPLETE
            </span>
          )}
          {status === 'error' && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#f43f5e]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]" />
              DEGRADED
            </span>
          )}
        </div>
      </div>

      {/* Session Question History Tabs */}
      {history.length > 0 && (
        <div className="px-3 py-1.5 bg-[#050810] border-b border-[#141d2b] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-0">
            <Clock className="w-3 h-3 text-[#475569] shrink-0" />
            <span className="text-[10px] font-mono text-[#475569] shrink-0">
              SESSION:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {history.map(item => {
                const isActive = item.id === activeSessionId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectSession(item.id)}
                    className={`shrink-0 max-w-[160px] truncate px-2 py-0.5 rounded-sm text-[10px] font-mono transition-colors ${
                      isActive
                        ? 'bg-[#10223d] text-[#7dd3fc] border border-[#23426e]'
                        : 'bg-[#080d18] text-[#8c909f] hover:text-[#cbd5e1] border border-[#162030]'
                    }`}
                    title={item.question}
                  >
                    {item.question}
                  </button>
                );
              })}
            </div>
          </div>

          {onClearHistory && history.length > 1 && (
            <button
              type="button"
              onClick={onClearHistory}
              title="Clear session history"
              className="text-[#475569] hover:text-[#94a3b8] p-1 shrink-0"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Main Terminal Viewport */}
      <div
        ref={terminalBodyRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar min-h-[220px]"
      >
        {status === 'idle' && !currentAnswer && (
          <div className="flex flex-col items-center justify-center text-center h-full py-8 text-[#64748b]">
            <div className="w-9 h-9 rounded-md bg-[#0a1222] border border-[#1c2a40] flex items-center justify-center mb-3 text-[#38bdf8]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="font-['Space_Grotesk'] text-[13px] font-semibold text-[#cbd5e1] mb-1">
              Institutional Documentation RAG
            </h4>
            <p className="text-[12px] text-[#64748b] max-w-sm leading-relaxed mb-4">
              Ask any question regarding calculation methodologies, raw data pipelines,
              or central bank balance sheet telemetry.
            </p>

            {/* Quick Suggestions */}
            {suggestedPrompts.length > 0 && (
              <div className="w-full max-w-md">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#475569] mb-2">
                  SUGGESTED MACRO INQUIRIES
                </div>
                <div className="flex flex-col gap-1.5">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePromptClick(prompt)}
                      className="text-left px-3 py-1.5 rounded-sm bg-[#080f1e] hover:bg-[#0d1a33] border border-[#16243b] hover:border-[#27446b] text-[11px] font-mono text-[#94a3b8] hover:text-[#d4e4fa] transition-colors flex items-center justify-between group"
                    >
                      <span className="truncate">{prompt}</span>
                      <span className="text-[#38bdf8] opacity-0 group-hover:opacity-100 transition-opacity">
                        ↵
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Display Current Question */}
        {currentQuestion && (
          <div className="p-2.5 rounded-md bg-[#081020] border border-[#1c2e47] flex items-start gap-2">
            <span className="font-mono text-[#38bdf8] text-[12px] font-bold select-none pt-0.5">
              &gt;
            </span>
            <div className="flex-1">
              <span className="text-[10px] font-mono text-[#64748b] block mb-0.5">
                ALLOCATOR INQUIRY
              </span>
              <p className="text-[12px] font-mono text-[#f1f5f9] font-medium">
                {currentQuestion}
              </p>
            </div>
          </div>
        )}

        {/* Reading Docs Loading State */}
        {status === 'reading-docs' && (
          <div className="p-4 rounded-md bg-[#070d1a] border border-[#1c293b] flex items-center gap-3 animate-pulse">
            <div className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
            <div className="flex-1">
              <span className="text-[11px] font-mono text-[#38bdf8] block font-medium">
                Scanning documentation corpus...
              </span>
              <span className="text-[10px] text-[#64748b]">
                Parsing methodology articles, formulas, and balance sheet series
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-md bg-[#18080a] border border-[#44161b] text-[#fca5a5] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#f43f5e] shrink-0 mt-0.5" />
            <div className="flex-1 text-[11px]">
              <span className="font-mono font-semibold block mb-0.5">
                TELEMETRY RETRIEVAL NOTICE
              </span>
              <p className="text-[#cbd5e1]">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => onAsk(currentQuestion)}
              className="p-1 text-[#cbd5e1] hover:text-white"
              title="Retry query"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Streamed or Completed Response */}
        {currentAnswer && (
          <div className="p-3.5 rounded-md bg-[#050912] border border-[#162234]">
            <StreamedMarkdownAnswer
              content={currentAnswer}
              isStreaming={status === 'streaming'}
              citations={citations}
            />
          </div>
        )}
      </div>

      {/* Input Form & Footer */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-[#080d1a] border-t border-[#182333]"
      >
        <div className="relative flex items-center">
          <span className="absolute left-3 font-mono text-[12px] text-[#38bdf8] select-none pointer-events-none">
            query &gt;
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            disabled={isWorking}
            placeholder={
              isWorking
                ? 'Processing documentation inquiry...'
                : 'Ask anything else about models, ingestion, or data...'
            }
            className="w-full bg-[#050810] border border-[#1f2e45] focus:border-[#38bdf8] disabled:bg-[#070b14] disabled:border-[#131b26] disabled:text-[#475569] rounded-md pl-20 pr-16 py-2.5 text-[12px] text-[#e2e8f0] font-mono focus:outline-none transition-colors shadow-inner"
          />

          <button
            type="submit"
            disabled={!inputVal.trim() || isWorking || cooldown > 0}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-sm bg-[#102440] hover:bg-[#16335a] disabled:bg-transparent disabled:text-[#334155] border border-[#25456f] disabled:border-transparent text-[#38bdf8] text-[11px] font-mono font-medium transition-all flex items-center gap-1"
          >
            {cooldown > 0 ? (
              <span>{cooldown}s</span>
            ) : (
              <>
                <span className="hidden sm:inline">Ask</span>
                <Send className="w-3 h-3" />
              </>
            )}
          </button>
        </div>

        {/* Helper micro-text */}
        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-[#64748b]">
          <span className="font-['Inter']">
            The short ones are here. For anything else, just ask.
          </span>
          <span className="font-mono text-[10px] text-[#475569]">
            Press <kbd className="px-1 py-0.5 rounded bg-[#0d1524] text-[#94a3b8] border border-[#1b2638]">Enter ↵</kbd>
          </span>
        </div>
      </form>
    </div>
  );
};
