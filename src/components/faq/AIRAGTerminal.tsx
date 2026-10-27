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
      className={`flex flex-col h-full bg-card border border-border rounded-md overflow-hidden ${className}`}
    >
      {/* Terminal Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-card border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-mono text-[11px] font-semibold tracking-wider text-foreground">
            DOCS RAG INTELLIGENCE TERMINAL
          </span>
          <span className="font-mono text-[11px] uppercase px-1.5 py-0.2 rounded-sm bg-card text-sky-400 border border-border">
            {docScope}
          </span>
        </div>

        {/* Telemetry Status Indicator */}
        <div className="flex items-center gap-2">
          {status === 'idle' && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-terminal-dim">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              READY
            </span>
          )}
          {status === 'reading-docs' && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-500 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              READING DOCS...
            </span>
          )}
          {status === 'streaming' && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              STREAMING SSE
            </span>
          )}
          {status === 'completed' && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-sky-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              SYNTHESIS COMPLETE
            </span>
          )}
          {status === 'error' && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-rose-500">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              DEGRADED
            </span>
          )}
        </div>
      </div>

      {/* Session Question History Tabs */}
      {history.length > 0 && (
        <div className="px-3 py-1.5 bg-background border-b border-border flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-0">
            <Clock className="w-3 h-3 text-terminal-dim shrink-0" />
            <span className="text-[11px] font-mono text-terminal-dim shrink-0">
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
                    className={`shrink-0 max-w-[160px] truncate px-2 py-0.5 rounded-sm text-[11px] font-mono transition-colors ${
                      isActive
                        ? ' bg-card text-sky-300 border border-border'
                        : 'bg-card text-terminal-dim hover:text-foreground border border-border'
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
              className="text-muted-foreground hover:text-foreground p-1 shrink-0"
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
          <div className="flex flex-col items-center justify-center text-center h-full py-8 text-terminal-dim">
            <div className="w-9 h-9 rounded-md bg-card border border-border flex items-center justify-center mb-3 text-sky-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="font-sans text-sm font-semibold text-foreground mb-1">
              Institutional Documentation RAG
            </h4>
            <p className="text-[12px] text-terminal-dim max-w-sm leading-relaxed mb-4">
              Ask any question regarding calculation methodologies, raw data pipelines,
              or central bank balance sheet telemetry.
            </p>

            {/* Quick Suggestions */}
            {suggestedPrompts.length > 0 && (
              <div className="w-full max-w-md">
                <div className="text-[11px] font-mono uppercase tracking-wider text-terminal-dim mb-2">
                  SUGGESTED MACRO INQUIRIES
                </div>
                <div className="flex flex-col gap-1.5">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePromptClick(prompt)}
                      className="text-left px-3 py-1.5 rounded-sm bg-card hover:bg-secondary border border-border hover:border-primary/40 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between group"
                    >
                      <span className="truncate">{prompt}</span>
                      <span className=" text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
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
          <div className="p-2.5 rounded-md bg-card border border-border flex items-start gap-2">
            <span className="font-mono text-sky-400 text-[12px] font-bold select-none pt-0.5">
              &gt;
            </span>
            <div className="flex-1">
              <span className="text-[11px] font-mono text-terminal-dim block mb-0.5">
                ALLOCATOR INQUIRY
              </span>
              <p className="text-[12px] font-mono text-foreground font-medium">
                {currentQuestion}
              </p>
            </div>
          </div>
        )}

        {/* Reading Docs Loading State */}
        {status === 'reading-docs' && (
          <div className="p-4 rounded-md bg-card border border-border flex items-center gap-3 animate-pulse">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <div className="flex-1">
              <span className="text-[11px] font-mono text-sky-400 block font-medium">
                Scanning documentation corpus...
              </span>
              <span className="text-[11px] text-terminal-dim">
                Parsing methodology articles, formulas, and balance sheet series
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-md bg-card border border-border text-red-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 text-[11px]">
              <span className="font-mono font-semibold block mb-0.5">
                TELEMETRY RETRIEVAL NOTICE
              </span>
              <p className=" text-foreground">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => onAsk(currentQuestion)}
              className="p-1 text-foreground hover:text-white"
              title="Retry query"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Streamed or Completed Response */}
        {currentAnswer && (
          <div className="p-3.5 rounded-md bg-background border border-border">
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
        className="p-3 bg-card border-t border-border"
      >
        <div className="relative flex items-center">
          <span className="absolute left-3 font-mono text-[12px] text-sky-400 select-none pointer-events-none">
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
            className="w-full bg-background border border-border focus:border-sky-400 disabled:bg-card disabled:border-border disabled:text-terminal-dim rounded-md pl-20 pr-16 py-2.5 text-[12px] text-foreground font-mono focus:outline-none transition-colors shadow-inner"
          />

          <button
            type="submit"
            disabled={!inputVal.trim() || isWorking || cooldown > 0}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-sm bg-card hover:bg-secondary disabled:bg-transparent disabled:text-terminal-dim border border-border disabled:border-transparent text-sky-400 text-[11px] font-mono font-medium transition-all flex items-center gap-1"
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
        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-terminal-dim">
          <span className="font-sans">
            The short ones are here. For anything else, just ask.
          </span>
          <span className="font-mono text-[11px] text-terminal-dim">
            Press <kbd className="px-1 py-0.5 rounded bg-card text-muted-foreground border border-border">Enter ↵</kbd>
          </span>
        </div>
      </form>
    </div>
  );
};
