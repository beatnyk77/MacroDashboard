import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TrailLink as Link } from '@/components/TrailLink';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { Citation } from '@/types/faq';

interface StreamedMarkdownAnswerProps {
  content: string;
  isStreaming?: boolean;
  citations?: Citation[];
  className?: string;
}

export const StreamedMarkdownAnswer: React.FC<StreamedMarkdownAnswerProps> = ({
  content,
  isStreaming = false,
  citations = [],
  className = '',
}) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const handleCopyCode = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeIndex(idx);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  let codeBlockCounter = 0;

  return (
    <div className={`faq-markdown-stream text-foreground ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-semibold font-sans text-foreground mt-3 mb-2 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[11px] font-semibold font-sans text-sky-400 mt-3 mb-1.5 uppercase tracking-wider">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[12px] font-medium font-sans text-foreground mt-2 mb-1">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-sm leading-[19px] text-foreground mb-2.5 font-sans">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-4 mb-2.5 space-y-1 text-[12px] text-foreground marker:text-sky-400">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-4 mb-2.5 space-y-1 text-[12px] text-foreground marker:text-sky-400">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[12px] leading-[17px] pl-1 font-sans">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-sky-400 pl-3 py-1 my-2 bg-sky-400/[0.04] text-[12px] text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => {
            if (!href) return <span>{children}</span>;
            const isInternal = href.startsWith('/') || href.startsWith('#');

            if (isInternal) {
              return (
                <Link
                  to={href}
                  className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200 underline underline-offset-2 decoration-sky-400/40 hover:decoration-sky-400 font-medium transition-colors"
                >
                  {children}
                </Link>
              );
            }

            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200 underline underline-offset-2 decoration-sky-400/40 transition-colors"
              >
                <span>{children}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
              </a>
            );
          },
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code
                  className="font-mono text-[11px] bg-card text-sky-400 border border-border px-1.5 py-0.5 rounded-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const currentIdx = codeBlockCounter++;
            const isCopied = copiedCodeIndex === currentIdx;

            return (
              <div className="relative group my-2.5 rounded-md overflow-hidden border border-border bg-card">
                <div className="flex items-center justify-between px-3 py-1.5 bg-card border-b border-border text-[11px] text-terminal-dim font-mono">
                  <span>{match ? match[1].toUpperCase() : 'CODE'}</span>
                  <button
                    onClick={() => handleCopyCode(codeString, currentIdx)}
                    className="flex items-center gap-1 text-muted-foreground hover:text-white transition-colors"
                    title="Copy code"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className=" text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 overflow-x-auto text-[11px] font-mono text-foreground leading-relaxed">
                  <code>{children}</code>
                </pre>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>

      {/* Streaming cursor */}
      {isStreaming && (
        <span className="inline-block w-2 h-3.5 ml-1 bg-sky-400 animate-pulse align-middle" />
      )}

      {/* Citations section */}
      {citations.length > 0 && !isStreaming && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="text-[11px] font-mono uppercase tracking-wider text-terminal-dim mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Grounded Documentation Sources
          </div>
          <div className="flex flex-wrap gap-1.5">
            {citations.map((cit, idx) => (
              <Link
                key={idx}
                to={cit.url}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-card hover:bg-secondary border border-border text-[11px] text-sky-300 font-mono transition-colors"
              >
                <span>{cit.title}</span>
                <span className=" text-terminal-dim">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
