import { useState } from 'react';
import { CHART_COLORS } from '@/constants/chartDefaults';

function syntaxHighlight(raw: string): string {
    const escaped = raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return escaped.replace(
        /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|true|false|null|-?\d+(?:\.\d*)?(?:[eE][-+]?\d+)?)/g,
        (match) => {
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    return `<span style="color:${CHART_COLORS.westSoft}">${match}</span>`;
                }
                return `<span style="color:${CHART_COLORS.expansionSoft}">${match}</span>`;
            }
            if (/true|false/.test(match)) return `<span style="color:${CHART_COLORS.violet}">${match}</span>`;
            if (/null/.test(match)) return `<span style="color:${CHART_COLORS.label}">${match}</span>`;
            return `<span style="color:${CHART_COLORS.goldSoft}">${match}</span>`;
        }
    );
}

export function CodeBlock({ code, lang = 'json' }: { code: string; lang?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const highlighted = lang === 'json' ? syntaxHighlight(code) : code;

    return (
        <div className="relative group rounded-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
                <span
                    className="text-[11px] font-semibold uppercase tracking-wider text-terminal-dim"
                    style={{ fontFamily: "'Fira Code', monospace" }}
                >
                    {lang}
                </span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[11px] font-semibold uppercase tracking-wider text-terminal-dim hover:text-slate-300 transition-colors"
                >
                    {copied ? 'COPIED' : 'COPY'}
                </button>
            </div>
            {lang === 'json' ? (
                <pre
                    className="p-4 overflow-x-auto text-sm leading-relaxed"
                    style={{
                        background: CHART_COLORS.surface,
                        fontFamily: "'Fira Code', monospace",
                        tabSize: 2,
                        color: CHART_COLORS.textStrong,
                    }}
                    dangerouslySetInnerHTML={{ __html: highlighted }}
                />
            ) : (
                <pre
                    className="p-4 overflow-x-auto text-sm leading-relaxed whitespace-pre-wrap"
                    style={{
                        background: CHART_COLORS.surface,
                        fontFamily: "'Fira Code', monospace",
                        tabSize: 2,
                        color: CHART_COLORS.textStrong,
                    }}
                >
                    {code}
                </pre>
            )}
        </div>
    );
}