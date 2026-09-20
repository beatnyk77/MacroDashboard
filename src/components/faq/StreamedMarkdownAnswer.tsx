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
    <div className={`faq-markdown-stream text-[#d4e4fa] ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-semibold font-['Space_Grotesk'] text-[#e2e8f0] mt-3 mb-2 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-semibold font-['Space_Grotesk'] text-[#38bdf8] mt-3 mb-1.5 tracking-tight uppercase tracking-wider text-[11px]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[12px] font-medium font-['Space_Grotesk'] text-[#cbd5e1] mt-2 mb-1">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-[13px] leading-[19px] text-[#cbd5e1] mb-2.5 font-['Inter']">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-4 mb-2.5 space-y-1 text-[12px] text-[#cbd5e1] marker:text-[#38bdf8]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-4 mb-2.5 space-y-1 text-[12px] text-[#cbd5e1] marker:text-[#38bdf8]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[12px] leading-[17px] pl-1 font-['Inter']">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#38bdf8] pl-3 py-1 my-2 bg-[rgba(56,189,248,0.04)] text-[12px] text-[#94a3b8] italic">
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
                  className="inline-flex items-center gap-1 text-[#38bdf8] hover:text-[#7dd3fc] underline underline-offset-2 decoration-[#38bdf8]/40 hover:decoration-[#38bdf8] font-medium transition-colors"
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
                className="inline-flex items-center gap-1 text-[#38bdf8] hover:text-[#7dd3fc] underline underline-offset-2 decoration-[#38bdf8]/40 transition-colors"
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
                  className="font-mono text-[11px] bg-[#0c1524] text-[#38bdf8] border border-[#1e2e47] px-1.5 py-0.5 rounded-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const currentIdx = codeBlockCounter++;
            const isCopied = copiedCodeIndex === currentIdx;

            return (
              <div className="relative group my-2.5 rounded-md overflow-hidden border border-[#1e293b] bg-[#050914]">
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a1120] border-b border-[#1e293b] text-[10px] text-[#64748b] font-mono">
                  <span>{match ? match[1].toUpperCase() : 'CODE'}</span>
                  <button
                    onClick={() => handleCopyCode(codeString, currentIdx)}
                    className="flex items-center gap-1 text-[#94a3b8] hover:text-white transition-colors"
                    title="Copy code"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-[#10b981]" />
                        <span className="text-[#10b981]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 overflow-x-auto text-[11px] font-mono text-[#cbd5e1] leading-relaxed">
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
        <span className="inline-block w-2 h-3.5 ml-1 bg-[#38bdf8] animate-pulse align-middle" />
      )}

      {/* Citations section */}
      {citations.length > 0 && !isStreaming && (
        <div className="mt-4 pt-3 border-t border-[#1e293b]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748b] mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
            Grounded Documentation Sources
          </div>
          <div className="flex flex-wrap gap-1.5">
            {citations.map((cit, idx) => (
              <Link
                key={idx}
                to={cit.url}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-[#081324] hover:bg-[#0c1e38] border border-[#1e324f] text-[11px] text-[#7dd3fc] font-mono transition-colors"
              >
                <span>{cit.title}</span>
                <span className="text-[#475569]">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
