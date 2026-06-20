import { useState } from 'react';

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
                    return `<span style="color:#93c5fd">${match}</span>`;
                }
                return `<span style="color:#6ee7b7">${match}</span>`;
            }
            if (/true|false/.test(match)) return `<span style="color:#c084fc">${match}</span>`;
            if (/null/.test(match)) return `<span style="color:#94a3b8">${match}</span>`;
            return `<span style="color:#fcd34d">${match}</span>`;
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
        <div className="relative group rounded-lg border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                <span
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                    {lang}
                </span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
                >
                    {copied ? 'COPIED' : 'COPY'}
                </button>
            </div>
            {lang === 'json' ? (
                <pre
                    className="p-4 overflow-x-auto text-[13px] leading-relaxed"
                    style={{
                        background: 'rgb(2 6 23)',
                        fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
                        tabSize: 2,
                        color: '#e2e8f0',
                    }}
                    dangerouslySetInnerHTML={{ __html: highlighted }}
                />
            ) : (
                <pre
                    className="p-4 overflow-x-auto text-[13px] leading-relaxed whitespace-pre-wrap"
                    style={{
                        background: 'rgb(2 6 23)',
                        fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
                        tabSize: 2,
                        color: '#e2e8f0',
                    }}
                >
                    {code}
                </pre>
            )}
        </div>
    );
}